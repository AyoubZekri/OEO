import { createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PermissionModule } from '../../View/Screen/UserManagement/Roles/role_model';

/**
 * Read only: everything inside sees no permission (a management page shown in the personal space,
 * with all its add / edit / delete buttons and dialogs, becomes read only at once).
 */
export const ReadOnlyContext = createContext(false);

/**
 * `can('matches', 'add')` → may the signed-in user do this? Full-access roles can do everything.
 * The action defaults to "view" (opening the page).
 */
export const useCan = () => {
  const { permissions, isFullAccess } = useAuth();
  const readOnly = useContext(ReadOnlyContext);
  return (module: PermissionModule, action = 'view') =>
    !readOnly && (isFullAccess || (permissions[module] as unknown as Record<string, boolean> | undefined)?.[action] === true);
};
