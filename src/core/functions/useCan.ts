import { useAuth } from '../context/AuthContext';
import type { PermissionModule } from '../../View/Screen/UserManagement/Roles/role_model';

/**
 * `can('matches', 'add')` → may the signed-in user do this? Full-access roles can do everything.
 * The action defaults to "view" (opening the page).
 */
export const useCan = () => {
  const { permissions, isFullAccess } = useAuth();
  return (module: PermissionModule, action = 'view') =>
    isFullAccess || (permissions[module] as unknown as Record<string, boolean> | undefined)?.[action] === true;
};
