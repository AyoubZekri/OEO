import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, UserPlus, UserCog, User, Mail, Lock, Eye, EyeOff, BadgeCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { validInput } from '../../../../core/functions/valiedinput';
import { showSnackbar } from '../../../../core/functions/Snacpar';
import { UserModel } from './user_model';
import { useRolesController } from '../Roles/RolesController';
import { useCan } from '../../../../core/functions/useCan';
import { PasswordReveal } from './PasswordReveal';
import { PostField } from './PostField';
import './UserDialog.css';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<UserModel, 'id' | 'toJson'>) => void;
  userToEdit?: UserModel | null;
}

type Errors = { name?: string; email?: string; password?: string };

/**
 * Adding or editing a user (computer): the account (name, email, password), the post — every user is a member too,
 * on the staff (the players are added on the members page) — then the role. The app's dropdowns; a field's message
 * under it, a choice's in a snackbar.
 */
export const UserDialog: React.FC<UserDialogProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [post, setPost] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const { roles } = useRolesController();
  const { t } = useTranslation();
  const can = useCan();

  useEffect(() => {
    if (!isOpen) return;
    setName(userToEdit?.name || '');
    setEmail(userToEdit?.email || '');
    setPassword('');
    setShowPass(false);
    // The role is optional: a new account starts without one (personal space only)
    setRoleId(userToEdit?.roleId || '');
    setPost(userToEdit?.memberType || '');
    setErrors({});
  }, [isOpen, userToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const nameErr = validInput(name, 3, 50, 'text');
    if (nameErr) next.name = nameErr;
    const emailErr = validInput(email, 5, 100, 'email');
    if (emailErr) next.email = emailErr;
    const passErr = validInput(password, 6, 50, 'text', !!userToEdit);
    if (passErr && (!userToEdit || password.length > 0)) next.password = passErr;
    setErrors(next);
    if (Object.keys(next).length) return;
    // A new user's post (a choice): its message in a snackbar
    if (!userToEdit && !post) {
      showSnackbar('خطأ', 'اختر المنصب', '#ef4444');
      return;
    }
    onSave({ name, email, password, roleId, memberType: post });
  };

  // An account may have no role: «بدون دور» is a choice
  const roleOptions = [{ value: '', label: 'بدون دور' }, ...roles.map(role => ({ value: role.id, label: role.name }))];
  const clear = (k: keyof Errors) => setErrors(p => ({ ...p, [k]: undefined }));

  return createPortal(
    <div className="ud-overlay" onMouseDown={onClose}>
      <form className="ud" role="dialog" aria-modal="true" aria-label={userToEdit ? t('users.edit_user') : t('users.add_new_user')} onMouseDown={e => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <header className="ud-head">
          <span className="ud-head-icon">{userToEdit ? <UserCog size={22} /> : <UserPlus size={22} />}</span>
          <h2>{userToEdit ? t('users.edit_user') : t('users.add_new_user')}</h2>
          <button type="button" className="ud-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ud-body">
          {/* The account */}
          <section className="ud-card">
            <h3 className="ud-card-title"><span><User size={15} /></span>الحساب</h3>
            <label className="ud-field">
              <span className="ud-label"><User size={14} />{t('users.username')}</span>
              <input className={errors.name ? 'is-missing' : ''} type="text" value={name} maxLength={50} onChange={e => { setName(e.target.value); clear('name'); }} autoFocus />
              {errors.name && <small className="ud-error"><AlertCircle size={13} />{errors.name}</small>}
            </label>
            <label className="ud-field">
              <span className="ud-label"><Mail size={14} />{t('users.email')}</span>
              <input className={errors.email ? 'is-missing' : ''} type="email" dir="ltr" value={email} onChange={e => { setEmail(e.target.value); clear('email'); }} />
              {errors.email && <small className="ud-error"><AlertCircle size={13} />{errors.email}</small>}
            </label>
            {userToEdit && can('usersAndRoles', 'editUsers') && <PasswordReveal userId={userToEdit.id} />}
            <label className="ud-field">
              <span className="ud-label"><Lock size={14} />{userToEdit ? 'كلمة المرور الجديدة' : t('users.password')}</span>
              <span className="ud-pass">
                <input className={errors.password ? 'is-missing' : ''} type={showPass ? 'text' : 'password'} dir="ltr" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); clear('password'); }} />
                <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {errors.password && <small className="ud-error"><AlertCircle size={13} />{errors.password}</small>}
            </label>
          </section>

          {/* The post: the member the user is */}
          <section className="ud-card">
            <h3 className="ud-card-title"><span><BadgeCheck size={15} /></span>المنصب</h3>
            <PostField value={post} onChange={setPost} mobile={false} />
          </section>

          <section className="ud-card">
            <h3 className="ud-card-title"><span><ShieldCheck size={15} /></span>{t('users.role')}</h3>
            <CustomDropdown<string> value={roleId} options={roleOptions} onChange={setRoleId} placeholder="بدون دور" />
          </section>
        </div>

        <footer className="ud-foot">
          <button type="button" className="ud-btn ghost" onClick={onClose}>{t('users.cancel')}</button>
          <button type="submit" className="ud-btn primary">{userToEdit ? 'حفظ التعديلات' : 'تأكيد'}</button>
        </footer>
      </form>
    </div>,
    document.body,
  );
};
