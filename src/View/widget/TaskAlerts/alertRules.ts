import { dueText, parseDate, type Task } from '../../Screen/Tasks/taskUtils';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import { computedStatus, countdownText, dayLabel, endOf, myAttendance, startOf } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import type { Match } from '../../Screen/Matches/match_model';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import type { MyMeeting } from '../../Screen/Personal/useMyMeetings';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import type { Travel } from '../../Screen/Travels/travelUtils';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';
import type { Debt } from '../../Screen/Debts/debtUtils';
import { moneyText } from '../../Mobile/MobileContracts/contractUtils';
import { canJustifyNow, dateOf, isMemberRequest, justifyLeft, leftText, recordTitle, statusOf, typeMeta } from '../../Screen/Absence/absenceUtils';
import { countdown, dayText as matchDay, matchDate, matchState, opponentName, resultOf, RESULT_LABEL, timeText } from '../../Mobile/MobileMatches/matchUtils';

/** Why something needs attention: a task (most urgent first), or a disciplinary action */
export type TaskAlertKind = 'overdue' | 'returned' | 'due_soon' | 'start';
export type DisciplinaryAlertKind =
  // for the member concerned
  | 'disciplinary' | 'disc_reply_due' | 'disc_reply_late' | 'disc_hearing' | 'disc_decision'
  // for the managers
  | 'mgr_replied' | 'mgr_reply_late' | 'mgr_hearing' | 'mgr_document';
/** A training session: about to start, started, ended (for the category's members, and for the managers) */
export type TrainingAlertKind = 'train_soon' | 'train_live' | 'train_ended'
  // what the managers did to a session of my category
  | 'train_new' | 'train_changed' | 'train_cancelled';
/** A match: called up, about to start, live, ended (result), waiting for its result (managers), what the managers did to it */
export type MatchAlertKind = 'match_callup' | 'match_soon' | 'match_live' | 'match_ended' | 'match_awaiting'
  | 'match_new' | 'match_changed' | 'match_postponed' | 'match_cancelled'
  // what the managers still have to do
  | 'match_no_callups' | 'match_no_lineup' | 'match_no_attendance' | 'match_no_ratings' | 'match_no_report';
/** An absence record: logged on me, my justification / request decided; for the managers: one awaiting a decision */
export type AbsenceAlertKind =
  // the member
  | 'abs_new' | 'abs_accepted' | 'abs_rejected' | 'abs_expired' | 'abs_admin_justified' | 'abs_leave_soon' | 'abs_repeated'
  // the managers
  | 'abs_pending' | 'abs_today' | 'abs_repeated_member';
/** Meetings: invited, near, live, a point sent, a decision in my charge (near / late); the managers: points, attendance, decisions */
export type MeetingAlertKind =
  | 'meet_invited' | 'meet_soon' | 'meet_live' | 'meet_point' | 'dec_assigned' | 'dec_due' | 'dec_late'
  | 'meet_changed' | 'meet_cancelled' | 'meet_uninvited'
  | 'mgr_meet_point' | 'mgr_meet_soon' | 'mgr_meet_attendance' | 'mgr_meet_no_decisions' | 'mgr_dec_late';
/** Trips: added, departure near, on the way, changed / cancelled / taken off; the managers: near, no head, no one chosen */
export type TravelAlertKind = 'trv_added' | 'trv_soon' | 'trv_live' | 'trv_changed' | 'trv_cancelled' | 'trv_removed'
  | 'mgr_trv_soon' | 'mgr_trv_no_head' | 'mgr_trv_empty';
/** Medical files: opened, a stage reached, an exam near / missed, the end of the absence near; the managers: exams, first diagnosis, return */
export type MedicalAlertKind = 'med_new' | 'med_stage' | 'med_recovered' | 'med_exam' | 'med_exam_missed' | 'med_return_soon'
  | 'med_changed' | 'med_exam_moved' | 'med_deleted'
  | 'mgr_med_exam' | 'mgr_med_exam_late' | 'mgr_med_initial' | 'mgr_med_return';
/** Debts (loans and purchases on credit) not fully paid: the repayment date near, today, passed */
export type DebtAlertKind = 'debt_soon' | 'debt_due' | 'debt_late';
export type AlertKind = DebtAlertKind | TaskAlertKind | DisciplinaryAlertKind | TrainingAlertKind | MatchAlertKind | AbsenceAlertKind | MeetingAlertKind | TravelAlertKind | MedicalAlertKind;

export interface AppAlert {
  /** Changes when the reason or the deadline changes, so a new alert reopens a minimized stack */
  key: string;
  kind: AlertKind;
  /** What it is about, in bold: the task's title, the action's reason */
  heading: string;
  title: string;
  detail: string;
  tone: 'red' | 'amber' | 'blue' | 'violet';
  /** Where a click leads (a disciplinary action: in the member's personal space, or in the management space) */
  target:
    | { type: 'task'; id: number }
    | { type: 'disciplinary'; id: string; space: 'personal' | 'management' }
    /** attendance: open the session's attendance sheet (a manager who can take it) */
    | { type: 'training'; id: number; space: 'personal' | 'management'; attendance?: boolean }
    /** attendance: open the match's attendance sheet */
    | { type: 'match'; id: number; space: 'personal' | 'management'; attendance?: boolean }
    /** tab: the management page's tab to open (the pending requests by default) */
    | { type: 'absence'; id: number; space: 'personal' | 'management'; tab?: 'requests' | 'registry' }
    /** attendance: open the meeting's attendance sheet; decisions: open the decisions page */
    | { type: 'meeting'; id: string; space: 'personal' | 'management'; attendance?: boolean; decisions?: boolean }
    /** id 0: the trips page (a deleted trip) */
    | { type: 'travel'; id: number; space: 'personal' | 'management' }
    | { type: 'medical'; id: number; space: 'personal' | 'management' }
    | { type: 'debt'; id: number; kind: 'loan' | 'purchase' };
  /** Something that happened (created, decided, replied): opening it marks it seen. Otherwise it stays while its reason holds */
  event?: boolean;
}

/** Kept for the task side */
export type TaskAlert = AppAlert;

/** A task is "due soon" this long before its deadline: the last 3 hours */
export const DUE_SOON_MS = 3 * 3600 * 1000;

const RANK: Record<TaskAlertKind, number> = { overdue: 0, returned: 1, due_soon: 2, start: 3 };

const clock = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * The alerts of the signed-in user's tasks (one per task, the most urgent reason):
 * late, sent back for correction, deadline within 3 hours, or start time reached on a task not started yet.
 * Tasks waiting for review, done or deleted give none.
 */
export const alertsFor = (tasks: Task[], now = Date.now()): AppAlert[] => tasks
  .filter(t => !t.deleted_at && t.status !== 'approved' && t.status !== 'in_review')
  .map((t): { alert: AppAlert; rank: number; due: number } | null => {
    const due = parseDate(t.due_at);
    const start = parseDate(t.starts_at);
    const make = (kind: TaskAlertKind, title: string, detail: string, tone: AppAlert['tone']) => ({
      alert: {
        key: `${t.id}:${kind}:${t.due_at ?? ''}`,
        kind,
        heading: t.title,
        title,
        detail,
        tone,
        target: { type: 'task' as const, id: t.id },
      },
      rank: RANK[kind],
      due: due?.getTime() ?? Infinity,
    });

    if (due && due.getTime() < now) return make('overdue', 'تأخر في إنجاز مهمة', dueText(t), 'red');
    if (t.status === 'returned') return make('returned', 'أُرجعت مهمة للتصحيح', t.return_reason || 'راجع ملاحظة المراجع', 'amber');
    if (due && due.getTime() - now <= DUE_SOON_MS) return make('due_soon', 'اقترب موعد مهمة', `آخر أجل: ${dueText(t)}`, 'amber');
    if (start && start.getTime() <= now && t.status === 'assigned') return make('start', 'حان وقت مهمة', `بدأ وقتها ${clock(start)}`, 'blue');
    return null;
  })
  .filter((x): x is { alert: AppAlert; rank: number; due: number } => x !== null)
  .sort((a, b) => a.rank - b.rank || a.due - b.due)
  .map(x => x.alert);

/** A disciplinary action as /disciplinary and /disciplinary/mine return it (the fields the alerts need) */
export interface MyDisciplinaryAction {
  id: string;
  actionType: string;
  incidentDate: string;
  reason: string;
  status: string;
  memberName?: string;
  deadlineOrHearingDate?: string;
  player_statements?: string;
  admin_notes?: string;
  decision_outcome?: string;
  decision_reasons?: string;
  signed_document?: string | null;
}

