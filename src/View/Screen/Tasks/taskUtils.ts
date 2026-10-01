import {
  CircleDot, PlayCircle, PauseCircle, Eye, CheckCircle2, Undo2, Trophy, Dumbbell, Briefcase, Bus,
} from 'lucide-react';

export type TaskStatus = 'assigned' | 'in_progress' | 'blocked' | 'in_review' | 'approved' | 'returned';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskAction = 'start' | 'block' | 'resume' | 'submit' | 'approve' | 'return';

export interface TaskAttachment {
  id: number;
  type: 'file' | 'image' | 'text' | 'link';
  name: string | null;
  url: string | null;
  body: string | null;
  uploaded_by: number | null;
  uploader_name: string | null;
  created_at: string | null;
}

export interface TaskHistory {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  user_name: string | null;
  created_at: string | null;
}

export interface Task {
  id: number;
  reference: string | null;
  title: string;
  description: string | null;
  assignee_id: number;
  assignee_name: string | null;
  reviewer_id: number | null;
  reviewer_name: string | null;
  created_by: number | null;
  creator_name: string | null;
  priority: TaskPriority;
  starts_at: string | null;
  due_at: string | null;
  requires_approval: boolean;
  requires_proof: boolean;
  status: TaskStatus;
  is_overdue: boolean;
  block_reason: string | null;
  block_note: string | null;
  return_reason: string | null;
  source_type: 'manual' | 'periodic' | 'event';
  source_ref: string | null;
  completed_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  deleted_at: string | null;
  attachments_count: number | null;
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
  /** The linked match / training session (details only) */
  event?: TaskEvent | null;
  /** The periodic / automatic task this one was created from (details only) */
  template?: TaskSeries | null;
}

export interface TaskSeries {
  id: number;
  kind: 'periodic' | 'event';
  rrule: string | null;
  trigger: string | null;
  active: boolean;
  next_run_at: string | null;
  tasks_count: number;
  /** May stop or delete it (templates permission, or created it) */
  can_manage: boolean;
}

/** A periodic task is created this many days before its date (TaskGenerator::LEAD_DAYS) */
export const PERIODIC_LEAD_DAYS = 3;

/** An upcoming match or training session a task can be linked to */
export interface TaskEvent {
  type: 'match' | 'training' | 'meeting' | 'travel';
  id: number;
  title: string;
  at: string | null;
  team: string | null;
  place: string | null;
  detail: string | null;
}

export interface TaskTemplate {
  id: number;
  title: string;
  description: string | null;
  kind: 'periodic' | 'event';
  assignee_id: number;
  assignee_name: string | null;
  priority: TaskPriority;
  requires_approval: boolean;
  requires_proof: boolean;
  rrule: string | null;
  starts_on: string | null;
  next_run_at: string | null;
  trigger: string | null;
  offset_minutes: number;
  duration_minutes: number;
  active: boolean;
  tasks_count: number | null;
  /** May edit / stop / delete it (templates permission, or created it) */
  can_manage?: boolean;
}

export interface TaskStatsRow {
  total: number;
  open: number;
  approved: number;
  overdue: number;
  blocked: number;
  in_review: number;
  returned: number;
  on_time_rate: number | null;
}

export interface TaskStats extends TaskStatsRow {
  by_assignee: (TaskStatsRow & { assignee_id: number; assignee_name: string | null })[];
}

export interface TaskUser { id: number; name: string }

/* ── Labels ── */

export const STATUS_META: Record<TaskStatus, { label: string; tone: string; icon: typeof CircleDot }> = {
  assigned: { label: 'جديدة', tone: 'blue', icon: CircleDot },
  in_progress: { label: 'قيد التنفيذ', tone: 'orange', icon: PlayCircle },
  blocked: { label: 'معطلة', tone: 'red', icon: PauseCircle },
  in_review: { label: 'قيد المراجعة', tone: 'violet', icon: Eye },
  approved: { label: 'منجزة', tone: 'green', icon: CheckCircle2 },
  returned: { label: 'مُرجعة للتصحيح', tone: 'amber', icon: Undo2 },
};

export const PRIORITIES: { value: TaskPriority; label: string; tone: string }[] = [
  { value: 'low', label: 'منخفضة', tone: 'slate' },
  { value: 'normal', label: 'عادية', tone: 'blue' },
  { value: 'high', label: 'مرتفعة', tone: 'amber' },
  { value: 'urgent', label: 'عاجلة', tone: 'red' },
];

export const priorityMeta = (p: string) => PRIORITIES.find(x => x.value === p) || PRIORITIES[1];

