import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, FileText, UserRound, Layers, Shapes, CalendarClock, CalendarDays, BellRing, Repeat, Zap, Info } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { UserPicker } from '../../../shared/FormBits';
import { toApiDate, toInputDate } from '../../../shared/dates';
import type { TasksAdmin } from '../useTasks';
import {
  durationText, EVENT_META, EVENTS, eventOffsetText, KIND_META, NATURE_META, WEEK_DAYS,
  type EventType, type Task, type TaskKind, type TaskNature, type TaskTemplate,
} from '../taskUtils';

const UNITS = [{ value: 60, label: 'ساعة' }, { value: 1440, label: 'يوم' }];

/** Minutes → an amount in the biggest whole unit, and before / after */
const split = (minutes: number) => {
  const m = Math.abs(minutes);
  const unit = m !== 0 && m % 1440 === 0 ? 1440 : 60;
  return { amount: String(Math.round((m / unit) * 100) / 100), unit, before: minutes <= 0 };
};
const pad = (n: number) => String(n).padStart(2, '0');
/** A periodic appointment's time, from the task's day start: «يوم المهمة 08:00», «اليوم السابق 22:00», «بعد يومين 08:00» */
const periodicText = (minutes: number) => {
  const days = Math.floor(minutes / 1440);
  const rest = minutes - days * 1440;
  const time = `${pad(Math.floor(rest / 60))}:${pad(rest % 60)}`;
  const day = days === 0 ? 'يوم المهمة' : days === 1 ? 'اليوم التالي' : days === -1 ? 'اليوم السابق'
    : days > 0 ? `بعد ${durationText(days * 1440)}` : `قبل ${durationText(days * 1440)}`;
  return `${day} ${time}`;
};

/** An appointment's alert or deadline: its name and what it comes to («قبل المباراة بيومين»), then its controls */
const TimeBox: React.FC<{ label: string; icon: typeof Info; tone: 'orange' | 'blue'; summary?: string; children: React.ReactNode }> = ({ label, icon: Icon, tone, summary, children }) => (
  <div className={`tsk-time tone-${tone}`}>
    <span className="tk-label tsk-time-head"><Icon size={14} />{label}{summary && <em>{summary}</em>}</span>
    {children}
  </div>
);

type Offset = { amount: string; unit: number; before: boolean };

/** An appointment's alert or deadline, in reading order: «قبل / بعد», an amount, hour / day (from the event, or the periodic day's start) */
const EventOffset: React.FC<{ value: Offset; onChange: (v: Offset) => void }> = ({ value, onChange }) => (
  <div className="tsk-time-row three">
    <div className="tk-seg two">
      <button type="button" className={value.before ? 'on' : ''} onClick={() => onChange({ ...value, before: true })}>قبل</button>
      <button type="button" className={!value.before ? 'on' : ''} onClick={() => onChange({ ...value, before: false })}>بعد</button>
    </div>
    <input className="tk-input num" type="number" min={0} step="1" inputMode="numeric" value={value.amount} onChange={e => onChange({ ...value, amount: e.target.value })} aria-label="المدة" />
    <div className="tk-seg two">
      {UNITS.map(u => <button key={u.value} type="button" className={value.unit === u.value ? 'on' : ''} onClick={() => onChange({ ...value, unit: u.value })}>{u.label}</button>)}
    </div>
  </div>
);

/**
 * A new task, all its fields in one block, in the order it is thought of: what it is, who does it, its kind, then its nature.
 * Kinds: normal (an optional deadline); urgent (given at once, no deadline: only what to do, who, and its nature);
 * appointment (here or on the appointments page): with every new event or periodic, with its alert and deadline.
 * The voice note has its own form. Editing shows the same form with the task's data: a normal task can become urgent
 * and back; an appointment's task keeps its kind, its own alert and deadline can be changed.
 */
