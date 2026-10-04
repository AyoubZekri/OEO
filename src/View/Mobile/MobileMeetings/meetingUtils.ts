import type { Attendee, Meeting, MeetingPoint } from '../../Screen/Meetings/meeting_model';
import { arCount } from '../MobileTeams/teamRoster';

/** Start of the meeting in local time (date "yyyy-mm-dd" + time "hh:mm[:ss]") */
export const meetingStart = (m: Meeting) => {
  const [y, mo, d] = (m.date || '').split('T')[0].split('-').map(Number);
  const [h, mi] = (m.time || '00:00').split(':').map(Number);
  const date = new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
  return isNaN(date.getTime()) ? null : date;
};

export const dayOfMeeting = (m: Meeting) => (m.date || '').split('T')[0];
export const shortTime = (time?: string) => (time || '').slice(0, 5);

const RECORDED = ['حاضر', 'متأخر', 'غائب مبرر', 'غائب غير مبرر'];

/** Share of invited members who came (present or late), once attendance was taken */
export const attendanceOf = (m: Meeting) => {
  const list = m.attendees || [];
  const recorded = list.filter(a => RECORDED.includes(a.status)).length;
  if (!list.length || !recorded) return null;
  const came = list.filter(a => a.status === 'حاضر' || a.status === 'متأخر').length;
  return { came, total: list.length, rate: Math.round((came / list.length) * 100) };
};

// Label and colour of an attendee's status (the old pending/confirmed/absent values included)
export const ATTENDEE_STATUS: Record<string, { label: string; tone: string }> = {
  'حاضر': { label: 'حاضر', tone: 'green' },
  'متأخر': { label: 'متأخر', tone: 'amber' },
  'غائب مبرر': { label: 'غائب مبرر', tone: 'violet' },
  'غائب غير مبرر': { label: 'غائب', tone: 'red' },
  pending: { label: 'قيد الانتظار', tone: 'muted' },
  confirmed: { label: 'مؤكد الحضور', tone: 'green' },
  absent: { label: 'غائب', tone: 'red' },
};

export const statusOf = (a: Attendee) => ATTENDEE_STATUS[a.status] || { label: a.status || '—', tone: 'muted' };

export const invitedText = (n: number) => (n ? arCount(n, 'مدعو واحد', 'مدعوان', 'مدعوين', 'مدعواً') : 'بدون مدعوين');

/** The text of a point (the administration's text, or a sent point) */
export const pointText = (p: MeetingPoint) => (typeof p === 'string' ? p : p?.text || '');

/** A point as the agenda shows it: author null = the administration */
export interface AgendaItem {
  key: string;
  /** A sent point's id (the administration's texts have none) */
  id: string | null;
  text: string;
  author: string | null;
  mine: boolean;
  created_at?: string | null;
}

/** The meeting's points for the agenda, in their order */
export const agendaOf = (points: MeetingPoint[] | undefined, userId?: string | number | null): AgendaItem[] =>
  (points || [])
    .map((p, i): AgendaItem | null => {
      if (typeof p === 'string') return p.trim() ? { key: `o-${i}`, id: null, text: p, author: null, mine: false } : null;
      if (!p || !p.text) return null;
      return { key: p.id || `s-${i}`, id: p.id || null, text: p.text, author: p.author || 'عضو', mine: userId != null && String(p.user_id) === String(userId), created_at: p.created_at };
    })
    .filter((x): x is AgendaItem => x !== null);
