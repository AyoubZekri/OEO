import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Undo2, Hourglass, PlayCircle, ChevronLeft, ChevronDown, Bell, X, Scale, MessageSquare, Gavel, CalendarClock, FileSignature, Dumbbell, Radio, CalendarCheck, CalendarPlus, CalendarCog, CalendarX, Trophy, Megaphone, Flag, PauseCircle, UserPlus, LayoutGrid, ClipboardCheck, Star, FileText, CalendarX2, BadgeCheck, XCircle, Inbox } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import client from '../../../core/api/client';
import { DATA_CHANGED } from '../../../core/api/dataChanged';
import { useSpace } from '../../../core/context/space';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { Approutes } from '../../../core/constant/routes';
import { taskApi } from '../../Screen/Tasks/taskApi';
import type { Task } from '../../Screen/Tasks/taskUtils';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import type { Match } from '../../Screen/Matches/match_model';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import {
  absenceAlerts, alertsFor, disciplinaryAlerts, managerAbsenceAlerts, managerDisciplinaryAlerts, matchAlerts, matchNoticeAlerts, trainingAlerts, trainingNoticeAlerts,
  type AlertKind, type AppAlert, type MatchNotice, type MyDisciplinaryAction, type TrainingNotice,
} from './alertRules';
import './TaskAlerts.css';

const ICONS: Record<AlertKind, typeof Bell> = {
  overdue: AlarmClock,
  returned: Undo2,
  due_soon: Hourglass,
  start: PlayCircle,
  disciplinary: Scale,
  disc_reply_due: Hourglass,
  disc_reply_late: AlarmClock,
  disc_hearing: CalendarClock,
  disc_decision: Gavel,
  mgr_replied: MessageSquare,
  mgr_reply_late: AlarmClock,
  mgr_hearing: CalendarClock,
  mgr_document: FileSignature,
  train_soon: Dumbbell,
  train_live: Radio,
  train_ended: CalendarCheck,
  train_new: CalendarPlus,
  train_changed: CalendarCog,
  train_cancelled: CalendarX,
  match_callup: Megaphone,
  match_soon: Trophy,
  match_live: Radio,
  match_ended: Flag,
  match_awaiting: AlarmClock,
  match_new: CalendarPlus,
  match_changed: CalendarCog,
  match_postponed: PauseCircle,
  match_cancelled: CalendarX,
  match_no_callups: UserPlus,
  match_no_lineup: LayoutGrid,
  match_no_attendance: ClipboardCheck,
  match_no_ratings: Star,
  match_no_report: FileText,
  abs_new: CalendarX2,
  abs_accepted: BadgeCheck,
  abs_rejected: XCircle,
  abs_pending: Inbox,
};

/**
 * Live without a page refresh:
 * - every few seconds the server is asked a tiny "has anything changed?" (VERSION_MS); the alerts reload when it has;
 * - a save made in this window reloads them at once;
 * - a full reload anyway every 2 minutes (FETCH_MS), and the times are recomputed every half minute (deadlines pass).
 */
const VERSION_MS = 10 * 1000;
const FETCH_MS = 2 * 60 * 1000;
const TICK_MS = 30 * 1000;
/** A save is followed by a short wait, so several saves in a row reload once */
const AFTER_SAVE_MS = 700;
const MINIMIZED_KEY = 'taskAlertsMinimized';
/** Alerts closed by the user (their keys): an alert comes back only for a new reason or a new deadline */
const DISMISSED_KEY = 'taskAlertsDismissed';

const readDismissed = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

/**
 * Alerts for the signed-in user, on every page, at the side of the screen:
 * - their tasks: an alert stays while its reason holds (late, returned, due soon, start time); clicking opens the task;
 * - a disciplinary action sent to them (still open): clicking opens it in the personal space, and it is then seen;
 * - the training sessions (of their category, and all of them for the managers): near, started, ended.
 * The stack can be folded into a small bell; a new alert unfolds it.
 */
