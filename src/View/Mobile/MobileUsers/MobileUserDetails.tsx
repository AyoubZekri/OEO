import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Mail, Shield, ShieldCheck, ShieldAlert, ChevronLeft } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { UserModel } from '../../Screen/UserManagement/Users/user_model';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { MODULES, enabledModules, userInitials } from './roleUtils';
import { MobileRoleDetails } from './MobileRoleDetails';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileUserDetailsProps {
  user: UserModel;
  role?: RoleModel;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}

// One user (phone): account, role and the sections this role opens
export const MobileUserDetails: React.FC<MobileUserDetailsProps> = ({ user, role, canEdit, onEdit, onClose }) => {
  const { t } = useTranslation();
  const [showRole, setShowRole] = useState(false);
  const on = role ? enabledModules(role) : [];
  const isFull = role?.accessLevel === 'full';

  return (
    <MobileScreen
      title="تفاصيل المستخدم"
      onBack={onClose}
      footer={canEdit ? <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> {t('users.edit_user')}</button> : undefined}
    >
      <section className="mus-hero">
        <div className="mus-person">
          <span className="mus-avatar big">{userInitials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small dir="ltr"><Mail size={12} /> {user.email}</small>
          </div>
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><Shield size={16} /></span>{t('users.role')}</h3>
        {role ? (
          <button type="button" className={`mus-role-link ${isFull ? 'full' : 'partial'}`} onClick={() => setShowRole(true)}>
            <span className="mus-role-icon">{isFull ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}</span>
            <span className="mus-card-text">
              <strong>{role.name}</strong>
              <small>{isFull ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')} · {on.length} من {MODULES.length} قسماً</small>
            </span>
            <ChevronLeft size={18} />
          </button>
        ) : (
          <p className="mus-none">{t('users.no_role')}</p>
        )}
      </section>

      {role && (
        <section className="me-card">
          <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>الأقسام المتاحة لهذا المستخدم</h3>
          {on.length === 0 ? (
            <p className="mus-none">لا يوجد أي قسم مفعل في هذا الدور</p>
          ) : (
            <div className="mus-access">
              {on.map(m => (
                <span key={m.key}><m.icon size={15} /> {t(`roles_permissions.modules.${m.key}`)}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {showRole && role && (
        <MobileRoleDetails role={role} canEdit={false} onEdit={() => undefined} onClose={() => setShowRole(false)} layer={2} />
      )}
    </MobileScreen>
  );
};
