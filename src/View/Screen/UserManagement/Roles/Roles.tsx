import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Shield, X, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useRolesController } from './RolesController';
import { RoleDialog } from './RoleDialog';
import { useAuth } from '../../../../core/context/AuthContext';
import { defaultPermissions, type PermissionModule } from './role_model';
import { MODULE_ICONS } from './permissionIcons';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileRoles } from '../../../Mobile/MobileUsers/MobileRoles';
import './Roles.css';

// Section icons come from the shared permission icons
const getModuleIcon = (moduleKey: string) => React.createElement(MODULE_ICONS[moduleKey as PermissionModule] || Shield, { size: 22 });

export const Roles: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useRolesController();
  const { t } = useTranslation();

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
      />
    );
  }


  return (
    <div className="roles-container">
      <div className="roles-header" style={{ justifyContent: 'flex-end' }}>
        {hasAccess(permissions.usersAndRoles.addRoles) && (
          <button className="add-role-btn" onClick={controller.openAddDialog}>
            <Plus size={20} />
            {t('roles_permissions.add_role')}
          </button>
        )}
      </div>

      <div className="roles-grid">
        {controller.roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-card-header">
              <div className="role-title">
                <Shield size={24} className={role.accessLevel === 'full' ? 'icon-full' : 'icon-partial'} />
                <h2>{role.name}</h2>
              </div>
              <div className="role-actions">
                {hasAccess(permissions.usersAndRoles.editRoles) && (
                  <button className="btn-icon edit" onClick={() => controller.openEditDialog(role)}>
                    <Edit2 size={18} />
                  </button>
                )}
                {hasAccess(permissions.usersAndRoles.deleteRoles) && (
                  <button className="btn-icon delete" onClick={() => controller.handleDeleteRole(role.id)}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="role-card-body">
              <div className="access-level-badge">
                {role.accessLevel === 'full' ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}
              </div>
              
              {/* Permissions are now shown in the view dialog */}
            </div>
          </div>
        ))}
      </div>

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

