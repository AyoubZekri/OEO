import type { DisciplinaryModel } from '../disciplinary_data';

export type PrintType = 'incident' | 'decision' | 'summons' | 'hearing' | 'clarification_request' | 'clarification_reply' | 'disciplinary_decision';

export interface PrintDoc {
  type: PrintType;
  label: string;
}

/** The documents of an action, the main one first; each menu entry prints its document directly */
export const printDocsFor = (item: DisciplinaryModel): PrintDoc[] => {
  // The administration's decision, as a formal document, only when it carries a sanction
  const decision: PrintDoc[] = item.decision_outcome?.trim() ? [{ type: 'disciplinary_decision', label: 'طباعة القرار التأديبي' }] : [];
  if (item.actionType === 'استدعاء جلسة') {
    // The minutes once the hearing closed
    return item.hearingEndTime ? [{ type: 'hearing', label: 'طباعة محضر الجلسة' }, ...decision] : decision;
  }
  if (item.actionType === 'طلب توضيح') return decision;
  return [{ type: 'incident', label: 'طباعة محضر الواقعة' }, ...decision];
};