/** The reply deadline / hearing counts as "near" this many days ahead (today included) */
export const DISC_SOON_DAYS = 2;

const dayText = (value?: string) => {
  const d = parseDate(value);
  return d ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long' }).format(d) : '';
};

/** Whole days from today to the date (0 = today, negative = past) */
const daysUntil = (value: string | undefined, now: number) => {
  const d = parseDate(value);
  if (!d) return null;
  const day = (t: number) => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };
  return Math.round((day(d.getTime()) - day(now)) / 86400000);
};

const inDays = (n: number) => (n === 0 ? 'اليوم' : n === 1 ? 'غداً' : `بعد ${n} أيام`);

const decided = (a: MyDisciplinaryAction) => Boolean(a.admin_notes?.trim() || a.decision_outcome?.trim() || a.decision_reasons?.trim());
const replied = (a: MyDisciplinaryAction) => Boolean(a.player_statements?.trim());
const live = (a: MyDisciplinaryAction) => a.status !== 'ملغى';

const discAlert = (
  a: MyDisciplinaryAction,
  space: 'personal' | 'management',
  kind: DisciplinaryAlertKind,
  key: string,
  title: string,
  detail: string,
  tone: AppAlert['tone'],
  event = false,
): AppAlert => ({
  key,
  kind,
  heading: a.reason || a.actionType,
  title,
  detail,
  tone,
  target: { type: 'disciplinary', id: a.id, space },
  event,
});

/**
 * The member's alerts about their own actions, one per action (the most urgent):
 * reply late, reply deadline near, hearing near, decision issued, record created.
 * "Created" and "decision" are events: once opened they are seen. The others stay while they hold.
 */
export const disciplinaryAlerts = (items: MyDisciplinaryAction[], now = Date.now()): AppAlert[] => items
  .filter(live)
  .map((a): AppAlert | null => {
    const left = daysUntil(a.deadlineOrHearingDate, now);
    const clarification = a.actionType === 'طلب توضيح';
    const hearing = a.actionType === 'استدعاء جلسة';
    const open = a.status === 'مفتوح' || a.status === 'متأخر';

    if (clarification && !replied(a) && !decided(a) && left !== null && left < 0) {
      return discAlert(a, 'personal', 'disc_reply_late', `disc:late:${a.id}:${a.deadlineOrHearingDate}`, 'تأخرت في الرد على طلب التوضيح', `انتهى الأجل ${dayText(a.deadlineOrHearingDate)}`, 'red');
    }
    if (clarification && !replied(a) && !decided(a) && left !== null && left <= DISC_SOON_DAYS) {
      return discAlert(a, 'personal', 'disc_reply_due', `disc:due:${a.id}:${a.deadlineOrHearingDate}`, 'اقترب أجل الرد على طلب التوضيح', `آخر أجل ${inDays(left)} · ${dayText(a.deadlineOrHearingDate)}`, 'amber');
    }
    if (hearing && !decided(a) && left !== null && left >= 0 && left <= DISC_SOON_DAYS) {
      return discAlert(a, 'personal', 'disc_hearing', `disc:hearing:${a.id}:${a.deadlineOrHearingDate}`, 'اقترب موعد جلسة الاستماع', `الجلسة ${inDays(left)} · ${dayText(a.deadlineOrHearingDate)}`, 'blue');
    }
    if (decided(a)) {
      return discAlert(a, 'personal', 'disc_decision', `disc:decision:${a.id}`, 'صدر القرار في الإجراء الخاص بك', [a.actionType, a.decision_outcome].filter(Boolean).join(' · '), 'violet', true);
    }
    if (open) {
      return discAlert(a, 'personal', 'disciplinary', `disc:${a.id}`, 'تم إنشاء محضر خاص بك',
        [a.actionType, a.deadlineOrHearingDate ? `الأجل: ${dayText(a.deadlineOrHearingDate)}` : dayText(a.incidentDate)].filter(Boolean).join(' · '), 'violet', true);
    }
    return null;
  })
  .filter((x): x is AppAlert => x !== null);

/**
 * The managers' alerts (users who can see the disciplinary actions), one per action (the most urgent):
 * the member is late replying, the member replied (a decision is awaited), a hearing is near,
 * a decision waits for its signed document. "Replied" is an event; the others stay while they hold.
 */
export const managerDisciplinaryAlerts = (items: MyDisciplinaryAction[], now = Date.now()): AppAlert[] => items
  .filter(live)
  .map((a): AppAlert | null => {
    const left = daysUntil(a.deadlineOrHearingDate, now);
    const who = a.memberName || 'العضو';
    const clarification = a.actionType === 'طلب توضيح';
    const hearing = a.actionType === 'استدعاء جلسة';

    if (clarification && !replied(a) && !decided(a) && left !== null && left < 0) {
      return discAlert(a, 'management', 'mgr_reply_late', `mgr:late:${a.id}:${a.deadlineOrHearingDate}`, 'تأخر عضو في الرد على طلب توضيح', `${who} · انتهى الأجل ${dayText(a.deadlineOrHearingDate)}`, 'red');
    }
    if (clarification && replied(a) && !decided(a)) {
      return discAlert(a, 'management', 'mgr_replied', `mgr:replied:${a.id}`, 'ردّ عضو على طلب التوضيح', `${who} · بانتظار القرار`, 'amber', true);
    }
    if (hearing && !decided(a) && left !== null && left >= 0 && left <= DISC_SOON_DAYS) {
      return discAlert(a, 'management', 'mgr_hearing', `mgr:hearing:${a.id}:${a.deadlineOrHearingDate}`, 'جلسة استماع قريبة', `${who} · ${inDays(left)}`, 'blue');
    }
    if (decided(a) && !a.signed_document) {
      return discAlert(a, 'management', 'mgr_document', `mgr:doc:${a.id}`, 'بانتظار رفع الوثيقة الممضاة', `${who} · اطبع الوثيقة ليوقعها العضو ثم ارفعها`, 'violet');
    }
    return null;
  })
  .filter((x): x is AppAlert => x !== null);

/** A training session is "near" this long before it starts, and its end is announced this long after */
export const TRAIN_SOON_MS = 3 * 3600 * 1000;
export const TRAIN_ENDED_MS = 3 * 3600 * 1000;

/**
 * Training session alerts, one per session (the current moment of it):
 * - near: it starts within 3 hours;
 * - started: it is running now;
 * - ended: it ended less than 3 hours ago (an event: seen once opened).
 * personal: the sessions of my category (with my attendance once recorded);
 * management: every session, for the managers who take the attendance (canAttend: the click opens the sheet).
 * Cancelled sessions give none. A time change gives a new alert.
 */
export const trainingAlerts = (
  sessions: TrainingSessionModel[],
  space: 'personal' | 'management',
  now = Date.now(),
  canAttend = false,
): AppAlert[] => {
  const at = new Date(now);
  return sessions
    .filter(s => s.id && s.date && s.start && s.end)
    .map((s): { alert: AppAlert; start: number } | null => {
      const status = computedStatus(s, at);
      if (status === 'ملغاة') return null;
      const start = startOf(s).getTime();
      const end = endOf(s).getTime();
      const team = s.team_name || 'حصة تدريبية';
      const place = s.location ? ` · ${s.location}` : '';
      const time = `${s.start} – ${s.end}`;
      const make = (kind: TrainingAlertKind, title: string, detail: string, tone: AppAlert['tone'], attendance = false, event = false) => ({
        alert: {
          key: `train:${space}:${s.id}:${kind}:${s.date}:${s.start}`,
          kind,
          heading: space === 'personal' ? `حصة تدريب ${team}` : `حصة تدريب · ${team}`,
          title,
          detail,
          tone,
          target: { type: 'training' as const, id: s.id as number, space, attendance },
          event,
        },
        start,
      });

      if (status === 'جارية') {
        return space === 'management' && canAttend
          ? make('train_live', 'بدأت حصة التدريب', `جارية الآن حتى ${s.end} · سجّل الحضور`, 'blue', true)
          : make('train_live', 'بدأت حصة التدريب', `جارية الآن حتى ${s.end}${place}`, 'blue');
      }
      if (status === 'مجدولة' && start > now && start - now <= TRAIN_SOON_MS) {
        return make('train_soon', 'اقترب موعد حصة التدريب', `تبدأ ${countdownText(new Date(start), at)} · ${time}${place}`, 'amber');
      }
      if (status === 'مكتملة' && now - end <= TRAIN_ENDED_MS) {
        if (space === 'management') {
          // The sheet already saved: nothing left to do
          if (s.attendance_taken) return null;
          return canAttend
            ? make('train_ended', 'لم يُسجل حضور حصة التدريب', 'انتهت الحصة: سجّل الحضور والغياب', 'red', true)
            : null;
        }
        const mine = s.my_absence ? myAttendance(s, at) : null;
        return make('train_ended', 'انتهت حصة التدريب', mine ? `حضوري: ${mine.label}` : `${time}${place}`, 'violet', false, true);
      }
      return null;
    })
    .filter((x): x is { alert: AppAlert; start: number } => x !== null)
    .sort((a, b) => a.start - b.start)
    .map(x => x.alert);
};

