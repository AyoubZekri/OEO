import React, { useState } from 'react';
import { Send, AlertCircle, Paperclip, Trash2 } from 'lucide-react';
import { MobileSheet } from '../widgets/MobileSheet';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { typeMeta, dateOf } from '../../Screen/Absence/absenceUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileJustifySheetProps {
  absence?: AbsenceRecord | null;
  onSubmit: (text: string, document?: File | null) => void;
  onClose: () => void;
  /** Personal space: a document (PDF / picture) may be attached, and a document alone is enough */
  withDocument?: boolean;
}

const MAX_DOC = 5 * 1024 * 1024;

// Write the justification of one record (phone); it then waits for acceptance or refusal
export const MobileJustifySheet: React.FC<MobileJustifySheetProps> = ({ absence, onSubmit, onClose, withDocument }) => {
  const [text, setText] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const [error, setError] = useState('');
  const type = absence ? typeMeta(absence.absence_type) : null;

  const pick = (file: File | null) => {
    if (file && file.size > MAX_DOC) {
      setError('حجم الوثيقة أكبر من 5 ميغا');
      return;
    }
    setDoc(file);
    setError('');
  };

  const send = () => {
    if (!text.trim() && !doc) {
      setError(withDocument ? 'أرفق وثيقة أو اكتب نص التبرير' : 'اكتب نص التبرير');
      return;
    }
    onSubmit(text.trim(), doc);
  };

  return (
    <MobileSheet
      title="تقديم تبرير"
      onClose={onClose}
      footer={(
        <div className="mab-sheet-actions">
          <button type="button" className="me-btn" onClick={onClose}>إلغاء</button>
          <button type="button" className="me-btn primary" onClick={send}><Send size={16} /> إرسال التبرير</button>
        </div>
      )}
    >
      <div className="mab-justify">
        {absence && type && (
          <div className={`mab-remind tone-${type.tone}`}>
            <span><type.icon size={17} /></span>
            <div>
              <strong>{absence.player_name}</strong>
              <small>{type.label}{absence.event_category ? ` · ${absence.event_category}` : ''} · <b dir="ltr">{dateOf(absence)}</b></small>
            </div>
          </div>
        )}
        {withDocument && (doc ? (
          <div className="mab-file">
            <Paperclip size={16} /> <b>{doc.name}</b>
            <button type="button" onClick={() => pick(null)} aria-label="إزالة الوثيقة"><Trash2 size={15} /></button>
          </div>
        ) : (
          <label className="mab-file pick">
            <Paperclip size={16} /> أرفق وثيقة (PDF أو صورة)
            <input type="file" accept="application/pdf,image/*" onChange={e => pick(e.target.files?.[0] ?? null)} hidden />
          </label>
        ))}
        <textarea
          className="mab-textarea"
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder="اكتب سبب الغياب بوضوح (مرض، ظرف عائلي، دراسة...)"
          rows={5}
        />
        {error && <p className="mab-error"><AlertCircle size={14} /> {error}</p>}
        <p className="mab-note">يبقى التبرير قيد الدراسة حتى يتم قبوله أو رفضه.</p>
      </div>
    </MobileSheet>
  );
};
