import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

/** Asked before a task is deleted for good: centered, over everything (the task details included) */
export const DeleteTaskDialog: React.FC<{ title: string; onConfirm: () => void; onClose: () => void }> = ({ title, onConfirm, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    // Its clicks stay here: drawn elsewhere on the page, it still sits inside the row / window that opened it,
    // which must not react (open the task, close the details…)
    <div
      className="tk-confirm-backdrop"
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onClose(); }}
    >
      <div className="tk-confirm" role="alertdialog" aria-modal="true" aria-labelledby="tk-confirm-title" onClick={e => e.stopPropagation()}>
        <span className="tk-confirm-icon"><Trash2 size={26} /></span>
        <h3 id="tk-confirm-title">حذف المهمة</h3>
        <p>هل تريد حذف المهمة <strong>«{title}»</strong> نهائياً؟</p>
        <small>لا يمكن التراجع عن هذا الإجراء.</small>
        <div className="tk-confirm-actions">
          <button type="button" className="tk-confirm-delete" onClick={e => { e.stopPropagation(); onConfirm(); }}><Trash2 size={17} />حذف</button>
          <button type="button" className="tk-confirm-cancel" onClick={e => { e.stopPropagation(); onClose(); }} autoFocus>إلغاء</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
