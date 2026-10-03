import { dueText, parseDate, type Task } from '../../Screen/Tasks/taskUtils';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import { computedStatus, countdownText, dayLabel, endOf, myAttendance, startOf } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import type { Match } from '../../Screen/Matches/match_model';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { dateOf, statusOf, typeMeta } from '../../Screen/Absence/absenceUtils';
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
export type AbsenceAlertKind = 'abs_new' | 'abs_accepted' | 'abs_rejected' | 'abs_pending';
export type AlertKind = TaskAlertKind | DisciplinaryAlertKind | TrainingAlertKind | MatchAlertKind | AbsenceAlertKind;

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
    | { type: 'absence'; id: number; space: 'personal' | 'management' };
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

/**
 * The member's alerts about their own records (each an event, seen once opened, for 7 days):
 * an absence / lateness / leave logged on them by the administration (justify it), and the decision
 * on their justification or holiday request (accepted, or refused: justify again).
 */
export const absenceAlerts = (records: AbsenceRecord[], now = Date.now()): AppAlert[] => records
  .map((a): AppAlert | null => {
    const type = typeMeta(a.absence_type);
    const status = statusOf(a);
    const leave = type.value === 'طلب عطلة';
    const when = absenceWhen(a) || 'بدون تاريخ';
    const make = (kind: AbsenceAlertKind, key: string, title: string, heading: string, detail: string, tone: AppAlert['tone']): AppAlert => ({
      key, kind, heading, title, detail, tone, target: { type: 'absence', id: a.id, space: 'personal' }, event: true,
    });

    if ((status === 'accepted' || status === 'rejected') && since(a.decision_date, now) <= ABSENCE_RECENT_MS) {
      const ok = status === 'accepted';
      if (leave) {
        return make(ok ? 'abs_accepted' : 'abs_rejected', `abs:dec:${a.id}:${status}:${a.decision_date}`,
          ok ? 'تم قبول طلب العطلة' : 'تم رفض طلب العطلة', `عطلة · ${when}`, a.duration || (ok ? 'تمت الموافقة على طلبك' : 'لم تتم الموافقة على طلبك'), ok ? 'blue' : 'red');
      }
      return make(ok ? 'abs_accepted' : 'abs_rejected', `abs:dec:${a.id}:${status}:${a.decision_date}`,
        ok ? 'تم قبول تبريرك' : 'تم رفض تبريرك', `${type.label} · ${when}`,
        ok ? 'أصبح مبرراً' : 'يمكنك إعادة تقديم تبرير', ok ? 'blue' : 'red');
    }
    if (!leave && a.record_source !== 'طلب العضو' && status !== 'accepted' && since(a.created_at, now) <= ABSENCE_RECENT_MS) {
      return make('abs_new', `abs:new:${a.id}`, `سُجل عليك ${type.label}`, when,
        status === 'none' ? 'قدّم تبريرك من صفحة غياباتي' : 'تبريرك قيد الدراسة', 'amber');
    }
    return null;
  })
  .filter((x): x is AppAlert => x !== null);

/** The managers' alerts (who decide the justifications): every justification or holiday request awaiting a decision */
export const managerAbsenceAlerts = (records: AbsenceRecord[]): AppAlert[] => records
  .filter(a => statusOf(a) === 'pending')
  .sort((x, y) => dateOf(x).localeCompare(dateOf(y)))
  .map(a => {
    const leave = typeMeta(a.absence_type).value === 'طلب عطلة';
    const reason = (a.reason || '').trim();
    return {
      key: `abs:pending:${a.id}:${a.reason?.length ?? 0}`,
      kind: 'abs_pending' as const,
      heading: a.player_name || 'عضو',
      title: leave ? 'طلب عطلة بانتظار القرار' : 'تبرير بانتظار القرار',
      detail: [`${typeMeta(a.absence_type).label} · ${absenceWhen(a)}`, reason.length > 40 ? `${reason.slice(0, 40)}…` : reason].filter(Boolean).join(' · '),
      tone: 'amber' as const,
      target: { type: 'absence' as const, id: a.id, space: 'management' as const },
    };
  });
