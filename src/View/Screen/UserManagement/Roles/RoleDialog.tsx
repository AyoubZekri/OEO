import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, ShieldCheck, Users, UsersRound, FileText, Wallet, Vault, PieChart, Shield, Plus, Edit2, Trash2, Printer, Search, Settings, Activity, Package, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { CustomInput } from '../../../widget/CustomInput';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { RoleModel, defaultPermissions } from './role_model';
import type { AppPermissions } from './role_model';
import { validInput } from '../../../../core/functions/valiedinput';
import './Roles.css';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<RoleModel, 'id' | 'toJson'>) => void;
  roleToEdit?: RoleModel | null;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'add': return <Plus size={18} className="premium-action-icon" />;
    case 'edit': return <Edit2 size={18} className="premium-action-icon" />;
    case 'delete': return <Trash2 size={18} className="premium-action-icon" />;
    case 'print': return <Printer size={18} className="premium-action-icon" />;
    case 'handover': return <ArrowLeftRight size={18} className="premium-action-icon" />;
    case 'return': return <RefreshCw size={18} className="premium-action-icon" />;
    case 'viewFinancialRecord': return <Search size={18} className="premium-action-icon" />;
    case 'addTransaction': return <Plus size={18} className="premium-action-icon" />;
    case 'deleteTransaction': return <Trash2 size={18} className="premium-action-icon" />;
    case 'viewIndividuals':
    case 'viewTeams':
    case 'viewContracts':
    case 'viewFunds':
    case 'viewUsers':
    case 'viewRoles':
      return <Search size={18} className="premium-action-icon" />;
    case 'manageUsers':
    case 'manageRoles':
      return <Settings size={18} className="premium-action-icon" />;
    default: return <Activity size={18} className="premium-action-icon" />;
  }
};

const getModuleIcon = (moduleKey: string) => {
  switch (moduleKey) {
    case 'dashboard': return <Activity size={24} />;
    case 'members': return <Users size={24} />;
    case 'teams': return <UsersRound size={24} />;
    case 'contracts': return <FileText size={24} />;
    case 'payments': return <Wallet size={24} />;
    case 'funds': return <Vault size={24} />;
    case 'reports': return <PieChart size={24} />;
    case 'usersAndRoles': return <Shield size={24} />;
    case 'equipment': return <Package size={24} />;
    case 'equipmentOperations': return <ArrowLeftRight size={24} />;
    default: return <Shield size={24} />;
  }
};

