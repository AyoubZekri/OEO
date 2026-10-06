import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { CustomInput } from '../../../widget/CustomInput';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { validInput } from '../../../../core/functions/valiedinput';
import { UserModel } from './user_model';
import { useRolesController } from '../Roles/RolesController';
import { useCan } from '../../../../core/functions/useCan';
import { PasswordReveal } from './PasswordReveal';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<UserModel, 'id' | 'toJson'>) => void;
  userToEdit?: UserModel | null;
}

export const UserDialog: React.FC<UserDialogProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState<{name?: string, email?: string, password?: string, roleId?: string}>({});

  // Fetch roles from RolesController
  const { roles } = useRolesController();
  const { t } = useTranslation();
  const can = useCan();

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setName(userToEdit.name);
        setEmail(userToEdit.email);
        setPassword(userToEdit.password || '');
        setRoleId(userToEdit.roleId);
      } else {
        setName('');
        setEmail('');
        setPassword('');
        // The role is optional: a new account starts without one (personal space only)
        setRoleId('');
      }
      setErrors({});
    }
  }, [isOpen, userToEdit, roles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {name?: string, email?: string, password?: string, roleId?: string} = {};
    
    const nameErr = validInput(name, 3, 50, 'text');
    if (nameErr) newErrors.name = nameErr;
    
    const emailErr = validInput(email, 5, 100, 'email');
    if (emailErr) newErrors.email = emailErr;
    
    const passErr = validInput(password, 6, 50, 'text', !!userToEdit);
    if (passErr && (!userToEdit || password.length > 0)) newErrors.password = passErr;
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave({
        name,
        email,
        password,
        roleId,
      });
    }
  };

  // Member accounts have no role: "no role" is a valid choice
  const roleOptions = [{ value: '', label: 'بدون دور' }, ...roles.map(role => ({
    value: role.id,
    label: role.name
  }))];

  return (
    <div className="task-dialog-overlay" onClick={onClose}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>{userToEdit ? t('users.edit_user') : t('users.add_new_user')}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <CustomInput 
              label={t('users.username') || 'إسم المستخدم'} 
              required 
              type="text" 
              value={name} 
              onChange={(e) => {setName(e.target.value); setErrors(p => ({...p, name: undefined}));}} 
              placeholder={t('users.username_placeholder') || 'إسم المستخدم'} 
              error={errors.name}
            />
          </div>

          <CustomInput 
            label={t('users.email')} 
            required 
            type="email" 
            value={email} 
            onChange={(e) => {setEmail(e.target.value); setErrors(p => ({...p, email: undefined}));}} 
            placeholder="example@kaidnews.com" 
            error={errors.email}
          />

          {userToEdit && can('usersAndRoles', 'editUsers') && <PasswordReveal userId={userToEdit.id} />}

          <CustomInput 
            label={userToEdit ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء عليها)' : t('users.password')} 
            required={!userToEdit} 
            type="password" 
            value={password} 
            onChange={(e) => {setPassword(e.target.value); setErrors(p => ({...p, password: undefined}));}} 
            placeholder="********" 
            error={errors.password}
          />

          <div className="form-row">
            <CustomDropdown<string>
              label={`${t('users.role')} (اختياري)`}
              value={roleId}
              options={roleOptions}
              onChange={(val) => {setRoleId(val); setErrors(p => ({...p, roleId: undefined}));}}
              placeholder={t('users.select_role') || 'اختر دوراً'}
              error={errors.roleId}
            />
          </div>
          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>{t('users.cancel')}</button>
            <button type="submit" className="btn-submit">{t('users.save_user')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