/** What happened to a session of my category, as /training-sessions/mine/notices returns it (the latest per session) */
export interface TrainingNotice {
  id: number;
  session_id: number;
  kind: 'created' | 'updated' | 'cancelled' | 'restored' | 'deleted';
  team_name: string;
  date: string;
  start: string;
  end: string;
  location: string;
  /** updated: the date / times / place before the change */
  previous?: { date?: string | null; start?: string | null; end?: string | null; location?: string | null } | null;
}

/**
 * The member's alerts about the sessions of their category: scheduled, changed (what changed), cancelled or deleted,
 * back on after a cancellation. Each is an event: seen once opened.
 */
export const trainingNoticeAlerts = (notices: TrainingNotice[]): AppAlert[] => notices.map(n => {
  const when = [n.date ? dayLabel(n.date) : '', n.start && n.end ? `${n.start} – ${n.end}` : n.start].filter(Boolean).join(' · ');
  const make = (kind: TrainingAlertKind, title: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
    key: `tnotice:${n.id}`,
    kind,
    heading: `حصة تدريب ${n.team_name || ''}`.trim(),
    title,
    detail,
    tone,
    target: { type: 'training', id: n.session_id, space: 'personal' },
    event: true,
  });

  if (n.kind === 'cancelled' || n.kind === 'deleted') {
    return make('train_cancelled', 'تم إلغاء حصة التدريب', when, 'red');
  }
  if (n.kind === 'updated') {
    const p = n.previous || {};
    const changes: string[] = [];
    if (p.date && p.date !== n.date) changes.push(`نُقلت إلى ${dayLabel(n.date)}`);
    if ((p.start && p.start !== n.start) || (p.end && p.end !== n.end)) changes.push(`الوقت ${n.start} – ${n.end} بدل ${p.start} – ${p.end}`);
    if (p.location && p.location !== n.location) changes.push(`المكان: ${n.location}`);
    return make('train_changed', 'تم تعديل موعد حصة التدريب', changes.join(' · ') || when, 'amber');
  }
  const place = n.location ? ` · ${n.location}` : '';
  return n.kind === 'restored'
    ? make('train_new', 'أُعيدت برمجة حصة التدريب', `${when}${place}`, 'blue')
    : make('train_new', 'تمت برمجة حصة تدريبية', `${when}${place}`, 'blue');
});

/** A match is "near" this long before kick-off; its result is announced this long after; what is left to do is reminded this long */
export const MATCH_SOON_MS = 24 * 3600 * 1000;
export const MATCH_ENDED_MS = 24 * 3600 * 1000;
export const MATCH_AWAITING_MS = 7 * 24 * 3600 * 1000;
/** The call-up is asked for this long before kick-off (red in the last 24 hours); the lineup is set 1 h 30 before kick-off */
export const MATCH_CALLUP_MS = 48 * 3600 * 1000;
export const MATCH_CALLUP_URGENT_MS = 24 * 3600 * 1000;
export const MATCH_LINEUP_MS = 90 * 60 * 1000;

/** The match actions a manager can do (role permissions of the matches section) */
export interface MatchPermissions {
  callups?: boolean;
  lineup?: boolean;
  attendance?: boolean;
  report?: boolean;
}

const gatheringText = (m: Match) => {
  if (!m.gathering_time) return '';
  const d = new Date(m.gathering_time.includes('T') ? m.gathering_time : m.gathering_time.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  return `التجمع ${timeText(d)}${m.gathering_location ? ` في ${m.gathering_location}` : ''}`;
};

/**
 * Match alerts (by the clock).
 * personal (my category): called up (an event, once per date), near (24 hours before), live, ended with its result (an event).
 * management, each for the managers allowed to do it, until it is done:
 * - near / live (any match permission);
 * - no player called up 48 hours before (callups); no starting lineup once its time comes, 1 h 30 before kick-off (lineup);
 * - once kicked off: attendance not taken (attendance) — opens the sheet;
 * - once played, for 7 days: result missing, players not rated, report not written (report).
 * Cancelled and postponed matches give none.
 */
export const matchAlerts = (
  matches: Match[],
  space: 'personal' | 'management',
  now = Date.now(),
  can: MatchPermissions = {},
): AppAlert[] => {
  const manager = Boolean(can.callups || can.lineup || can.attendance || can.report);
  if (space === 'management' && !manager) return [];
  const at = new Date(now);
  const list: { alert: AppAlert; time: number; rank: number }[] = [];
  matches.forEach(m => {
    const date = matchDate(m);
    const state = matchState(m, at);
    if (!date || state === 'cancelled' || state === 'postponed') return;
    const time = date.getTime();
    const vs = `ضد ${opponentName(m)}`;
    const team = m.team?.name ? ` · ${m.team.name}` : '';
    const push = (kind: MatchAlertKind, title: string, detail: string, tone: AppAlert['tone'], opts: { event?: boolean; attendance?: boolean; rank?: number } = {}) => list.push({
      alert: {
        key: `match:${space}:${m.id}:${kind}:${m.match_date}`,
        kind,
        heading: space === 'personal' ? `مباراة ${vs}` : `مباراة ${vs}${team}`,
        title,
        detail,
        tone,
        target: { type: 'match', id: m.id, space, ...(opts.attendance ? { attendance: true } : {}) },
        event: opts.event,
      },
      time,
      rank: opts.rank ?? 1,
    });
    const when = `${matchDay(date)} ${timeText(date)}`;

    if (space === 'personal') {
      if (m.my_callup && state === 'upcoming') {
        push('match_callup', 'تم استدعاؤك للمباراة',
          [m.my_callup.is_starter ? 'أساسي' : 'احتياط', when, gatheringText(m)].filter(Boolean).join(' · '), 'violet', { event: true });
      }
      if (state === 'live') {
        push('match_live', 'المباراة جارية الآن', [m.competition, m.location].filter(Boolean).join(' · '), 'blue');
      } else if (state === 'upcoming' && time - now <= MATCH_SOON_MS) {
        push('match_soon', 'اقترب موعد المباراة', [`تنطلق ${countdown(date, at)}`, gatheringText(m) || m.location].filter(Boolean).join(' · '), 'amber');
      } else if (state === 'finished' && now - time <= MATCH_ENDED_MS) {
        const r = resultOf(m);
        push('match_ended', 'انتهت المباراة', `${r ? RESULT_LABEL[r] : 'النتيجة'} ${m.team_score} - ${m.opponent_score}`, 'violet', { event: true });
      }
      return;
    }

    // ---- management: what is still to do (known only when the list gives the counts)
    const counted = m.callups_count !== undefined;
    if (state === 'upcoming') {
      if (can.callups && counted && m.callups_count === 0 && time - now <= MATCH_CALLUP_MS) {
        push('match_no_callups', 'لم يتم استدعاء اللاعبين بعد', `المباراة ${when}`, time - now <= MATCH_CALLUP_URGENT_MS ? 'red' : 'amber', { rank: 0 });
      } else if (can.lineup && counted && (m.callups_count ?? 0) > 0 && m.starters_count === 0 && time - now <= MATCH_LINEUP_MS) {
        push('match_no_lineup', 'حان وقت تحديد التشكيلة الأساسية', `تنطلق المباراة ${countdown(date, at)} · ${m.callups_count} لاعب مستدعى`, 'red', { rank: 0 });
      }
      if (time - now <= MATCH_SOON_MS) {
        push('match_soon', 'اقترب موعد المباراة', [`تنطلق ${countdown(date, at)}`, gatheringText(m) || m.location].filter(Boolean).join(' · '), 'amber', { rank: 2 });
      }
      return;
    }

    if (state === 'live') push('match_live', 'المباراة جارية الآن', [m.competition, m.location].filter(Boolean).join(' · '), 'blue', { rank: 2 });

    const recent = now - time <= MATCH_AWAITING_MS;
    if (!recent) return;
    if (can.attendance && counted && !m.attendance_taken_at) {
      push('match_no_attendance', 'لم يُسجل حضور المباراة', `لُعبت ${matchDay(date)} · سجّل الحضور والغياب`, 'red', { attendance: true, rank: 0 });
    }
    if (!can.report) return;
    if (state === 'awaiting') {
      push('match_awaiting', 'بانتظار تسجيل نتيجة المباراة', `لُعبت ${matchDay(date)}`, 'red', { rank: 0 });
      return;
    }
    if (state === 'finished' && counted) {
      if ((m.callups_count ?? 0) > 0 && m.rated_count === 0) {
        push('match_no_ratings', 'لم يُقيَّم أداء اللاعبين بعد', `${m.callups_count} لاعب مستدعى · ${matchDay(date)}`, 'amber');
      }
      if (m.reports_count === 0) {
        push('match_no_report', 'لم يُحرر تقرير المباراة بعد', `النتيجة ${m.team_score} - ${m.opponent_score} · ${matchDay(date)}`, 'amber');
      }
    }
  });
  return list.sort((x, y) => x.rank - y.rank || x.time - y.time).map(x => x.alert);
};

/** What happened to a match of my category, as /matches/mine/notices returns it (the latest per match) */
export interface MatchNotice {
  id: number;
  match_id: number;
  kind: 'created' | 'updated' | 'postponed' | 'cancelled' | 'restored' | 'deleted';
  team_name: string;
  /** "Y-m-d H:i", Algeria time */
  match_date: string;
  location: string;
  opponent: string;
  competition: string;
  previous?: { match_date?: string | null; location?: string | null; opponent?: string | null } | null;
}

const noticeDate = (value?: string | null) => (value ? matchDate({ id: 0, match_date: value }) : null);

/** The member's alerts about what the managers did to the matches of their category; each is seen once opened */
export const matchNoticeAlerts = (notices: MatchNotice[]): AppAlert[] => notices.map(n => {
  const date = noticeDate(n.match_date);
  const when = date ? `${matchDay(date)} ${timeText(date)}` : '';
  const make = (kind: MatchAlertKind, title: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
    key: `mnotice:${n.id}`,
    kind,
    heading: `مباراة ضد ${n.opponent || 'خصم غير محدد'}`,
    title,
    detail,
    tone,
    target: { type: 'match', id: n.match_id, space: 'personal' },
    event: true,
  });

  if (n.kind === 'cancelled' || n.kind === 'deleted') return make('match_cancelled', 'تم إلغاء المباراة', when, 'red');
  if (n.kind === 'postponed') return make('match_postponed', 'تم تأجيل المباراة', when ? `كانت مبرمجة ${when}` : 'الموعد الجديد يحدد لاحقاً', 'amber');
  if (n.kind === 'updated') {
    const p = n.previous || {};
    const changes: string[] = [];
    if (p.match_date && p.match_date !== n.match_date) {
      const before = noticeDate(p.match_date);
      changes.push(`الموعد الجديد ${when}${before ? ` بدل ${matchDay(before)} ${timeText(before)}` : ''}`);
    }
    if (p.location && p.location !== n.location) changes.push(`الملعب: ${n.location}`);
    if (p.opponent && p.opponent !== n.opponent) changes.push(`المنافس: ${n.opponent}`);
    return make('match_changed', 'تم تعديل موعد المباراة', changes.join(' · ') || when, 'amber');
  }
  const place = n.location ? ` · ${n.location}` : '';
  return n.kind === 'restored'
    ? make('match_new', 'أُعيدت برمجة المباراة', `${when}${place}`, 'blue')
    : make('match_new', 'تمت برمجة مباراة', `${[n.competition, when].filter(Boolean).join(' · ')}${place}`, 'blue');
});

