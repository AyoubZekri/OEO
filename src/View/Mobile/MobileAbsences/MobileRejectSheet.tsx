import React, { useState } from 'react';
import { XCircle, AlertCircle } from 'lucide-react';
import { MobileSheet } from '../widgets/MobileSheet';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { typeMeta, dateOf, isMemberRequest, recordTitle } from '../../Screen/Absence/absenceUtils';
import '../MobileEvaluations/MobileEvaluations.css';

// Refusing a justification or a request (phone): the reason is written, the member reads it
export const MobileRejectSheet: React.FC<{ absence: AbsenceRecord; onConfirm: (note: string) => void; onClose: () => void }> = ({ absence, onConfirm, onClose }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const type = typeMeta(absence.absence_type);
  const request = isMemberRequest(absence);

  const send = () => {
    if (!note.trim()) return setError(true);
    onConfirm(note.trim());
  };

  return (
    <MobileSheet
      title={request ? 'رفض الطلب' : 'رفض التبرير'}
      onClose={onClose}
      footer={(
        <div className="mab-sheet-actions">
          <button type="button" className="me-btn" onClick={onClose}>إلغاء</button>
          <button type="button" className="me-btn danger" onClick={send}><XCircle size={16} /> تأكيد الرفض</button>
        </div>
      )}
    >
      <div className="mab-justify">
        <div className={`mab-remind tone-${type.tone}`}>
          <span><type.icon size={17} /></span>
          <div>
            <strong>{absence.player_name}</strong>
            <small>{recordTitle(absence)}{absence.event_category ? ` · ${absence.event_category}` : ''} · <b dir="ltr">{dateOf(absence)}</b></small>
          </div>
        </div>
        <textarea
          className="mab-textarea"
          value={note}
          onChange={e => { setNote(e.target.value); setError(false); }}
          placeholder="سبب الرفض (يصل إلى العضو)"
          rows={4}
        />
        {error && <p className="mab-error"><AlertCircle size={14} /> اكتب سبب الرفض</p>}
        <p className="mab-note">القرار نهائي.</p>
      </div>
    </MobileSheet>
  );
};
