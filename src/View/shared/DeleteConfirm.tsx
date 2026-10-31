import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Loader2 } from 'lucide-react';
import './DeleteConfirm.css';

/**
 * The one delete dialog of the app: a card in the middle of the screen (computer and phone) — a red bin in soft
 * rings, the question, the item's name — then «إلغاء» and «حذف». Escape or a click outside cancels.
 * Pages that keep it in their own state render it; the others ask through confirmDelete().
 */
export const DeleteConfirm: React.FC<{
  title: string;
  name?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}> = ({ title, name, onConfirm, onClose }) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      onClose();
    }
  };

  return createPortal(
    <div className="del-dlg-overlay" onMouseDown={() => { if (!busy) onClose(); }}>
      <div className="del-dlg" role="alertdialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <span className="del-dlg-icon" aria-hidden="true"><Trash2 size={28} /></span>
        <h3>{title}</h3>
        {name && <p className="del-dlg-name">«{name}»</p>}
        <div className="del-dlg-actions">
          <button type="button" className="del-dlg-btn cancel" onClick={onClose} disabled={busy}>إلغاء</button>
          <button type="button" className="del-dlg-btn danger" onClick={confirm} disabled={busy} autoFocus>
            {busy ? <Loader2 size={17} className="tk-spin" /> : <Trash2 size={17} />}حذف
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