/** A record logged on me, or a decision on it, is announced for this long */
export const ABSENCE_RECENT_MS = 7 * 24 * 3600 * 1000;

const since = (value: string | null | undefined, now: number) => {
  const t = value ? new Date(value).getTime() : NaN;
  return isNaN(t) ? Infinity : now - t;
};

const absenceWhen = (a: AbsenceRecord) => {
  const day = dateOf(a);
  const d = day ? parseDate(day.slice(0, 10)) : null;
  return [a.event_category, d ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long' }).format(d) : day].filter(Boolean).join(' · ');
};

/** The last hours to justify are shown in red */
export const ABSENCE_URGENT_MS = 3 * 3600 * 1000;
/** Repeated absences: this many unjustified absences within ABSENCE_REPEAT_DAYS */
export const ABSENCE_REPEAT_COUNT = 3;
export const ABSENCE_REPEAT_DAYS = 30;

const DAY_MS = 86400000;

/** Midnight of a "Y-m-d" day (local), or null */
const dayStart = (value?: string | null) => {
  const d = value ? parseDate(value.slice(0, 10)) : null;
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Whole days from today to the day (0 = today, 1 = tomorrow, negative = past) */
const daysTo = (value: string | null | undefined, now: number) => {
  const start = dayStart(value);
  if (start === null) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((start - today.getTime()) / DAY_MS);
};

const inDayWords = (n: number) => (n === 0 ? 'اليوم' : n === 1 ? 'غداً' : n === 2 ? 'بعد يومين' : n < 0 ? 'منذ أيام' : `بعد ${n} أيام`);

/** The last day a record covers: a holiday "حتى Y-m-d", else its own day */
const lastDayOf = (a: AbsenceRecord) => a.duration?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || dateOf(a);

/** Does an accepted holiday / announcement cover today? */
const coversToday = (a: AbsenceRecord, now: number) => {
  const from = daysTo(dateOf(a), now);
  const to = daysTo(lastDayOf(a), now);
  return from !== null && to !== null && from <= 0 && to >= 0;
};

/** Unjustified absences (no justification, or refused) of the last 30 days, by member */
const repeatedAbsences = (records: AbsenceRecord[], now: number) => {
  const byMember = new Map<string, AbsenceRecord[]>();
  records.forEach(a => {
    const st = statusOf(a);
    const d = daysTo(dateOf(a), now);
    if (typeMeta(a.absence_type).value !== 'غياب' || isMemberRequest(a)) return;
    if (st !== 'none' && st !== 'rejected') return;
    if (d === null || d > 0 || d < -ABSENCE_REPEAT_DAYS) return;
    const key = String(a.player_id);
    byMember.set(key, [...(byMember.get(key) || []), a]);
  });
  return [...byMember.values()].filter(list => list.length >= ABSENCE_REPEAT_COUNT);
};

/**
 * The member's alerts about their own records:
 * - logged on them: "justify it", while the 24 hours last (red in the last 3); then "time over" (once);
 * - the administration justified it for them (once);
 * - the decision on a justification or a request (once, for 7 days), with the reason of a refusal;
 * - an accepted holiday / announcement for today or tomorrow (once);
 * - 3 unjustified absences within 30 days (stays while it holds).
 */
export const absenceAlerts = (records: AbsenceRecord[], now = Date.now()): AppAlert[] => {
  const list: AppAlert[] = [];
  records.forEach(a => {
    const type = typeMeta(a.absence_type);
    const status = statusOf(a);
    const request = isMemberRequest(a);
    const when = absenceWhen(a) || 'بدون تاريخ';
    const push = (kind: AbsenceAlertKind, key: string, title: string, heading: string, detail: string, tone: AppAlert['tone'], event: boolean) =>
      list.push({ key, kind, heading, title, detail, tone, target: { type: 'absence', id: a.id, space: 'personal' }, event });

    if ((status === 'accepted' || status === 'rejected') && since(a.decision_date, now) <= ABSENCE_RECENT_MS) {
      const ok = status === 'accepted';
      const why = (a.decision_note || '').trim();
      const key = `abs:dec:${a.id}:${status}:${a.decision_date}`;
      if (request) {
        push(ok ? 'abs_accepted' : 'abs_rejected', key, ok ? 'تم قبول طلبك' : 'تم رفض طلبك', `${recordTitle(a)} · ${when}`,
          ok ? (a.duration || 'تمت الموافقة على طلبك') : (why ? `السبب: ${why}` : 'لم تتم الموافقة على طلبك'), ok ? 'blue' : 'red', true);
      } else {
        push(ok ? 'abs_accepted' : 'abs_rejected', key, ok ? 'تم قبول تبريرك' : 'تم رفض تبريرك', `${type.label} · ${when}`,
          ok ? 'أصبح مبرراً' : (why ? `السبب: ${why}` : 'يبقى غير مبرر'), ok ? 'blue' : 'red', true);
      }
    }

    // Logged on me: justify within 24 hours, then the time is over
    if (status === 'none' && canJustifyNow(a, now)) {
      const left = justifyLeft(a, now) ?? 0;
      push('abs_new', `abs:new:${a.id}:${a.absence_type}:${a.justify_until}`, `سُجل عليك ${type.label}`, when,
        `قدّم تبريرك (وثيقة أو نص) · باقي ${leftText(left)}`, left <= ABSENCE_URGENT_MS ? 'red' : 'amber', false);
    } else if (status === 'none' && !request) {
      const left = justifyLeft(a, now);
      if (left !== null && left <= 0 && -left <= DAY_MS) {
        push('abs_expired', `abs:expired:${a.id}:${a.justify_until}`, 'انتهت مهلة التبرير', `${type.label} · ${when}`,
          `يبقى ${type.label} غير مبرر`, 'red', true);
      }
    }

    // The administration sent a justification for me
    if (status === 'pending' && !request && a.justified_by === 'administration') {
      push('abs_admin_justified', `abs:admin:${a.id}:${a.reason?.length ?? 0}:${a.attachment_url ?? ''}`, 'قدّمت الإدارة تبريراً عنك',
        `${type.label} · ${when}`, 'بانتظار القرار', 'blue', true);
    }

    // My accepted holiday / announcement is today or tomorrow
    if (status === 'accepted' && request) {
      const d = daysTo(dateOf(a), now);
      if (d !== null && (d === 0 || d === 1)) {
        push('abs_leave_soon', `abs:soon:${a.id}:${dateOf(a)}`,
          type.value === 'طلب عطلة' ? `تبدأ عطلتك ${inDayWords(d)}` : `${recordTitle(a)} ${inDayWords(d)}`,
          `${recordTitle(a)} · ${when}`, a.duration || 'تمت الموافقة عليه', 'violet', true);
      }
    }
  });

  // Repeated unjustified absences
  repeatedAbsences(records, now).forEach(items => {
    list.push({
      key: `abs:repeat:${items.length}:${items.map(x => x.id).join('-')}`,
      kind: 'abs_repeated',
      heading: `${items.length} غيابات غير مبررة`,
      title: `لديك ${items.length} غيابات غير مبررة خلال ${ABSENCE_REPEAT_DAYS} يوماً`,
      detail: 'قد يؤدي تكرار الغياب إلى إجراء تأديبي',
      tone: 'amber',
      target: { type: 'absence', id: items[0].id, space: 'personal' },
    });
  });
  return list;
};

/**
 * The managers' alerts:
 * - who decides (canDecide): every justification / request awaiting a decision, red when the request is for today or tomorrow;
 * - who sees the absences: the members absent today by an accepted announcement / holiday,
 *   and the members with 3 unjustified absences within 30 days.
 */
export const managerAbsenceAlerts = (records: AbsenceRecord[], now = Date.now(), canDecide = true): AppAlert[] => {
  const list: AppAlert[] = [];

  if (canDecide) {
    records
      .filter(a => statusOf(a) === 'pending')
      .sort((x, y) => dateOf(x).localeCompare(dateOf(y)))
      .forEach(a => {
        const request = isMemberRequest(a);
        const reason = (a.reason || '').trim();
        const d = daysTo(dateOf(a), now);
        const soon = request && d !== null && d <= 1;
        list.push({
          key: `abs:pending:${a.id}:${a.reason?.length ?? 0}:${soon ? 'soon' : ''}`,
          kind: 'abs_pending',
          heading: a.player_name || 'عضو',
          title: request ? `${recordTitle(a)} بانتظار القرار` : 'تبرير بانتظار القرار',
          detail: [soon && d !== null ? `يبدأ ${inDayWords(d)}` : '', `${typeMeta(a.absence_type).label} · ${absenceWhen(a)}`, reason.length > 40 ? `${reason.slice(0, 40)}…` : reason]
            .filter(Boolean).join(' · '),
          tone: soon ? 'red' : 'amber',
          target: { type: 'absence', id: a.id, space: 'management', tab: 'requests' },
        });
      });
  }

  // Absent today, announced and accepted
  const today = new Date(now).toISOString().slice(0, 10);
  records
    .filter(a => statusOf(a) === 'accepted' && isMemberRequest(a) && coversToday(a, now))
    .forEach(a => {
      const leave = typeMeta(a.absence_type).value === 'طلب عطلة';
      list.push({
        key: `abs:today:${a.id}:${today}`,
        kind: 'abs_today',
        heading: a.player_name || 'عضو',
        title: leave ? 'في عطلة اليوم' : `${typeMeta(a.absence_type).value === 'تأخر' ? 'تأخر' : 'غياب'} معلن اليوم`,
        detail: [a.event_category, a.duration].filter(Boolean).join(' · ') || 'بإعلام مسبق مقبول',
        tone: 'blue',
        target: { type: 'absence', id: a.id, space: 'management', tab: 'registry' },
      });
    });

  // Repeated unjustified absences
  repeatedAbsences(records, now).forEach(items => {
    list.push({
      key: `abs:mrepeat:${items[0].player_id}:${items.length}:${items.map(x => x.id).join('-')}`,
      kind: 'abs_repeated_member',
      heading: items[0].player_name || 'عضو',
      title: 'تكرر الغياب بدون تبرير',
      detail: `${items.length} غيابات غير مبررة خلال ${ABSENCE_REPEAT_DAYS} يوماً`,
      tone: 'red',
      target: { type: 'absence', id: items[0].id, space: 'management', tab: 'registry' },
    });
  });
  return list;
};

/** A meeting is "near" this long before it starts, "live" this long after; a sent point / a new charge is told for this long */
export const MEET_SOON_MS = 24 * 3600 * 1000;
export const MEET_LIVE_MS = 2 * 3600 * 1000;
export const MEET_NEWS_MS = 48 * 3600 * 1000;
/** The last hours to send a point */
export const MEET_LAST_CALL_MS = 3 * 3600 * 1000;
/** A decision in my charge is "near" its deadline this many days before */
export const DEC_SOON_DAYS = 2;

const meetStart = (m: { date?: string; time?: string }) => {
  const [y, mo, d] = (m.date || '').slice(0, 10).split('-').map(Number);
  const [h, mi] = (m.time || '00:00').split(':').map(Number);
  const date = new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
  return isNaN(date.getTime()) ? null : date;
};

const decisionDone = (progress?: number | null) => (progress || 0) >= 100;
const clip = (text: string, n = 60) => (text.length > n ? `${text.slice(0, n)}…` : text);

/**
 * The member's meeting alerts (the meetings they are invited to):
 * - invited (once per date and time), near (24 hours before; "last chance to send a point" in the last 3), live;
 * - a point sent by someone else for an upcoming meeting (once, for 48 hours);
 * - a decision in their charge: new (once), deadline near (2 days), late — until it is done.
 */
export const meetingAlerts = (meetings: MyMeeting[], now = Date.now()): AppAlert[] => {
  const list: AppAlert[] = [];
  const at = new Date(now);
  meetings.forEach(m => {
    const start = meetStart(m)?.getTime() ?? null;
    const target = { type: 'meeting' as const, id: m.id, space: 'personal' as const };
    const push = (kind: MeetingAlertKind, key: string, title: string, heading: string, detail: string, tone: AppAlert['tone'], event = false) =>
      list.push({ key, kind, heading, title, detail, tone, target, event });
    const when = start ? `${matchDay(new Date(start))} ${timeText(new Date(start))}` : '';

    if (start !== null && start > now) {
      push('meet_invited', `meet:inv:${m.id}`, 'تمت دعوتك لاجتماع',m.topic, [when, m.location].filter(Boolean).join(' · '), 'violet', true);
      if (start - now <= MEET_SOON_MS) {
        const lastCall = m.can_propose && start - now <= MEET_LAST_CALL_MS;
        push('meet_soon', `meet:soon:${m.id}:${m.date}:${m.time}`, 'اقترب موعد الاجتماع', m.topic,
          [`يبدأ ${countdown(new Date(start), at)}`, lastCall ? 'آخر فرصة لإرسال نقاطك' : m.location].filter(Boolean).join(' · '), lastCall ? 'red' : 'amber');
      }
      m.points.forEach(p => {
        if (p.author && !p.mine && p.id && since(p.created_at, now) <= MEET_NEWS_MS) {
          push('meet_point', `meet:pt:${p.id}`, `أرسل ${p.author} نقطة للنقاش`, m.topic, clip(p.text), 'blue', true);
        }
      });
    } else if (start !== null && now - start <= MEET_LIVE_MS) {
      push('meet_live', `meet:live:${m.id}:${m.date}:${m.time}`, 'الاجتماع جارٍ الآن', m.topic, m.location || '', 'blue');
    }

    m.decisions.filter(d => d.mine && !decisionDone(d.progress)).forEach(d => {
      const title = d.text?.trim() || d.category || 'قرار';
      const days = d.deadline ? daysTo(d.deadline, now) : null;
      push('dec_assigned', `dec:as:${d.id}`, 'كُلفت بقرار', clip(title), `من اجتماع: ${m.topic}`, 'violet', true);
      if (days !== null && days < 0) {
        push('dec_late', `dec:late:${d.id}:${d.deadline}`, 'قرار مكلف به متأخر', clip(title), `انتهى الأجل منذ ${-days === 1 ? 'يوم' : `${-days} أيام`} · ${d.progress || 0}%`, 'red');
      } else if (days !== null && days <= DEC_SOON_DAYS) {
        push('dec_due', `dec:due:${d.id}:${d.deadline}`, 'اقترب أجل قرار مكلف به', clip(title), `آخر أجل ${inDayWords(days)} · ${d.progress || 0}%`, 'amber');
      }
    });
  });
  return list;
};

/** A decision as /decisions returns it (the fields the alerts need) */
export interface ManagedDecision {
  id: number | string;
  meeting_id?: number | string | null;
  text?: string;
  decision_text?: string;
  category?: string | null;
  deadline?: string | null;
  progress?: number | null;
}

const RECORDED_STATUSES = ['حاضر', 'متأخر', 'غائب مبرر', 'غائب غير مبرر'];

/**
 * The managers' meeting alerts, each for who may act:
 * - a point sent by a member for an upcoming meeting (once, for 48 hours) — meetings;
 * - a meeting within 24 hours — meetings;
 * - a meeting held (for 7 days) without its attendance — meetings.attendance (opens the sheet);
 * - a meeting held (for 3 days) without any decision — decisions.add;
 * - a decision past its deadline and not done — decisions.
 */
export const managerMeetingAlerts = (
  meetings: Meeting[],
  decisions: ManagedDecision[],
  now = Date.now(),
  can: { meetings?: boolean; attendance?: boolean; addDecisions?: boolean; decisions?: boolean } = {},
  myUserId?: string | number | null,
  /** The meetings I am invited to: their points and nearness come as my own alerts already */
  invitedIds: string[] = [],
): AppAlert[] => {
  const list: AppAlert[] = [];
  const at = new Date(now);
  const invited = new Set(invitedIds.map(String));
  const byMeeting= new Map<string, ManagedDecision[]>();
  decisions.forEach(d => {
    const key = String(d.meeting_id ?? '');
    byMeeting.set(key, [...(byMeeting.get(key) || []), d]);
  });

  meetings.forEach(m => {
    const start = meetStart(m)?.getTime() ?? null;
    if (start === null) return;
    const push = (kind: MeetingAlertKind, key: string, title: string, detail: string, tone: AppAlert['tone'], extra: { event?: boolean; attendance?: boolean; decisions?: boolean } = {}) =>
      list.push({
        key, kind, heading: m.topic, title, detail, tone, event: extra.event,
        target: { type: 'meeting', id: String(m.id), space: 'management', ...(extra.attendance ? { attendance: true } : {}), ...(extra.decisions ? { decisions: true } : {}) },
      });

    if (start > now) {
      if (can.meetings && !invited.has(String(m.id))) {
        (m.points || []).forEach(p => {
          if (typeof p === 'string' || !p?.id || String(p.user_id) === String(myUserId)) return;
          if (since(p.created_at, now) <= MEET_NEWS_MS) push('mgr_meet_point', `mmeet:pt:${p.id}`, `نقطة جديدة من ${p.author}`, clip(p.text), 'blue', { event: true });
        });
        if (start - now <= MEET_SOON_MS) {
          push('mgr_meet_soon', `mmeet:soon:${m.id}:${m.date}:${m.time}`, 'اجتماع قريب',
            [`يبدأ ${countdown(new Date(start), at)}`, `${(m.attendees || []).length} مدعو`, `${(m.points || []).length} نقاط`].join(' · '), 'amber');
        }
      }
      return;
    }

    const held = now - start;
    if (held > 7 * DAY_MS) return;
    const attendees = m.attendees || [];
    if (can.attendance && attendees.length > 0 && !attendees.some(a => RECORDED_STATUSES.includes(a.status))) {
      push('mgr_meet_attendance', `mmeet:att:${m.id}:${m.date}`, 'لم يُسجل حضور الاجتماع', `عُقد ${matchDay(new Date(start))} · ${attendees.length} مدعو`, 'red', { attendance: true });
    }
    if (can.addDecisions && held > MEET_LIVE_MS && held <= 3 * DAY_MS && !(byMeeting.get(String(m.id)) || []).length) {
      push('mgr_meet_no_decisions', `mmeet:nodec:${m.id}:${m.date}`, 'لم تُسجل قرارات الاجتماع بعد', `عُقد ${matchDay(new Date(start))}`, 'amber', { decisions: true });
    }
  });

  if (can.decisions) {
    const topics = new Map(meetings.map(m => [String(m.id), m.topic]));
    decisions.forEach(d => {
      if (!d.deadline || decisionDone(d.progress)) return;
      const days = daysTo(d.deadline, now);
      if (days === null || days >= 0) return;
      const title = (d.text || d.decision_text || '').trim() || d.category || 'قرار';
      list.push({
        key: `mdec:late:${d.id}:${d.deadline}`,
        kind: 'mgr_dec_late',
        heading: clip(title),
        title: 'قرار متأخر عن أجله',
        detail: [`متأخر ${-days === 1 ? 'يوماً' : `${-days} أيام`}`, `${d.progress || 0}%`, topics.get(String(d.meeting_id)) ? `اجتماع: ${topics.get(String(d.meeting_id))}` : ''].filter(Boolean).join(' · '),
        tone: 'red',
        target: { type: 'meeting', id: String(d.meeting_id ?? ''), space: 'management', decisions: true },
      });
    });
  }
  return list;
};

/** What happened to one of my meetings, as /meetings/mine/notices returns it (the latest per meeting) */
export interface MeetingNotice {
  id: number;
  meeting_id: string;
  kind: 'updated' | 'deleted' | 'uninvited';
  topic: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  previous?: { topic?: string; date?: string | null; time?: string | null; location?: string } | null;
}

/**
 * The member's alerts about what the managers did to their meetings (each seen once opened):
 * the date / time / place / topic changed (what changed, and what it was), the meeting deleted, taken off the list.
 */
export const meetingNoticeAlerts = (notices: MeetingNotice[]): AppAlert[] => notices.map(n => {
  const start = meetStart({ date: n.date || '', time: n.time || '' });
  const when = start ? `${matchDay(start)} ${timeText(start)}` : '';
  const make = (kind: MeetingAlertKind, title: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
    key: `mnot:${n.id}`,
    kind,
    heading: n.topic || 'اجتماع',
    title,
    detail,
    tone,
    target: { type: 'meeting', id: n.kind === 'updated' ? n.meeting_id : '', space: 'personal' },
    event: true,
  });

  if (n.kind === 'deleted') return make('meet_cancelled', 'تم إلغاء الاجتماع', when ? `كان مبرمجاً ${when}` : '', 'red');
  if (n.kind === 'uninvited') return make('meet_uninvited', 'لم تعد مدعواً لهذا الاجتماع', when, 'amber');

  const p = n.previous || {};
  const changes: string[] = [];
  const before = meetStart({ date: p.date || '', time: p.time || '' });
  if ((p.date && p.date !== n.date) || (p.time && p.time !== n.time)) {
    changes.push(`الموعد الجديد ${when}${before ? ` بدل ${matchDay(before)} ${timeText(before)}` : ''}`);
  }
  if (p.location && p.location !== n.location) changes.push(`المكان: ${n.location}`);
  if (p.topic && p.topic !== n.topic) changes.push(`الموضوع الجديد بدل «${p.topic}»`);
  const timeChanged = Boolean((p.date && p.date !== n.date) || (p.time && p.time !== n.time));
  return make('meet_changed', timeChanged ? 'تم تغيير موعد الاجتماع' : 'تم تعديل الاجتماع', changes.join(' · ') || when, 'amber');
});

/** A trip's departure is "near" this long before; the last hours are red; the managers check a trip this many days before */
export const TRV_SOON_MS = 24 * 3600 * 1000;
export const TRV_URGENT_MS = 3 * 3600 * 1000;
export const TRV_CHECK_DAYS = 3;

/** "Y-m-d H:i" (local) → Date */
const tripTime = (value?: string | null) => {
  if (!value) return null;
  const [d, t] = value.split(' ');
  return meetStart({ date: d, time: t || '00:00' });
};

const TRIP_ROLE: Record<string, string> = { head: 'رئيس الوفد', staff: 'ضمن الطاقم', player: 'لاعب في الوفد' };
const tripWhen = (d: Date | null) => (d ? `${matchDay(d)} ${timeText(d)}` : '');

/**
 * The member's trip alerts (the trips they are on):
 * added (once per trip, with their role), departure near (24 hours before, red in the last 3), on the way (until the return).
 */
export const travelAlerts = (travels: Travel[], now = Date.now()): AppAlert[] => {
  const list: AppAlert[] = [];
  const at = new Date(now);
  travels.forEach(t => {
    const dep = tripTime(t.departure_time);
    const ret = tripTime(t.return_time);
    if (!dep) return;
    const target = { type: 'travel' as const, id: t.id, space: 'personal' as const };
    const depMs = dep.getTime();
    const endMs = ret?.getTime() ?? depMs + DAY_MS;
    const role = t.my_role ? TRIP_ROLE[t.my_role] : '';

    if (depMs > now) {
      list.push({ key: `trv:add:${t.id}`, kind: 'trv_added', heading: t.destination, title: 'تمت إضافتك لتنقل',
        detail: [role, tripWhen(dep), t.match?.title || t.travel_reason].filter(Boolean).join(' · '), tone: 'violet', target, event: true });
      if (depMs - now <= TRV_SOON_MS) {
        list.push({ key: `trv:soon:${t.id}:${t.departure_time}`, kind: 'trv_soon', heading: t.destination, title: 'اقترب موعد الانطلاق',
          detail: [`الانطلاق ${countdown(dep, at)}`, t.departure_location ? `من ${t.departure_location}` : '', t.transport_method].filter(Boolean).join(' · '),
          tone: depMs - now <= TRV_URGENT_MS ? 'red' : 'amber', target });
      }
    } else if (now <= endMs) {
      list.push({ key: `trv:live:${t.id}:${t.departure_time}`, kind: 'trv_live', heading: t.destination, title: 'التنقل جارٍ',
        detail: ret ? `العودة ${tripWhen(ret)}` : 'العودة غير محددة', tone: 'blue', target });
    }
  });
  return list;
};

/** What happened to one of my trips, as /travels/mine/notices returns it (the latest per trip) */
export interface TravelNotice {
  id: number;
  travel_id: number;
  kind: 'updated' | 'deleted' | 'removed';
  destination: string;
  departure_time?: string | null;
  return_time?: string | null;
  departure_location?: string | null;
  transport_method?: string | null;
  previous?: Partial<Record<'destination' | 'departure_time' | 'return_time' | 'departure_location' | 'transport_method', string | null>> | null;
}

/** The member's alerts about what the managers did to their trips (each seen once opened) */
export const travelNoticeAlerts = (notices: TravelNotice[]): AppAlert[] => notices.map(n => {
  const make = (kind: TravelAlertKind, title: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
    key: `tnot:${n.id}`, kind, heading: n.destination || 'تنقل', title, detail, tone, event: true,
    target: { type: 'travel', id: n.kind === 'updated' ? n.travel_id : 0, space: 'personal' },
  });
  const dep = tripTime(n.departure_time);
  if (n.kind === 'deleted') return make('trv_cancelled', 'تم إلغاء التنقل', dep ? `كان الانطلاق ${tripWhen(dep)}` : '', 'red');
  if (n.kind === 'removed') return make('trv_removed', 'لم تعد ضمن هذا التنقل', tripWhen(dep), 'amber');

  const p = n.previous || {};
  const changes: string[] = [];
  if ('departure_time' in p) changes.push(`الانطلاق الجديد ${tripWhen(dep)}${p.departure_time ? ` بدل ${tripWhen(tripTime(p.departure_time))}` : ''}`);
  if ('return_time' in p) changes.push(`العودة ${n.return_time ? tripWhen(tripTime(n.return_time)) : 'غير محددة'}`);
  if ('destination' in p) changes.push(`الوجهة الجديدة بدل ${p.destination || '—'}`);
  if ('departure_location' in p) changes.push(`مكان الانطلاق: ${n.departure_location || '—'}`);
  if ('transport_method' in p) changes.push(`وسيلة النقل: ${n.transport_method || '—'}`);
  const timeChanged = 'departure_time' in p || 'return_time' in p;
  return make('trv_changed', timeChanged ? 'تم تغيير موعد التنقل' : 'تم تعديل التنقل', changes.join(' · '), 'amber');
});

