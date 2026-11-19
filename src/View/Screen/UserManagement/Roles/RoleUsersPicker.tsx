import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { showSnackbar } from '../../../../core/functions/Snacpar';
import { useAuth } from '../../../../core/context/AuthContext';
import { parsePermissions, type AppPermissions } from './role_model';
import type { FocusedMember } from './useMemberPerms';
import client from '../../../../core/api/client';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { AddMemberWindow } from './AddMemberWindow';
import './RoleUsersPicker.css';

/** own: the member's own permissions (stored), null: the role's */
interface PickUser { id: string; name: string; email: string; roleId: string; roleName: string; own: string | null; type: string | null }

const ownOf = (raw: string | null): AppPermissions | null => {
  if (!raw) return null;
  try { return parsePermissions(JSON.parse(raw)); } catch { return null; }
};

/**
 * The role's users, in the role's window (computer and phone). On top, those linked to the role: a tap on one shows
 * their permissions in the window (to give them their own), its tick takes them off the role. Under the search, the
 * others: a tap links one.
 * value null = not loaded yet; once loaded it holds the users who have the role now (a new role: none).
 * «إضافة عضو» (beside the access levels, addOpen) adds a member: their new account comes ticked, so it takes this role
 * when the role is saved.
 */
export const RoleUsersPicker: React.FC<{
  roleId?: string;
  value: string[] | null;
  onChange: (ids: string[]) => void;
  /** The add-member form, opened from the role's window */
  addOpen?: boolean;
  onAddClose?: () => void;
  /** «إضافة», under the members linked to the role */
  addButton?: React.ReactNode;
  /** The member whose permissions are shown (tapped), and a tap on a linked member (null: back to the role's) */
  focusId?: string;
  onFocus?: (m: FocusedMember | null) => void;
}> = ({ roleId, value, onChange, addOpen, onAddClose, addButton, focusId, onFocus }) => {
  const { user: me } = useAuth();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<PickUser[] | null>(null);
  const [query, setQuery] = useState('');

  // The latest choice, for answers that arrive later
  const valueRef = useRef(value);
  const usersRef = useRef(users);
  useEffect(() => { valueRef.current = value; usersRef.current = users; }, [value, users]);

  /** Loads the users; afterAdd: the accounts that were not there before are ticked */
  const load = useCallback(async (afterAdd: boolean) => {
    try {
      const res = await client.get('/users');
      const raw: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const list = raw.map(u => ({ id: String(u.id), name: String(u.name || ''), email: String(u.email || ''), roleId: u.role_id == null ? '' : String(u.role_id), roleName: String((u.role as { name?: string } | null)?.name || ''), own: typeof u.permissions === 'string' && u.permissions ? u.permissions : null, type: ((u.individual as { type?: string } | null)?.type) ?? null }));
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
  // The members linked to this role, on top (a tap takes one off); the others under the search (a tap links one)
  const linked = (users || []).filter(u => chosen.has(u.id));
  // Players are not given roles: not in the list (one already in the role stays on top, to take them off)
  const others = (users || [])
    .filter(u => !chosen.has(u.id) && u.type !== 'player')
    .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  /** What a tapped member brings: their post, their saved permissions, and the role's other members */
  const focusOf = (u: PickUser): FocusedMember => ({
    id: u.id, name: u.name, own: ownOf(u.own), type: u.type, self: String(me?.id ?? '') === u.id,
    peers: linked.filter(x => x.id !== u.id).map(x => ({ id: x.id, type: x.type, own: ownOf(x.own) })),
  });

  // The first member of the role always selected (their permissions shown), also after one is taken off
  const firstId = linked[0]?.id;
  useEffect(() => {
    if (!onFocus || users === null) return;
    if (focusId && linked.some(u => u.id === focusId)) return;
    const first = linked.find(u => u.id === firstId);
    if (first) onFocus(focusOf(first));
    else if (focusId) onFocus(null);
  }, [firstId, focusId, users]); // eslint-disable-line react-hooks/exhaustive-deps -- the first member, when it changes

  /** A member not in the role: the whole row links them */
  const otherRow = (u: PickUser) => {
    // One role per member: one in another role is moved here (taken off the other) when the role is saved
    const other = u.roleId && u.roleId !== roleId;
    const link = () => {
      if (other) showSnackbar('تنبيه', `سيُنقل ${u.name} من دور «${u.roleName || 'آخر'}» إلى هذا الدور عند الحفظ`, '#f59e0b');
      toggle(u.id);
    };
    return (
      <button key={u.id} type="button" className="rup-item" aria-pressed={false} onClick={link}>
        <span className="rup-check" />
        <span className="rup-text">
          <strong>{u.name}</strong>
          <small dir="ltr">{u.email}</small>
        </span>
        {other && <em>{u.roleName ? `«${u.roleName}»` : 'دور آخر'}</em>}
      </button>
    );
  };

  /** A member in the role: a tap shows their permissions; only the tick takes them off */
  const linkedRow = (u: PickUser) => {
    // Oneself: selected too, to see one's permissions, but never to change them
    const self = String(me?.id ?? '') === u.id;
    const focused = focusId === u.id;
    // One member is always selected: a tap selects another (the selected one stays)
    const open = () => { if (onFocus && !focused) onFocus(focusOf(u)); };
    return (
      <div
        key={u.id}
        className={`rup-item on ${focused ? 'focused' : ''} ${onFocus ? 'focusable' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={focused}
        onClick={open}
        onKeyDown={e => { if (e.key === 'Enter') open(); }}
      >
        <button
          type="button"
          className="rup-check"
          onClick={e => { e.stopPropagation(); if (focused) onFocus?.(null); toggle(u.id); }}
          aria-label={`نزع ${u.name} من الدور`}
          title="نزع من الدور"
        >
          <Check size={13} strokeWidth={3} />
        </button>
        <span className="rup-text">
          <strong>{u.name}</strong>
          <small dir="ltr">{u.email}</small>
        </span>
        {/* Coming from another role: taken off it when saved (a member has one role) */}
        {u.roleId && u.roleId !== roleId && <em>من «{u.roleName || 'دور آخر'}»</em>}
      </div>
    );
  };

  return (
    <div className="rup">
      {linked.length > 0 && <div className="rup-list rup-linked">{linked.map(linkedRow)}</div>}
      {addButton}
      <label className="rup-search">
        <Search size={15} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد" />
      </label>
      <div className="rup-list">
        {users === null ? (
          <span className="rup-loading"><Loader2 size={18} className="rup-spin" /></span>
        ) : others.map(otherRow)}
      </div>

      {addOpen && <AddMemberWindow mobile={isMobile} onClose={() => { onAddClose?.(); load(true); }} />}
    </div>
  );
};
