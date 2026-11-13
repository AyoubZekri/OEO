import React, { createElement, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import './DeleteConfirm.css';
import './appDialog.css';

/** error: something failed · success: done · info: to know · ask: a question before acting */
export type AppDialogTone = 'error' | 'success' | 'info' | 'ask';

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info, ask: HelpCircle };

/**
 * The app's message window, in place of the browser's alert / confirm: a card in the middle of the screen
 * (computer and phone), the same as the delete dialog — its icon, the message, then «حسناً» (or «إلغاء» and the action).
 */
// eslint-disable-next-line react-refresh/only-export-components -- only opened through showAlert / askConfirm
const AppDialog: React.FC<{
  tone: AppDialogTone;
  message: string;
  title?: string;
  confirmLabel?: string;
  /** A question: two buttons; otherwise one «حسناً» */
  ask: boolean;
  onAnswer: (yes: boolean) => void;
}> = ({ tone, message, title, confirmLabel, ask, onAnswer }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnswer(false);
      if (e.key === 'Enter' && !ask) onAnswer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask, onAnswer]);

  const Icon = ICONS[tone];
  return createPortal(
    <div className="del-dlg-overlay app-dlg-overlay" onMouseDown={() => onAnswer(false)}>
      <div className={`del-dlg app-dlg tone-${tone}`} role="alertdialog" aria-modal="true" aria-label={title || message} onMouseDown={e => e.stopPropagation()}>
        <span className="del-dlg-icon" aria-hidden="true"><Icon size={28} /></span>
        {title && <h3>{title}</h3>}
        <p className="app-dlg-text">{message}</p>
        <div className={`del-dlg-actions ${ask ? '' : 'one'}`}>
          {ask && <button type="button" className="del-dlg-btn cancel" onClick={() => onAnswer(false)}>إلغاء</button>}
          <button type="button" className="del-dlg-btn app-dlg-ok" onClick={() => onAnswer(true)} autoFocus>
            {ask ? confirmLabel || 'تأكيد' : 'حسناً'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const open = (props: Omit<React.ComponentProps<typeof AppDialog>, 'onAnswer'>): Promise<boolean> =>
  new Promise(resolve => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let done = false;
    const onAnswer = (yes: boolean) => {
      if (done) return;
      done = true;
      resolve(yes);
      // Unmounted after the click that closed it is done
      setTimeout(() => { root.unmount(); host.remove(); });
    };
    root.render(createElement(AppDialog, { ...props, onAnswer }));
  });

/** A message (in place of alert): `showAlert('تعذر الحفظ')`, `showAlert('تم الحفظ', 'success')`; resolves once closed */
export const showAlert = (message: string, tone: Exclude<AppDialogTone, 'ask'> = 'error', title?: string): Promise<void> =>
  open({ tone, message, title, ask: false }).then(() => undefined);

/** A question (in place of confirm): `if (!(await askConfirm('توليد كلمة مرور جديدة؟'))) return;` */
export const askConfirm = (message: string, opts: { title?: string; confirmLabel?: string; tone?: AppDialogTone } = {}): Promise<boolean> =>
  open({ tone: opts.tone || 'ask', message, title: opts.title, confirmLabel: opts.confirmLabel, ask: true });