/**
 * The managers' trip alerts (who manages the trips): a departure within 24 hours, and in the 3 days before it,
 * a trip without a head of the delegation or with no one chosen. myTravelIds: the trips I am on myself (no double alert).
 */
export const managerTravelAlerts = (travels: Travel[], now = Date.now(), myTravelIds: number[] = []): AppAlert[] => {
  const list: AppAlert[] = [];
  const at = new Date(now);
  const mine = new Set(myTravelIds);
  travels.forEach(t => {
    const dep = tripTime(t.departure_time);
    if (!dep || dep.getTime() <= now) return;
    const left = dep.getTime() - now;
    const target = { type: 'travel' as const, id: t.id, space: 'management' as const };
    const players = t.players?.length || t.players_count || 0;
    const staff = t.staff?.length || 0;
    if (left <= TRV_SOON_MS && !mine.has(t.id)) {
      list.push({ key: `mtrv:soon:${t.id}:${t.departure_time}`, kind: 'mgr_trv_soon', heading: t.destination, title: 'تنقل قريب',
        detail: [`الانطلاق ${countdown(dep, at)}`, `${players} لاعب`, `${staff} طاقم`].join(' · '), tone: 'amber', target });
    }
    if (left <= TRV_CHECK_DAYS * DAY_MS) {
      if (!t.head_of_delegation_id) {
        list.push({ key: `mtrv:nohead:${t.id}`, kind: 'mgr_trv_no_head', heading: t.destination, title: 'تنقل بدون رئيس وفد',
          detail: `الانطلاق ${tripWhen(dep)}`, tone: 'amber', target });
      }
      if (players + staff === 0) {
        list.push({ key: `mtrv:empty:${t.id}`, kind: 'mgr_trv_empty', heading: t.destination, title: 'لم يُحدد أعضاء الوفد بعد',
          detail: `الانطلاق ${tripWhen(dep)}`, tone: 'red', target });
      }
    }
  });
  return list;
};

