import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { MODULES, DOMAINS, permsOf, enabledModules } from './roleUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileRoleDetailsProps {
  role: RoleModel;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
  /** Opened from a user's page: sits one layer higher */
  layer?: 1 | 2;
}

// What a role can do (phone): every section with its granted and denied actions
export const MobileRoleDetails: React.FC<MobileRoleDetailsProps> = ({ role, canEdit, onEdit, onClose, layer = 1 }) => {
  const { t } = useTranslation();
  const perms = permsOf(role);
  const isFull = role.accessLevel === 'full';
  const on = enabledModules(role).length;

  return (
    <MobileScreen
      title={role.name}
      onBack={onClose}
      layer={layer}
      footer={canEdit ? <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> {t('roles_permissions.edit_permissions')}</button> : undefined}
    >
      <section className={`mus-hero ${isFull ? 'full' : 'partial'}`}>
        <div className="mus-hero-top">
          <span className="mus-hero-icon">{isFull ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}</span>
          <div>
            <small>{t('roles_permissions.access_level')}</small>
            <strong className="title">{isFull ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}</strong>
          </div>
        </div>
        <div className="mus-progress">
          <div className="mus-bar"><div style={{ width: `${(on / MODULES.length) * 100}%` }} /></div>
          <span><b>{on}</b> من {MODULES.length} قسماً مفعلة</span>
        </div>
      </section>

      <div className="mus-modules">
        {DOMAINS.map(d => (
          <div key={d.key} className="mus-domain">
            <h4 className="mus-domain-title"><span>{t(`roles_permissions.domains.${d.key}`)}</span></h4>
            {d.items.map(m => {
              const mp = perms[m.key] as unknown as Record<string, boolean>;
              const active = mp?.view === true;
              return (
                <section key={m.key} className={`mus-module ${active ? 'active' : 'inactive'}`}>
                  <div className="mus-module-head">
                    <span className="mus-module-icon"><m.icon size={19} /></span>
                    <strong>{t(`roles_permissions.modules.${m.key}`)}</strong>
                    <em>{active ? 'مفعل' : 'غير مفعل'}</em>
                  </div>
                  {active && m.actions.length > 0 && (
                    <div className="mus-chips">
                      {m.actions.map(a => (
                        <span key={a} className={mp[a] ? 'yes' : 'no'}>
                          {mp[a] ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                          {t(`roles_permissions.actions.${a}`)}
                        </span>
                      ))}
                    </div>
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
