import { UserX, Clock, LogOut, Plane, Dumbbell, Trophy, Briefcase, CircleHelp } from 'lucide-react';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { absenceKind } from '../Members/useMemberRecord';

/* eslint-disable @typescript-eslint/no-explicit-any -- members come untyped from the API */

type Icon = typeof UserX;

/** The four kinds of records, as saved by the add dialog (absence_type) */
export const ABSENCE_TYPES: { value: string; mode: 'record' | 'late' | 'leave' | 'request'; label: string; icon: Icon; tone: string }[] = [
  { value: 'غياب', mode: 'record', label: 'غياب', icon: UserX, tone: 'red' },
  { value: 'تأخر', mode: 'late', label: 'تأخر', icon: Clock, tone: 'amber' },
  { value: 'مغادرة', mode: 'leave', label: 'مغادرة', icon: LogOut, tone: 'orange' },
  { value: 'طلب عطلة', mode: 'request', label: 'طلب عطلة', icon: Plane, tone: 'violet' },
];
const KIND_VALUE = { absence: 'غياب', late: 'تأخر', leave: 'مغادرة', request: 'طلب عطلة' } as const;

/**
 * The kind of a record as one of ABSENCE_TYPES values. Matched loosely (same rule as the member
 * tracking record): attendance sheets save "متأخر" / "غائب", this page saves "تأخر" / "غياب".
 */
export const kindOf = (a: Pick<AbsenceRecord, 'absence_type'>): string =>
  KIND_VALUE[absenceKind(a as AbsenceRecord).kind];

export const typeMeta = (type?: string) => {
  const value = kindOf({ absence_type: type || '' });
  return ABSENCE_TYPES.find(t => t.value === value) || ABSENCE_TYPES[0];
};

export const EVENT_CATEGORIES: { value: string; icon: Icon }[] = [
  { value: 'تدريب', icon: Dumbbell },
  { value: 'مباراة', icon: Trophy },
  { value: 'اجتماع', icon: Briefcase },
  { value: 'أخرى', icon: CircleHelp },
];
export const categoryIcon = (category?: string) => (EVENT_CATEGORIES.find(c => c.value === category) || EVENT_CATEGORIES[3]).icon;

export type JustificationState = 'none' | 'pending' | 'accepted' | 'rejected';

/**
 * One status for the whole page (the API mixes Arabic and English values).
 * A record with a written reason but no decision yet is under review, like in the member history.
 */
export const statusOf = (a: AbsenceRecord): JustificationState => {
  const s = a.justification_status as string;
  if (s === 'مقبول' || s === 'accepted') return 'accepted';
  if (s === 'مرفوض' || s === 'rejected') return 'rejected';
  if (s === 'قيد_الدراسة' || s === 'pending') return 'pending';
  return a.reason || (a as any).attachment_url ? 'pending' : 'none';
};

export const STATUS_LABEL: Record<JustificationState, string> = {
  none: 'بدون تبرير',
  pending: 'تبرير قيد الدراسة',
  accepted: 'مبرر',
  rejected: 'تبرير مرفوض',
};

/** Values the API filter expects for each status */
export const STATUS_FILTERS = [
  { value: '', label: 'كل الحالات' },
  { value: 'لا_يوجد', label: 'بدون تبرير' },
  { value: 'قيد_الدراسة', label: 'قيد الدراسة' },
  { value: 'مقبول', label: 'مبرر' },
  { value: 'مرفوض', label: 'مرفوض' },
];

export const dateOf = (a: AbsenceRecord) => a.event_date || a.session_date || '';

export const MEMBER_ROLES: Record<string, string> = {
  player: 'لاعب',
  coach: 'مدرب',
  assistant_coach: 'مساعد مدرب',
  goalkeeper_coach: 'مدرب حراس',
  physical_trainer: 'محضر بدني',
  employee: 'موظف/إداري',
  admin: 'إداري',
  doctor: 'طبيب',
};

export const memberName = (m: any) => `${m?.first_name || ''} ${m?.last_name || ''}`.trim() || 'عضو';
export const memberRole = (m: any) => MEMBER_ROLES[m?.type] || m?.type || 'لاعب';
export const memberTeam = (m: any) => m?.team?.name || m?.team_name || '';
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('') || '؟';

export interface MemberCounts {
  total: number;
  absent: number;
  late: number;
  leave: number;
  request: number;
  pending: number;
  unjustified: number;
}

/** Counters of one member (or all records when no member is given) */
export const countsOf = (records: AbsenceRecord[]): MemberCounts => ({
  total: records.length,
  absent: records.filter(r => kindOf(r) === 'غياب').length,
  late: records.filter(r => kindOf(r) === 'تأخر').length,
  leave: records.filter(r => kindOf(r) === 'مغادرة').length,
  request: records.filter(r => kindOf(r) === 'طلب عطلة').length,
  pending: records.filter(r => statusOf(r) === 'pending').length,
  unjustified: records.filter(r => kindOf(r) === 'غياب' && (statusOf(r) === 'none' || statusOf(r) === 'rejected')).length,
});

export const recordsOf = (absences: AbsenceRecord[], memberId: number | string) =>
  absences.filter(a => String(a.player_id) === String(memberId));

/** Newest first */
export const byDateDesc = (a: AbsenceRecord, b: AbsenceRecord) => dateOf(b).localeCompare(dateOf(a));
/* eslint-enable @typescript-eslint/no-explicit-any */
