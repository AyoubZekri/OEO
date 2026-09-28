import React, { useState } from 'react';
import { X, FileText, Send, AlertCircle } from 'lucide-react';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, dateOf } from './absenceUtils';

interface JustificationDialogProps {
  isOpen: boolean;
  /** The record being justified, shown as a reminder */
  absence?: AbsenceRecord | null;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

// Write the justification of one record; it then waits for acceptance or refusal
export const JustificationDialog: React.FC<JustificationDialogProps> = ({ isOpen, absence, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    setText('');
    setError(false);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSubmit(text.trim());
    setText('');
    setError(false);
  };

  const type = absence ? typeMeta(absence.absence_type) : null;

  return (
    <div className="ab-overlay" onClick={close}>
      <form className="ab-dialog" onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label="تقديم تبرير">
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><FileText size={22} /></span>
          <div className="ab-dialog-title">
            <h2>تقديم تبرير</h2>
            <p>يبقى التبرير قيد الدراسة حتى يتم قبوله أو رفضه</p>
          </div>
          <button type="button" className="ab-close" onClick={close} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          {absence && type && (
            <div className={`ab-remind tone-${type.tone}`}>
              <span><type.icon size={18} /></span>
              <div>
                <strong>{absence.player_name}</strong>
                <small>{type.label}{absence.event_category ? ` · ${absence.event_category}` : ''} · <b dir="ltr">{dateOf(absence)}</b></small>
              </div>
            </div>
          )}

          <label className="ab-field">
            <span>نص التبرير</span>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setError(false); }}
              placeholder="اكتب سبب الغياب بوضوح (مرض، ظرف عائلي، دراسة...)"
              rows={5}
              autoFocus
            />
          </label>
          {error && <p className="ab-error"><AlertCircle size={14} /> اكتب نص التبرير</p>}
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={close}>إلغاء</button>
          <button type="submit" className="ab-btn primary"><Send size={16} /> إرسال التبرير</button>
        </footer>
      </form>
    </div>
  );
};
