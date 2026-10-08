/**
 * The administration's decision may carry a disciplinary sanction:
 * a warning (تنبيه), a formal warning (إنذار), or another measure written out; with its reasons and the date it applies from.
 * Stored in decision_outcome (the sanction), decision_reasons, effective_date.
 */
export type DecisionKind = 'none' | 'تنبيه' | 'إنذار' | 'other';

export const DECISION_KINDS: { value: DecisionKind; label: string }[] = [
  { value: 'none', label: 'بدون قرار تأديبي' },
  { value: 'تنبيه', label: 'تنبيه' },
  { value: 'إنذار', label: 'إنذار' },
  { value: 'other', label: 'إجراء آخر' },
];

/** The kind of a stored sanction (an older value such as "فصل" is "another measure") */
export const decisionKindOf = (outcome?: string): DecisionKind => {
  const value = (outcome || '').trim();
  if (!value) return 'none';
  return value === 'تنبيه' || value === 'إنذار' ? value : 'other';
};

/** The fields to save when the kind is chosen ("none" clears the sanction, its reasons and its date) */
export const decisionPatch = (kind: DecisionKind, current?: string) =>
  kind === 'none'
    ? { decision_outcome: '', decision_reasons: '', effective_date: '' }
    : { decision_outcome: kind === 'other' ? (decisionKindOf(current) === 'other' ? current || '' : '') : kind };

/** How each kind looks: its tone (colour) */
export const DECISION_LOOK: Record<DecisionKind, { tone: 'calm' | 'amber' | 'red' | 'violet' }> = {
  none: { tone: 'calm' },
  'تنبيه': { tone: 'amber' },
  'إنذار': { tone: 'red' },
  other: { tone: 'violet' },
};

/** When the decision applies: "يسري منذ 3 أيام" / "يسري اليوم" / "يسري بعد يومين" */
export const effectiveStatus = (value?: string, now = Date.now()) => {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const day = new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const days = Math.round((day - today.getTime()) / 86400000);
  const n = Math.abs(days);
  const count = n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`;
  return {
    active: days <= 0,
    text: days === 0 ? 'يسري ابتداءً من اليوم' : days < 0 ? `ساري منذ ${count}` : `يسري بعد ${count}`,
    date: new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(day),
  };
};