export const TaskAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { space, setSpace } = useSpace();
  // Managers of the disciplinary actions also get the alerts of every action (replies, late replies, hearings, documents)
  const canDo = useCan();
  const managesDisciplinary = canDo('disciplinary');
  // Only the managers who take the attendance get the alerts of every session (near, started, ended);
  // the others get only the sessions of their own category, in the personal space
  const canAttend = canDo('trainingSessions', 'attendance');
  const managesTraining = canAttend;
  // The match managers get, each for what they are allowed to do: call-up, lineup, attendance, result / ratings / report
  const matchCan = {
    callups: canDo('matches', 'callups'),
    lineup: canDo('matches', 'lineup'),
    attendance: canDo('matches', 'attendance'),
    report: canDo('matches', 'report'),
  };
  const managesMatches = matchCan.callups || matchCan.lineup || matchCan.attendance || matchCan.report;
  const matchCanKey = JSON.stringify(matchCan);
  // The managers who decide the justifications get every one awaiting a decision
  const decidesAbsences = canDo('absences', 'justify');
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actions, setActions] = useState<MyDisciplinaryAction[]>([]);
  const [allActions, setAllActions] = useState<MyDisciplinaryAction[]>([]);
  const [mySessions, setMySessions] = useState<TrainingSessionModel[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSessionModel[]>([]);
  const [notices, setNotices] = useState<TrainingNotice[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [matchNotices, setMatchNotices] = useState<MatchNotice[]>([]);
  const [myAbsences, setMyAbsences] = useState<AbsenceRecord[]>([]);
  const [allAbsences, setAllAbsences] = useState<AbsenceRecord[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  // Keys seen when the stack was folded: it stays folded until an alert not in this list appears
  const [minimized, setMinimized] = useState<string[] | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(MINIMIZED_KEY) || 'null'); } catch { return null; }
  });

  const load = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    // Alerts are a help: a failed refresh keeps the last ones
    const [myTasks, myActions, everyAction, myTraining, everyTraining, myNotices, mineMatches, everyMatch, myMatchNotices, mineAbsences, everyAbsence] = await Promise.all([
      taskApi.list('my').catch(() => null),
      client.get('/disciplinary/mine').then(r => r.data.data as MyDisciplinaryAction[]).catch(() => null),
      managesDisciplinary
        ? client.get('/disciplinary').then(r => (Array.isArray(r.data) ? r.data : r.data?.data || []) as MyDisciplinaryAction[]).catch(() => null)
        : Promise.resolve([] as MyDisciplinaryAction[]),
      client.get('/training-sessions/mine').then(r => r.data as TrainingSessionModel[]).catch(() => null),
      managesTraining
        ? client.get('/training-sessions').then(r => r.data as TrainingSessionModel[]).catch(() => null)
        : Promise.resolve([] as TrainingSessionModel[]),
      client.get('/training-sessions/mine/notices').then(r => r.data as TrainingNotice[]).catch(() => null),
      client.get('/matches/mine').then(r => r.data?.data as Match[]).catch(() => null),
      managesMatches
        ? client.get('/matches').then(r => r.data?.data as Match[]).catch(() => null)
        : Promise.resolve([] as Match[]),
      client.get('/matches/mine/notices').then(r => r.data as MatchNotice[]).catch(() => null),
      client.get('/absences/mine').then(r => r.data as AbsenceRecord[]).catch(() => null),
      decidesAbsences
        ? client.get('/absences').then(r => (Array.isArray(r.data) ? r.data : r.data?.data) as AbsenceRecord[]).catch(() => null)
        : Promise.resolve([] as AbsenceRecord[]),
    ]);
    if (myTasks) setTasks(myTasks);
    if (myActions) setActions(myActions);
    if (everyAction) setAllActions(everyAction);
    if (Array.isArray(myTraining)) setMySessions(myTraining);
    if (Array.isArray(everyTraining)) setAllSessions(everyTraining);
    if (Array.isArray(myNotices)) setNotices(myNotices);
    if (Array.isArray(mineMatches)) setMyMatches(mineMatches);
    if (Array.isArray(everyMatch)) setAllMatches(everyMatch);
    if (Array.isArray(myMatchNotices)) setMatchNotices(myMatchNotices);
    if (Array.isArray(mineAbsences)) setMyAbsences(mineAbsences);
    if (Array.isArray(everyAbsence)) setAllAbsences(everyAbsence);
  }, [managesDisciplinary, managesTraining, managesMatches, decidesAbsences]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the user's tasks
    load();
    const fetchTimer = window.setInterval(load, FETCH_MS);
    const tick = window.setInterval(() => setNow(Date.now()), TICK_MS);

    // Something changed on the server (by anyone): reload
    let version: string | null = null;
    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const next = (await client.get('/alerts/version')).data?.version ?? null;
        if (version !== null && next !== version) load();
        version = next;
      } catch { /* the next check will tell */ }
    };
    check();
    const versionTimer = window.setInterval(check, VERSION_MS);

    // Saved in this window: reload at once (after the save's own follow-up requests)
    let saveTimer: number | undefined;
    const onSaved = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => { load(); setNow(Date.now()); }, AFTER_SAVE_MS);
    };
    window.addEventListener(DATA_CHANGED, onSaved);
    // Back on the page (window focused, or tab shown again): refresh at once
    const onFocus = () => { load(); setNow(Date.now()); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(fetchTimer);
      window.clearInterval(tick);
      window.clearInterval(versionTimer);
      window.clearTimeout(saveTimer);
      window.removeEventListener(DATA_CHANGED, onSaved);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  // Disciplinary actions first (mine, then the ones to handle as a manager), then the tasks
  const all = useMemo(() => [
    ...disciplinaryAlerts(actions, now),
    ...managerDisciplinaryAlerts(allActions, now),
    ...absenceAlerts(myAbsences, now),
    ...managerAbsenceAlerts(allAbsences),
    ...matchNoticeAlerts(matchNotices),
    ...matchAlerts(myMatches, 'personal', now),
    ...matchAlerts(allMatches, 'management', now, JSON.parse(matchCanKey)),
    ...trainingNoticeAlerts(notices),
    ...trainingAlerts(mySessions, 'personal', now),
    ...trainingAlerts(allSessions, 'management', now, canAttend),
    ...alertsFor(tasks, now),
  ], [actions, allActions, myAbsences, allAbsences, matchNotices,myMatches, allMatches, matchCanKey, notices, mySessions, allSessions, canAttend, tasks, now]);
  const alerts = useMemo(() => all.filter(a => !dismissed.includes(a.key)), [all, dismissed]);

  /** Close one alert; the list keeps only keys of alerts that still exist, so it does not grow forever */
  const dismiss = (a: AppAlert) => {
    const live = new Set(all.map(x => x.key));
    const next = [...dismissed.filter(k => live.has(k)), a.key];
    setDismissed(next);
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(next)); } catch { /* only not remembered */ }
  };
  const folded = minimized !== null && alerts.every(a => minimized.includes(a.key));

  const fold = (value: string[] | null) => {
    setMinimized(value);
    try {
      if (value) sessionStorage.setItem(MINIMIZED_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(MINIMIZED_KEY);
    } catch { /* only not remembered */ }
  };

  if (alerts.length === 0) return null;

  const open = (a: AppAlert) => {
    if (a.target.type === 'disciplinary') {
      // Something that happened is seen once opened; a reason that holds (late, near…) stays until it is solved
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      const page = a.target.space === 'personal' ? Approutes.MyDisciplinary : Approutes.Disciplinary;
      navigate(`${page}?action=${a.target.id}`);
      return;
    }
    if (a.target.type === 'absence') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      navigate(a.target.space === 'personal' ? `${Approutes.MyAbsences}?absence=${a.target.id}` : `${Approutes.AbsenceRequests}?tab=requests`);
      return;
    }
    if (a.target.type === 'match') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      if (a.target.attendance) {
        navigate(`/matches/${a.target.id}/attendance`);
        return;
      }
      navigate(`${a.target.space === 'personal' ? Approutes.MyMatches : Approutes.Matches}?match=${a.target.id}`);
      return;
    }
    if (a.target.type === 'training') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      if (a.target.attendance) {
        navigate(`/training-sessions/${a.target.id}/attendance`);
        return;
      }
      const page = a.target.space === 'personal' ? Approutes.MyTrainingSessions : Approutes.TrainingSessions;
      navigate(`${page}?session=${a.target.id}`);
      return;
    }
    const page = space === 'personal' ? Approutes.MyTasks : Approutes.Tasks;
    navigate(`${page}?task=${a.target.id}`);
  };

  if (folded) {
    return (
      <button type="button" className={`ta-bell ${isMobile ? 'mobile' : ''}`} onClick={() => fold(null)} aria-label={`${alerts.length} تنبيه`}>
        <Bell size={20} />
        <b>{alerts.length}</b>
      </button>
    );
  }

  // Phones show one alert (the most urgent), desktops up to three; the others behind "+N"
  const max = isMobile ? 1 : 3;
  const shown = expanded ? alerts : alerts.slice(0, max);
  const hidden = alerts.length - shown.length;

  return (
    <aside className={`ta-stack ${isMobile ? 'mobile' : ''}`} aria-label="التنبيهات" aria-live="polite">
      <div className="ta-head">
        <span><Bell size={14} />التنبيهات <b>{alerts.length}</b></span>
        <button type="button" onClick={() => { setExpanded(false); fold(alerts.map(a => a.key)); }} aria-label="طي التنبيهات" title="طي التنبيهات">
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="ta-list">
        {shown.map(a => {
          const Icon = ICONS[a.kind];
          return (
            <div
              key={a.key}
              role="button"
              tabIndex={0}
              className={`ta-card tone-${a.tone}`}
              onClick={() => open(a)}
              onKeyDown={e => { if (e.key === 'Enter') open(a); }}
            >
              <span className="ta-icon"><Icon size={18} /></span>
              <span className="ta-text">
                <small>{a.title}</small>
                <strong>{a.heading}</strong>
                <em>{a.detail}</em>
              </span>
              <ChevronLeft size={16} className="ta-go" />
              <button
                type="button"
                className="ta-close"
                onClick={e => { e.stopPropagation(); dismiss(a); }}
                aria-label="إغلاق التنبيه"
                title="إغلاق التنبيه"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {hidden > 0 && (
        <button type="button" className="ta-more" onClick={() => setExpanded(true)}>+{hidden} تنبيه آخر</button>
      )}
      {expanded && alerts.length > max && (
        <button type="button" className="ta-more" onClick={() => setExpanded(false)}>عرض أقل</button>
      )}
    </aside>
  );
};
