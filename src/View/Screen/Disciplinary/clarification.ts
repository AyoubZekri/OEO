import type { DisciplinaryModel } from './disciplinary_data';

/**
 * Clarification request (طلب توضيح) workflow:
 * created and sent to the member → the member replies (personal space) → the administration writes its decision
 * → the document is printed and signed by the player → the signed document is uploaded.
 */
export const isClarification = (item: Pick<DisciplinaryModel, 'actionType'>) => item.actionType === 'طلب توضيح';

/** The administration has written its decision */
export const hasDecision = (item: Pick<DisciplinaryModel, 'admin_notes' | 'decision_outcome' | 'decision_reasons'>) =>
  Boolean(item.admin_notes?.trim() || item.decision_outcome?.trim() || item.decision_reasons?.trim());

/** The member may still answer: a clarification request without a decision yet */
export const memberCanReply = (item: DisciplinaryModel) => isClarification(item) && !hasDecision(item);

/** Printing a clarification request waits for the decision (the printed document carries it, for the player's signature) */
export const canPrintNow = (item: DisciplinaryModel) => !isClarification(item) || hasDecision(item);
