import React, { useState } from 'react';
import { X, FileText, Send, AlertCircle, Paperclip, Trash2 } from 'lucide-react';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, dateOf } from './absenceUtils';
import { showSnackbar } from '../../../core/functions/Snacpar';

interface JustificationDialogProps {
  isOpen: boolean;
  /** The record being justified, shown as a reminder */
  absence?: AbsenceRecord | null;
  onClose: () => void;
  onSubmit: (text: string, document?: File | null) => void;
  /** Personal space: a document (PDF / picture) may be attached, and a document alone is enough */
  withDocument?: boolean;
}

const MAX_DOC = 5 * 1024 * 1024;

// Write the justification of one record; it then waits for acceptance or refusal
export const JustificationDialog: React.FC<JustificationDialogProps> = ({ isOpen, absence, onClose, onSubmit, withDocument }) => {
  const [text, setText] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const close = () => {
    setText('');
    setDoc(null);
    setError('');
    onClose();
  };

  const pick = (file: File | null) => {
    if (file && file.size > MAX_DOC) return showSnackbar('خطأ', 'حجم الوثيقة أكبر من 5 ميغا', '#ef4444');
    setDoc(file);
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !doc) {
      setError(withDocument ? 'أرفق وثيقة أو اكتب نص التبرير' : 'اكتب نص التبرير');
      return;
    }
    onSubmit(text.trim(), doc);
    setText('');
    setDoc(null);
    setError('');
  };

  const type = absence ? typeMeta(absence.absence_type) : null;

  return (
    <div className="ab-overlay" onClick={close}>
      <form className="ab-dialog" onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label="تقديم تبرير">
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><FileText size={22} /></span>
          <div className="ab-dialog-title">
            <h2>تقديم تبرير</h2>
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

          {withDocument && (
            <div className="ab-field">
              <span><Paperclip size={15} /> الوثيقة</span>
              {doc ? (
                <div className="ab-file">
                  <Paperclip size={16} /> <b>{doc.name}</b>
                  <button type="button" onClick={() => pick(null)} aria-label="إزالة الوثيقة"><Trash2 size={15} /></button>
                </div>
              ) : (
                <label className="ab-file pick">
                  <Paperclip size={16} /> إرفاق وثيقة
                  <input type="file" accept="application/pdf,image/*" onChange={e => pick(e.target.files?.[0] ?? null)} hidden />
                </label>
              )}
            </div>
          )}

          <label className="ab-field">
            <span>التبرير</span>
            <textarea
              className={error ? 'is-missing' : ''}
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              rows={5}
              autoFocus
            />
            {error && <p className="ab-field-error"><AlertCircle size={13} /> {error}</p>}
          </label>
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={close}>إلغاء</button>
          <button type="submit" className="ab-btn primary"><Send size={16} /> إرسال التبرير</button>
        </footer>
      </form>
    </div>
  );
};
