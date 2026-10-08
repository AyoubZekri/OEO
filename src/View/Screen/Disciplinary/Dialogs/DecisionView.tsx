import React from 'react';
import { CalendarCheck, CalendarClock, FileText, Gavel, NotebookPen } from 'lucide-react';
import type { DisciplinaryModel } from '../disciplinary_data';
import { DECISION_LOOK, decisionKindOf, effectiveStatus, type DecisionKind } from '../decision';
import { DECISION_ICONS } from './decisionIcons';
import './DecisionDesign.css';

type DecisionValues = Pick<DisciplinaryModel, 'admin_notes' | 'decision_outcome' | 'decision_reasons' | 'effective_date'>;

/** The verdict banner: the sanction (or none), what it means, and from when it applies */
export const DecisionHero: React.FC<{ value: DecisionValues; compact?: boolean; kind?: DecisionKind }> = ({ value, compact, kind: chosen }) => {
  // The form gives the kind being chosen (another measure not written yet)
  const kind = chosen ?? decisionKindOf(value.decision_outcome);
  const look = DECISION_LOOK[kind];
  const Icon = DECISION_ICONS[kind];
  const status = kind === 'none' ? null : effectiveStatus(value.effective_date);
  return (
    <div className={`dv-hero tone-${look.tone} ${compact ? 'compact' : ''}`}>
      <span className="dv-hero-icon"><Icon size={compact ? 22 : 26} strokeWidth={2.2} /></span>
      <div className="dv-hero-text">
        <small>القرار التأديبي</small>
        <strong>{kind === 'none' ? 'بدون عقوبة تأديبية' : value.decision_outcome?.trim() || 'إجراء آخر'}</strong>
      </div>
      {kind !== 'none' && (
        <div className={`dv-stamp ${status?.active ? 'on' : ''}`}>
          {status?.active ? <CalendarCheck size={16} /> : <CalendarClock size={16} />}
          <b>{status ? status.text : 'تاريخ السريان غير محدد'}</b>
          {status && <small>{status.date}</small>}
        </div>
      )}
    </div>
  );
};

/** The administration's decision, read only (desktop and phone): verdict, reasons, notes */
export const DecisionView: React.FC<{ value: DecisionValues; emptyText?: string }> = ({ value, emptyText = 'لم يصدر القرار بعد' }) => {
  const notes = value.admin_notes?.trim();
  const reasons = value.decision_reasons?.trim();
  if (!notes && !value.decision_outcome?.trim()) {
    return (
      <div className="dv-empty">
        <span><Gavel size={26} /></span>
        <strong>{emptyText}</strong>
        <small>يظهر هنا قرار الإدارة وأسبابه وتاريخ سريانه</small>
      </div>
    );
  }
  return (
    <div className="dv">
      <DecisionHero value={value} />
      {reasons && (
        <div className="dv-block">
          <div className="dv-block-label"><FileText size={15} /> أسباب القرار</div>
          <p>{reasons}</p>
        </div>
      )}
      {notes && (
        <div className="dv-block notes">
          <div className="dv-block-label"><NotebookPen size={15} /> ملاحظات الإدارة</div>
          <p>{notes}</p>
        </div>
      )}
    </div>
  );
};
