import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Shield, X, CheckCircle2, ShieldCheck, ShieldAlert, FolderPlus, FolderOpen, Layers } from 'lucide-react';
import { useRolesController } from './RolesController';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { RoleDialog } from './RoleDialog';
import { useAuth } from '../../../../core/context/AuthContext';
import { defaultPermissions, type PermissionModule } from './role_model';
import { MODULE_ICONS } from './permissionIcons';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileRoles } from '../../../Mobile/MobileUsers/MobileRoles';
import { RoleSections, SectionDialog, ROLE_DRAG_TYPE, type SectionFilter } from './RoleSections';
import './Roles.css';

// Section icons come from the shared permission icons
const getModuleIcon = (moduleKey: string) => React.createElement(MODULE_ICONS[moduleKey as PermissionModule] || Shield, { size: 22 });

export const Roles: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useRolesController();
  const { t } = useTranslation();
  // The section shown (on top), and the role being dragged onto one
  const [filter, setFilter] = useState<SectionFilter>('all');
  const [dragging, setDragging] = useState<string | null>(null);
  // A section's side card a role is dragged over (the grouped view)
  const [overSide, setOverSide] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const sectionCan = {
    add: hasAccess(permissions.usersAndRoles.addRoles),
    edit: hasAccess(permissions.usersAndRoles.editRoles),
    delete: hasAccess(permissions.usersAndRoles.deleteRoles),
  };

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileRoles
        c={controller}
        can={{
          add: hasAccess(permissions.usersAndRoles.addRoles),
          edit: hasAccess(permissions.usersAndRoles.editRoles),
          delete: hasAccess(permissions.usersAndRoles.deleteRoles),
        }}
        filter={filter}
        onFilter={setFilter}
      />
    );
  }

  const shown = controller.roles.filter(r => filter === 'all' || (filter === 'none' ? !r.sectionId : r.sectionId === filter));


  /** A role's card (dragged onto a section: moved into it) */
  const roleCard = (role: (typeof controller.roles)[number]) => (
    <div
      key={role.id}
      className={`role-card ${dragging === role.id ? 'dragging' : ''}`}
      // Dragged onto a section on top: moved into it
      draggable={sectionCan.edit && controller.sections.length > 0}
      onDragStart={e => { e.dataTransfer.setData(ROLE_DRAG_TYPE, role.id); e.dataTransfer.effectAllowed = 'move'; setDragging(role.id); }}
      onDragEnd={() => setDragging(null)}
    >
      <div className="role-card-header">
        <div className="role-title">
          <Shield size={24} className={role.accessLevel === 'full' ? 'icon-full' : 'icon-partial'} />
          <h2>{role.name}</h2>
        </div>
        {/* Its actions in one ⋮ (those this role may do) */}
        <div className="role-actions" onMouseDown={e => e.stopPropagation()} draggable={false} onDragStart={e => e.preventDefault()}>
          <ActionsMenu
            label="إجراءات الدور"
            items={[
              ...(hasAccess(permissions.usersAndRoles.editRoles) ? [{ key: 'edit', label: t('roles_permissions.edit_permissions'), icon: Edit2, color: '#f97316', onClick: () => controller.openEditDialog(role) }] : []),
              ...(hasAccess(permissions.usersAndRoles.deleteRoles) ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => controller.handleDeleteRole(role.id) }] : []),
            ]}
          />
        </div>
      </div>

      <div className="role-card-body">
        <div className="access-level-badge">
          {role.accessLevel === 'full' ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}
        </div>

        {/* Permissions are now shown in the view dialog */}
      </div>
    </div>
  );

  return (
    <div className="roles-container">
      <div className="roles-header" style={{ justifyContent: 'flex-end', gap: 10 }}>
        {hasAccess(permissions.usersAndRoles.addRoles) && (
          <button className="add-role-btn" onClick={controller.openAddDialog}>
            <Plus size={20} />
            {t('roles_permissions.add_role')}
          </button>
        )}
        {sectionCan.add && (
          <button className="add-role-btn secondary" onClick={() => setAddingSection(true)}>
            <FolderPlus size={20} />
            قسم جديد
          </button>
        )}
      </div>

      <RoleSections
        sections={controller.sections}
        roles={controller.roles}
        value={filter}
        onChange={setFilter}
        mobile={false}
        can={sectionCan}
        onSave={controller.saveSection}
        onDelete={controller.deleteSections}
        onMove={controller.moveRole}
        hideAdd
      />
      {addingSection && <SectionDialog section={null} onSave={name => controller.saveSection(name)} onClose={() => setAddingSection(false)} />}

      {/* All the roles: each section on the side, its roles beside it (the section as tall as its rows); then the roles
          in no section. One section chosen on top: its roles alone */}
      {filter === 'all' && controller.sections.length > 0 ? (
        <div className="rsec-groups">
          {controller.sections.map(sec => {
            const its = controller.roles.filter(r => r.sectionId === sec.id);
            return (
              <div key={sec.id} className="rsec-group">
                <aside
                  className={`rsec-side ${overSide === sec.id ? 'drop' : ''}`}
                  onDragOver={e => { if (e.dataTransfer.types.includes(ROLE_DRAG_TYPE)) { e.preventDefault(); setOverSide(sec.id); } }}
                  onDragLeave={() => setOverSide(o => (o === sec.id ? null : o))}
                  onDrop={e => { const id = e.dataTransfer.getData(ROLE_DRAG_TYPE); setOverSide(null); if (id) { e.preventDefault(); controller.moveRole(id, sec.id); } }}
                >
                  <span className="rsec-side-icon"><FolderOpen size={22} /></span>
                  <strong>{sec.name}</strong>
                  <small>{its.length} {its.length === 1 ? 'دور' : 'أدوار'}</small>
                </aside>
                <div className="roles-grid rsec-group-roles">
                  {its.length ? its.map(roleCard) : <div className="rsec-group-empty">اسحب دوراً إلى هنا</div>}
                </div>
              </div>
            );
          })}
          {/* The roles in no section, last: the same, under «بلا قسم» (a role dropped there leaves its section) */}
          {controller.roles.some(r => !r.sectionId) && (() => {
            const none = controller.roles.filter(r => !r.sectionId);
            return (
              <div className="rsec-group none">
                <aside
                  className={`rsec-side none ${overSide === '' ? 'drop' : ''}`}
                  onDragOver={e => { if (e.dataTransfer.types.includes(ROLE_DRAG_TYPE)) { e.preventDefault(); setOverSide(''); } }}
                  onDragLeave={() => setOverSide(o => (o === '' ? null : o))}
                  onDrop={e => { const id = e.dataTransfer.getData(ROLE_DRAG_TYPE); setOverSide(null); if (id) { e.preventDefault(); controller.moveRole(id, ''); } }}
                >
                  <span className="rsec-side-icon"><Layers size={22} /></span>
                  <strong>بلا قسم</strong>
                  <small>{none.length} {none.length === 1 ? 'دور' : 'أدوار'}</small>
                </aside>
                <div className="roles-grid rsec-group-roles">{none.map(roleCard)}</div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="roles-grid">
          {shown.map(roleCard)}
        </div>
      )}

      <RoleDialog
        isOpen={controller.isDialogOpen}
        onClose={controller.closeDialog}
        onSave={controller.handleSaveRole}
        roleToEdit={controller.roleToEdit}
      />

      {controller.roleToView && (
        <div className="premium-dialog-overlay" onClick={controller.closeViewDialog}>
          <div className="premium-role-dialog" style={{ fontFamily: 'var(--sans)', width: '800px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="premium-dialog-header">
              <h2>{controller.roleToView.name} - {t('roles_permissions.permissions')}</h2>
              <button type="button" onClick={controller.closeViewDialog} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '18px 28px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)' }}>
                  {t('roles_permissions.access_level')}:
                </span>
                <div className="access-level-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: controller.roleToView.accessLevel === 'full' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: controller.roleToView.accessLevel === 'full' ? '#059669' : '#d97706', fontWeight: 700, margin: 0 }}>
                  {controller.roleToView.accessLevel === 'full' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                  {controller.roleToView.accessLevel === 'full' ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}
                </div>
              </div>
            </div>

            <div className="view-permissions-grid" style={{ flex: 1, overflowY: 'auto' }}>
              {Object.entries(defaultPermissions).map(([moduleKey, defaultActions]) => {
                const modulePerms = controller.roleToView!.accessLevel === 'full'
                  ? defaultPermissions[moduleKey as keyof typeof defaultPermissions]
                  : controller.roleToView!.permissions[moduleKey as keyof typeof defaultPermissions];

                const isModuleActive = modulePerms.view === true;

                // Get the actions for this module based on default permissions keys (excluding 'view')
                const actionKeys = Object.keys(defaultActions).filter(k => k !== 'view');

                return (
                  <div key={moduleKey} className={`view-module-card ${isModuleActive ? 'active' : 'inactive'}`}>
                    <div className="view-module-header">
                      <div className="view-module-icon">
                        {getModuleIcon(moduleKey)}
                      </div>
                      <div className="view-module-title-wrap">
                        <h3>{t(`roles_permissions.modules.${moduleKey}`)}</h3>
                        <span className={`view-status-badge ${isModuleActive ? 'active' : 'inactive'}`}>
                          {isModuleActive ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </div>
                    </div>

                    {actionKeys.length > 0 && (
                      <div className="view-permissions-list">
                        {actionKeys.map(actionKey => {
                          const isActionGranted = (modulePerms as any)[actionKey] === true;
                          return (
                            <div key={actionKey} className={`view-perm-chip ${isActionGranted ? 'granted' : 'denied'}`}>
                              {isActionGranted ? <CheckCircle2 size={14} /> : <X size={14} />}
                              <span>{t(`roles_permissions.actions.${actionKey}`)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--card-bg)' }}>
              <button
                type="button"
                onClick={controller.closeViewDialog}
                style={{ padding: '8px 24px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
              >
                {t('roles_permissions.cancel', 'إغلاق')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