export const BLOCK_REASONS: { value: string; label: string }[] = [
  { value: 'waiting_decision', label: 'بانتظار قرار' },
  { value: 'financial', label: 'مشكل مالي' },
  { value: 'missing_resources', label: 'نقص الوسائل' },
  { value: 'external', label: 'مرتبطة بجهة خارجية' },
  { value: 'other', label: 'سبب آخر' },
];

export const blockReasonText = (task: Pick<Task, 'block_reason' | 'block_note'>) => {
  const label = BLOCK_REASONS.find(r => r.value === task.block_reason)?.label || '';
  if (task.block_reason === 'other') return task.block_note || label;
  return task.block_note ? `${label}: ${task.block_note}` : label;
};

/** The events a task can be linked to, with their words and icon */
export const EVENT_TYPES: {
  value: TaskEvent['type']; label: string; the: string; linked: string; pick: string; empty: string; list: string; icon: typeof Trophy;
}[] = [
  { value: 'match', label: 'مباراة', the: 'المباراة', linked: 'المباراة المرتبطة', pick: 'اختر المباراة', empty: 'لا توجد مباريات قادمة', list: 'المباريات القادمة', icon: Trophy },
  { value: 'training', label: 'تدريب', the: 'الحصة', linked: 'الحصة التدريبية المرتبطة', pick: 'اختر الحصة التدريبية', empty: 'لا توجد حصص تدريبية قادمة', list: 'الحصص التدريبية المتاحة', icon: Dumbbell },
  { value: 'meeting', label: 'اجتماع', the: 'الاجتماع', linked: 'الاجتماع المرتبط', pick: 'اختر الاجتماع', empty: 'لا توجد اجتماعات قادمة', list: 'الاجتماعات القادمة', icon: Briefcase },
  { value: 'travel', label: 'تنقل', the: 'التنقل', linked: 'التنقل المرتبط', pick: 'اختر التنقل', empty: 'لا توجد تنقلات قادمة', list: 'التنقلات القادمة', icon: Bus },
];

export const eventMeta = (type: string | undefined) => EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[0];

export const TRIGGERS: { value: string; label: string; event: string; icon: typeof Trophy }[] = [
  { value: 'match.created', label: 'عند إضافة مباراة', event: 'المباراة', icon: Trophy },
  { value: 'training.created', label: 'عند إضافة حصة تدريبية', event: 'الحصة', icon: Dumbbell },
  { value: 'travel.created', label: 'عند إضافة تنقل', event: 'التنقل', icon: Bus },
  { value: 'meeting.created', label: 'عند إضافة اجتماع', event: 'الاجتماع', icon: Briefcase },
];

export const HISTORY_LABELS: Record<string, string> = {
  created: 'إنشاء المهمة',
  updated: 'تعديل المهمة',
  start: 'بدء التنفيذ',
  block: 'تعطيل المهمة',
  resume: 'استئناف التنفيذ',
  submit: 'إرسال للمراجعة',
  approve: 'اعتماد المهمة',
  approved: 'إنجاز المهمة',
  return: 'إرجاع للتصحيح',
  attached: 'إضافة إثبات',
  deleted: 'حذف المهمة',
  restored: 'استرجاع المهمة',
};

export const SOURCE_LABELS: Record<string, string> = {
  manual: 'مرة واحدة',
  periodic: 'دورية',
  event: 'مرتبطة بحدث',
};

/**
 * What the form creates: a one-time task, a periodic one, a task for one specific match / training session,
 * or an automatic task created with every new match / training session / meeting (trigger)
 */
export type TaskKind = 'once' | 'periodic' | 'event' | 'trigger';

/** Where an event task comes from: "match:12" → "مباراة" */
export const sourceText = (task: Pick<Task, 'source_type' | 'source_ref'>) => {
  if (task.source_type !== 'event' || !task.source_ref) return SOURCE_LABELS[task.source_type] || '';
  const kind = task.source_ref.split(':')[0];
  return ({ match: 'مرتبطة بمباراة', training: 'مرتبطة بحصة تدريبية', meeting: 'مرتبطة باجتماع', travel: 'مرتبطة بتنقل' } as Record<string, string>)[kind] || SOURCE_LABELS.event;
};

