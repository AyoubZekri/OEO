import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, ShieldCheck, Shield, Edit2, Check, Save, Lock, AlertCircle, Type } from 'lucide-react';
import { RoleModel, defaultPermissions, MODULE_ACTIONS, ALL_MODULES, PERMISSION_DOMAINS } from './role_model';
import { MODULE_ICONS, actionIcon } from './permissionIcons';
import type { AppPermissions } from './role_model';
import { validInput } from '../../../../core/functions/valiedinput';
import './Roles.css';
import './RoleDialog.css';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<RoleModel, 'id' | 'toJson'>) => void;
  roleToEdit?: RoleModel | null;
}

export const RoleDialog: React.FC<RoleDialogProps> = ({ isOpen, onClose, onSave, roleToEdit }) => {
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<'full' | 'partial'>('full');
  const [appPerms, setAppPerms] = useState<AppPermissions>({ ...defaultPermissions });
  const isFull = accessLevel === 'full';
  const [errors, setErrors] = useState<{name?: string}>({});
  const { t } = useTranslation();

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
        setAccessLevel('full');
        setAppPerms(JSON.parse(JSON.stringify(defaultPermissions)));
      }
      setErrors({});
    }
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {name?: string} = {};
    const nameErr = validInput(name, 3, 50, 'text');
    if (nameErr) newErrors.name = nameErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name,
        accessLevel,
        permissions: accessLevel === 'full' ? JSON.parse(JSON.stringify(defaultPermissions)) : appPerms
      });
    }
  };

  const handleActionChange = (moduleKey: keyof AppPermissions, actionKey: string, checked: boolean) => {
    setAppPerms(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: checked
      }
    }));
  };

  const handleModuleToggle = (moduleKey: keyof AppPermissions, checked: boolean) => {
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

  // Turn every section of the list on or off at once (same rule as one section's switch)
  const handleAllToggle = (checked: boolean) => {
    modulesConfig.forEach(module => handleModuleToggle(module.key, checked));
  };

  const permsShown = (key: keyof AppPermissions) => (isFull ? defaultPermissions[key] : appPerms[key]) as unknown as Record<string, boolean>;
  const activeModules = modulesConfig.filter(module => permsShown(module.key).view === true);
  const grantedActions = modulesConfig.reduce((sum, module) => sum + module.actions.filter(a => permsShown(module.key)[a]).length, 0);
  const totalActions = modulesConfig.reduce((sum, module) => sum + module.actions.length, 0);
  const coverage = Math.round((activeModules.length / modulesConfig.length) * 100);

  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="rd-header">
          <span className="rd-header-icon">{roleToEdit ? <Edit2 size={24} /> : <Shield size={26} />}</span>
          <div className="rd-header-text">
            <h2>{roleToEdit ? t('roles_permissions.edit_permissions') : t('roles_permissions.add_role')}</h2>
            <p>حدد اسم الدور والأقسام والإجراءات التي يمكن لأصحابه الوصول إليها</p>
          </div>
          <button type="button" className="rd-close" onClick={onClose} aria-label={t('roles_permissions.cancel')}>
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="rd-form">
          <div className="rd-body">
            {/* Side: name, access level, live summary */}
            <aside className="rd-side">
              <div className="rd-field">
                <label htmlFor="rd-name"><Type size={15} /> {t('roles_permissions.role_name')}</label>
                <input
                  id="rd-name"
                  type="text"
                  className={errors.name ? 'has-error' : ''}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors({}); }}
                  placeholder="مثال: أمين المال"
                  autoFocus
                />
                {errors.name && <span className="rd-error"><AlertCircle size={14} /> {errors.name}</span>}
              </div>

              <div className="rd-field">
                <label>{t('roles_permissions.access_level')}</label>
                <div className="rd-levels">
                  <button type="button" className={`full ${isFull ? 'on' : ''}`} onClick={() => setAccessLevel('full')}>
                    <span className="rd-level-icon"><ShieldCheck size={22} /></span>
                    <span className="rd-level-text">
                      <strong>{t('roles_permissions.full_access')}</strong>
                      <small>كل الأقسام وكل الإجراءات</small>
                    </span>
                    <span className="rd-radio">{isFull && <Check size={13} strokeWidth={3} />}</span>
                  </button>
                  <button type="button" className={`partial ${!isFull ? 'on' : ''}`} onClick={() => setAccessLevel('partial')}>
                    <span className="rd-level-icon"><ShieldAlert size={22} /></span>
                    <span className="rd-level-text">
                      <strong>{t('roles_permissions.partial_access')}</strong>
                      <small>تختار الأقسام والإجراءات بنفسك</small>
                    </span>
                    <span className="rd-radio">{!isFull && <Check size={13} strokeWidth={3} />}</span>
                  </button>
                </div>
              </div>

              <div className="rd-summary">
                <div className="rd-ring" style={{ '--rd-p': coverage } as React.CSSProperties}>
                  <span><strong>{activeModules.length}</strong><small>/ {modulesConfig.length}</small></span>
                </div>
                <div className="rd-summary-text">
                  <strong>الأقسام المفعلة</strong>
                  <small><b>{grantedActions}</b> من {totalActions} إجراءً مسموحاً</small>
                </div>
              </div>

              {!isFull && (
                <div className="rd-bulk">
                  <button type="button" onClick={() => handleAllToggle(true)}><Check size={15} /> تفعيل الكل</button>
                  <button type="button" onClick={() => handleAllToggle(false)}><X size={15} /> إلغاء الكل</button>
                </div>
              )}
            </aside>

            {/* Sections and their actions */}
            <section className="rd-main">
              {isFull && (
                <div className="rd-locked">
                  <Lock size={16} />
                  الصلاحيات الكاملة تفعّل كل الأقسام. اختر "{t('roles_permissions.partial_access')}" لتحديدها بنفسك.
                </div>
              )}
              {PERMISSION_DOMAINS.map(domain => {
                const items = modulesConfig.filter(module => domain.modules.includes(module.key));
                const onCount = items.filter(module => permsShown(module.key).view === true).length;
                return (
                  <div key={domain.key} className="rd-domain">
                    <h3 className="rd-domain-title">
                      <span>{t(`roles_permissions.domains.${domain.key}`)}</span>
                      <em>{onCount} / {items.length}</em>
                    </h3>
                    <div className={`rd-modules ${isFull ? 'locked' : ''}`}>
                      {items.map((module) => {
                      const modulePerms = permsShown(module.key);
                      const isModuleActive = modulePerms.view === true;
                      const granted = module.actions.filter(a => modulePerms[a]).length;
                      const label = t(`roles_permissions.modules.${module.key}`);

                      return (
                        <div key={module.key} className={`rd-module ${isModuleActive ? 'active' : ''}`}>
                          <div className="rd-module-head">
                            <span className="rd-module-icon">{React.createElement(MODULE_ICONS[module.key], { size: 20 })}</span>
                            <div className="rd-module-title">
                              <strong>{label}</strong>
                              <small>
                                {!isModuleActive ? 'غير مفعل' : module.actions.length ? `${granted} من ${module.actions.length} إجراءات` : 'عرض فقط'}
                              </small>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isModuleActive}
                              aria-label={label}
                              className={`rd-switch ${isModuleActive ? 'on' : ''}`}
                              disabled={isFull}
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
                                    aria-pressed={on}
                                    disabled={isFull}
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
                  </div>
                );
              })}
            </section>
          </div>

          <footer className="rd-footer">
            <button type="button" onClick={onClose} className="rd-cancel">{t('roles_permissions.cancel')}</button>
            <button type="submit" className="rd-save"><Save size={18} /> {t('roles_permissions.save_role')}</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
