import type { Decision } from '../../Screen/Decisions/decision_model';
import { daysFromToday } from '../MobileTrainingSessions/sessionUtils';

export type DecisionState = 'done' | 'late' | 'active' | 'new';

/** Title shown for a decision: its text, or for a task list its category (same as desktop) */
export const decisionTitle = (d: Decision) =>
  d.type === 'checklist' ? (d.category || 'قرار مهام متعددة') : (d.text || d.category || 'قرار');

export const decisionState = (d: Decision): DecisionState => {
  if ((d.progress || 0) >= 100) return 'done';
  if (d.deadline && daysFromToday(d.deadline.split('T')[0]) < 0) return 'late';
  return (d.progress || 0) > 0 ? 'active' : 'new';
};

export const STATE_LABEL: Record<DecisionState, string> = {
  done: 'مكتمل',
  late: 'متأخر',
  active: 'قيد التنفيذ',
  new: 'لم يبدأ',
};

/** "بعد 5 أيام" / "اليوم" / "متأخر 3 أيام" */
export const deadlineText = (deadline?: string) => {
  if (!deadline) return null;
  const days = daysFromToday(deadline.split('T')[0]);
  const n = Math.abs(days);
  const count = n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`;
  if (days === 0) return { text: 'آخر أجل اليوم', late: false };
  return days > 0 ? { text: `باقي ${count}`, late: false } : { text: `متأخر ${count}`, late: true };
};

export const tasksDone = (d: Decision) => {
  const items = d.checklistItems || [];
  return { done: items.filter(i => i.checked).length, total: items.length };
};
