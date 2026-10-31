import { useSyncExternalStore } from 'react';

/**
 * What went wrong with the last request to the server, if anything: no connection, or the server failing.
 * Empty pages read it to draw the right picture (nothing here, no internet, server error).
 */
export type ConnectionProblem = 'offline' | 'server' | null;

let problem: ConnectionProblem = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(l => l());

export const setConnectionProblem = (next: ConnectionProblem) => {
  if (next === problem) return;
  problem = next;
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
};

// The browser saying it is offline wins over the last request
const snapshot = (): ConnectionProblem => (navigator.onLine === false ? 'offline' : problem);

export const useConnectionProblem = () => useSyncExternalStore(subscribe, snapshot, () => null);