export const TaskForm: React.FC<{ c: TasksAdmin; task?: Task; template?: TaskTemplate; appointment?: boolean; mobile: boolean }> = ({ c, task, template, appointment, mobile }) => {
  const editing = Boolean(task || template);
  const [title, setTitle] = useState(task?.title || template?.title || '');
  const [details, setDetails] = useState(task?.details || template?.details || '');
  const [assignee, setAssignee] = useState(String(task?.assignee?.id ?? template?.assignee?.id ?? ''));
  const [kind, setKind] = useState<TaskKind>(template || appointment || (!task && !c.can('add')) ? 'scheduled' : task?.kind || 'normal');
  const [nature, setNature] = useState<TaskNature | ''>(task?.nature || template?.nature || '');
  const [dueAt, setDueAt] = useState(toInputDate(task?.due_at));
  // A task an appointment created: its own alert and deadline (this task only)
  const generated = task?.kind === 'scheduled';
  const [alertAt, setAlertAt] = useState(toInputDate(task?.alert_at));

  // The appointment
  const [schedule, setSchedule] = useState<'event' | 'periodic'>(template?.schedule || 'event');
  const [eventType, setEventType] = useState<EventType>(template?.event_type || 'match');
  const [alertOff, setAlertOff] = useState(split(template?.schedule === 'event' ? template.alert_offset : -2880));
  const [dueOff, setDueOff] = useState(split(template?.schedule === 'event' ? template.due_offset : -1440));
  const [repeat, setRepeat] = useState<'weekly' | 'monthly'>(template?.repeat || 'weekly');
  const [weekDay, setWeekDay] = useState(template?.repeat === 'weekly' ? template.repeat_day || 7 : 7);
  const [monthDay, setMonthDay] = useState(template?.repeat === 'monthly' ? template.repeat_day || 1 : 1);
  const periodic = template?.schedule === 'periodic' ? template : null;
  // From the periodic day's start: by default the alert at 08:00 and the deadline at 18:00 that day
  const [pAlertOff, setPAlertOff] = useState(split(periodic ? periodic.alert_offset : 480));
  const [pDueOff, setPDueOff] = useState(split(periodic ? periodic.due_offset : 1080));

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const eventMinutes = (v: typeof alertOff) => Math.round((Number(v.amount) || 0) * v.unit) * (v.before ? -1 : 1);
  const alertMinutes = eventMinutes(schedule === 'event' ? alertOff : pAlertOff);
  const dueMinutes = eventMinutes(schedule === 'event' ? dueOff : pDueOff);
  // An appointment's schedule (a task an appointment created keeps its dates)
  const scheduled = kind === 'scheduled' && !task;
  // Only a normal task has a deadline of its own
  const withDeadline = kind === 'normal';

  const save = async () => {
    if (!title.trim()) return setError('اكتب المهمة');
    if (!assignee) return setError('اختر المكلّف بالمهمة');
    if (scheduled && dueMinutes < alertMinutes) return setError('آخر أجل يكون بعد التنبيه');
    if (generated && alertAt && dueAt && dueAt < alertAt) return setError('آخر أجل يكون بعد التنبيه');
    if (!nature) return setError('اختر طبيعة المهمة: داخلية، خارجية أو اتصال');
    setError('');
    setSaving(true);
    try {
      await c.save({
        ...(task ? { id: task.id } : template ? { id: template.id } : {}),
        title: title.trim(),
        details: kind === 'urgent' ? null : details.trim() || null,
        kind,
        nature,
        assignee_id: Number(assignee),
        ...(scheduled
          ? {
            schedule,
            event_type: schedule === 'event' ? eventType : null,
            repeat: schedule === 'periodic' ? repeat : null,
            repeat_day: schedule === 'periodic' ? (repeat === 'weekly' ? weekDay : monthDay) : null,
            alert_offset: alertMinutes,
            due_offset: dueMinutes,
          }
          : generated ? { alert_at: toApiDate(alertAt), due_at: toApiDate(dueAt) }
            : withDeadline ? { due_at: toApiDate(dueAt) } : {}),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const heading = template ? 'تعديل الموعد' : appointment ? 'موعد جديد' : task ? 'تعديل المهمة' : 'مهمة جديدة';
  const kinds: TaskKind[] = ['normal', 'urgent', 'scheduled'];
  // Editing: a normal task can become urgent and back; an appointment's task stays one
  // A new one: only the kinds this role may give (a task: «إسناد مهمة»; an appointment: the appointments' «إضافة»)
  const kindLocked = (k: TaskKind) => (task
    ? (generated ? k !== 'scheduled' : k === 'scheduled')
    : !(k === 'scheduled' ? c.canAppointments('add') : c.can('add')));

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      icon={KIND_META[kind].icon}
      title={heading}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {editing ? 'حفظ التعديلات' : scheduled ? 'حفظ الموعد' : 'تأكيد'}
          </button>
        </>
      )}
    >
      <div className={`tk-form calm tsk-form ${mobile ? 'phone' : ''}`}>
        <section className="tk-sec tv-sec">
          <div className="tk-sec-body">
            <label className="tk-field">
              <span className="tk-label"><FileText size={14} />المهمة</span>
              <input className="tk-input" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
            </label>
            {kind !== 'urgent' && (
              <label className="tk-field">
                <span className="tk-label">التفاصيل <em>اختياري</em></span>
                <textarea className="tk-input" rows={2} value={details} onChange={e => setDetails(e.target.value)} />
              </label>
            )}

            <UserPicker mobile={mobile} label="المكلّف بالمهمة" icon={UserRound} value={assignee} users={c.users} onChange={setAssignee} placeholder="اختر العضو" />

            {!appointment && !template && (
              <div className="tk-field">
                <span className="tk-label"><Layers size={14} />النوع</span>
                <div className="tk-kind n3" role="radiogroup" aria-label="نوع المهمة">
                  {kinds.map(k => {
                    const meta = KIND_META[k];
                    return (
                      <button key={k} type="button" role="radio" aria-checked={kind === k} className={`tone-${meta.tone} ${kind === k ? 'on' : ''}`} disabled={kindLocked(k)} onClick={() => { setKind(k); setError(''); }}>
                        <span className="tsk-kind-icon"><meta.icon size={18} /></span><strong>{meta.label}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {generated && (
              <>
                <TimeBox label="التنبيه" icon={BellRing} tone="orange" summary={task?.event_label || undefined}>
                  <div className="tsk-time-row">
                    <input className="tk-input" type="datetime-local" value={alertAt} onChange={e => setAlertAt(e.target.value)} aria-label="التنبيه" />
                  </div>
                </TimeBox>
                <TimeBox label="آخر أجل" icon={CalendarClock} tone="blue">
                  <div className="tsk-time-row">
                    <input className="tk-input" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} aria-label="آخر أجل" />
                  </div>
                </TimeBox>
              </>
            )}

            {withDeadline && (
              <label className="tk-field">
                <span className="tk-label"><CalendarClock size={14} />آخر أجل <em>اختياري</em></span>
                <input className="tk-input" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
              </label>
            )}

            {scheduled && (
              <>
                <span className="tk-label"><CalendarClock size={14} />الموعد</span>
                <div className="tk-seg two">
                  <button type="button" className={schedule === 'event' ? 'on' : ''} onClick={() => setSchedule('event')}><Zap size={15} />مرتبطة بحدث</button>
                  <button type="button" className={schedule === 'periodic' ? 'on' : ''} onClick={() => setSchedule('periodic')}><Repeat size={15} />دورية</button>
                </div>

                {schedule === 'event' ? (
                  <>
                    <div className="tk-choice-list tsk-events">
                      {EVENTS.filter(e => e !== 'birthday' || template?.event_type === 'birthday').map(e => {
                        const meta = EVENT_META[e];
                        return (
                          <button key={e} type="button" className={eventType === e ? 'on' : ''} onClick={() => setEventType(e)}>
                            <meta.icon size={16} />{meta.every}
                          </button>
                        );
                      })}
                    </div>
                    <TimeBox label="التنبيه" icon={BellRing} tone="orange" summary={eventOffsetText(alertMinutes, eventType)}>
                      <EventOffset value={alertOff} onChange={setAlertOff} />
                    </TimeBox>
                    <TimeBox label="آخر أجل" icon={CalendarClock} tone="blue" summary={eventOffsetText(dueMinutes, eventType)}>
                      <EventOffset value={dueOff} onChange={setDueOff} />
                    </TimeBox>
                  </>
                ) : (
                  <>
                    <div className="tk-field">
                      <span className="tk-label"><Repeat size={14} />التكرار</span>
                      <div className="tk-seg two">
                        <button type="button" className={repeat === 'weekly' ? 'on' : ''} onClick={() => setRepeat('weekly')}>كل أسبوع</button>
                        <button type="button" className={repeat === 'monthly' ? 'on' : ''} onClick={() => setRepeat('monthly')}>كل شهر</button>
                      </div>
                    </div>
                    {repeat === 'weekly' ? (
                      <div className="tk-field">
                        <span className="tk-label"><CalendarDays size={14} />يوم المهمة</span>
                        <div className="tk-days tsk-week">
                          {WEEK_DAYS.map(d => <button key={d.value} type="button" className={weekDay === d.value ? 'on' : ''} onClick={() => setWeekDay(d.value)}>{d.label}</button>)}
                        </div>
                      </div>
                    ) : (
                      <label className="tk-field">
                        <span className="tk-label"><CalendarDays size={14} />يوم الشهر</span>
                        <input className="tk-input tsk-month-day" type="number" min={1} max={31} inputMode="numeric" value={monthDay} onChange={e => setMonthDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
                      </label>
                    )}
                    <TimeBox label="التنبيه" icon={BellRing} tone="orange" summary={periodicText(alertMinutes)}>
                      <EventOffset value={pAlertOff} onChange={setPAlertOff} />
                    </TimeBox>
                    <TimeBox label="آخر أجل" icon={CalendarClock} tone="blue" summary={periodicText(dueMinutes)}>
                      <EventOffset value={pDueOff} onChange={setPDueOff} />
                    </TimeBox>
                  </>
                )}
              </>
            )}

            <div className="tk-field">
              <span className="tk-label"><Shapes size={14} />طبيعة المهمة</span>
              <div className="tk-seg three tsk-nature">
                {(Object.keys(NATURE_META) as TaskNature[]).map(n => {
                  const meta = NATURE_META[n];
                  return <button key={n} type="button" className={nature === n ? 'on' : ''} onClick={() => { setNature(n); setError(''); }}><meta.icon size={15} />{meta.label}</button>;
                })}
              </div>
            </div>
          </div>
        </section>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </SidePanel>
  );
};
