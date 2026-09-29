import React, { useEffect } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { MobileScreen } from '../../../Mobile/widgets/MobileScreen';
import { MobileSheet } from '../../../Mobile/widgets/MobileSheet';

interface TaskPanelProps {
  mobile: boolean;
  title: string;
  subtitle?: string;
  /** Desktop dialog title icon */
  icon?: LucideIcon;
  onClose: () => void;
  footer?: React.ReactNode;
  /** Phone: a bottom sheet instead of a full screen */
  sheet?: boolean;
  layer?: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

/** Desktop: the app's usual dialog (same classes as the other pages). Phone: a full-screen page (or a bottom sheet for short prompts) */
export const TaskPanel: React.FC<TaskPanelProps> = ({ mobile, title, subtitle, icon: Icon, onClose, footer, sheet, layer = 1, size = 'md', children }) => {
  useEffect(() => {
    if (mobile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobile, onClose]);

  if (mobile) {
    return sheet
      ? <MobileSheet title={title} onClose={onClose} footer={footer}><div className="tk-scope">{children}</div></MobileSheet>
      : <MobileScreen title={title} onBack={onClose} footer={footer} layer={layer}><div className="tk-scope tk-mobile-body">{children}</div></MobileScreen>;
  }

  return (
    <div className={`dialog-overlay tk-overlay layer-${layer}`} onMouseDown={onClose}>
      <div className={`dialog-content tk-dialog tk-scope size-${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            {Icon && <span className="tk-dlg-icon"><Icon size={20} /></span>}
            <div className="tk-dlg-titles">
              <h2>{title}</h2>
              {subtitle && <span>{subtitle}</span>}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};
