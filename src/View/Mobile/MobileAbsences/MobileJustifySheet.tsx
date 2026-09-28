import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { MobileSheet } from '../widgets/MobileSheet';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { typeMeta, dateOf } from '../../Screen/Absence/absenceUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileJustifySheetProps {
  absence?: AbsenceRecord | null;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

// Write the justification of one record (phone); it then waits for acceptance or refusal
export const MobileJustifySheet: React.FC<MobileJustifySheetProps> = ({ absence, onSubmit, onClose }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const type = absence ? typeMeta(absence.absence_type) : null;

  const send = () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSubmit(text.trim());
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
        <textarea
          className="mab-textarea"
          value={text}
          onChange={e => { setText(e.target.value); setError(false); }}
          placeholder="اكتب سبب الغياب بوضوح (مرض، ظرف عائلي، دراسة...)"
          rows={5}
        />
        {error && <p className="mab-error"><AlertCircle size={14} /> اكتب نص التبرير</p>}
        <p className="mab-note">يبقى التبرير قيد الدراسة حتى يتم قبوله أو رفضه.</p>
      </div>
    </MobileSheet>
  );
};
