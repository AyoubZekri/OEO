import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, ShieldCheck, ShieldAlert, Type, AlertCircle, Info } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { RoleModel, defaultPermissions } from '../../Screen/UserManagement/Roles/role_model';
import type { AppPermissions } from '../../Screen/UserManagement/Roles/role_model';
import { validInput } from '../../../core/functions/valiedinput';
import { DOMAINS, actionIcon } from './roleUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileRoleFormProps {
  role: RoleModel | null;
  saving: boolean;
  onSave: (role: Omit<RoleModel, 'id' | 'toJson'>) => void;
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
  const [accessLevel, setAccessLevel] = useState<'full' | 'partial'>(role?.accessLevel || 'full');
  const [perms, setPerms] = useState<AppPermissions>(() => copy(role ? role.permissions : defaultPermissions));
  const [error, setError] = useState<string | null>(null);
  const isFull = accessLevel === 'full';

  const setAction = (key: keyof AppPermissions, action: string, value: boolean) =>
    setPerms(prev => ({ ...prev, [key]: { ...prev[key], [action]: value } }));

  // Turning a section on or off turns all its actions on or off (desktop rule)
  const setModule = (key: keyof AppPermissions, value: boolean) =>
    setPerms(prev => {
      const next = { ...prev[key] } as Record<string, boolean>;
      Object.keys(next).forEach(k => { next[k] = value; });
      return { ...prev, [key]: next };
    });

  const save = () => {
    const err = validInput(name, 3, 50, 'text');
    setError(err);
    if (err) return;
    onSave({ name, accessLevel, permissions: isFull ? copy(defaultPermissions) : perms });
  };

  return (
    <MobileScreen
      title={role ? t('roles_permissions.edit_permissions') : t('roles_permissions.add_role')}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mus-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : t('roles_permissions.save_role')}
        </button>
      )}
    >
      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> {t('roles_permissions.role_name')}</span>
          <input className="me-input" type="text" value={name} onChange={e => { setName(e.target.value); setError(null); }} placeholder="مثال: أمين المال" />
        </label>
        {error && <p className="mus-form-error"><AlertCircle size={14} /> {error}</p>}

        <div className="me-field">
          <span className="me-label">{t('roles_permissions.access_level')}</span>
          <div className="mus-levels">
            <button type="button" className={`full ${isFull ? 'on' : ''}`} onClick={() => setAccessLevel('full')}>
              <ShieldCheck size={22} />
              <strong>{t('roles_permissions.full_access')}</strong>
              <small>كل الأقسام وكل الإجراءات</small>
            </button>
            <button type="button" className={`partial ${!isFull ? 'on' : ''}`} onClick={() => setAccessLevel('partial')}>
              <ShieldAlert size={22} />
              <strong>{t('roles_permissions.partial_access')}</strong>
              <small>تختار الأقسام والإجراءات</small>
            </button>
          </div>
        </div>
      </section>

      {isFull && <p className="mus-note"><Info size={15} /> الصلاحيات الكاملة تفعّل كل الأقسام. اختر "صلاحيات جزئية" لتحديدها بنفسك.</p>}

      <div className={`mus-modules ${isFull ? 'locked' : ''}`}>
        {DOMAINS.map(d => (
          <div key={d.key} className="mus-domain">
            <h4 className="mus-domain-title"><span>{t(`roles_permissions.domains.${d.key}`)}</span></h4>
            {d.items.map(m => {
              const mp = (isFull ? defaultPermissions[m.key] : perms[m.key]) as unknown as Record<string, boolean>;
              const active = mp.view === true;
              const label = t(`roles_permissions.modules.${m.key}`);
              return (
                <section key={m.key} className={`mus-module ${active ? 'active' : 'inactive'}`}>
                  <div className="mus-module-head">
                    <span className="mus-module-icon"><m.icon size={19} /></span>
                    <strong>{label}</strong>
                    <Switch checked={active} disabled={isFull} onChange={v => setModule(m.key, v)} label={label} />
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
                            <Switch checked={mp[a] || false} disabled={isFull} onChange={v => setAction(m.key, a, v)} label={actionLabel} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        ))}
      </div>
    </MobileScreen>
  );
};
