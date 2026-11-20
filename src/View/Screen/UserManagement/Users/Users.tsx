import React, { useState } from 'react';
import defaultAvatar from '../../../../assets/AVETER.png';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Send } from 'lucide-react';
import { sendLoginWhatsApp } from './sendLoginWhatsApp';
import { useUsersController } from './UsersController';
import { UserDialog } from './UserDialog';
import { useRolesController } from '../Roles/RolesController';
import { useAuth } from '../../../../core/context/AuthContext';
import { Pagination } from '../../../widget/Pagination';
import { ItemsPerPageSelector } from '../../../widget/ItemsPerPageSelector';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileUsers } from '../../../Mobile/MobileUsers/MobileUsers';
import './Users.css';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { TopbarSearch } from '../../../widget/TopbarSearch';

/** A photo that does not load: the app's default picture (as on the members page) */
const onPhotoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (!e.currentTarget.src.endsWith(defaultAvatar)) e.currentTarget.src = defaultAvatar;
};

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
        <TopbarSearch value={query} onChange={v => { setQuery(v); setCurrentPage(1); }} placeholder="ابحث عن مستخدم" />
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
                    {/* The linked member's photo, else the name's first letters */}
                    <div className={`user-avatar ${user.photo ? 'has-photo' : ''}`}>
                      {user.photo ? <img src={user.photo} alt="" onError={onPhotoError} loading="lazy" /> : user.name.substring(0, 2).toUpperCase()}
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
                  {/* Its actions in one ⋮: edit, send its login in WhatsApp, delete (those this role may do) */}
                  <ActionsMenu
                    label="إجراءات المستخدم"
                    items={[
                      ...(hasAccess(permissions.usersAndRoles.editUsers) ? [
                        { key: 'edit', label: t('users.edit_user'), icon: Edit2, color: '#f97316', onClick: () => openEditDialog(user) },
                        { key: 'whatsapp', label: 'إرسال البريد وكلمة المرور', icon: Send, color: '#16a34a', onClick: () => sendLoginWhatsApp(user) },
                      ] : []),
                      ...(hasAccess(permissions.usersAndRoles.deleteUsers) ? [
                        { key: 'delete', label: t('users.delete_user'), icon: Trash2, danger: true, onClick: () => handleDeleteUser(user.id) },
                      ] : []),
                    ]}
                  />
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
