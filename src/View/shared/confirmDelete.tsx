import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DeleteConfirm } from './DeleteConfirm';

/**
 * Asks before a delete with the app's delete dialog, from anywhere (a controller, a menu's click):
 * `if (!(await confirmDelete('حذف العضو؟', name))) return;` — true once «حذف» is pressed, false when cancelled.
 */
export const confirmDelete = (title: string, name?: string): Promise<boolean> =>
  new Promise(resolve => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let answer = false;
    const close = () => {
      resolve(answer);
      // Unmounted after the click that closed it is done
      setTimeout(() => { root.unmount(); host.remove(); });
    };
    root.render(createElement(DeleteConfirm, { title, name, onConfirm: () => { answer = true; }, onClose: close }));
  });
