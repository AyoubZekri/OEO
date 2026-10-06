import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Undo2, Hourglass, PlayCircle, ChevronLeft, ChevronDown, Bell, X, Scale, MessageSquare, Gavel, CalendarClock, FileSignature, Dumbbell, Radio, CalendarCheck, CalendarPlus, CalendarCog, CalendarX, Trophy, Megaphone, Flag, PauseCircle, UserPlus, LayoutGrid, ClipboardCheck, Star, FileText, CalendarX2, BadgeCheck, XCircle, Inbox, TimerOff, ShieldCheck, Plane, Repeat2, UserMinus, Briefcase, MessageSquarePlus, ClipboardX, Timer, CalendarSync, UserX, Bus, Navigation, Crown, Users as UsersIcon, HeartPulse, Stethoscope, Activity, HeartHandshake } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import client from '../../../core/api/client';
import { DATA_CHANGED } from '../../../core/api/dataChanged';
import { useSpace } from '../../../core/context/space';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { Approutes } from '../../../core/constant/routes';
import { createAlertsBatch } from './alertsBatch';
import { MobileSheet } from '../../Mobile/widgets/MobileSheet';
import { alertsBell, useAlertsBell } from './alertsBell';
import { SwipeAway } from './SwipeAway';
import type { Task } from '../../Screen/Tasks/taskUtils';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import type { Match } from '../../Screen/Matches/match_model';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import type { MyMeeting } from '../../Screen/Personal/useMyMeetings';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import type { Travel } from '../../Screen/Travels/travelUtils';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';
import type { Debt } from '../../Screen/Debts/debtUtils';
import { useAuth } from '../../../core/context/AuthContext';
import {
  absenceAlerts, alertsFor, disciplinaryAlerts, managerAbsenceAlerts, managerDisciplinaryAlerts, managerMeetingAlerts, matchAlerts, matchNoticeAlerts,
  meetingAlerts, meetingNoticeAlerts, trainingAlerts, trainingNoticeAlerts, type ManagedDecision, type MeetingNotice,
  travelAlerts, travelNoticeAlerts, managerTravelAlerts, type TravelNotice, medicalAlerts, managerMedicalAlerts,
  medicalNoticeAlerts, type MedicalNotice, debtAlerts,
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
  abs_expired: TimerOff,
  abs_admin_justified: ShieldCheck,
  abs_leave_soon: Plane,
  abs_repeated: Repeat2,
  abs_today: UserMinus,
  abs_repeated_member: Repeat2,
  meet_invited: Briefcase,
  meet_soon: Timer,
  meet_live: Radio,
  meet_point: MessageSquarePlus,
  dec_assigned: Gavel,
  dec_due: Hourglass,
  dec_late: AlarmClock,
  mgr_meet_point: MessageSquarePlus,
  mgr_meet_soon: Timer,
  mgr_meet_attendance: ClipboardX,
  mgr_meet_no_decisions: Gavel,
  mgr_dec_late: AlarmClock,
  meet_changed: CalendarSync,
  meet_cancelled: CalendarX,
  meet_uninvited: UserX,
  trv_added: Bus,
  trv_soon: Timer,
  trv_live: Navigation,
  trv_changed: CalendarSync,
  trv_cancelled: CalendarX,
  trv_removed: UserX,
  mgr_trv_soon: Bus,
  mgr_trv_no_head: Crown,
  mgr_trv_empty: UsersIcon,
  med_new: HeartPulse,
  med_stage: Activity,
  med_recovered: HeartHandshake,
  med_exam: Stethoscope,
  med_exam_missed: AlarmClock,
  med_return_soon: CalendarClock,
  mgr_med_exam: Stethoscope,
  mgr_med_exam_late: AlarmClock,
  mgr_med_initial: HeartPulse,
  mgr_med_return: CalendarClock,
  med_changed: CalendarSync,
  med_exam_moved: CalendarSync,
  med_deleted: CalendarX,
  debt_soon: CalendarClock,
  debt_due: AlarmClock,
  debt_late: AlarmClock,
};

/**
 * Live without a page refresh, light on the server:
 * - the server is asked a tiny "has anything changed?" (a number read from a file): every 15 seconds while the user
 *   works, every minute after 3 minutes without a touch, never while the page is hidden;
 *   when it fails, it waits longer each time (30 s, 1 min, 2 min) instead of insisting;
 * - the alerts reload (all their lists in one request) only when the answer changes; a save made in this window,
 *   or coming back to the page, asks at once;
 * - a full reload anyway every 15 minutes (FETCH_MS), and the times are recomputed every half minute (deadlines pass).
 */
