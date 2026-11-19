import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, Type, AlertCircle, UserPlus, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { DOMAIN_ICONS } from '../../Screen/UserManagement/Roles/permissionIcons';
import { RoleUsersPicker } from '../../Screen/UserManagement/Roles/RoleUsersPicker';
import '../../Screen/UserManagement/Roles/RoleDialog.css';
import { useMemberPerms, type MemberChanges } from '../../Screen/UserManagement/Roles/useMemberPerms';
import { MobileScreen } from '../widgets/MobileScreen';
import { RoleModel, defaultPermissions, emptyPermissions } from '../../Screen/UserManagement/Roles/role_model';
import type { AppPermissions } from '../../Screen/UserManagement/Roles/role_model';
import { validInput } from '../../../core/functions/valiedinput';
import { DOMAINS, actionIcon } from './roleUtils';
import { domainsForPost } from '../../Screen/UserManagement/Roles/role_model';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileRoleFormProps {
  role: RoleModel | null;
  saving: boolean;
  onSave: (role: Omit<RoleModel, 'id' | 'toJson' | 'sectionId'>, userIds: string[] | null, memberChanges: MemberChanges) => void;
  onClose: () => void;
}

const copy = (p: AppPermissions): AppPermissions => JSON.parse(JSON.stringify(p));

const Switch: React.FC<{ checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className={`mus-switch ${checked ? 'on' : ''}`}
    disabled={disabled}
    onClick={e => { e.stopPropagation(); onChange(!checked); }}
  >
    <i />
  </button>
);

