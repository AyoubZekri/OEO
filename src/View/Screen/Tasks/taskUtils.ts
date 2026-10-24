import {
  CircleDot, PlayCircle, PauseCircle, CheckCircle2, XCircle, AlarmClock, ClipboardList, Zap, CalendarClock,
  Building2, MapPinned, Phone, Mic, Cake, Trophy, Dumbbell, Bus, Briefcase, Repeat, Layers, Shapes, Power, Filter, UserRound, type LucideIcon,
} from 'lucide-react';
import { parseDate } from '../../shared/dates';
import { Approutes } from '../../../core/constant/routes';

export type TaskStatus = 'new' | 'in_progress' | 'on_hold' | 'done' | 'cancelled';
export type TaskKind = 'normal' | 'urgent' | 'voice' | 'scheduled';
export type TaskNature = 'internal' | 'external' | 'call';
export type EventType = 'match' | 'training' | 'travel' | 'meeting' | 'birthday';

export interface TaskUser { id: number; name: string }

/** A task given to one member */
export interface Task {
  id: number;
  title: string;
  details: string | null;
  kind: TaskKind;
  nature: TaskNature;
  status: TaskStatus;
  /** The deadline passed and it is not finished (not a status anyone picks) */
  overdue: boolean;
  alert_at: string | null;
  due_at: string | null;
  /** The event or the day it was created for */
  event_label: string | null;
  source: EventType | 'periodic' | null;
  template_id: number | null;
  /** The event it was created for (an appointment's task), to open it: a birthday's is the member */
  event: { type: EventType; id: number } | null;
  assignee: TaskUser | null;
  created_by: string | null;
  /** The member opened it */
  seen: boolean;
  /** Messages not read yet (by the member, or by the management) */
  unread: number;
  last_message: { body: string | null; status: TaskStatus | null; by: string | null; at: string | null } | null;
  done_at: string | null;
  created_at: string | null;
}

/** An appointment: creates a task with every new event, or periodically */
export interface TaskTemplate {
  id: number;
  title: string;
  details: string | null;
  nature: TaskNature;
  schedule: 'event' | 'periodic';
  event_type: EventType | null;
  repeat: 'weekly' | 'monthly' | null;
  repeat_day: number | null;
  /** Minutes: from the event (negative = before), or from the periodic day's start */
  alert_offset: number;
  due_offset: number;
  status: 'active' | 'paused';
  assignee: TaskUser | null;
  created_by: string | null;
  tasks_count: number;
  created_at: string | null;
}

/** A message of a task's conversation, or a status change written in it */
export interface TaskMessage {
  id: number;
  body: string | null;
  status: TaskStatus | null;
  by: string | null;
  mine: boolean;
  from_assignee: boolean;
  at: string | null;
}

