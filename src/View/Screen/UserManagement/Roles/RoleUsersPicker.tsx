import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Search, Check, Loader2, UserPlus } from 'lucide-react';
import client from '../../../../core/api/client';
import { useAuth } from '../../../../core/context/AuthContext';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { AddMemberWindow } from './AddMemberWindow';
import './RoleUsersPicker.css';

interface PickUser { id: string; name: string; email: string; roleId: string }

/**
 * The role's users, in the role's window (computer and phone): tap a user to give them this role or take it off.
 * value null = not loaded yet; once loaded it holds the users who have the role now (a new role: none).
 * «إضافة عضو» adds a member here: their new account comes ticked, so it takes this role when the role is saved.
 */
export const RoleUsersPicker: React.FC<{
  roleId?: string;
  value: string[] | null;
  onChange: (ids: string[]) => void;
}> = ({ roleId, value, onChange }) => {
  const { permissions, isFullAccess } = useAuth();
  const canAddMember = isFullAccess || permissions.members.add;
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<PickUser[] | null>(null);
  const [query, setQuery] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // The latest choice, for answers that arrive later
  const valueRef = useRef(value);
  const usersRef = useRef(users);
  useEffect(() => { valueRef.current = value; usersRef.current = users; }, [value, users]);

  /** Loads the users; afterAdd: the accounts that were not there before are ticked */
  const load = useCallback(async (afterAdd: boolean) => {
    try {
      const res = await client.get('/users');
      const raw: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const list = raw.map(u => ({ id: String(u.id), name: String(u.name || ''), email: String(u.email || ''), roleId: u.role_id == null ? '' : String(u.role_id) }));
      const before = new Set((usersRef.current || []).map(u => u.id));
      setUsers(list);
      if (valueRef.current === null) {
        onChange(roleId ? list.filter(u => u.roleId === roleId).map(u => u.id) : []);
      } else if (afterAdd) {
        const added = list.filter(u => !before.has(u.id)).map(u => u.id);
        if (added.length) onChange([...new Set([...valueRef.current, ...added])]);
      }
    } catch {
      setUsers(prev => prev || []);
    }
  }, [roleId, onChange]);

  useEffect(() => { load(false); }, [roleId]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect -- once per open window; set after the answer

  const chosen = new Set(value || []);
  const toggle = (id: string) => onChange(chosen.has(id) ? [...chosen].filter(x => x !== id) : [...chosen, id]);
  const q = query.trim().toLowerCase();
  // The role's users first, then the others
  const shown = (users || [])
    .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => Number(chosen.has(b.id)) - Number(chosen.has(a.id)));

  return (
    <div className="rup">
      <div className="rup-head">
        <span className="rup-label"><Users size={15} /> المستخدمون <b>{chosen.size}</b></span>
        {canAddMember && (
          <button type="button" className="rup-add" onClick={() => setAddingMember(true)}>
            <UserPlus size={15} /> إضافة عضو
          </button>
        )}
      </div>
      <label className="rup-search">
        <Search size={15} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد" />
      </label>
      <div className="rup-list">
        {users === null ? (
          <span className="rup-loading"><Loader2 size={18} className="rup-spin" /></span>
        ) : shown.map(u => {
          const on = chosen.has(u.id);
          const other = !on && u.roleId && u.roleId !== roleId;
          return (
            <button key={u.id} type="button" className={`rup-item ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(u.id)}>
              <span className="rup-check">{on && <Check size={13} strokeWidth={3} />}</span>
              <span className="rup-text">
                <strong>{u.name}</strong>
                <small dir="ltr">{u.email}</small>
              </span>
              {other && <em>دور آخر</em>}
            </button>
          );
        })}
      </div>

      {addingMember && <AddMemberWindow mobile={isMobile} onClose={() => { setAddingMember(false); load(true); }} />}
    </div>
  );
};
