import React, { useMemo, useState } from 'react';
import { SpaceContext, type AppSpace, type SpaceState } from './space';
import { useAuth } from './AuthContext';
import { ALL_MODULES } from '../../View/Screen/UserManagement/Roles/role_model';

const STORAGE_KEY = 'appSpace';

const readSaved = (): AppSpace | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'management' || v === 'personal' ? v : null;
  } catch {
    return null;
  }
};

/** The space the user works in; it opens on the last one used. Without management rights it is always "personal". */
export const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { permissions, isFullAccess } = useAuth();
  // The tasks page is open to everyone (their own tasks): it does not make someone a manager
  const canManage = isFullAccess || ALL_MODULES.some(m => m !== 'tasks' && (permissions[m] as unknown as Record<string, boolean> | undefined)?.view === true);
  const [chosen, setChosen] = useState<AppSpace>(() => readSaved() || 'management');

  const value = useMemo<SpaceState>(() => ({
    space: canManage ? chosen : 'personal',
    canManage,
    setSpace: (space: AppSpace) => {
      setChosen(space);
      try { localStorage.setItem(STORAGE_KEY, space); } catch { /* the choice is only not remembered */ }
    },
  }), [canManage, chosen]);

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
};
