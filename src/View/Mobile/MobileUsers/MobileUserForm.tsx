import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { UserModel } from '../../Screen/UserManagement/Users/user_model';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { validInput } from '../../../core/functions/valiedinput';
import { MODULES, enabledModules, userInitials } from './roleUtils';
import { useCan } from '../../../core/functions/useCan';
import { PasswordReveal } from '../../Screen/UserManagement/Users/PasswordReveal';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileUserFormProps {
  user: UserModel | null;
  roles: RoleModel[];
  saving: boolean;
  onSave: (user: Omit<UserModel, 'id' | 'toJson'>) => void;
  onClose: () => void;
}

type Errors = { name?: string; email?: string; password?: string; roleId?: string };

// Phone version of the user dialog: same fields, checks and payload
export const MobileUserForm: React.FC<MobileUserFormProps> = ({ user, roles, saving, onSave, onClose }) => {
  const { t } = useTranslation();
  const can = useCan();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  // New users start on the first role, like the desktop dialog
  const [roleId, setRoleId] = useState(user?.roleId || roles[0]?.id || '');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const save = () => {
    const next: Errors = {};
    const nameErr = validInput(name, 3, 50, 'text');
    if (nameErr) next.name = nameErr;
    const emailErr = validInput(email, 5, 100, 'email');
    if (emailErr) next.email = emailErr;
    const passErr = validInput(password, 6, 50, 'text', !!user);
    if (passErr && (!user || password.length > 0)) next.password = passErr;
    setErrors(next);
    if (Object.keys(next).length === 0) onSave({ name, email, password, roleId });
  };

  const err = (text?: string) => (text ? <p className="mus-form-error"><AlertCircle size={14} /> {text}</p> : null);

  return (
    <MobileScreen
      title={user ? t('users.edit_user') : t('users.add_new_user')}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mus-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : t('users.save_user')}
        </button>
      )}
    >
      <section className="mus-preview">
        <span className="mus-avatar big">{name ? userInitials(name) : <User size={24} />}</span>
        <div>
          <strong>{name || t('users.username')}</strong>
          <small dir="ltr">{email || 'example@kaidnews.com'}</small>
        </div>
      </section>

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><User size={14} /> {t('users.username')}</span>
          <input className="me-input" type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }} placeholder={t('users.username_placeholder')} />
        </label>
        {err(errors.name)}

        <label className="me-field">
          <span className="me-label"><Mail size={14} /> {t('users.email')}</span>
          <input className="me-input" type="email" dir="ltr" inputMode="email" autoCapitalize="none" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }} placeholder="example@kaidnews.com" />
        </label>
        {err(errors.email)}

        {user && can('usersAndRoles', 'editUsers') && <PasswordReveal userId={user.id} />}

        <div className="me-field">
          <span className="me-label"><Lock size={14} /> {user ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء عليها)' : t('users.password')}</span>
          <div className="mus-pass">
            <input className="me-input" type={showPass ? 'text' : 'password'} dir="ltr" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }} placeholder="********" />
            <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {err(errors.password)}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>{t('users.role')}</h3>
        {roles.length === 0 ? (
          <p className="mus-none">لا توجد أدوار. أضف دوراً من صفحة الأدوار أولاً.</p>
        ) : (
          <div className="mus-role-pick">
            {/* Member accounts have no role */}
            <button type="button" className={`partial ${roleId === '' ? 'on' : ''}`} onClick={() => setRoleId('')}>
              <span className="mus-role-icon"><ShieldAlert size={18} /></span>
              <span className="mus-card-text"><strong>بدون دور</strong><small>لا صلاحيات إضافية</small></span>
              <span className="mus-radio">{roleId === '' && <Check size={14} strokeWidth={3} />}</span>
            </button>
            {roles.map(r => {
              const isFull = r.accessLevel === 'full';
              const on = roleId === r.id;
              return (
                <button key={r.id} type="button" className={`${isFull ? 'full' : 'partial'} ${on ? 'on' : ''}`} onClick={() => { setRoleId(r.id); setErrors(p => ({ ...p, roleId: undefined })); }}>
                  <span className="mus-role-icon">{isFull ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}</span>
                  <span className="mus-card-text">
                    <strong>{r.name}</strong>
                    <small>{isFull ? t('roles_permissions.full_access') : `${enabledModules(r).length} من ${MODULES.length} قسماً`}</small>
                  </span>
                  <span className="mus-radio">{on && <Check size={14} strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>
        )}
        {err(errors.roleId)}
      </section>
    </MobileScreen>
  );
};