/** A medical file's opening is told for this long */
export const MED_NEWS_MS = 7 * DAY_MS;
/** The first diagnosis is awaited at most this many days after the injury */
export const MED_INITIAL_DAYS = 2;

const RECOVERED = 'مغلق/متعافي';

/** What each status means for the member when it is reached */
const STAGE_NEWS: Record<string, { title: string; field: keyof PlayerMedicalRecord }> = {
  'بانتظار الفحص النهائي': { title: 'تم التشخيص الأولي لإصابتك', field: 'initial_recommendation' },
  'قيد التأهيل': { title: 'بدأت مرحلة التأهيل', field: 'restrictions' },
  'بانتظار قرار العودة': { title: 'صدر القرار الطبي في إصابتك', field: 'medical_decision' },
};

/** The player's name in a management record (the API puts the player object in player_id) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- records come untyped from the API
const playerOf = (r: any) => {
  const p = r.player || (typeof r.player_id === 'object' ? r.player_id : null) || r.playerId;
  return p ? (p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()) : 'لاعب';
};

/**
 * The member's medical alerts (their own files):
 * - a file opened for their injury — once, told for 7 days (the stages and changes come with medicalNoticeAlerts);
 * - their next exam today / tomorrow, or missed; the end of their absence period in the next 2 days.
 */
