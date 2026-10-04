import client from '../../../core/api/client';
import type { AgendaItem } from '../../Mobile/MobileMeetings/meetingUtils';

/** Sending a point into a meeting's list, and removing a sent one (the server checks who may) */
export const meetingPointsApi = {
  add: (meetingId: string, text: string) => client.post(`/meetings/${meetingId}/points`, { text }),

  /** Asks first; shows the server's message when refused. Resolves true when removed */
  remove: async (meetingId: string, item: AgendaItem) => {
    if (!item.id || !window.confirm('حذف هذه النقطة؟')) return false;
    try {
      await client.post('/meetings/points/delete', { meeting_id: meetingId, point_id: item.id });
      return true;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
      alert((e as any)?.response?.data?.message || 'تعذر حذف النقطة');
      return false;
    }
  },
};
