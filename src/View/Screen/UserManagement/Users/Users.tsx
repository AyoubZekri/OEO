import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useUsersController } from './UsersController';
import { UserDialog } from './UserDialog';
import { useRolesController } from '../Roles/RolesController';
import { useAuth } from '../../../../core/context/AuthContext';
import { Pagination } from '../../../widget/Pagination';
import { ItemsPerPageSelector } from '../../../widget/ItemsPerPageSelector';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileUsers } from '../../../Mobile/MobileUsers/MobileUsers';
import './Users.css';

export const Users: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const usersController = useUsersController();
  const {
    users,
    isDialogOpen,
    userToEdit,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveUser,
    handleDeleteUser,
  } = usersController;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [query, setQuery] = useState('');

  const { roles } = useRolesController();
  const { t } = useTranslation();

  // Search by name, email or role
  const q = query.trim().toLowerCase();
  const roleNameOf = (roleId: string) => roles.find(r => r.id === roleId)?.name || '';
  const visibleUsers = q
    ? users.filter(u => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || roleNameOf(u.roleId).toLowerCase().includes(q))
    : users;
  const paginatedUsers = visibleUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileUsers
        c={usersController}
        roles={roles}
        can={{
          add: hasAccess(permissions.usersAndRoles.addUsers),
          edit: hasAccess(permissions.usersAndRoles.editUsers),
          delete: hasAccess(permissions.usersAndRoles.deleteUsers),
        }}
      />
    );
  }

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : t('users.no_role');
  };

  return (
    <div className="users-container" style={{ fontFamily: 'var(--sans)' }}>
      <div className="users-header" style={{ justifyContent: 'flex-end', gap: '12px' }}>
        <div className="search-box users-search">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="ابحث عن مستخدم..."
            value={query}
            onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        {hasAccess(permissions.usersAndRoles.addUsers) && (
          <button className="add-user-btn" onClick={openAddDialog}>
            <Plus size={20} />
            {t('users.add_user')}
          </button>
        )}
      </div>

      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="users-table-container">
          <table className="custom-table">
          <thead>
            <tr>
              <th>{t('users.user_col')}</th>
              <th>{t('users.email_col')}</th>
              <th>{t('users.role_col')}</th>
              <th>{t('users.actions_col')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td data-label={t('users.user_col', 'المستخدم')} className="avatar-cell">
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
                <td data-label={t('users.actions_col', 'إجراءات')} className="actions-cell">
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
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  {users.length && q ? 'لا يوجد مستخدم بهذا البحث' : t('users.no_users')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination 
          totalItems={visibleUsers.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
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