export const medicalAlerts = (records: PlayerMedicalRecord[], now = Date.now()): AppAlert[] => {
  const list: AppAlert[] = [];
  records.forEach(r => {
    const target = { type: 'medical' as const, id: r.id, space: 'personal' as const };
    const heading = r.injury_nature || 'إصابة';
    const recovered = r.record_status === RECOVERED;
    const push = (kind: MedicalAlertKind, key: string, title: string, detail: string, tone: AppAlert['tone'], event = false) =>
      list.push({ key, kind, heading, title, detail, tone, target, event });

    if (since(r.created_at, now) <= MED_NEWS_MS) {
      push('med_new', `med:new:${r.id}`, 'تم فتح ملف طبي لإصابتك',
        [r.injury_date ? `بتاريخ ${matchDay(parseDate(r.injury_date.slice(0, 10)) || new Date())}` : '', r.doctor?.name ? `الطبيب: ${r.doctor.name}` : ''].filter(Boolean).join(' · '), 'violet', true);
    }
    if (recovered) return;

    const exam = r.next_exam_date ? daysTo(r.next_exam_date, now) : null;
    const examDone = r.last_exam_date && r.next_exam_date && r.last_exam_date.slice(0, 10) >= r.next_exam_date.slice(0, 10);
    if (exam !== null && !examDone && (exam === 0 || exam === 1)) {
      push('med_exam', `med:exam:${r.id}:${r.next_exam_date}`, `موعد فحصك الطبي ${inDayWords(exam)}`, r.doctor?.name ? `مع ${r.doctor.name}` : 'راجع الطبيب', 'amber');
    } else if (exam !== null && !examDone && exam < 0) {
      push('med_exam_missed', `med:missed:${r.id}:${r.next_exam_date}`, 'فات موعد فحصك الطبي', 'تواصل مع الطاقم الطبي لتحديد موعد جديد', 'red');
    }
    const back = r.absence_to ? daysTo(r.absence_to, now) : null;
    if (back !== null && back >= 0 && back <= 2) {
      push('med_return_soon', `med:back:${r.id}:${r.absence_to}`, `تنتهي فترة غيابك ${inDayWords(back)}`, 'بانتظار قرار العودة من الطبيب', 'blue');
    }
  });
  return list;
};

