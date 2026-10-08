import React, { useState } from 'react';
import { Calendar, Check, FileText, Gavel, NotebookPen, PenLine } from 'lucide-react';
import type { DisciplinaryModel } from '../disciplinary_data';
import { DECISION_KINDS, DECISION_LOOK, decisionKindOf, decisionPatch, type DecisionKind } from '../decision';
import { DECISION_ICONS } from './decisionIcons';
import { DecisionHero } from './DecisionView';
import './DecisionDesign.css';

type DecisionValues = Pick<DisciplinaryModel, 'admin_notes' | 'decision_outcome' | 'decision_reasons' | 'effective_date'>;

/**
 * The administration's decision, editable (desktop dialogs and phone form):
 * its notes, then an optional disciplinary sanction (warning, formal warning or another measure written out),
 * its reasons and the date it applies from, with a preview of the verdict.
 */
export const DecisionFields: React.FC<{
  value: DecisionValues;
  onChange: (patch: Partial<DecisionValues>) => void;
  /** The phone form's inputs */
  variant?: 'desktop' | 'mobile';
}> = ({ value, onChange, variant = 'desktop' }) => {
  // The kind follows the saved sanction; "another measure" stays chosen while its text is still empty
  const [otherPending, setOtherPending] = useState(false);
  const saved = decisionKindOf(value.decision_outcome);
  const kind: DecisionKind = saved !== 'none' ? saved : otherPending ? 'other' : 'none';
  const input = variant === 'mobile' ? 'me-input' : 'modern-form-input';
  const textarea = variant === 'mobile' ? 'me-textarea' : 'modern-form-input modern-form-textarea';

  const choose = (next: DecisionKind) => {
    setOtherPending(next === 'other');
    onChange(decisionPatch(next, value.decision_outcome));
  };

  return (
    <div className={`df ${variant}`}>
      <label className="df-field">
        <span className="df-label"><NotebookPen size={15} /> ملاحظات الإدارة</span>
        <textarea
          className={textarea}
          rows={3}
          value={value.admin_notes || ''}
          onChange={e => onChange({ admin_notes: e.target.value })}
          placeholder="ما الذي خلصت إليه الإدارة؟"
        />
      </label>

      <div className="df-field">
        <span className="df-label"><Gavel size={15} /> القرار التأديبي</span>
        <div className="df-kinds" role="radiogroup" aria-label="القرار التأديبي">
          {DECISION_KINDS.map(k => {
            const Icon = DECISION_ICONS[k.value];
            const active = kind === k.value;
            return (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`df-kind tone-${DECISION_LOOK[k.value].tone} ${active ? 'active' : ''}`}
                onClick={() => choose(k.value)}
              >
                <span className="df-kind-icon"><Icon size={20} /></span>
                <span className="df-kind-text">
                  <strong>{k.label}</strong>
                </span>
                <span className="df-kind-check">{active && <Check size={13} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      </div>

      {kind !== 'none' && (
        <div className={`df-sanction tone-${DECISION_LOOK[kind].tone}`}>
          {kind === 'other' && (
            <label className="df-field">
              <span className="df-label"><PenLine size={15} /> الإجراء المتخذ</span>
              <input
                className={input}
                value={value.decision_outcome || ''}
                onChange={e => onChange({ decision_outcome: e.target.value })}
                placeholder="اذكر الإجراء (مثال: توقيف عن مباراتين)"
                autoFocus={variant === 'desktop'}
              />
            </label>
          )}
          <div className="df-grid">
            <label className="df-field">
              <span className="df-label"><FileText size={15} /> أسباب القرار</span>
              <textarea
                className={textarea}
                rows={3}
                value={value.decision_reasons || ''}
                onChange={e => onChange({ decision_reasons: e.target.value })}
                placeholder="لماذا اتُّخذ هذا القرار؟"
              />
            </label>
            <label className="df-field">
              <span className="df-label"><Calendar size={15} /> تاريخ سريان القرار</span>
              <input
                type="date"
                dir="ltr"
                className={input}
                value={value.effective_date ? value.effective_date.split('T')[0] : ''}
                onChange={e => onChange({ effective_date: e.target.value })}
              />
            </label>
          </div>

          <div className="df-preview">
            <span className="df-preview-label">معاينة القرار</span>
            <DecisionHero value={value} kind={kind} compact />
          </div>
        </div>
      )}
    </div>
  );
};
