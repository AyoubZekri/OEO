import { Plane, UserX, Clock } from 'lucide-react';
import type { MyAbsenceRequest } from './useMyAbsences';

type Kind = MyAbsenceRequest['kind'];

/** The three requests a member sends */
export const REQUEST_KINDS: { value: Kind; label: string; short: string; icon: typeof Plane; tone: string }[] = [
  { value: 'leave', label: 'طلب عطلة', short: 'عطلة', icon: Plane, tone: 'violet' },
  { value: 'absence', label: 'إعلام مسبق بغياب', short: 'غياب', icon: UserX, tone: 'red' },
  { value: 'late', label: 'إعلام مسبق بتأخر', short: 'تأخر', icon: Clock, tone: 'amber' },
];

/** What an absence / lateness is announced for */
export const ANNOUNCE_EVENTS = ['سفر', 'اجتماع', 'تدريب', 'مباراة', 'أخرى'];

export const MAX_DOC = 5 * 1024 * 1024;

export const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** The form's checks before sending (the server checks the same) */
export const requestError = (r: { kind: Kind; from: string; to: string; event: string; other: string; reason: string; doc: File | null }) => {
  if (r.kind !== 'leave' && !r.event) return 'حدد الحدث';
  if (r.kind !== 'leave' && r.event === 'أخرى' && !r.other.trim()) return 'اكتب ما هو الحدث';
  if (!r.from) return 'حدد التاريخ';
  if (r.kind === 'leave' && r.to && r.to < r.from) return 'تاريخ النهاية قبل تاريخ البداية';
  if (!r.reason.trim() && !r.doc) return 'اكتب السبب أو أرفق وثيقة';
  return '';
};

