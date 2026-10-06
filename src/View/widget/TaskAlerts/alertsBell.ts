import { useSyncExternalStore } from 'react';

/**
 * Phones: the alerts live behind the bell of the app bar.
 * The alerts (TaskAlerts) tell how many there are; the bell shows the number and opens the list.
 */
interface BellState {
  count: number;
  open: boolean;
}

let state: BellState = { count: 0, open: false };
const listeners = new Set<() => void>();

const set = (next: Partial<BellState>) => {
  if (Object.entries(next).every(([k, v]) => state[k as keyof BellState] === v)) return;
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

export const alertsBell = {
  setCount: (count: number) => set({ count }),
  open: () => set({ open: true }),
  close: () => set({ open: false }),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const useAlertsBell = () => useSyncExternalStore(subscribe, () => state);
