import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, BadgeCheck } from 'lucide-react';
import { MobileSelect } from '../widgets/MobileSelect';
import { PostField } from '../../Screen/UserManagement/Users/PostField';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { MobileScreen } from '../widgets/MobileScreen';
import type { UserModel } from '../../Screen/UserManagement/Users/user_model';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { validInput } from '../../../core/functions/valiedinput';
import { useCan } from '../../../core/functions/useCan';
import { PasswordReveal } from '../../Screen/UserManagement/Users/PasswordReveal';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileUserFormProps {
  user: UserModel | null;
  roles: RoleModel[];
  saving: boolean;
  onSave: (user: Omit<UserModel, 'id' | 'toJson'>) => void;
  onClose: () => void;
  /** From a role's window: no role to choose (the new account takes that role) */
  hideRole?: boolean;
}

type Errors = { name?: string; email?: string; password?: string; roleId?: string };

// Phone version of the user dialog: same fields, checks and payload
export const MobileUserForm: React.FC<MobileUserFormProps> = ({ user, roles, saving, onSave, onClose, hideRole }) => {
  const { t } = useTranslation();
  const can = useCan();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  // The post: every user is a member too («لاعب» or a staff post)
  const [post, setPost] = useState(user?.memberType || '');
  // The role is optional: a new account starts without one (personal space only), like the desktop dialog
  const [roleId, setRoleId] = useState(user?.roleId || '');
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
    if (Object.keys(next).length) return;
    if (!user && !post) {
      showSnackbar('خطأ', 'اختر المنصب', '#ef4444');
      return;
    }
    onSave({ name, email, password, roleId, memberType: post });
  };

  const err = (text?: string) => (text ? <p className="mus-form-error"><AlertCircle size={14} /> {text}</p> : null);

  return (
    <MobileScreen
      title={user ? t('users.edit_user') : t('users.add_new_user')}
      onBack={onClose}
      layer={hideRole ? 3 : 2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mus-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : user ? t('users.save_user') : 'تأكيد'}
        </button>
      )}
    >
      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><User size={14} /> {t('users.username')}</span>
          <input className={`me-input ${errors.name ? 'is-missing' : ''}`} type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }} />
        </label>
        {err(errors.name)}

        <label className="me-field">
          <span className="me-label"><Mail size={14} /> {t('users.email')}</span>
          <input className={`me-input ${errors.email ? 'is-missing' : ''}`} type="email" dir="ltr" inputMode="email" autoCapitalize="none" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }} />
        </label>
        {err(errors.email)}

        {user && can('usersAndRoles', 'editUsers') && <PasswordReveal userId={user.id} />}

        <div className="me-field">
          <span className="me-label"><Lock size={14} /> {user ? 'كلمة المرور الجديدة' : t('users.password')}</span>
          <div className="mus-pass">
            <input className={`me-input ${errors.password ? 'is-missing' : ''}`} type={showPass ? 'text' : 'password'} dir="ltr" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }} />
            <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {err(errors.password)}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><BadgeCheck size={16} /></span>المنصب</h3>
        <PostField value={post} onChange={setPost} mobile />
      </section>

      {/* The role — the app's dropdown */}
      {!hideRole && (
        <section className="me-card">
          <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>{t('users.role')}</h3>
          <MobileSelect
            label={t('users.role')}
            icon={ShieldCheck}
            value={roleId}
            options={[{ value: '', label: 'بدون دور' }, ...roles.map(r => ({ value: r.id, label: r.name }))]}
            onChange={v => { setRoleId(v); setErrors(p => ({ ...p, roleId: undefined })); }}
            placeholder="بدون دور"
          />
          {err(errors.roleId)}
        </section>
      )}
    </MobileScreen>
  );
};