// Phone version of the role dialog: same fields, rules and payload
export const MobileRoleForm: React.FC<MobileRoleFormProps> = ({ role, saving, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(role?.name || '');
  // No access-level choice: a full role stays full until one of its permissions is changed; a new role is partial
  const [accessLevel, setAccessLevel] = useState<'full' | 'partial'>(role?.accessLevel || 'partial');
  // A new role starts with nothing on: its permissions are then chosen one by one (or all at once)
  const [perms, setPerms] = useState<AppPermissions>(() => copy(role ? role.permissions : emptyPermissions));
  const [error, setError] = useState<string | null>(null);
  const [userIds, setUserIds] = useState<string[] | null>(null);
  // «إضافة عضو» with the access levels: the member's account comes linked to this role
  const [addingMember, setAddingMember] = useState(false);
  const { permissions: myPermissions, isFullAccess } = useAuth();
  const canAddMember = isFullAccess || myPermissions.members.add;

  // A linked member tapped: the permissions shown and changed are theirs (saved with the role)
  const member = useMemberPerms(accessLevel === 'full' ? defaultPermissions : perms);
  const modulesRef = React.useRef<HTMLDivElement>(null);
  const focusMember: typeof member.setFocus = m => {
    member.setFocus(m);
    if (m) setTimeout(() => modulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const shown = member.current || perms;
  // Groups folded (their pages hidden): a tap on a group's chevron
  // Opening (adding or editing): every group folded, the one needed is opened
  const [folded, setFolded] = useState<Set<string>>(() => new Set(DOMAINS.map(d => d.key)));
  const fold = (key: string) => setFolded(f => { const n = new Set(f); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const setAction = (key: keyof AppPermissions, action: string, value: boolean) => {
    if (member.focus) {
      member.edit(p => ({ ...p, [key]: { ...p[key], [action]: value } }));
      return;
    }
    setAccessLevel('partial');
    setPerms(prev => ({ ...prev, [key]: { ...prev[key], [action]: value } }));
  };

  // Turning a section on or off turns all its actions on or off (desktop rule)
  const setModule = (key: keyof AppPermissions, value: boolean) => {
    if (member.focus) {
      member.edit(p => {
        const next = { ...p[key] } as Record<string, boolean>;
        Object.keys(next).forEach(k => { next[k] = value; });
        return { ...p, [key]: next };
      });
      return;
    }
    setAccessLevel('partial');
    setPerms(prev => {
      const next = { ...prev[key] } as Record<string, boolean>;
      Object.keys(next).forEach(k => { next[k] = value; });
      return { ...prev, [key]: next };
    });
  };

  // «تحديد الكل» / «إلغاء الكل»: every section and action of what is shown (the role's, or the tapped member's)
  // The groups shown: all for the role; a tapped member's by their post («الإدارة» last)
  const domains = domainsForPost(member.focus && !member.focus.self ? member.focus.type : null).map(pd => DOMAINS.find(d => d.key === pd.key)!);
  const allOn = domains.every(d => d.items.every(m => Object.values(shown[m.key] as unknown as Record<string, boolean>).every(Boolean)));
  const setAll = (value: boolean) => domains.forEach(d => d.items.forEach(m => setModule(m.key, value)));

  const save = () => {
    const err = validInput(name, 3, 50, 'text');
    setError(err);
    if (err) return;
    onSave({ name, accessLevel, permissions: accessLevel === 'full' ? copy(defaultPermissions) : perms }, userIds, Object.fromEntries(Object.entries(member.changes).filter(([id]) => !userIds || userIds.includes(id))));
  };

  return (
    <MobileScreen
      title={role ? t('roles_permissions.edit_permissions') : t('roles_permissions.add_role')}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mus-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : role ? t('roles_permissions.save_role') : 'تأكيد'}
        </button>
      )}
    >
      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> {t('roles_permissions.role_name')}</span>
          <input className={`me-input ${error ? 'is-missing' : ''}`} type="text" maxLength={50} value={name} onChange={e => { setName(e.target.value); setError(null); }} />
        </label>
        {error && <p className="mus-form-error"><AlertCircle size={14} /> {error}</p>}

      </section>

      <section className="me-card">
        <RoleUsersPicker
          roleId={role?.id}
          value={userIds}
          onChange={setUserIds}
          addOpen={addingMember}
          onAddClose={() => setAddingMember(false)}
          focusId={member.focus?.id}
          onFocus={focusMember}
          addButton={canAddMember && (
            <div className="mus-levels">
              <button type="button" className="member" onClick={() => setAddingMember(true)}>
                <UserPlus size={22} />
                <strong>إضافة</strong>
              </button>
            </div>
          )}
        />
      </section>

      {/* The permissions are a member's: none shown until the role has one (the first is selected) */}
      {!member.focus ? (
        <div className="rd-no-member"><UserPlus size={34} /><span>أضف عضواً إلى الدور</span></div>
      ) : (
      <div className="mus-modules" ref={modulesRef}>
        <div className="rd-all">
          <button type="button" className={allOn ? 'on' : ''} onClick={() => setAll(!allOn)} disabled={member.focus?.self}>
            <span className="rd-action-check">{allOn ? <Check size={12} strokeWidth={3} /> : null}</span>
            {allOn ? 'إلغاء الكل' : 'تحديد الكل'}
          </button>
        </div>
        {domains.map(d => (
          <div key={d.key} className="mus-domain">
            <h4 className="mus-domain-title">
              {DOMAIN_ICONS[d.key] && React.createElement(DOMAIN_ICONS[d.key], { size: 15 })}<span>{t(`roles_permissions.domains.${d.key}`)}</span>
              <button type="button" className={`rd-domain-fold ${folded.has(d.key) ? 'closed' : ''}`} onClick={() => fold(d.key)} aria-expanded={!folded.has(d.key)} aria-label={folded.has(d.key) ? 'إظهار الصلاحيات' : 'إخفاء الصلاحيات'}>
                <ChevronDown size={18} />
              </button>
              {(() => {
                // The whole group on or off at once
                const groupOn = d.items.every(m => Object.values(shown[m.key] as unknown as Record<string, boolean>).every(Boolean));
                return (
                  // The same switch as a page's
                  <span className="mus-domain-switch">
                    <Switch checked={groupOn} disabled={member.focus?.self} onChange={v => d.items.forEach(m => setModule(m.key, v))} label={`${t(`roles_permissions.domains.${d.key}`)} كاملاً`} />
                  </span>
                );
              })()}
            </h4>
            <div className={`rd-fold ${folded.has(d.key) ? 'closed' : ''}`}><div className="rd-fold-in mus-fold-in">
            {d.items.map(m => {
              const mp = shown[m.key] as unknown as Record<string, boolean>;
              const active = mp.view === true;
              const label = t(`roles_permissions.modules.${m.key}`);
              return (
                <section key={m.key} className={`mus-module ${active ? 'active' : 'inactive'}`}>
                  <div className="mus-module-head">
                    <span className="mus-module-icon"><m.icon size={19} /></span>
                    <strong>{label}</strong>
                    <Switch checked={active} disabled={member.focus?.self} onChange={v => setModule(m.key, v)} label={label} />
                  </div>
                  {active && m.actions.length > 0 && (
                    <ul className="mus-actions">
                      {m.actions.map(a => {
                        const Icon = actionIcon(a);
                        const actionLabel = t(`roles_permissions.actions.${a}`);
                        return (
                          <li key={a}>
                            <Icon size={15} />
                            <span>{actionLabel}</span>
                            <Switch checked={mp[a] || false} disabled={member.focus?.self} onChange={v => setAction(m.key, a, v)} label={actionLabel} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
            </div></div>
          </div>
        ))}
      </div>
      )}
    </MobileScreen>
  );
};
