import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X, Shield, Edit2, Check, Save, AlertCircle, Type, UserPlus } from 'lucide-react';
import { useAuth } from '../../../../core/context/AuthContext';
import { RoleModel, defaultPermissions, emptyPermissions, MODULE_ACTIONS, ALL_MODULES, domainsForPost } from './role_model';
import { MODULE_ICONS, DOMAIN_ICONS, actionIcon } from './permissionIcons';
import type { AppPermissions } from './role_model';
import { validInput } from '../../../../core/functions/valiedinput';
import { RoleUsersPicker } from './RoleUsersPicker';
import { useMemberPerms, type MemberChanges } from './useMemberPerms';
import './Roles.css';
import './RoleDialog.css';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<RoleModel, 'id' | 'toJson' | 'sectionId'>, userIds: string[] | null, memberChanges: MemberChanges) => void;
  roleToEdit?: RoleModel | null;
}

export const RoleDialog: React.FC<RoleDialogProps> = ({ isOpen, onClose, onSave, roleToEdit }) => {
  const [name, setName] = useState('');
  // No access-level choice: a full role stays full until one of its permissions is changed; a new role is partial
  const [accessLevel, setAccessLevel] = useState<'full' | 'partial'>('partial');
  // A new role starts with nothing on: its permissions are then chosen one by one (or all at once)
  const [appPerms, setAppPerms] = useState<AppPermissions>({ ...emptyPermissions });
  const [errors, setErrors] = useState<{name?: string}>({});
  const [userIds, setUserIds] = useState<string[] | null>(null);
  // «إضافة عضو» beside the access levels: the member's account comes linked to this role
  const [addingMember, setAddingMember] = useState(false);
  const { permissions: myPermissions, isFullAccess } = useAuth();
  const canAddMember = isFullAccess || myPermissions.members.add;
  const { t } = useTranslation();
  // A linked member tapped: the permissions shown and changed are theirs (saved with the role)
  // Groups folded (their pages hidden): a tap on a group's chevron
  // Opening (adding or editing): every group folded, the one needed is opened
  const allFolded = () => new Set(domainsForPost(null).map(d => d.key));
  const [folded, setFolded] = useState<Set<string>>(allFolded);
  const fold = (key: string) => setFolded(f => { const n = new Set(f); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const member = useMemberPerms(accessLevel === 'full' ? defaultPermissions : appPerms);

  // Every section of the app, from the shared permission model
  const modulesConfig = ALL_MODULES.map(key => ({ key, actions: MODULE_ACTIONS[key] }));

  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        setName(roleToEdit.name);
        setAccessLevel(roleToEdit.accessLevel);
        setAppPerms(JSON.parse(JSON.stringify(roleToEdit.permissions)));
      } else {
        setName('');
        setAccessLevel('partial');
        setAppPerms(JSON.parse(JSON.stringify(emptyPermissions)));
      }
      setErrors({});
      setUserIds(null);
      member.reset();
      setFolded(allFolded());
    }
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {name?: string} = {};
    const nameErr = validInput(name, 3, 255, 'text');
    if (nameErr) newErrors.name = nameErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name,
        accessLevel,
        permissions: accessLevel === 'full' ? JSON.parse(JSON.stringify(defaultPermissions)) : appPerms
      }, userIds, Object.fromEntries(Object.entries(member.changes).filter(([id]) => !userIds || userIds.includes(id))));
    }
  };

  const handleActionChange = (moduleKey: keyof AppPermissions, actionKey: string, checked: boolean) => {
    if (member.focus) {
      member.edit(p => ({ ...p, [moduleKey]: { ...p[moduleKey], [actionKey]: checked } }));
      return;
    }
    setAccessLevel('partial');
    setAppPerms(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: checked
      }
    }));
  };

  const handleModuleToggle = (moduleKey: keyof AppPermissions, checked: boolean) => {
    if (member.focus) {
      member.edit(p => {
        const next = { ...p[moduleKey] } as Record<string, boolean>;
        Object.keys(next).forEach(k => { next[k] = checked; });
        return { ...p, [moduleKey]: next };
      });
      return;
    }
    setAccessLevel('partial');
    setAppPerms(prev => {
      const newModulePerms = { ...prev[moduleKey] };
      if (!checked) {
        Object.keys(newModulePerms).forEach(key => {
          (newModulePerms as any)[key] = false;
        });
      } else {
        Object.keys(newModulePerms).forEach(key => {
          (newModulePerms as any)[key] = true;
        });
      }
      return { ...prev, [moduleKey]: newModulePerms };
    });
  };

  const permsShown = (key: keyof AppPermissions) => (member.current || appPerms)[key] as unknown as Record<string, boolean>;

  // «تحديد الكل» / «إلغاء الكل»: every section and action of what is shown (the role's, or the tapped member's)
  // The groups shown: all for the role; a tapped member's by their post («الإدارة» last)
  const domains = domainsForPost(member.focus && !member.focus.self ? member.focus.type : null);
  const shownModules = modulesConfig.filter(m => domains.some(d => d.modules.includes(m.key)));
  const allOn = shownModules.every(m => Object.values(permsShown(m.key)).every(Boolean));
  const setAll = (checked: boolean) => shownModules.forEach(m => handleModuleToggle(m.key, checked));


  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="rd-header">
          <span className="rd-header-icon">{roleToEdit ? <Edit2 size={24} /> : <Shield size={26} />}</span>
          <div className="rd-header-text">
            <h2>{roleToEdit ? t('roles_permissions.edit_permissions') : t('roles_permissions.add_role')}</h2>
          </div>
          <button type="button" className="rd-close" onClick={onClose} aria-label={t('roles_permissions.cancel')}>
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="rd-form">
          <div className="rd-body">
            {/* Side: name and access level */}
            <aside className="rd-side">
              <div className="rd-field">
                <label htmlFor="rd-name"><Type size={15} /> {t('roles_permissions.role_name')}</label>
                <input
                  id="rd-name"
                  type="text"
                  className={errors.name ? 'has-error' : ''}
                  value={name}
                  maxLength={255}
                  onChange={(e) => { setName(e.target.value); setErrors({}); }}
                  autoFocus
                />
                {errors.name && <span className="rd-error"><AlertCircle size={14} /> {errors.name}</span>}
              </div>

              <RoleUsersPicker
                key={roleToEdit?.id || 'new'}
                roleId={roleToEdit?.id}
                value={userIds}
                onChange={setUserIds}
                addOpen={addingMember}
                onAddClose={() => setAddingMember(false)}
                focusId={member.focus?.id}
                onFocus={member.setFocus}
                addButton={canAddMember && (
                  <div className="rd-levels">
                    <button type="button" className="member" onClick={() => setAddingMember(true)}>
                      <span className="rd-level-icon"><UserPlus size={22} /></span>
                      <span className="rd-level-text"><strong>إضافة</strong></span>
                    </button>
                  </div>
                )}
              />
            </aside>

            {/* Sections and their actions */}
            <section className="rd-main">
              {/* The permissions are a member's: none shown until the role has one (the first is selected) */}
              {!member.focus ? (
                <div className="rd-no-member"><UserPlus size={34} /><span>أضف عضواً إلى الدور</span></div>
              ) : (<>
              <div className="rd-all">
                <button type="button" className={allOn ? 'on' : ''} onClick={() => setAll(!allOn)} disabled={member.focus?.self}>
                  <span className="rd-action-check">{allOn ? <Check size={12} strokeWidth={3} /> : null}</span>
                  {allOn ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
              </div>
              {domains.map(domain => {
                const items = modulesConfig.filter(module => domain.modules.includes(module.key));
                // The whole group on or off at once
                const groupOn = items.every(m => Object.values(permsShown(m.key)).every(Boolean));
                return (
                  <div key={domain.key} className="rd-domain">
                    <h3 className="rd-domain-title">
                      {DOMAIN_ICONS[domain.key] && React.createElement(DOMAIN_ICONS[domain.key], { size: 16 })}
                      <span>{t(`roles_permissions.domains.${domain.key}`)}</span>
                      <button
                        type="button"
                        className={`rd-domain-fold ${folded.has(domain.key) ? 'closed' : ''}`}
                        onClick={() => fold(domain.key)}
                        aria-expanded={!folded.has(domain.key)}
                        aria-label={folded.has(domain.key) ? 'إظهار الصلاحيات' : 'إخفاء الصلاحيات'}
                        title={folded.has(domain.key) ? 'إظهار' : 'إخفاء'}
                      >
                        <ChevronDown size={18} />
                      </button>
                      {/* The whole group on or off: the same switch as a page's */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={groupOn}
                        aria-label={`${t(`roles_permissions.domains.${domain.key}`)} كاملاً`}
                        title={groupOn ? 'إلغاء القسم' : 'تفعيل القسم'}
                        className={`rd-switch rd-domain-switch ${groupOn ? 'on' : ''}`}
                        disabled={member.focus?.self}
                        onClick={() => items.forEach(m => handleModuleToggle(m.key, !groupOn))}
                      >
                        <i />
                      </button>
                    </h3>
                    <div className={`rd-fold ${folded.has(domain.key) ? 'closed' : ''}`}><div className="rd-fold-in"><div className="rd-fold-pad">
                    <div className={`rd-modules ${member.focus?.self ? 'locked' : ''}`}>
                      {items.map((module) => {
                      const modulePerms = permsShown(module.key);
                      const isModuleActive = modulePerms.view === true;
                      const label = t(`roles_permissions.modules.${module.key}`);

                      return (
                        <div key={module.key} className={`rd-module ${isModuleActive ? 'active' : ''}`}>
                          <div className="rd-module-head">
                            <span className="rd-module-icon">{React.createElement(MODULE_ICONS[module.key], { size: 20 })}</span>
                            <div className="rd-module-title">
                              <strong>{label}</strong>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isModuleActive}
                              aria-label={label}
                              className={`rd-switch ${isModuleActive ? 'on' : ''}`}
                              disabled={member.focus?.self}
                              onClick={() => handleModuleToggle(module.key, !isModuleActive)}
                            >
                              <i />
                            </button>
                          </div>

                          {isModuleActive && module.actions.length > 0 && (
                            <div className="rd-actions">
                              {module.actions.map(action => {
                                const on = modulePerms[action] || false;
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    className={`rd-action ${on ? 'on' : ''}`}
                                    disabled={member.focus?.self}
                                    aria-pressed={on}
                              onClick={() => handleActionChange(module.key, action, !on)}
                                  >
                                    <span className="rd-action-check">{on ? <Check size={12} strokeWidth={3} /> : React.createElement(actionIcon(action), { size: 14 })}</span>
                                    {t(`roles_permissions.actions.${action}`)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                    </div></div></div>
                  </div>
                );
              })}
              </>)}
            </section>
          </div>

          <footer className="rd-footer">
            <button type="button" onClick={onClose} className="rd-cancel">{t('roles_permissions.cancel')}</button>
            <button type="submit" className="rd-save"><Save size={18} /> {roleToEdit ? t('roles_permissions.save_role') : 'تأكيد'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
