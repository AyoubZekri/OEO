import { useEffect, useRef } from 'react';

/** The screens' history entries: their depth, and a token telling which screen added it */
interface ScreenState { mScreenDepth?: number; mScreenToken?: string; usr?: { urlDetails?: string } }

const current = () => (window.history.state || {}) as ScreenState;

/** The entry of a screen just closed, about to be taken out (a screen mounted again at once takes it back) */
let leaving: string | null = null;

/**
 * Phones: the back button (the phone's, or the browser's) closes this full-screen page instead of leaving the page
 * under it. Opening it adds a history entry; going back closes the screen on top only (screens stacked are closed
 * one by one); closing it from the app removes its entry.
 * `skip`: the screen already has its own entry (details kept in the address, see useUrlDetails).
 */
export const useBackCloses = (onBack: () => void, skip = false) => {
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  useEffect(() => {
    if (skip) return;
    let depth: number;
    let token: string;
    if (leaving && current().mScreenToken === leaving) {
      // Mounted again right after its cleanup (development double mount): the same entry
      token = leaving;
      depth = current().mScreenDepth ?? 1;
      leaving = null;
    } else {
      depth = (current().mScreenDepth ?? 0) + 1;
      token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.history.pushState({ ...current(), mScreenDepth: depth, mScreenToken: token }, '');
    }

    // Back: the entry we land on is under this screen → this screen closes
    const onPop = (e: PopStateEvent) => {
      const landed = (e.state as ScreenState | null)?.mScreenDepth ?? 0;
      if (landed < depth) onBackRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed from the app: take its entry out, if it is still the one on top (not after a move to another page)
      leaving = token;
      window.setTimeout(() => {
        if (leaving !== token) return; // taken back by the same screen
        leaving = null;
        if (current().mScreenToken === token) window.history.back();
      }, 0);
    };
  }, [skip]);
};
