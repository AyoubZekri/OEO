import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const OPEN = '[aria-modal="true"], [role="dialog"], [role="menu"]';
const openCount = () => document.querySelectorAll(OPEN).length;

/**
 * The Android app's back button, like any app: it closes what is open on top (a dialog, a sheet, a menu — they all
 * close on Escape, or by their ✕), else goes back a page, and on the home page puts the app in the background
 * instead of closing it.
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = App.addListener('backButton', ({ canGoBack }) => {
      const before = openCount();
      if (before > 0) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        // One that does not listen to Escape: its close button
        window.setTimeout(() => {
          if (openCount() < before) return;
          const top = [...document.querySelectorAll<HTMLElement>(OPEN)].pop();
          top?.querySelector<HTMLElement>('[aria-label^="إغلاق"], [aria-label="Close"], [aria-label="close"], .close, .btn-close')?.click();
        }, 60);
        return;
      }
      if (pathname !== '/' && canGoBack) navigate(-1);
      else if (pathname !== '/') navigate('/', { replace: true });
      else App.minimizeApp();
    });
    return () => { handle.then(h => h.remove()).catch(() => undefined); };
  }, [navigate, pathname]);
};
