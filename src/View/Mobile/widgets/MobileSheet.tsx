import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './MobileSheet.css';

interface MobileSheetProps {
  title: string;
  onClose: () => void;
  /** Sticky buttons at the bottom of the sheet */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// Bottom sheet: slides up over the page, closes on backdrop tap, the close button or Escape
export const MobileSheet: React.FC<MobileSheetProps> = ({ title, onClose, footer, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="msh-backdrop" onClick={onClose}>
      <div className="msh-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <span className="msh-grabber" aria-hidden="true" />
        <div className="msh-head">
          <h3>{title}</h3>
          <button type="button" className="msh-close" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="msh-body">{children}</div>
        {footer && <div className="msh-footer">{footer}</div>}
      </div>
    </div>
  );
};
