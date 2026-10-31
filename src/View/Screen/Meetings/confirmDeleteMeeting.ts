import type { Meeting } from './meeting_model';
import { confirmDelete } from '../../shared/confirmDelete';

/** Asks before deleting a meeting: one with decisions says they go with it */
export const confirmDeleteMeeting = (m: Pick<Meeting, 'topic' | 'decisions_count'>) =>
  confirmDelete((m.decisions_count || 0) > 0 ? 'حذف الاجتماع مع قراراته؟' : 'حذف الاجتماع؟', m.topic);
