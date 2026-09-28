import {
  type AppPermissions, type PermissionModule, type RoleModel, defaultPermissions, MODULE_ACTIONS, ALL_MODULES, PERMISSION_DOMAINS,
} from '../../Screen/UserManagement/Roles/role_model';
import { MODULE_ICONS, type PermissionIcon } from '../../Screen/UserManagement/Roles/permissionIcons';

export { actionIcon } from '../../Screen/UserManagement/Roles/permissionIcons';

export interface RolePermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ModuleInfo {
  key: PermissionModule;
  actions: string[];
  icon: PermissionIcon;
}

// Every section of the app (same list as the desktop role dialog)
export const MODULES: ModuleInfo[] = ALL_MODULES.map(key => ({ key, actions: MODULE_ACTIONS[key], icon: MODULE_ICONS[key] }));

/** The sections grouped by domain */
export const DOMAINS = PERMISSION_DOMAINS.map(d => ({ ...d, items: MODULES.filter(m => d.modules.includes(m.key)) }));

/** The permissions a role really has (full access = everything) */
export const permsOf = (role: RoleModel): AppPermissions => (role.accessLevel === 'full' ? defaultPermissions : role.permissions);

export const enabledModules = (role: RoleModel) => MODULES.filter(m => permsOf(role)[m.key]?.view === true);

/** Same avatar letters as the desktop users table */
export const userInitials = (name: string) => name.substring(0, 2).toUpperCase();
