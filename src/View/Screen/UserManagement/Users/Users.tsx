import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useUsersController } from './UsersController';
import { UserDialog } from './UserDialog';
import { useRolesController } from '../Roles/RolesController';
import { useAuth } from '../../../../core/context/AuthContext';
import './Users.css';

export const Users: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const {
    users,
    isDialogOpen,
    userToEdit,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveUser,
    handleDeleteUser,
  } = useUsersController();

  const { roles } = useRolesController();
  const { t } = useTranslation();

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : t('users.no_role');
  };

  return (
    <div className="users-container" style={{ fontFamily: 'var(--sans)' }}>
      <div className="users-header">
        <h1>{t('users.title')}</h1>
        {hasAccess(permissions.usersAndRoles.addUsers) && (
          <button className="add-user-btn" onClick={openAddDialog}>
            <Plus size={20} />
            {t('users.add_user')}
          </button>
        )}
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('users.user_col')}</th>
              <th>{t('users.email_col')}</th>
              <th>{t('users.role_col')}</th>
              <th>{t('users.actions_col')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label={t('users.user_col', 'المستخدم')}>
                  <div className="user-name">
                    <div className="user-avatar">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td data-label={t('users.email_col', 'البريد')}>
                  <span className="user-email">{user.email}</span>
                </td>
                <td data-label={t('users.role_col', 'الدور')}>
                  <span className="access-level-badge">{getRoleName(user.roleId)}</span>
                </td>
                <td data-label={t('users.actions_col', 'إجراءات')}>
                  <div className="user-actions">
                    {hasAccess(permissions.usersAndRoles.editUsers) && (
                      <button 
                        className="btn-icon edit" 
                        onClick={() => openEditDialog(user)}
                        title={t('users.edit_user')}
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {hasAccess(permissions.usersAndRoles.deleteUsers) && (
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleDeleteUser(user.id)}
                        title={t('users.delete_user')}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  {t('users.no_users')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
      />
    </div>
  );
};
