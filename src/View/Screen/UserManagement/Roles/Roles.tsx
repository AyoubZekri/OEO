import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Shield, Eye, X, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useRolesController } from './RolesController';
import { RoleDialog } from './RoleDialog';
import { useAuth } from '../../../../core/context/AuthContext';
import './Roles.css';

export const Roles: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useRolesController();
  const { t } = useTranslation();


  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1>{t('roles_permissions.title')}</h1>
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
                {hasAccess(permissions.usersAndRoles.viewRoles) && (
                  <button className="btn-icon view" onClick={() => controller.openViewDialog(role)}>
                    <Eye size={18} />
                  </button>
                )}
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
          <div className="premium-role-dialog" style={{ fontFamily: 'var(--sans)', width: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="premium-dialog-header">
              <h2>{controller.roleToView.name} - {t('roles_permissions.permissions')}</h2>
              <button type="button" onClick={controller.closeViewDialog} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px 32px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                {t('roles_permissions.access_level')}:
              </span>
              <div className="access-level-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: controller.roleToView.accessLevel === 'full' ? '#ecfdf5' : '#fef3c7', color: controller.roleToView.accessLevel === 'full' ? '#059669' : '#d97706', fontWeight: 600 }}>
                {controller.roleToView.accessLevel === 'full' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                {controller.roleToView.accessLevel === 'full' ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}
              </div>
            </div>
            
            {controller.roleToView.accessLevel === 'partial' && (
              <div className="premium-modules-grid" style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(controller.roleToView.permissions).map(([moduleKey, actions]) => {
                  if (!actions.view) return null;

                  const activeActions = Object.entries(actions).filter(([key, isGranted]) => isGranted && key !== 'view');

                  return (
                    <div key={moduleKey} className="premium-module-card active">
                      <div className="premium-module-header" style={{ cursor: 'default' }}>
                        <div className="premium-module-title">
                          <div className="premium-module-icon">
                            <Shield size={24} />
                          </div>
                          {moduleKey === 'dashboard' ? 'الصفحة الرئيسية' : t(`roles_permissions.modules.${moduleKey}`)}
                        </div>
                      </div>
                      <div className="premium-actions-list">
                        {activeActions.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                            {activeActions.map(([actionKey]) => (
                              <div key={actionKey} className="premium-action-item">
                                <div className="premium-action-info" style={{ color: 'var(--primary-color)' }}>
                                  <CheckCircle2 size={16} /> 
                                  {t(`roles_permissions.actions.${actionKey}`)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', textAlign: 'center', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            صلاحية العرض فقط
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

