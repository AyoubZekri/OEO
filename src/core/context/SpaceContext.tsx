import React, { useMemo } from 'react';
import { SpaceContext, type SpaceState } from './space';
import { useAuth } from './AuthContext';
import { ALL_MODULES } from '../../View/Screen/UserManagement/Roles/role_model';

/**
 * The space the user works in, one per account (no switching): the management space for who has a role in it (a page
 * of it to view, or full access) — their own records are there too; the personal space only for who has none.
 * A player has the personal space only, whatever their role (even a full-access one).
 */
export const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { permissions, isFullAccess, user } = useAuth();
  const isPlayer = ['player', 'لاعب'].includes(user?.memberType || '');
  const canManage = !isPlayer && (isFullAccess || ALL_MODULES.some(m => (permissions[m] as unknown as Record<string, boolean> | undefined)?.view === true));
  const value = useMemo<SpaceState>(() => ({
    space: canManage ? 'management' : 'personal',
    canManage,
    isPlayer,
    // Nothing to switch to: each account has its one space
    setSpace: () => undefined,
  }), [canManage, isPlayer]);

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
};
