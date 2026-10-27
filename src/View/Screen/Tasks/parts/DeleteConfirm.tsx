import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Deleting a task or an appointment: a card in the middle of the screen (computer and phone) — a red bin in soft rings,
 * the question, the item's name, what it means — then «إلغاء» and «حذف». Escape or a click outside cancels.
 */
export const DeleteConfirm: React.FC<{
  title: string;
  name?: string;
  note: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}> = ({ title, name, note, onConfirm, onClose }) => {
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
    <div className="tsk-del-overlay" onMouseDown={() => { if (!busy) onClose(); }}>
      <div className="tsk-del" role="alertdialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <span className="tsk-del-icon" aria-hidden="true"><Trash2 size={28} /></span>
        <h3>{title}</h3>
        {name && <p className="tsk-del-name">«{name}»</p>}
        <p className="tsk-del-note"><AlertTriangle size={14} />{note}</p>
        <div className="tsk-del-actions">
          <button type="button" className="tsk-del-btn cancel" onClick={onClose} disabled={busy}>إلغاء</button>
          <button type="button" className="tsk-del-btn danger" onClick={confirm} disabled={busy} autoFocus>
            {busy ? <Loader2 size={17} className="tk-spin" /> : <Trash2 size={17} />}حذف
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
