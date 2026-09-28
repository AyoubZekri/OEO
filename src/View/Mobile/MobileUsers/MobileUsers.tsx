import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Pencil, Trash2, UserCog, Search, X, Mail, ShieldCheck, ShieldAlert } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useUsersController } from '../../Screen/UserManagement/Users/UsersController';
import type { UserModel } from '../../Screen/UserManagement/Users/user_model';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { type RolePermissions, userInitials } from './roleUtils';
import { MobileUserDetails } from './MobileUserDetails';
import { MobileUserForm } from './MobileUserForm';
import './MobileUsers.css';

interface MobileUsersProps {
  c: ReturnType<typeof useUsersController>;
  roles: RoleModel[];
  can: RolePermissions;
}

// Phone version of the users page: search and user cards with their role; details and form on their own pages
export const MobileUsers: React.FC<MobileUsersProps> = ({ c, roles, can }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('user');

  const roleOf = (u: UserModel) => roles.find(r => r.id === u.roleId);
  const q = query.trim().toLowerCase();
  const list = c.users.filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const details = detailsId ? c.users.find(u => String(u.id) === detailsId) : undefined;
  const fullCount = c.users.filter(u => roleOf(u)?.accessLevel === 'full').length;

  const menuItems = (u: UserModel): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(u.id) },
    ...(can.edit ? [{ key: 'edit', label: t('users.edit_user'), icon: Pencil, color: '#f97316', onClick: () => c.openEditDialog(u) }] : []),
    ...(can.delete ? [{ key: 'delete', label: t('users.delete_user'), icon: Trash2, danger: true, onClick: () => c.handleDeleteUser(u.id) }] : []),
  ];

  return (
    <div className="mus-page">
      <MobileAppBar title={t('users.title')} />

      <section className="mus-hero">
        <div className="mus-hero-top">
          <span className="mus-hero-icon"><UserCog size={26} /></span>
          <div>
            <small>حسابات الدخول للتطبيق</small>
            <strong>{c.users.length}</strong>
          </div>
        </div>
        <div className="mus-stats">
          <div className="green"><ShieldCheck size={16} /><strong>{fullCount}</strong><small>{t('roles_permissions.full_access')}</small></div>
          <div className="amber"><ShieldAlert size={16} /><strong>{c.users.length - fullCount}</strong><small>صلاحيات جزئية أو بدون دور</small></div>
        </div>
      </section>

      <label className="mus-search">
        <Search size={17} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد..." />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
      </label>

      {c.isLoading && !c.users.length ? (
        <MobileLoader text="جاري تحميل المستخدمين..." />
      ) : list.length === 0 ? (
        <div className="mus-empty">
          <span className="mus-empty-icon"><UserCog size={36} /></span>
          <strong>{query ? 'لا توجد نتائج' : t('users.no_users')}</strong>
          {!query && can.add && <p>أضف مستخدماً جديداً بالزر +</p>}
        </div>
      ) : (
        <div className="mus-list">
          {list.map(u => {
            const role = roleOf(u);
            const open = () => setDetailsId(u.id);
            return (
              <article
                key={u.id}
                className={`mus-card ${role?.accessLevel === 'full' ? 'full' : 'partial'}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="mus-card-top">
                  <span className="mus-avatar">{userInitials(u.name)}</span>
                  <span className="mus-card-text">
                    <strong>{u.name}</strong>
                    <small dir="ltr"><Mail size={11} /> {u.email}</small>
                  </span>
                  <MobileRowMenu items={menuItems(u)} label="إجراءات المستخدم" />
                </div>
                <div className="mus-card-foot">
                  <em className={`mus-role-badge ${role ? role.accessLevel : 'none'}`}>
                    {role?.accessLevel === 'full' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                    {role ? role.name : t('users.no_role')}
                  </em>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="mus-fab" onClick={c.openAddDialog} aria-label={t('users.add_user')} title={t('users.add_user')}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileUserDetails
          user={details}
          role={roleOf(details)}
          canEdit={can.edit}
          onEdit={() => c.openEditDialog(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isDialogOpen && (
        <MobileUserForm key={c.userToEdit?.id || 'new'} user={c.userToEdit} roles={roles} saving={c.isLoading} onSave={c.handleSaveUser} onClose={c.closeDialog} />
      )}
    </div>
  );
};