const VERSION_MS = 15 * 1000;
const IDLE_VERSION_MS = 60 * 1000;
const IDLE_AFTER_MS = 3 * 60 * 1000;
const MAX_BACKOFF_MS = 2 * 60 * 1000;
const FETCH_MS = 15 * 60 * 1000;
const TICK_MS = 30 * 1000;
/** A save is followed by a short wait, so several saves in a row reload once */
const AFTER_SAVE_MS = 700;
const MINIMIZED_KEY = 'taskAlertsMinimized';
/** Alerts closed by the user (their keys): an alert comes back only for a new reason or a new deadline */
const DISMISSED_KEY = 'taskAlertsDismissed';
/** Phones: the alerts already dropped in from the top (each is shown once) */
const ANNOUNCED_KEY = 'taskAlertsAnnounced';
/** Phones: how long a new alert stays at the top before it goes */
const TOAST_MS = 4500;

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
  // The managers' alerts (to handle, in the management space): only who has the management space (never a player)
  const { space, setSpace, canManage } = useSpace();
  // Managers of the disciplinary actions also get the alerts of every action (replies, late replies, hearings, documents)
  const canDo = useCan();
  // The disciplinary alerts (mine and the ones to handle): only who has the disciplinary permission
  const managesDisciplinary = canDo('disciplinary');
  // Only the managers who take the attendance get the alerts of every session (near, started, ended);
  // the others get only the sessions of their own category, in the personal space
  const canAttend = canDo('trainingSessions', 'attendance');
  const managesTraining = canAttend;
  // The training alerts (my sessions and their notices): only who has the training sessions permission
  const seesTraining = canDo('trainingSessions');
  // The match managers get, each for what they are allowed to do: call-up, lineup, attendance, result / ratings / report
  const matchCan = {
    callups: canDo('matches', 'callups'),
    lineup: canDo('matches', 'lineup'),
    attendance: canDo('matches', 'attendance'),
    report: canDo('matches', 'report'),
  };
  const managesMatches = matchCan.callups || matchCan.lineup || matchCan.attendance || matchCan.report;
  const matchCanKey = JSON.stringify(matchCan);
  // The match alerts (my matches: called up, lineup, result, ratings, and their notices): only who has the matches permission
  const seesMatches = canDo('matches');
  // The managers who decide the justifications get every one awaiting a decision
  const decidesAbsences = canDo('absences', 'justify');
  // Who sees the absences gets them all: mine (absent, late, justify within 24 hours, decided, requests answered),
  // and as a manager the members absent today and the repeated absences; without it, none
  const seesAbsences = canDo('absences');
  // Meetings and decisions: who manages them gets their alerts (points sent, near, attendance, decisions)
  const meetCan = {
    meetings: canDo('meetings'),
    attendance: canDo('meetings', 'attendance'),
    addDecisions: canDo('decisions', 'add'),
    decisions: canDo('decisions'),
  };
  const meetCanKey = JSON.stringify(meetCan);
  // My meetings' alerts (invited, near, points, changes): only who has the meetings permission;
  // the decisions in my charge (new, deadline near, late): only who has the decisions permission
  const seesMeetings = meetCan.meetings;
  const seesDecisions = meetCan.decisions;
  // The trips' managers get their checks (near, no head, no one chosen)
  // Trips and medical files: only who has their permission gets their alerts (mine, and the ones to handle)
  const managesTravels = canDo('travels');
  const managesMedical = canDo('medical');
  // Repayment dates: the loans for who manages the debts, the purchases on credit for who manages the payments
  const managesDebts = canDo('debts');
  const managesPayments = canDo('payments');
  // The task alerts: only who has the tasks permission
  const seesTasks = canDo('tasks');
  const { user } = useAuth();
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
  const [myMeetings, setMyMeetings] = useState<MyMeeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [allDecisions, setAllDecisions] = useState<ManagedDecision[]>([]);
  const [meetingNotices, setMeetingNotices] = useState<MeetingNotice[]>([]);
  const [myTravels, setMyTravels] = useState<Travel[]>([]);
  const [allTravels, setAllTravels] = useState<Travel[]>([]);
  const [travelNotices, setTravelNotices] = useState<TravelNotice[]>([]);
  const [myMedical, setMyMedical] = useState<PlayerMedicalRecord[]>([]);
  const [allMedical, setAllMedical] = useState<PlayerMedicalRecord[]>([]);
  const [medicalNotices, setMedicalNotices] = useState<MedicalNotice[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [creditPurchases, setCreditPurchases] = useState<Debt[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  // Keys seen when the stack was folded: it stays folded until an alert not in this list appears
  const [minimized, setMinimized] = useState<string[] | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(MINIMIZED_KEY) || 'null'); } catch { return null; }
  });

  // One load at a time (one that hangs on a slow server stops blocking after 30 seconds)
  const loadingRef = useRef(0);
  const load = useCallback(async () => {
    if (document.visibilityState === 'hidden' || Date.now() - loadingRef.current < 30000) return;
    const started = Date.now();
    loadingRef.current = started;
    // Every list in one request (/alerts/all)
    const batch = createAlertsBatch();
    // Alerts are a help: a failed refresh keeps the last ones
    const lists = Promise.all([
      seesTasks ? batch.get('/tasks', { params: { scope: 'my' } }).then(r => r.data.data as Task[]).catch(() => null) : Promise.resolve([] as Task[]),
      managesDisciplinary
        ? batch.get('/disciplinary/mine').then(r => r.data.data as MyDisciplinaryAction[]).catch(() => null)
        : Promise.resolve([] as MyDisciplinaryAction[]),
      canManage && managesDisciplinary
        ? batch.get('/disciplinary').then(r => (Array.isArray(r.data) ? r.data : r.data?.data || []) as MyDisciplinaryAction[]).catch(() => null)
        : Promise.resolve([] as MyDisciplinaryAction[]),
      seesTraining
        ? batch.get('/training-sessions/mine').then(r => r.data as TrainingSessionModel[]).catch(() => null)
        : Promise.resolve([] as TrainingSessionModel[]),
      canManage && managesTraining
        ? batch.get('/training-sessions').then(r => r.data as TrainingSessionModel[]).catch(() => null)
        : Promise.resolve([] as TrainingSessionModel[]),
      seesTraining
        ? batch.get('/training-sessions/mine/notices').then(r => r.data as TrainingNotice[]).catch(() => null)
        : Promise.resolve([] as TrainingNotice[]),
      seesMatches
        ? batch.get('/matches/mine').then(r => r.data?.data as Match[]).catch(() => null)
        : Promise.resolve([] as Match[]),
      canManage && managesMatches
        ? batch.get('/matches').then(r => r.data?.data as Match[]).catch(() => null)
        : Promise.resolve([] as Match[]),
      seesMatches
        ? batch.get('/matches/mine/notices').then(r => r.data as MatchNotice[]).catch(() => null)
        : Promise.resolve([] as MatchNotice[]),
      seesAbsences
        ? batch.get('/absences/mine').then(r => r.data as AbsenceRecord[]).catch(() => null)
        : Promise.resolve([] as AbsenceRecord[]),
      canManage && seesAbsences
        ? batch.get('/absences').then(r => (Array.isArray(r.data) ? r.data : r.data?.data) as AbsenceRecord[]).catch(() => null)
        : Promise.resolve([] as AbsenceRecord[]),
      seesMeetings || seesDecisions
        ? batch.get('/meetings/mine').then(r => r.data as MyMeeting[]).catch(() => null)
        : Promise.resolve([] as MyMeeting[]),
      canManage && (meetCan.meetings || meetCan.attendance || meetCan.addDecisions)
        ? batch.get('/meetings').then(r => r.data as Meeting[]).catch(() => null)
        : Promise.resolve([] as Meeting[]),
      canManage && (meetCan.decisions || meetCan.addDecisions)
        ? batch.get('/decisions').then(r => r.data as ManagedDecision[]).catch(() => null)
        : Promise.resolve([] as ManagedDecision[]),
      seesMeetings
        ? batch.get('/meetings/mine/notices').then(r => r.data as MeetingNotice[]).catch(() => null)
        : Promise.resolve([] as MeetingNotice[]),
      managesTravels
        ? batch.get('/travels/mine').then(r => r.data?.data as Travel[]).catch(() => null)
        : Promise.resolve([] as Travel[]),
      canManage && managesTravels
        ? batch.get('/travels').then(r => r.data?.data as Travel[]).catch(() => null)
        : Promise.resolve([] as Travel[]),
      managesTravels
        ? batch.get('/travels/mine/notices').then(r => r.data as TravelNotice[]).catch(() => null)
        : Promise.resolve([] as TravelNotice[]),
      managesMedical
        ? batch.get('/medical-records/mine').then(r => r.data?.data as PlayerMedicalRecord[]).catch(() => null)
        : Promise.resolve([] as PlayerMedicalRecord[]),
      canManage && managesMedical
        ? batch.get('/medical-records').then(r => r.data?.data as PlayerMedicalRecord[]).catch(() => null)
        : Promise.resolve([] as PlayerMedicalRecord[]),
      managesMedical
        ? batch.get('/medical-records/mine/notices').then(r => r.data as MedicalNotice[]).catch(() => null)
        : Promise.resolve([] as MedicalNotice[]),
      canManage && managesDebts
        ? batch.get('/debts').then(r => r.data?.data as Debt[]).catch(() => null)
        : Promise.resolve([] as Debt[]),
      canManage && managesPayments
        ? batch.get('/payments/credit').then(r => r.data?.data as Debt[]).catch(() => null)
        : Promise.resolve([] as Debt[]),
    ]);
    batch.flush();
    const [myTasks, myActions, everyAction, myTraining, everyTraining, myNotices, mineMatches, everyMatch, myMatchNotices, mineAbsences, everyAbsence, mineMeetings, everyMeeting, everyDecision, myMeetingNotices, mineTravels, everyTravel, myTravelNotices, mineMedical, everyMedical, myMedicalNotices, everyDebt, everyCredit] = await lists;
    if (loadingRef.current === started) loadingRef.current = 0;
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
    if (Array.isArray(mineMeetings)) setMyMeetings(mineMeetings);
    if (Array.isArray(everyMeeting)) setAllMeetings(everyMeeting);
    if (Array.isArray(everyDecision)) setAllDecisions(everyDecision);
    if (Array.isArray(myMeetingNotices)) setMeetingNotices(myMeetingNotices);
    if (Array.isArray(mineTravels)) setMyTravels(mineTravels);
    if (Array.isArray(everyTravel)) setAllTravels(everyTravel);
    if (Array.isArray(myTravelNotices)) setTravelNotices(myTravelNotices);
    if (Array.isArray(mineMedical)) setMyMedical(mineMedical);
    if (Array.isArray(everyMedical)) setAllMedical(everyMedical);
    if (Array.isArray(myMedicalNotices)) setMedicalNotices(myMedicalNotices);
    if (Array.isArray(everyDebt)) setDebts(everyDebt);
    if (Array.isArray(everyCredit)) setCreditPurchases(everyCredit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- meetCan changes with meetCanKey
  }, [managesDisciplinary, managesTraining, managesMatches, seesAbsences, meetCanKey, managesTravels, managesMedical, seesTasks, seesTraining, seesMatches, managesDebts, managesPayments, canManage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the user's tasks
    load();
    const fetchTimer = window.setInterval(load, FETCH_MS);
    const tick = window.setInterval(() => setNow(Date.now()), TICK_MS);

    // Something changed on the server (by anyone): reload
    let version: string | null = null;
    let failures = 0;
    let lastTouch = Date.now();
    let timer: number | undefined;
    const delay = () => (failures > 0
      ? Math.min(MAX_BACKOFF_MS, VERSION_MS * 2 ** failures)
      : Date.now() - lastTouch > IDLE_AFTER_MS ? IDLE_VERSION_MS : VERSION_MS);
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, delay());
    };
    async function check() {
      window.clearTimeout(timer);
      // Hidden: no question until the page is shown again
      if (document.visibilityState === 'hidden') return;
      try {
        const next = (await client.get('/alerts/version')).data?.version ?? null;
        failures = 0;
        if (version !== null && next !== version) load();
        version = next;
      } catch {
        failures += 1;
      }
      schedule();
    }
    check();

    // Saved in this window: ask at once (after the save's own follow-up requests)
    let saveTimer: number | undefined;
    const onSaved = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => { check(); setNow(Date.now()); }, AFTER_SAVE_MS);
    };
    window.addEventListener(DATA_CHANGED, onSaved);
    // Back on the page (window focused, or tab shown again): ask at once
    const onFocus = () => { check(); setNow(Date.now()); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    // Working again after a pause: back to the short wait at once
    const onTouch = () => {
      const wasIdle = Date.now() - lastTouch > IDLE_AFTER_MS;
      lastTouch = Date.now();
      if (wasIdle && failures === 0) check();
    };
    window.addEventListener('pointerdown', onTouch, { passive: true });
    window.addEventListener('keydown', onTouch);
    return () => {
      window.clearInterval(fetchTimer);
      window.clearInterval(tick);
      window.clearTimeout(timer);
      window.clearTimeout(saveTimer);
      window.removeEventListener(DATA_CHANGED, onSaved);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('pointerdown', onTouch);
      window.removeEventListener('keydown', onTouch);
    };
  }, [load]);

  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  // Disciplinary actions first (mine, then the ones to handle as a manager), then the tasks
  const all = useMemo(() => [
    ...(managesDisciplinary ? disciplinaryAlerts(actions, now) : []),
    ...managerDisciplinaryAlerts(allActions, now),
    ...(managesDebts ? debtAlerts(debts, now) : []),
    ...(managesPayments ? debtAlerts(creditPurchases, now) : []),
    ...(managesMedical ? medicalAlerts(myMedical, now) : []),
    ...managerMedicalAlerts(allMedical, now),
    ...(managesMedical ? medicalNoticeAlerts(medicalNotices, myMedical) : []),
    ...(managesTravels ? travelNoticeAlerts(travelNotices) : []),
    ...(managesTravels ? travelAlerts(myTravels, now) : []),
    ...managerTravelAlerts(allTravels, now, myTravels.map(t => t.id)),
    ...(seesMeetings ? meetingNoticeAlerts(meetingNotices) : []),
    ...meetingAlerts(myMeetings, now).filter(a => (a.kind.startsWith('dec_') ? seesDecisions : seesMeetings)),
    ...managerMeetingAlerts(allMeetings, allDecisions, now, JSON.parse(meetCanKey), user?.id, myMeetings.map(m => m.id)),
    ...(seesAbsences ? absenceAlerts(myAbsences, now) : []),
    ...managerAbsenceAlerts(allAbsences, now, decidesAbsences),
    ...(seesMatches ? matchNoticeAlerts(matchNotices) : []),
    ...(seesMatches ? matchAlerts(myMatches, 'personal', now) : []),
    ...matchAlerts(allMatches, 'management', now, JSON.parse(matchCanKey)),
    ...(seesTraining ? trainingNoticeAlerts(notices) : []),
    ...(seesTraining ? trainingAlerts(mySessions, 'personal', now) : []),
    ...trainingAlerts(allSessions, 'management', now, canAttend),
    ...(seesTasks ? alertsFor(tasks, now) : []),
  ], [seesTasks, managesDisciplinary, seesTraining, seesAbsences, seesMatches, seesMeetings, seesDecisions, managesTravels, managesMedical, managesDebts, managesPayments, debts, creditPurchases, actions, allActions, myMedical, allMedical, medicalNotices, travelNotices,myTravels, allTravels, meetingNotices,myMeetings, allMeetings,allDecisions, meetCanKey, user, myAbsences, allAbsences, decidesAbsences,matchNotices,myMatches, allMatches, matchCanKey, notices, mySessions, allSessions, canAttend, tasks, now]);
  const alerts = useMemo(() => all.filter(a => !dismissed.includes(a.key)), [all, dismissed]);

  // Phones: the alerts are behind the bell of the app bar (its number, the full list in a sheet);
  // each new alert drops in from the top for a few seconds, then goes (the most urgent, "+N" for the others)
  const bell = useAlertsBell();
  const [announced, setAnnounced] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ANNOUNCED_KEY) || '[]'); } catch { return []; }
  });
  const [toast, setToast] = useState<{ alert: AppAlert; more: number } | null>(null);

  useEffect(() => { alertsBell.setCount(isMobile ? alerts.length : 0); }, [isMobile, alerts.length]);

  useEffect(() => {
    if (!isMobile || toast || bell.open) return;
    const fresh = alerts.filter(a => !announced.includes(a.key));
    if (fresh.length === 0) return;
    // Only the keys of alerts that still exist are kept, so the list does not grow forever
    const live = new Set(all.map(a => a.key));
    const next = [...announced.filter(k => live.has(k)), ...fresh.map(a => a.key)];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new alert arrived: announce it once
    setAnnounced(next);
    try { localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(next)); } catch { /* only not remembered */ }
    setToast({ alert: fresh[0], more: fresh.length - 1 });
  }, [isMobile, alerts, all, announced, toast, bell.open]);

  // It goes when its animation ends (in, stays, out); the timer is only a fallback (no animation, reduced motion)
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS + 1500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  if (alerts.length === 0 && !isMobile) return null;

  const open = (a: AppAlert) => {
    if (a.target.type === 'disciplinary') {
      // Something that happened is seen once opened; a reason that holds (late, near…) stays until it is solved
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      const page = a.target.space === 'personal' ? Approutes.MyDisciplinary : Approutes.Disciplinary;
      navigate(`${page}?action=${a.target.id}`);
      return;
    }
    if (a.target.type === 'debt') {
      if (space !== 'management') setSpace('management');
      navigate(`${a.target.kind === 'purchase' ? Approutes.Payments : Approutes.Debts}?debt=${a.target.id}`);
      return;
    }
    if (a.target.type === 'medical') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      const page = a.target.space === 'personal' ? Approutes.MyMedical : Approutes.MedicalRecords;
      navigate(a.target.id ? `${page}?record=${a.target.id}` : page);
      return;
    }
    if (a.target.type === 'travel') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      const page = a.target.space === 'personal' ? Approutes.MyTravels : Approutes.Travels;
      navigate(a.target.id ? `${page}?travel=${a.target.id}` : page);
      return;
    }
    if (a.target.type === 'meeting') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      if (a.target.attendance) navigate(`/meetings/${a.target.id}/attendance`);
      else if (a.target.decisions) navigate(Approutes.Decisions);
      else if (!a.target.id) navigate(a.target.space === 'personal' ? Approutes.MyMeetings : Approutes.Meetings);
      else navigate(`${a.target.space === 'personal' ? Approutes.MyMeetings : Approutes.Meetings}?meeting=${a.target.id}`);
      return;
    }
    if (a.target.type === 'absence') {
      if (a.event) dismiss(a);
      if (space !== a.target.space) setSpace(a.target.space);
      navigate(a.target.space === 'personal' ? `${Approutes.MyAbsences}?absence=${a.target.id}` : `${Approutes.AbsenceRequests}?tab=${a.target.tab || 'requests'}`);
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

  /** One alert as a card (the desktop stack and the phone list) */
  const card = (a: AppAlert, onOpen: () => void) => {
    const Icon = ICONS[a.kind];
    return (
      <div
        key={a.key}
        role="button"
        tabIndex={0}
        className={`ta-card tone-${a.tone}`}
        onClick={onOpen}
        onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}
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
  };

  if (isMobile) {
    const ToastIcon = toast ? ICONS[toast.alert.kind] : null;
    return (
      <>
        {toast && ToastIcon && !bell.open && (
          <div className="ta-toast-wrap" aria-live="polite">
            {/* Pulled sideways: it goes at once */}
            <SwipeAway key={toast.alert.key} onAway={() => setToast(null)}>
            <div
              role="button"
              tabIndex={0}
              className={`ta-toast tone-${toast.alert.tone}`}
              style={{ animationDuration: `${TOAST_MS}ms` }}
              onAnimationEnd={e => { if (e.target === e.currentTarget) setToast(null); }}
              onClick={() => { setToast(null); open(toast.alert); }}
              onKeyDown={e => { if (e.key === 'Enter') { setToast(null); open(toast.alert); } }}
            >
              <span className="ta-icon"><ToastIcon size={18} /></span>
              <span className="ta-text">
                <small>{toast.alert.title}</small>
                <strong>{toast.alert.heading}</strong>
                <em>{toast.alert.detail}</em>
              </span>
              {toast.more > 0 && (
                <button type="button" className="ta-toast-more" onClick={e => { e.stopPropagation(); setToast(null); alertsBell.open(); }}>
                  +{toast.more}
                </button>
              )}
            </div>
            </SwipeAway>
          </div>
        )}
        {bell.open && (
          <MobileSheet title={alerts.length ? `التنبيهات (${alerts.length})` : 'التنبيهات'} onClose={alertsBell.close}>
            {alerts.length === 0 ? (
              <div className="ta-empty">
                <Bell size={28} />
                <span>لا توجد تنبيهات</span>
              </div>
            ) : (
              <div className="ta-list ta-sheet-list">
                {/* Pulled sideways: closed, like its ✕ */}
                {alerts.map(a => (
                  <SwipeAway key={a.key} onAway={() => dismiss(a)}>
                    {card(a, () => { alertsBell.close(); open(a); })}
                  </SwipeAway>
                ))}
              </div>
            )}
          </MobileSheet>
        )}
      </>
    );
  }

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
        {shown.map(a => card(a, () => open(a)))}
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