/* ── Dates ── */

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-09-29 14:30" → Date (local time) */
export const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toApiDate = (local: string) => (local ? local.replace('T', ' ') : null);
export const toInputDate = (s: string | null | undefined) => (s ? s.replace(' ', 'T').slice(0, 16) : '');
export const nowInput = (addHours = 0) => {
  const d = new Date(Date.now() + addHours * 3600000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const dateText = (s: string | null | undefined) => {
  const d = parseDate(s);
  if (!d) return '—';
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Deadline in words: "متأخرة بـ 2 يوم", "اليوم 16:00", "غداً 09:00", "بعد 5 أيام" */
export const dueText = (task: Pick<Task, 'due_at' | 'status'>) => {
  const d = parseDate(task.due_at);
  if (!d) return 'بدون أجل';
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const days = Math.round((day.getTime() - today.getTime()) / 86400000);

  if (task.status !== 'approved' && d.getTime() < Date.now()) {
    const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
    return hours < 24 ? `متأخرة بـ ${Math.max(1, hours)} سا` : `متأخرة بـ ${Math.floor(hours / 24)} يوم`;
  }
  if (days === 0) return `اليوم ${time}`;
  if (days === 1) return `غداً ${time}`;
  if (days === -1) return `أمس ${time}`;
  if (days > 1 && days < 7) return `${DAYS_AR[d.getDay()]} ${time}`;
  return dateText(task.due_at);
};

export const isToday = (s: string | null | undefined) => {
  const d = parseDate(s);
  if (!d) return false;
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

/* ── Quick filters of a task list ── */

export const TASK_FILTERS: { value: string; label: string; test: (t: Task) => boolean }[] = [
  { value: '', label: 'الكل', test: () => true },
  { value: 'today', label: 'اليوم', test: t => t.status !== 'approved' && (isToday(t.due_at) || isToday(t.starts_at)) },
  { value: 'open', label: 'غير منجزة', test: t => t.status !== 'approved' },
  { value: 'in_progress', label: 'قيد التنفيذ', test: t => t.status === 'in_progress' },
  { value: 'overdue', label: 'متأخرة', test: t => t.is_overdue },
  { value: 'returned', label: 'مُرجعة', test: t => t.status === 'returned' },
  { value: 'blocked', label: 'معطلة', test: t => t.status === 'blocked' },
  { value: 'in_review', label: 'قيد المراجعة', test: t => t.status === 'in_review' },
  { value: 'approved', label: 'منجزة', test: t => t.status === 'approved' },
];

/** Filter by how the task was made: once (manual), periodic, or linked to an event */
export const KIND_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'كل الأنواع' },
  { value: 'manual', label: 'مرة واحدة' },
  { value: 'periodic', label: 'دورية' },
  { value: 'event', label: 'مرتبطة بحدث' },
];

export const filterTasks = (tasks: Task[], filter: string, query: string, kind = '') => {
  const test = TASK_FILTERS.find(f => f.value === filter)?.test || (() => true);
  const q = query.trim().toLowerCase();
  return tasks.filter(t => test(t) && (!kind || t.source_type === kind) && (!q
    || t.title.toLowerCase().includes(q)
    || (t.reference || '').toLowerCase().includes(q)
    || (t.assignee_name || '').toLowerCase().includes(q)));
};

export const countTasks = (tasks: Task[]) => ({
  total: tasks.length,
  open: tasks.filter(t => t.status !== 'approved').length,
  today: tasks.filter(TASK_FILTERS[1].test).length,
  overdue: tasks.filter(t => t.is_overdue).length,
  returned: tasks.filter(t => t.status === 'returned').length,
  blocked: tasks.filter(t => t.status === 'blocked').length,
  in_review: tasks.filter(t => t.status === 'in_review').length,
  approved: tasks.filter(t => t.status === 'approved').length,
});

export const initials = (name: string | null | undefined) =>
  (name || '؟').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');

/* ── What the signed-in user may do on a task ── */

export interface TaskAbilities {
  isAssignee: boolean;
  /** Reviewed this task (approved or returned it) */
  isReviewer: boolean;
  actions: TaskAction[];
  canAttach: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const abilitiesOf = (task: Task, userId: string | number | undefined, can: (a: string) => boolean): TaskAbilities => {
  const me = String(userId ?? '');
  const isAssignee = me !== '' && String(task.assignee_id) === me;
  const isReviewer = me !== '' && String(task.reviewer_id ?? '') === me;
  const isCreator = me !== '' && String(task.created_by ?? '') === me;
  const actions: TaskAction[] = [];

  if (!task.deleted_at) {
    // Changing the status is open to anyone who can see the task (not only the assignee)
    if (task.status === 'assigned' || task.status === 'returned') actions.push('start');
    if (task.status === 'in_progress') actions.push('submit', 'block');
    if (task.status === 'blocked') actions.push('resume');
    // No reviewer is chosen in advance: anyone with the review permission, other than the assignee, reviews
    if (!isAssignee && can('review') && task.status === 'in_review') actions.push('approve', 'return');
  }

  return {
    isAssignee,
    isReviewer,
    actions,
    canAttach: !task.deleted_at && !['in_review', 'approved'].includes(task.status),
    canEdit: !task.deleted_at && task.status !== 'approved' && (isCreator || can('edit')),
    canDelete: !task.deleted_at && (isCreator || can('delete')),
  };
};

export const ACTION_META: Record<TaskAction, { label: string; tone: string }> = {
  start: { label: 'بدء التنفيذ', tone: 'orange' },
  submit: { label: 'إرسال للمراجعة', tone: 'violet' },
  block: { label: 'تعطيل', tone: 'red' },
  resume: { label: 'استئناف', tone: 'orange' },
  approve: { label: 'اعتماد', tone: 'green' },
  return: { label: 'إرجاع للتصحيح', tone: 'amber' },
};

/* ── Recurrence (RRULE) ── */

export const WEEK_DAYS: { code: string; label: string }[] = [
  { code: 'SA', label: 'السبت' },
  { code: 'SU', label: 'الأحد' },
  { code: 'MO', label: 'الإثنين' },
  { code: 'TU', label: 'الثلاثاء' },
  { code: 'WE', label: 'الأربعاء' },
  { code: 'TH', label: 'الخميس' },
  { code: 'FR', label: 'الجمعة' },
];

export interface Recurrence {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  days: string[];
  monthDay: number;
  time: string; // HH:mm
  until: string; // YYYY-MM-DD or ''
}

export const DEFAULT_RECURRENCE: Recurrence = { freq: 'WEEKLY', interval: 1, days: ['SU'], monthDay: 1, time: '09:00', until: '' };

export const buildRRule = (r: Recurrence) => {
  const [h, m] = r.time.split(':').map(Number);
  const parts = [`FREQ=${r.freq}`];
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.freq === 'WEEKLY' && r.days.length) parts.push(`BYDAY=${r.days.join(',')}`);
  if (r.freq === 'MONTHLY') parts.push(`BYMONTHDAY=${r.monthDay}`);
  parts.push(`BYHOUR=${h || 0}`, `BYMINUTE=${m || 0}`);
  if (r.until) parts.push(`UNTIL=${r.until.replace(/-/g, '')}`);
  return parts.join(';');
};

export const parseRRule = (rule: string | null | undefined): Recurrence => {
  if (!rule) return DEFAULT_RECURRENCE;
  const map: Record<string, string> = {};
  rule.replace(/^RRULE:/i, '').split(';').forEach(p => {
    const [k, v] = p.split('=');
    if (k && v) map[k.toUpperCase()] = v.toUpperCase();
  });
  const u = map.UNTIL?.slice(0, 8);
  return {
    freq: (['DAILY', 'WEEKLY', 'MONTHLY'].includes(map.FREQ) ? map.FREQ : 'WEEKLY') as Recurrence['freq'],
    interval: Math.max(1, Number(map.INTERVAL) || 1),
    days: map.BYDAY ? map.BYDAY.split(',') : [],
    monthDay: Math.min(31, Math.max(1, Number(map.BYMONTHDAY) || 1)),
    time: `${pad(Number(map.BYHOUR) || 0)}:${pad(Number(map.BYMINUTE) || 0)}`,
    until: u && u.length === 8 ? `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}` : '',
  };
};

/** "كل أسبوع: الأحد، الخميس على 09:00" */
export const recurrenceText = (rule: string | null | undefined) => {
  if (!rule) return '';
  const r = parseRRule(rule);
  const every = r.freq === 'DAILY'
    ? (r.interval > 1 ? `كل ${r.interval} أيام` : 'كل يوم')
    : r.freq === 'WEEKLY'
      ? (r.interval > 1 ? `كل ${r.interval} أسابيع` : 'كل أسبوع')
      : (r.interval > 1 ? `كل ${r.interval} أشهر` : 'كل شهر');
  const when = r.freq === 'WEEKLY' && r.days.length
    ? `: ${WEEK_DAYS.filter(d => r.days.includes(d.code)).map(d => d.label).join('، ')}`
    : r.freq === 'MONTHLY' ? ` يوم ${r.monthDay}` : '';
  return `${every}${when} على ${r.time}${r.until ? ` حتى ${r.until}` : ''}`;
};

/** Minutes in words: 90 → "1 سا 30 د", 2880 → "2 يوم" */
export const minutesText = (minutes: number) => {
  const m = Math.abs(minutes);
  if (m === 0) return '0 د';
  if (m % 1440 === 0) return `${m / 1440} يوم`;
  if (m % 60 === 0) return `${m / 60} سا`;
  return m > 60 ? `${Math.floor(m / 60)} سا ${m % 60} د` : `${m} د`;
};

/** When an event task is due: "قبل الحدث بـ 2 سا" */
export const offsetText = (minutes: number) =>
  minutes === 0 ? 'في وقت الحدث' : minutes < 0 ? `قبل الحدث بـ ${minutesText(minutes)}` : `بعد الحدث بـ ${minutesText(minutes)}`;