/**
 * The managers' medical alerts (who manages the medical files), until it is done:
 * an exam today / tomorrow, an exam missed, an injury waiting for its first diagnosis (2 days after),
 * an absence period over without a return decision.
 */
export const managerMedicalAlerts = (records: PlayerMedicalRecord[], now = Date.now()): AppAlert[] => {
  const list: AppAlert[] = [];
  records.forEach(r => {
    if (r.record_status === RECOVERED) return;
    const target = { type: 'medical' as const, id: r.id, space: 'management' as const };
    const name = playerOf(r);
    const nature = r.injury_nature || 'إصابة';
    const push = (kind: MedicalAlertKind, key: string, title: string, detail: string, tone: AppAlert['tone']) =>
      list.push({ key, kind, heading: name, title, detail, tone, target });

    const exam = r.next_exam_date ? daysTo(r.next_exam_date, now) : null;
    const examDone = r.last_exam_date && r.next_exam_date && r.last_exam_date.slice(0, 10) >= r.next_exam_date.slice(0, 10);
    if (exam !== null && !examDone && (exam === 0 || exam === 1)) push('mgr_med_exam', `mmed:exam:${r.id}:${r.next_exam_date}`, `فحص طبي ${inDayWords(exam)}`, nature, 'amber');
    else if (exam !== null && !examDone && exam < 0) push('mgr_med_exam_late', `mmed:late:${r.id}:${r.next_exam_date}`, 'فات موعد فحص طبي', `${nature} · منذ ${-exam === 1 ? 'يوم' : `${-exam} أيام`}`, 'red');

    const injured = r.injury_date ? daysTo(r.injury_date, now) : null;
    if (r.record_status === 'مفتوح/مصاب' && injured !== null && -injured >= MED_INITIAL_DAYS) {
      push('mgr_med_initial', `mmed:init:${r.id}`, 'إصابة بانتظار التشخيص الأولي', `${nature} · منذ ${-injured} أيام`, 'amber');
    }
    const back = r.absence_to ? daysTo(r.absence_to, now) : null;
    if (back !== null && back < 0) push('mgr_med_return', `mmed:back:${r.id}:${r.absence_to}`, 'انتهت مدة الغياب دون قرار العودة', nature, 'amber');
  });
  return list;
};

/** What happened to one of my medical files (a new stage, a date / the doctor / a detail changed, deleted) */
export interface MedicalNotice {
  id: number;
  record_id: number;
  kind: 'stage' | 'updated' | 'deleted';
  injury_nature: string | null;
  changes: { field: string; label: string; from: string | null; to: string | null }[];
  created_at?: string;
}

const MED_DATES = ['injury_date', 'next_exam_date', 'last_exam_date', 'absence_from', 'absence_to'];

/** A changed value as the member reads it (dates as days) */
const medValue = (field: string, value: string | null) => {
  if (!value) return 'بدون';
  if (!MED_DATES.includes(field)) return value;
  const d = parseDate(value.slice(0, 10));
  return d ? matchDay(d) : value;
};

/** The title of a change: what changed, when it is one thing */
const MED_CHANGE_TITLE: Record<string, string> = {
  next_exam_date: 'تم تغيير موعد فحصك الطبي',
  absence_to: 'تم تغيير نهاية فترة غيابك',
  absence_from: 'تم تغيير بداية فترة غيابك',
  doctor_id: 'تم تغيير طبيبك المشرف',
  restrictions: 'تم تعديل القيود الطبية',
  medical_decision: 'تم تعديل القرار الطبي',
  injury_date: 'تم تعديل تاريخ إصابتك',
};

/**
 * The member's medical notices (each once, opened = dismissed):
 * a stage reached (first diagnosis, rehabilitation, decision, the return approved),
 * a date / the doctor / a detail changed (before → after), the file deleted.
 * records: my files now (for the stage's details).
 */
export const medicalNoticeAlerts = (notices: MedicalNotice[], records: PlayerMedicalRecord[] = []): AppAlert[] => notices.map(n => {
  const make = (kind: MedicalAlertKind, title: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
    key: `mnot:${n.id}`, kind, heading: n.injury_nature || 'ملفي الطبي', title, detail, tone, event: true,
    target: { type: 'medical', id: n.kind === 'deleted' ? 0 : n.record_id, space: 'personal' },
  });
  if (n.kind === 'deleted') return make('med_deleted', 'تم حذف ملفك الطبي', 'من طرف الطاقم الطبي', 'red');

  if (n.kind === 'stage') {
    const status = n.changes[0]?.to || '';
    const record = records.find(r => r.id === n.record_id);
    if (status === RECOVERED) return make('med_recovered', 'تمت الموافقة على عودتك للتدريبات', record?.medical_decision || 'تعافيت من الإصابة', 'blue');
    const news = STAGE_NEWS[status];
    return make('med_stage', news?.title || 'تم تحديث حالتك الطبية', String((news && record?.[news.field]) || status), 'violet');
  }

  const changes = n.changes || [];
  const one = changes.length === 1 ? changes[0] : null;
  const detail = changes.map(c => MED_DATES.includes(c.field) || c.field === 'doctor_id'
    ? `${c.label}: ${medValue(c.field, c.from)} ← ${medValue(c.field, c.to)}`
    : `${c.label}: ${c.to || 'أُزيل'}`).join(' · ');
  const examMoved = changes.some(c => c.field === 'next_exam_date');
  return make(examMoved ? 'med_exam_moved' : 'med_changed', (one && MED_CHANGE_TITLE[one.field]) || 'تم تعديل ملفك الطبي', detail, examMoved ? 'amber' : 'violet');
});

/** The repayment date is told this many days before */
export const DEBT_SOON_DAYS = 3;

/**
 * The repayment alerts of the debts not fully paid (loans: who manages the debts; purchases on credit:
 * who manages the payments & expenses), until they are paid:
 * the date in the next 3 days (amber), today (red), passed (red, how long ago).
 * A new date (the debt edited) is a new alert.
 */
export const debtAlerts = (debts: Debt[], now = Date.now()): AppAlert[] => debts
  .filter(d => d.status !== 'paid' && d.remaining > 0 && d.due_date)
  .map((d): { alert: AppAlert; days: number } | null => {
    const days = daysTo(d.due_date, now);
    if (days === null || days > DEBT_SOON_DAYS) return null;
    const what = d.kind === 'purchase' ? 'مصروف بالدين' : 'دين';
    const left = `الباقي ${moneyText(d.remaining)}`;
    const make = (kind: DebtAlertKind, title: string, detail: string, tone: AppAlert['tone']) => ({
      alert: {
        key: `debt:${d.kind}:${d.id}:${kind}:${d.due_date}`, kind, heading: d.title ? `${d.creditor} · ${d.title}` : d.creditor,
        title, detail, tone, target: { type: 'debt' as const, id: d.id, kind: d.kind },
      },
      days,
    });
    if (days > 0) return make('debt_soon', `اقترب موعد تسديد ${what}`, `${days === 1 ? 'غداً' : days === 2 ? 'بعد يومين' : `بعد ${days} أيام`} · ${left}`, 'amber');
    if (days === 0) return make('debt_due', `حان موعد تسديد ${what}`, `اليوم · ${left}`, 'red');
    return make('debt_late', `فات موعد تسديد ${what}`, `منذ ${-days === 1 ? 'يوم' : -days === 2 ? 'يومين' : `${-days} أيام`} · ${left}`, 'red');
  })
  .filter((x): x is { alert: AppAlert; days: number } => x !== null)
  .sort((a, b) => a.days - b.days)
  .map(x => x.alert);
