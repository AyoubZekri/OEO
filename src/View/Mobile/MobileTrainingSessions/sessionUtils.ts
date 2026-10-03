import { useEffect, useState } from 'react';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';

export type SessionStatus = 'مجدولة' | 'جارية' | 'مكتملة' | 'ملغاة';

export const STATUS_LABELS: Record<string, string> = {
  'مجدولة': 'مجدولة',
  'جارية': 'جارية الآن',
  'مكتملة': 'مكتملة',
  'ملغاة': 'ملغاة',
};

export const STATUS_TONE: Record<string, string> = {
  'مجدولة': 'scheduled',
  'جارية': 'live',
  'مكتملة': 'done',
  'ملغاة': 'cancelled',
};

export const dayOf = (session: TrainingSessionModel) => (session.date || '').split('T')[0];

const at = (day: string, time?: string) => {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = (time || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0);
};

export const startOf = (s: TrainingSessionModel) => at(dayOf(s), s.start);
export const endOf = (s: TrainingSessionModel) => at(dayOf(s), s.end);

/** Same rule as the desktop page: a status set by hand wins, otherwise it follows the clock */
export const computedStatus = (s: TrainingSessionModel, now = new Date()): string => {
  const raw = (s.status || '').trim();
  if (raw === 'ملغاة' || raw === 'مكتملة' || raw === 'جارية') return raw;
  if (!s.date || !s.start || !s.end) return raw || 'مجدولة';
  if (now < startOf(s)) return 'مجدولة';
  if (now <= endOf(s)) return 'جارية';
  return 'مكتملة';
};

/** Minutes between start and end, or null */
export const durationOf = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
};

export const durationText = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} د`;
  return m ? `${h} سا ${m} د` : `${h} سا`;
};

/** yyyy-mm-dd of today + offset, in local time */
export const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Days from today to `day` (negative in the past) */
export const daysFromToday = (day: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((at(day).getTime() - today.getTime()) / 86400000);
};

/** "اليوم" / "غداً" / "أمس" / "الأحد 28 سبتمبر" */
export const dayLabel = (day: string) => {
  const diff = daysFromToday(day);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'غداً';
  if (diff === -1) return 'أمس';
  const date = at(day);
  return isNaN(date.getTime())
    ? day
    : new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

export const longDate = (day: string) => {
  const date = at(day);
  return isNaN(date.getTime())
    ? day
    : new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

/** "بعد 2 سا 15 د" until `target` */
export const countdownText = (target: Date, now: Date) => {
  const minutes = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  if (days >= 1) return `بعد ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : `${days} ${days <= 10 ? 'أيام' : 'يوماً'}`}`;
  return `بعد ${durationText(minutes || 1)}`;
};

export const attendanceRate = (s: TrainingSessionModel) => {
  const stats = s.attendance_stats;
  return stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
};

export type MyAttendanceTone = 'present' | 'late' | 'excused' | 'absent';

/**
 * Personal space: my attendance in a session. An absence / late record is shown as it is;
 * a finished session without one counts as attended (the attendance sheet's rule). Nothing before the end.
 */
export const myAttendance = (s: TrainingSessionModel, now = new Date()): { label: string; tone: MyAttendanceTone } | null => {
  const status = computedStatus(s, now);
  if (status === 'ملغاة') return null;
  const absence = (s.my_absence || '').trim();
  if (absence === 'متأخر') return { label: 'متأخر', tone: 'late' };
  if (absence === 'غائب مبرر') return { label: 'غائب مبرر', tone: 'excused' };
  if (absence) return { label: absence, tone: 'absent' };
  return status === 'مكتملة' ? { label: 'حاضر', tone: 'present' } : null;
};

/** Current time, refreshed every minute so countdowns and "live" states stay right */
export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};
