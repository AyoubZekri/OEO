import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBackCloses } from '../../Mobile/widgets/useBackCloses';
import './MemberPhoto.css';

/**
 * A member's photo, big — the photo alone on a dark, blurred screen (computer and phone).
 * A tap outside, ✕, Escape or the phone's back closes it.
 */
export const MemberPhoto: React.FC<{ src: string; name: string; onClose: () => void }> = ({ src, name, onClose }) => {
  useBackCloses(onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="mph-overlay" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={name}>
      <button type="button" className="mph-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
      <img className="mph-img" src={src} alt={name} onMouseDown={e => e.stopPropagation()} />
    </div>,
    document.body,
  );
};
