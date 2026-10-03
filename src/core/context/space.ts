import { createContext, useContext } from 'react';

/** "management": the club's pages (by permissions). "personal": the signed-in user's own space */
export type AppSpace = 'management' | 'personal';

export const SPACE_LABELS: Record<AppSpace, string> = {
  management: 'فضاء التسيير',
  personal: 'فضائي الشخصي',
};

export interface SpaceState {
  space: AppSpace;
  /** May the user open the management space: a full-access role, or a page of it to view */
  canManage: boolean;
  setSpace: (space: AppSpace) => void;
}

export const SpaceContext = createContext<SpaceState | null>(null);

export const useSpace = (): SpaceState => {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpace must be used inside SpaceProvider');
  return ctx;
};
