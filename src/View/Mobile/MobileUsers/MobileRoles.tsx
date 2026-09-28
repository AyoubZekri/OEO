import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Pencil, Trash2, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useRolesController } from '../../Screen/UserManagement/Roles/RolesController';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { type RolePermissions, MODULES, enabledModules } from './roleUtils';
import { MobileRoleDetails } from './MobileRoleDetails';
import { MobileRoleForm } from './MobileRoleForm';
import './MobileUsers.css';

// Phone version of the roles page: every role as a card with its enabled sections; details and form on their own pages
export const MobileRoles: React.FC<{ c: ReturnType<typeof useRolesController>; can: RolePermissions }> = ({ c, can }) => {
  const { t } = useTranslation();
  const [detailsId, setDetailsId] = useUrlDetails('role');
  const details = detailsId ? c.roles.find(r => String(r.id) === detailsId) : undefined;
  const full = c.roles.filter(r => r.accessLevel === 'full').length;

  const menuItems = (r: RoleModel): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض الصلاحيات', icon: Eye, color: '#f97316', onClick: () => setDetailsId(r.id) },
    ...(can.edit ? [{ key: 'edit', label: t('roles_permissions.edit_permissions'), icon: Pencil, color: '#f97316', onClick: () => c.openEditDialog(r) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.handleDeleteRole(r.id) }] : []),
  ];

  return (
    <div className="mus-page">
      <MobileAppBar title="الأدوار والصلاحيات" />

      <section className="mus-hero">
        <div className="mus-hero-top">
          <span className="mus-hero-icon"><Shield size={26} /></span>
          <div>
            <small>{t('roles_permissions.title')}</small>
            <strong>{c.roles.length}</strong>
          </div>
        </div>
        <div className="mus-stats">
          <div className="green"><ShieldCheck size={16} /><strong>{full}</strong><small>{t('roles_permissions.full_access')}</small></div>
          <div className="amber"><ShieldAlert size={16} /><strong>{c.roles.length - full}</strong><small>{t('roles_permissions.partial_access')}</small></div>
        </div>
      </section>

      {c.isLoading && !c.roles.length ? (
        <MobileLoader text="جاري تحميل الأدوار..." />
      ) : c.roles.length === 0 ? (
        <div className="mus-empty">
          <span className="mus-empty-icon"><Shield size={36} /></span>
          <strong>لا توجد أدوار حالياً</strong>
          {can.add && <p>أضف دوراً جديداً بالزر +</p>}
        </div>
      ) : (
        <div className="mus-list">
          {c.roles.map(r => {
            const isFull = r.accessLevel === 'full';
            const on = enabledModules(r);
            const open = () => setDetailsId(r.id);
            return (
              <article
                key={r.id}
                className={`mus-card ${isFull ? 'full' : 'partial'}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="mus-card-top">
                  <span className="mus-role-icon">{isFull ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}</span>
                  <span className="mus-card-text">
                    <strong>{r.name}</strong>
                    <em className="mus-level">{isFull ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}</em>
                  </span>
                  <MobileRowMenu items={menuItems(r)} label="إجراءات الدور" />
                </div>
                <div className="mus-card-foot">
                  <div className="mus-mods">
                    {MODULES.map(m => (
                      <span key={m.key} className={on.includes(m) ? 'on' : ''} title={t(`roles_permissions.modules.${m.key}`)}>
                        <m.icon size={13} />
                      </span>
                    ))}
                  </div>
                  <small><b>{on.length}</b> من {MODULES.length} قسماً</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="mus-fab" onClick={c.openAddDialog} aria-label={t('roles_permissions.add_role')} title={t('roles_permissions.add_role')}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileRoleDetails role={details} canEdit={can.edit} onEdit={() => c.openEditDialog(details)} onClose={() => setDetailsId(null)} />
      )}

      {c.isDialogOpen && (
        <MobileRoleForm key={c.roleToEdit?.id || 'new'} role={c.roleToEdit} saving={c.isLoading} onSave={c.handleSaveRole} onClose={c.closeDialog} />
      )}
    </div>
  );
};
