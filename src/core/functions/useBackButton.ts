import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const OPEN = '[aria-modal="true"], [role="dialog"], [role="menu"]';
const CLOSE = '[aria-label^="إغلاق"], [aria-label="رجوع"], [aria-label="Close"], [aria-label="close"], .close, .btn-close, .m-screen-icon';

/** What is open on top and can be seen (one kept in the page but hidden does not count) */
const openLayers = () => [...document.querySelectorAll<HTMLElement>(OPEN)].filter(el => el.getClientRects().length > 0);

/**
 * The Android app's back button, like any app: it closes what is open on top, else goes back a page, and on the home
 * page puts the app in the background instead of closing it.
 * - A full-screen phone page (MobileScreen) has its own history entry: going back closes it, as its own back arrow does.
 * - A dialog, a sheet, a menu: Escape, or else its close (or back) button.
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = App.addListener('backButton', ({ canGoBack }) => {
      const open = openLayers();
      if (open.length > 0) {
        const top = open[open.length - 1];
        if (top.classList.contains('m-screen') && ((window.history.state?.mScreenDepth as number | undefined) ?? 0) > 0) {
          window.history.back();
          return;
        }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        // One that does not listen to Escape: its close (or back) button
        window.setTimeout(() => {
          if (top.isConnected && top.getClientRects().length > 0) top.querySelector<HTMLElement>(CLOSE)?.click();
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
