import type { Meeting } from './meeting_model';

/** Asks before deleting a meeting: with its decisions, it says they are deleted with it */
export const confirmDeleteMeeting = (m: Pick<Meeting, 'topic' | 'decisions_count'>) => {
  const n = m.decisions_count || 0;
  return window.confirm(n > 0
    ? `لهذا الاجتماع ${n === 1 ? 'قرار' : `${n} قرارات`}. سيتم حذف اجتماع "${m.topic}" مع ${n === 1 ? 'قراره' : 'قراراته'}. هل تريد المتابعة؟`
    : `هل أنت متأكد من حذف اجتماع "${m.topic}"؟`);
};