export const STATUS_META: Record<TaskStatus, { label: string; tone: string; icon: LucideIcon }> = {
  new: { label: 'جديدة', tone: 'blue', icon: CircleDot },
  in_progress: { label: 'قيد التنفيذ', tone: 'amber', icon: PlayCircle },
  on_hold: { label: 'معلّقة', tone: 'orange', icon: PauseCircle },
  done: { label: 'منجزة', tone: 'green', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', tone: 'slate', icon: XCircle },
};
export const STATUSES = Object.keys(STATUS_META) as TaskStatus[];
export const OVERDUE_META = { label: 'متأخرة', tone: 'red', icon: AlarmClock };

export const KIND_META: Record<TaskKind, { label: string; hint: string; tone: string; icon: LucideIcon }> = {
  normal: { label: 'عادية', hint: 'تُسند الآن', tone: 'blue', icon: ClipboardList },
  urgent: { label: 'عاجلة', hint: 'فورية بلا أجل', tone: 'red', icon: Zap },
  voice: { label: 'تنبيه صوتي', hint: 'تُملى بالميكروفون', tone: 'green', icon: Mic },
  scheduled: { label: 'موعد', hint: 'مع حدث أو دورية', tone: 'orange', icon: CalendarClock },
};

export const NATURE_META: Record<TaskNature, { label: string; icon: LucideIcon }> = {
  internal: { label: 'داخلية', icon: Building2 },
  external: { label: 'خارجية', icon: MapPinned },
  call: { label: 'اتصال', icon: Phone },
};

export const EVENT_META: Record<EventType, { label: string; every: string; the: string; icon: LucideIcon }> = {
  match: { label: 'مباراة', every: 'كل مباراة جديدة', the: 'المباراة', icon: Trophy },
  training: { label: 'حصة تدريب', every: 'كل حصة تدريب جديدة', the: 'الحصة', icon: Dumbbell },
  travel: { label: 'تنقل', every: 'كل تنقل جديد', the: 'التنقل', icon: Bus },
  meeting: { label: 'اجتماع', every: 'كل اجتماع جديد', the: 'الاجتماع', icon: Briefcase },
  birthday: { label: 'عيد ميلاد', every: 'كل عيد ميلاد عضو', the: 'عيد الميلاد', icon: Cake },
};
export const EVENTS = Object.keys(EVENT_META) as EventType[];

/** Opening a task's event: its page, with the item opened (?match=, ?session=…), and what the button says */
export const EVENT_LINK: Record<EventType, { page: string; param: string; open: string }> = {
  match: { page: Approutes.Matches, param: 'match', open: 'عرض المباراة' },
  training: { page: Approutes.TrainingSessions, param: 'session', open: 'عرض الحصة' },
  travel: { page: Approutes.Travels, param: 'travel', open: 'عرض التنقل' },
  meeting: { page: Approutes.Meetings, param: 'meeting', open: 'عرض الاجتماع' },
  birthday: { page: Approutes.Members, param: 'member', open: 'عرض العضو' },
};
export const eventLink = (e: NonNullable<Task['event']>) => `${EVENT_LINK[e.type].page}?${EVENT_LINK[e.type].param}=${e.id}`;
export const PERIODIC_ICON = Repeat;

/** 1 = Monday … 7 = Sunday, shown from Saturday */
export const WEEK_DAYS = [
  { value: 6, label: 'السبت' }, { value: 7, label: 'الأحد' }, { value: 1, label: 'الإثنين' }, { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' }, { value: 4, label: 'الخميس' }, { value: 5, label: 'الجمعة' },
];
export const dayName = (iso: number | null) => WEEK_DAYS.find(d => d.value === iso)?.label || '—';

/** Its time came: an appointment's task once its alert time is reached, the others at once */
export const hasArrived = (t: Pick<Task, 'kind' | 'alert_at'>, now = Date.now()) =>
  t.kind !== 'scheduled' || !t.alert_at || (parseDate(t.alert_at)?.getTime() ?? 0) <= now;

export const isOpen = (t: Pick<Task, 'status'>) => t.status === 'new' || t.status === 'in_progress' || t.status === 'on_hold';

/** The task's colour and label: late first, then its status */
export const statusView = (t: Pick<Task, 'status' | 'overdue'>) => (t.overdue && isOpen(t) ? OVERDUE_META : STATUS_META[t.status]);

const plural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** 1440 → «يوم», 2880 → «يومين», 180 → «3 ساعات», 30 → «30 دقيقة» */
export const durationText = (minutes: number) => {
  const m = Math.abs(minutes);
  if (m === 0) return 'في الوقت نفسه';
  if (m % 1440 === 0) return plural(m / 1440, 'يوم', 'يومين', 'أيام', 'يوماً');
  if (m % 60 === 0) return plural(m / 60, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
  return `${m} دقيقة`;
};

/** Event appointments: «قبل المباراة بيومين», «بعد الحصة بساعة», «عند بداية التنقل» */
export const eventOffsetText = (minutes: number, type: EventType | null) => {
  const the = type ? EVENT_META[type].the : 'الحدث';
  if (minutes === 0) return `عند بداية ${the}`;
  return `${minutes < 0 ? 'قبل' : 'بعد'} ${the} بـ${durationText(minutes)}`;
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Periodic appointments: minutes from the day's start → «08:00», «اليوم التالي 18:00» */
export const dayOffsetText = (minutes: number) => {
  const days = Math.floor(minutes / 1440);
  const rest = minutes - days * 1440;
  const time = `${pad(Math.floor(rest / 60))}:${pad(rest % 60)}`;
  return days === 0 ? time : days === 1 ? `اليوم التالي ${time}` : `بعد ${durationText(days * 1440)} ${time}`;
};

/** «مع كل مباراة جديدة», «كل أسبوع · الخميس», «كل شهر · يوم 5» */
export const scheduleText = (t: Pick<TaskTemplate, 'schedule' | 'event_type' | 'repeat' | 'repeat_day'>) => {
  if (t.schedule === 'event') return t.event_type ? `مع ${EVENT_META[t.event_type].every}` : 'مع كل حدث';
  return t.repeat === 'weekly' ? `كل أسبوع · ${dayName(t.repeat_day)}` : `كل شهر · يوم ${t.repeat_day ?? '—'}`;
};

export const templateTimesText = (t: TaskTemplate) => (t.schedule === 'event'
  ? { alert: eventOffsetText(t.alert_offset, t.event_type), due: eventOffsetText(t.due_offset, t.event_type) }
  : { alert: dayOffsetText(t.alert_offset), due: dayOffsetText(t.due_offset) });

/** Where it comes from: an event, periodic, or given directly */
export const sourceMeta = (t: Pick<Task, 'source' | 'kind'>) => {
  if (t.source === 'periodic') return { label: 'دورية', icon: Repeat };
  if (t.source) return { label: EVENT_META[t.source].label, icon: EVENT_META[t.source].icon };
  return { label: KIND_META[t.kind].label, icon: KIND_META[t.kind].icon };
};

/** "2026/10/25 15:00" */
export const dateText = (s: string | null | undefined) => {
  const d = parseDate(s);
  if (!d) return '—';
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const spanText = (ms: number) => {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} د`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} سا`;
  return durationText(Math.round(h / 24) * 1440);
};

/** How soon an appointment's task shows on the home page: within a day, within three days, or later */
export const showSoon = (s: string | null | undefined): 'soon' | 'near' | 'far' => {
  const d = parseDate(s);
  const left = d ? d.getTime() - Date.now() : Infinity;
  return left <= 86400000 ? 'soon' : left <= 3 * 86400000 ? 'near' : 'far';
};

/** The deadline: «باقي 3 سا», «متأخرة بيومين», «بدون أجل», «منجزة» */
export const dueText = (t: Pick<Task, 'status' | 'due_at' | 'overdue'>) => {
  if (t.status === 'done') return 'منجزة';
  if (t.status === 'cancelled') return 'ملغاة';
  const due = parseDate(t.due_at);
  if (!due) return 'بدون أجل';
  const left = due.getTime() - Date.now();
  return left < 0 ? `متأخرة بـ${spanText(-left)}` : `باقي ${spanText(left)}`;
};

export const errorText = (e: unknown, fallback: string) => {
  const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  const first = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
  return first || data?.message || fallback;
};

/** The status filters of the lists */
export const STATUS_FILTERS: { value: string; label: string; test: (t: Task) => boolean }[] = [
  { value: '', label: 'الكل', test: () => true },
  { value: 'open', label: 'غير منجزة', test: isOpen },
  { value: 'overdue', label: 'متأخرة', test: t => t.overdue && isOpen(t) },
  ...STATUSES.map(s => ({ value: s, label: STATUS_META[s].label, test: (t: Task) => t.status === s })),
];

/**
 * The home page's status filter: all, new, in progress, done, cancelled, then «late». «On hold» (no longer given)
 * only while some task still has it.
 */
export const presentStatusFilters = (tasks: Task[], picked = '') => [
  STATUS_FILTERS[0],
  ...STATUSES
    .filter(st => st !== 'on_hold' || st === picked || tasks.some(t => t.status === st))
    .map(st => STATUS_FILTERS.find(f => f.value === st)!),
  STATUS_FILTERS.find(f => f.value === 'overdue')!,
];

/** The nature filter: all, or internal / external / call */
export const NATURE_FILTERS = [
  { value: '', label: 'كل الطبائع' },
  ...(Object.keys(NATURE_META) as TaskNature[]).map(n => ({ value: n, label: NATURE_META[n].label })),
];

/** The kind filter: all, or normal / urgent / voice note / appointment */
export const KIND_FILTERS = [
  { value: '', label: 'كل الأنواع' },
  ...(['normal', 'urgent', 'voice', 'scheduled'] as TaskKind[]).map(k => ({ value: k, label: KIND_META[k].label })),
];

/** A date as it may be typed in the search: «2026/10/25 15:00» and «25/10/2026» */
const dateKeys = (s: string | null | undefined) => {
  const d = parseDate(s);
  return d ? [dateText(s), `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`] : [];
};

/** The search: the task, its details, who does it, its event, or one of its dates (given, alert, deadline, done) */
const matches = (t: Task, q: string) => [
  t.title, t.details, t.assignee?.name, t.event_label,
  ...[t.created_at, t.alert_at, t.due_at, t.done_at].flatMap(dateKeys),
].some(v => (v || '').toLowerCase().includes(q));

export const filterTasks = (tasks: Task[], status: string, query: string, nature = '', kind = '') => {
  const test = STATUS_FILTERS.find(f => f.value === status)?.test || (() => true);
  const raw = query.trim().toLowerCase();
  // A date typed «25-10» or «25.10»: as «25/10»
  const q = /^[\d\s/.:-]+$/.test(raw) ? raw.replace(/[-.]/g, '/') : raw;
  return tasks
    .filter(test)
    .filter(t => (!nature || t.nature === nature) && (!kind || t.kind === kind))
    .filter(t => !q || matches(t, q));
};

/** Open first (urgent, late, nearest deadline), then the finished ones (latest first) */
export const sortTasks = (tasks: Task[]) => [...tasks].sort((a, b) => {
  const oa = isOpen(a) ? 0 : 1;
  const ob = isOpen(b) ? 0 : 1;
  if (oa !== ob) return oa - ob;
  if (oa === 1) return b.id - a.id;
  const ua = a.kind === 'urgent' ? 0 : 1;
  const ub = b.kind === 'urgent' ? 0 : 1;
  if (ua !== ub) return ua - ub;
  const da = parseDate(a.due_at)?.getTime() ?? Infinity;
  const db = parseDate(b.due_at)?.getTime() ?? Infinity;
  return da - db || b.id - a.id;
});

export const countTasks = (tasks: Task[]) => ({
  open: tasks.filter(isOpen).length,
  fresh: tasks.filter(t => t.status === 'new').length,
  progress: tasks.filter(t => t.status === 'in_progress').length,
  hold: tasks.filter(t => t.status === 'on_hold').length,
  overdue: tasks.filter(t => t.overdue && isOpen(t)).length,
  urgent: tasks.filter(t => t.kind === 'urgent' && isOpen(t)).length,
  done: tasks.filter(t => t.status === 'done').length,
});

/** The home page's order: urgent, appointments (events and periodic), voice notes, then normal tasks */
const KIND_ORDER: Record<TaskKind, number> = { urgent: 0, scheduled: 1, voice: 2, normal: 3 };

/** What the home page may show: an appointment's task only once its alert time came (the others at once) */
export const onHome = (tasks: Task[], now = Date.now()) => tasks.filter(t => hasArrived(t, now));

/** The home page: the open tasks whose time came (by kind, late first, nearest deadline), then the archive */
export const homeTasks = (tasks: Task[], now = Date.now()) => ({
  live: onHome(tasks, now).filter(isOpen).sort((a, b) => {
    const k = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (k) return k;
    const late = Number(b.overdue) - Number(a.overdue);
    if (late) return late;
    const da = parseDate(a.due_at)?.getTime() ?? Infinity;
    const db = parseDate(b.due_at)?.getTime() ?? Infinity;
    return da - db || b.id - a.id;
  }),
  archive: sortTasks(onHome(tasks, now).filter(t => !isOpen(t))),
});

/** The appointments page's filters: the search (title, who), event / periodic, its nature, on / stopped */
export interface AppointmentFilter { query: string; schedule: '' | 'event' | 'periodic'; nature: string; status: '' | 'active' | 'paused' }

export const NO_APPOINTMENT_FILTER: AppointmentFilter = { query: '', schedule: '', nature: '', status: '' };

/** The appointments page's three filters, as on the other pages (a dropdown each; a bottom sheet on phones) */
export const APPOINTMENT_FILTERS: { key: 'schedule' | 'nature' | 'status'; label: string; icon: LucideIcon; options: { value: string; label: string }[] }[] = [
  { key: 'schedule', label: 'النوع', icon: Layers, options: [{ value: '', label: 'كل الأنواع' }, { value: 'event', label: 'مرتبطة بحدث' }, { value: 'periodic', label: 'دورية' }] },
  { key: 'nature', label: 'الطبيعة', icon: Shapes, options: NATURE_FILTERS },
  { key: 'status', label: 'الحالة', icon: Power, options: [{ value: '', label: 'كل الحالات' }, { value: 'active', label: 'مفعلة' }, { value: 'paused', label: 'متوقفة' }] },
];

export const filterAppointments = (templates: TaskTemplate[], f: AppointmentFilter, skip?: keyof AppointmentFilter) => {
  const q = f.query.trim().toLowerCase();
  return templates.filter(t => (skip === 'schedule' || !f.schedule || t.schedule === f.schedule)
    && (skip === 'nature' || !f.nature || t.nature === f.nature)
    && (skip === 'status' || !f.status || t.status === f.status)
    && (!q || [t.title, t.details, t.assignee?.name, scheduleText(t)].some(v => (v || '').toLowerCase().includes(q))));
};

/** The appointments' tasks still to come (the appointments page's other side, my appointments): their filters */
export type UpcomingFilterKey = 'source' | 'nature' | 'status' | 'given';
export type UpcomingFilters = { query: string } & Record<UpcomingFilterKey, string>;
export const NO_UPCOMING_FILTER: UpcomingFilters = { query: '', source: '', nature: '', status: '', given: '' };

/** What it comes from, its nature, its status, and whether it is given to someone */
export const UPCOMING_FILTERS: {
  key: UpcomingFilterKey; label: string; icon: LucideIcon; options: { value: string; label: string }[]; test: (t: Task, v: string) => boolean;
}[] = [
  {
    key: 'source', label: 'النوع', icon: Layers,
    options: [{ value: '', label: 'كل الأنواع' }, ...EVENTS.map(e => ({ value: e, label: EVENT_META[e].label })), { value: 'periodic', label: 'دورية' }],
    test: (t, v) => t.source === v,
  },
  {
    key: 'nature', label: 'الطبيعة', icon: Shapes,
    options: NATURE_FILTERS,
    test: (t, v) => t.nature === v,
  },
  {
    key: 'status', label: 'الحالة', icon: Filter,
    options: [{ value: '', label: 'كل الحالات' }, ...(['new', 'in_progress', 'on_hold'] as const).map(st => ({ value: st, label: STATUS_META[st].label }))],
    test: (t, v) => t.status === v,
  },
  {
    key: 'given', label: 'المكلّف', icon: UserRound,
    options: [{ value: '', label: 'الكل' }, { value: 'given', label: 'مسندة' }, { value: 'none', label: 'بلا مكلّف' }],
    test: (t, v) => (v === 'none' ? !t.assignee : Boolean(t.assignee)),
  },
];

export const filterUpcoming = (tasks: Task[], f: UpcomingFilters) => filterTasks(tasks, '', f.query)
  .filter(t => UPCOMING_FILTERS.every(x => !f[x.key] || x.test(t, f[x.key])));
