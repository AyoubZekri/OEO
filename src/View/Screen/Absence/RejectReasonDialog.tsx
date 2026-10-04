import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, dateOf, isMemberRequest, recordTitle } from './absenceUtils';

interface RejectReasonDialogProps {
  absence: AbsenceRecord | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

/** Refusing a justification or a request: the reason is written, the member reads it */
export const RejectReasonDialog: React.FC<RejectReasonDialogProps> = ({ absence, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  if (!absence) return null;
  const type = typeMeta(absence.absence_type);
  const request = isMemberRequest(absence);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return setError(true);
    onConfirm(note.trim());
  };

  return (
    <div className="ab-overlay" onClick={onClose}>
      <form className="ab-dialog tone-red" onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label="سبب الرفض">
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><XCircle size={22} /></span>
          <div className="ab-dialog-title">
            <h2>{request ? 'رفض الطلب' : 'رفض التبرير'}</h2>
            <p>القرار نهائي، ويصل السبب إلى العضو</p>
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          <div className={`ab-remind tone-${type.tone}`}>
            <span><type.icon size={18} /></span>
            <div>
              <strong>{absence.player_name}</strong>
              <small>{recordTitle(absence)}{absence.event_category ? ` · ${absence.event_category}` : ''} · <b dir="ltr">{dateOf(absence)}</b></small>
            </div>
          </div>
          <label className="ab-field">
            <span>سبب الرفض *</span>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setError(false); }}
              placeholder={request ? 'مثال: الفترة تتزامن مع مباراة مهمة' : 'مثال: الوثيقة غير مختومة، التبرير غير كافٍ...'}
              rows={4}
              autoFocus
            />
          </label>
          {error && <p className="ab-error"><AlertCircle size={14} /> اكتب سبب الرفض</p>}
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose}>إلغاء</button>
          <button type="submit" className="ab-btn reject"><XCircle size={16} /> تأكيد الرفض</button>
        </footer>
      </form>
    </div>
  );
};