export const RoleDialog: React.FC<RoleDialogProps> = ({ isOpen, onClose, onSave, roleToEdit }) => {
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<'full' | 'partial'>('full');
  const [appPerms, setAppPerms] = useState<AppPermissions>({ ...defaultPermissions });
  const [errors, setErrors] = useState<{name?: string}>({});
  const { t } = useTranslation();

  const modulesConfig: { key: keyof AppPermissions; actions: string[] }[] = [
    { key: 'dashboard', actions: [] },
    { key: 'members', actions: ['add', 'edit', 'delete', 'viewFinancialRecord'] },
    { key: 'teams', actions: ['add', 'edit', 'delete'] },
    { key: 'contracts', actions: ['add', 'edit', 'delete', 'print', 'renew'] },
    { key: 'payments', actions: ['add', 'edit', 'delete'] },
    { key: 'funds', actions: ['add', 'edit', 'delete', 'addTransaction'] },
    { key: 'reports', actions: ['viewIndividuals', 'viewTeams', 'viewContracts', 'viewFunds'] },
    { key: 'usersAndRoles', actions: ['viewUsers', 'addUsers', 'editUsers', 'deleteUsers', 'viewRoles', 'addRoles', 'editRoles', 'deleteRoles'] },
    { key: 'equipment', actions: ['add', 'edit', 'delete', 'print'] },
    { key: 'equipmentOperations', actions: ['handover', 'return', 'edit', 'delete', 'print'] }
  ];

  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        setName(roleToEdit.name);
        setAccessLevel(roleToEdit.accessLevel);
        setAppPerms(JSON.parse(JSON.stringify(roleToEdit.permissions))); 
      } else {
        setName('');
        setAccessLevel('full');
        setAppPerms(JSON.parse(JSON.stringify(defaultPermissions)));
      }
      setErrors({});
    }
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {name?: string} = {};
    const nameErr = validInput(name, 3, 50, 'text');
    if (nameErr) newErrors.name = nameErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name,
        accessLevel,
        permissions: accessLevel === 'full' ? JSON.parse(JSON.stringify(defaultPermissions)) : appPerms
      });
    }
  };

  const handleActionChange = (moduleKey: keyof AppPermissions, actionKey: string, checked: boolean) => {
    setAppPerms(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: checked
      }
    }));
  };

  const handleModuleToggle = (moduleKey: keyof AppPermissions, checked: boolean) => {
    setAppPerms(prev => {
      const newModulePerms = { ...prev[moduleKey] };
      if (!checked) {
        Object.keys(newModulePerms).forEach(key => {
          (newModulePerms as any)[key] = false;
        });
      } else {
        Object.keys(newModulePerms).forEach(key => {
          (newModulePerms as any)[key] = true;
        });
      }
      return { ...prev, [moduleKey]: newModulePerms };
    });
  };

  return (
    <div className="premium-dialog-overlay" onClick={onClose}>
      <div className="premium-role-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="premium-dialog-header">
          <h2>{roleToEdit ? t('roles_permissions.edit_permissions') : t('roles_permissions.add_role')}</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px 32px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <div className="role-form-top">
              <CustomInput 
                type="text" 
                value={name} 
                label={t('roles_permissions.role_name')} 
                onChange={(e) => {setName(e.target.value); setErrors({});}} 
                placeholder={t('roles_permissions.role_name')} 
                error={errors.name}
              />

              <CustomDropdown<'full' | 'partial'>
                label={t('roles_permissions.access_level')}
                value={accessLevel}
                options={[
                  { value: 'full', label: t('roles_permissions.full_access'), icon: <ShieldCheck size={16} color="#10B981" /> },
                  { value: 'partial', label: t('roles_permissions.partial_access'), icon: <ShieldAlert size={16} color="#F59E0B" /> },
                ]}
                onChange={(val) => setAccessLevel(val)}
              />
            </div>
          </div>

          <div className="premium-modules-grid" style={{ pointerEvents: accessLevel === 'full' ? 'none' : 'auto', opacity: accessLevel === 'full' ? 0.7 : 1 }}>
            {modulesConfig.map((module) => {
              const modulePerms = accessLevel === 'full' ? defaultPermissions[module.key] : appPerms[module.key];
              const isModuleActive = modulePerms.view === true;

              return (
                <div key={module.key} className={`premium-module-card ${isModuleActive ? 'active' : ''}`}>
                  <div className="premium-module-header">
                    <div className="premium-module-title">
                      <div className="premium-module-icon">
                        {getModuleIcon(module.key)}
                      </div>
                      {module.key === 'dashboard' ? 'الصفحة الرئيسية' : 
                       module.key === 'equipment' ? 'معدات الفريق' :
                       module.key === 'equipmentOperations' ? 'حركة العتاد' :
                       t(`roles_permissions.modules.${module.key}`)}
                    </div>
                    <label className="glow-switch">
                      <input 
                        type="checkbox" 
                        checked={isModuleActive}
                        onChange={(e) => handleModuleToggle(module.key, e.target.checked)}
                      />
                      <span className="glow-slider"></span>
                    </label>
                  </div>

                  {isModuleActive && (
                    <div className="premium-actions-list">
                      {module.actions.map(action => (
                        <div key={action} className="premium-action-item">
                          <div className="premium-action-info">
                            {getActionIcon(action)}
                            {action === 'handover' ? 'تسليم' : 
                             action === 'return' ? 'إرجاع' :
                             t(`roles_permissions.actions.${action}`)}
                          </div>
                          <label className="glow-switch small-switch">
                            <input 
                              type="checkbox" 
                              checked={(modulePerms as any)[action] || false} 
                              disabled={!isModuleActive}
                              onChange={(e) => handleActionChange(module.key, action, e.target.checked)} 
                            />
                            <span className="glow-slider"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', position: 'sticky', bottom: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 500 }}>{t('roles_permissions.cancel')}</button>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 500 }}>{t('roles_permissions.save_role')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
