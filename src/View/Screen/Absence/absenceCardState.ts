import type { AbsenceRecord } from './AbsenceRequestsController';
import { canJustifyNow, isMemberRequest, justifyLeft, leftText, statusOf, typeMeta } from './absenceUtils';

/**
 * What the bottom of an absence card shows, the same on the computer and on the phone:
 * a button (justify), two buttons (accept / refuse), or a line telling where the record stands.
 */
export type CardFooter =
  | { kind: 'justify'; left?: string }
  | { kind: 'decide' }
  | { kind: 'info'; tone: 'muted' | 'blue' | 'green' | 'red' | 'amber'; text: string; expired?: boolean };

const dayText = (value?: string | null) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d.getTime()) ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long' }).format(d) : '';
};

export const cardFooter = (
  a: AbsenceRecord,
  opts: { personal?: boolean; canJustify?: boolean; now?: number },
): CardFooter => {
  const status = statusOf(a);
  const leave = isMemberRequest(a);
  const now = opts.now ?? 0;
  const decided = dayText(a.decision_date);
  const why = (a.decision_note || '').trim();

  if (status === 'accepted') return { kind: 'info', tone: 'green', text: `${leave ? 'تم قبول الطلب' : 'تم قبول التبرير'}${decided ? ` · ${decided}` : ''}` };
  if (status === 'rejected') return { kind: 'info', tone: 'red', text: `${leave ? 'تم رفض الطلب' : 'تم رفض التبرير'}${why ? `: ${why}` : ' · قرار نهائي'}` };

  if (opts.personal) {
    if (status === 'pending') return { kind: 'info', tone: 'blue', text: leave ? 'طلبك بانتظار قرار الإدارة' : 'تبريرك بانتظار قرار الإدارة' };
    if (canJustifyNow(a, now)) return { kind: 'justify', left: `باقي ${leftText(justifyLeft(a, now) ?? 0)}` };
    if ((justifyLeft(a, now) ?? 1) <= 0) return { kind: 'info', tone: 'muted', text: 'انتهت مهلة التبرير (24 ساعة)', expired: true };
    return { kind: 'info', tone: 'muted', text: 'بدون تبرير' };
  }

  if (opts.canJustify) return status === 'pending' ? { kind: 'decide' } : { kind: 'justify' };
  return status === 'pending'
    ? { kind: 'info', tone: 'blue', text: 'بانتظار القرار' }
    : { kind: 'info', tone: 'muted', text: 'لم يُقدَّم تبرير' };
};

/** "4 أكتوبر" (with the year only when it is not this year) from the record's day */
export const longDay = (value: string) => {
  const day = value.slice(0, 10);
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (!y || isNaN(date.getTime())) return value || '—';
  const sameYear = y === new Date().getFullYear();
  return new Intl.DateTimeFormat('ar-DZ', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

/** The status in one or two words, for the card's corner (the bottom line says the rest) */
export const statusShort = (a: AbsenceRecord) => {
  const leave = typeMeta(a.absence_type).value === 'طلب عطلة';
  const request = leave || a.record_source === 'طلب العضو';
  return { none: request ? 'بانتظار الرد' : 'بدون تبرير', pending: 'قيد الدراسة', accepted: request ? 'مقبول' : 'مبرر', rejected: 'مرفوض' }[statusOf(a)];
};
