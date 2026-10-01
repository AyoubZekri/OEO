import React, { useState } from 'react';
import {
  Save, Loader2, AlertCircle, UserRound, ShieldCheck, Paperclip, Repeat, Zap, Info, CalendarCheck, ListTodo, FileText,
  Users, CalendarClock, SlidersHorizontal, Trophy, CalendarRange,
} from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { UserPicker, PriorityPicker, Toggle } from './FormBits';
import { EventPicker } from './EventPicker';
import type { TasksController } from '../useTasksController';
import {
  buildRRule, DEFAULT_RECURRENCE, parseRRule, recurrenceText, offsetText, minutesText, toApiDate, toInputDate, nowInput, parseDate, dateText,
  eventMeta, PERIODIC_LEAD_DAYS, TRIGGERS, WEEK_DAYS, type Recurrence, type Task, type TaskEvent, type TaskKind, type TaskTemplate,
} from '../taskUtils';

const UNITS = [
  { value: 60, label: 'ساعة' },
  { value: 1440, label: 'يوم' },
];

/** Minutes → an amount in the biggest whole unit */
const split = (minutes: number) => {
  const m = Math.abs(minutes);
  const unit = m !== 0 && m % 1440 === 0 ? 1440 : 60;
  return { amount: String(Math.round((m / unit) * 100) / 100), unit };
};

const pad = (n: number) => String(n).padStart(2, '0');
const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const KINDS: Record<TaskKind, { label: string; hint: string; icon: typeof Repeat }> = {
  once: { label: 'مرة واحدة', hint: 'بتاريخ محدد', icon: CalendarCheck },
  event: { label: 'مرتبطة بحدث', hint: 'مباراة، تدريب، اجتماع، تنقل', icon: Trophy },
  periodic: { label: 'دورية', hint: 'تتكرر حسب جدول', icon: Repeat },
  trigger: { label: 'مع كل حدث جديد', hint: 'تُنشأ تلقائياً', icon: Zap },
};

/** A titled block of the form: icon, title, a short hint, then its fields */
const Section: React.FC<{ icon: typeof Repeat; title: string; hint?: string; children: React.ReactNode }> = ({ icon: Icon, title, hint, children }) => (
  <section className="tk-sec">
    <header>
      <span className="tk-sec-icon"><Icon size={16} /></span>
      <div><h4>{title}</h4>{hint && <small>{hint}</small>}</div>
    </header>
    <div className="tk-sec-body">{children}</div>
  </section>
);

interface TaskFormProps {
  c: TasksController;
  task: Task | null;
  template: TaskTemplate | null;
  kind: TaskKind;
  kinds: TaskKind[];
  mobile: boolean;
}

/**
 * Create or edit a task: once, for a specific upcoming match / training session, periodic, or automatically with
 * every new event. The reviewer is not chosen here: whoever reviews it is recorded.
 */
export const TaskForm: React.FC<TaskFormProps> = ({ c, task, template, kind: initialKind, kinds, mobile }) => {
  const [kind, setKind] = useState<TaskKind>(initialKind);

  const [title, setTitle] = useState(task?.title || template?.title || '');
  const [description, setDescription] = useState(task?.description || template?.description || '');
  const [assignee, setAssignee] = useState(task ? String(task.assignee_id) : template ? String(template.assignee_id) : '');
  const [priority, setPriority] = useState<string>(task?.priority || template?.priority || 'normal');
  const [needsApproval, setNeedsApproval] = useState(task?.requires_approval ?? template?.requires_approval ?? true);
  const [needsProof, setNeedsProof] = useState(task?.requires_proof ?? template?.requires_proof ?? false);

  // Once
  const [startsAt, setStartsAt] = useState(task ? toInputDate(task.starts_at) : nowInput());
  const [dueAt, setDueAt] = useState(task ? toInputDate(task.due_at) : nowInput(24));

  // A specific match / training session
  const [eventType, setEventType] = useState<TaskEvent['type']>('match');
  const [event, setEvent] = useState<TaskEvent | null>(null);

  // Deadline relative to the event (event and trigger)
  const initialOffset = split(template?.offset_minutes ?? -1440);
  const [offsetAmount, setOffsetAmount] = useState(initialOffset.amount);
  const [offsetUnit, setOffsetUnit] = useState(initialOffset.unit);
  const [offsetSide, setOffsetSide] = useState<'before' | 'after'>((template?.offset_minutes ?? -1) > 0 ? 'after' : 'before');

  // Periodic
  const [rec, setRec] = useState<Recurrence>(template?.rrule ? parseRRule(template.rrule) : DEFAULT_RECURRENCE);
  const [startsOn, setStartsOn] = useState(template?.starts_on ? toInputDate(template.starts_on) : nowInput());

  // Trigger
  const [trigger, setTrigger] = useState(template?.trigger || TRIGGERS[0].value);

  // Time to do an automatic task
  const initialDuration = split(template?.duration_minutes ?? 1440);
  const [durationAmount, setDurationAmount] = useState(initialDuration.amount);
  const [durationUnit, setDurationUnit] = useState(initialDuration.unit);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<Recurrence>) => setRec(r => ({ ...r, ...p }));
  const toggleDay = (code: string) => patch({ days: rec.days.includes(code) ? rec.days.filter(d => d !== code) : [...rec.days, code] });

  const duration = Math.round(Number(durationAmount) * durationUnit);
  const offset = Math.round(Number(offsetAmount) * offsetUnit) * (offsetSide === 'before' ? -1 : 1);
  const rrule = buildRRule(rec);
  const triggerMeta = TRIGGERS.find(t => t.value === trigger) || TRIGGERS[0];
  const eventAt = parseDate(event?.at);
  const eventDue = eventAt && !Number.isNaN(offset) ? new Date(eventAt.getTime() + offset * 60000) : null;
  const close = () => c.closeForm();

  const save = async () => {
    if (!title.trim()) return setError('اكتب عنوان المهمة');
    if (!assignee) return setError('اختر المكلف بالمهمة');
    if (kind === 'once' && startsAt && dueAt && dueAt < startsAt) return setError('آخر أجل يجب أن يكون بعد تاريخ البداية');
    if (kind === 'event' && !event) return setError(eventMeta(eventType).pick);
    if (kind === 'event' && !eventDue) return setError('هذا الحدث بدون تاريخ، حدد آخر أجل من خيار «مرة واحدة»');
    if (kind === 'event' && eventDue && eventDue.getTime() < Date.now()) return setError('آخر أجل المحسوب مرّ، غيّر المدة قبل الحدث');
    if ((kind === 'periodic' || kind === 'trigger') && !(duration > 0)) return setError('حدد المدة المتاحة للإنجاز');
    if (kind === 'periodic' && rec.freq === 'WEEKLY' && rec.days.length === 0) return setError('اختر يوماً واحداً على الأقل');
    setError('');
    setSaving(true);

    const common = {
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: Number(assignee),
      priority,
      requires_approval: needsApproval,
      requires_proof: needsProof,
    };
    try {
      if (kind === 'once') {
        await c.saveTask({ ...(task ? { id: task.id } : {}), ...common, starts_at: toApiDate(startsAt), due_at: toApiDate(dueAt) });
      } else if (kind === 'event' && event && eventDue) {
        await c.saveTask({ ...common, starts_at: toLocal(new Date()), due_at: toLocal(eventDue), event_type: event.type, event_id: event.id });
      } else {
        await c.saveTemplate({
          ...(template ? { id: template.id, active: template.active } : {}),
          ...common,
          kind: kind === 'trigger' ? 'event' : 'periodic',
          duration_minutes: duration,
          ...(kind === 'periodic' ? { rrule, starts_on: toApiDate(startsOn) } : { trigger, offset_minutes: offset }),
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const unitSeg = (unit: number, setUnit: (v: number) => void) => (
    <div className="tk-seg two">
      {UNITS.map(u => <button key={u.value} type="button" className={unit === u.value ? 'on' : ''} onClick={() => setUnit(u.value)}>{u.label}</button>)}
    </div>
  );

  const offsetFields = (
    <div className="tk-field">
      <span className="tk-label">آخر أجل للمهمة</span>
      <div className="tk-inline wrap">
        <input className="tk-input num" type="number" min={0} step="0.5" inputMode="decimal" value={offsetAmount} onChange={e => setOffsetAmount(e.target.value)} />
        {unitSeg(offsetUnit, setOffsetUnit)}
        <div className="tk-seg two">
          <button type="button" className={offsetSide === 'before' ? 'on' : ''} onClick={() => setOffsetSide('before')}>قبل</button>
          <button type="button" className={offsetSide === 'after' ? 'on' : ''} onClick={() => setOffsetSide('after')}>بعد</button>
        </div>
      </div>
    </div>
  );

  const heading = task ? 'تعديل المهمة'
    : template ? (template.kind === 'periodic' ? 'تعديل المهمة الدورية' : 'تعديل مهمة تلقائية')
      : kinds.includes('once') || kinds.includes('event') ? 'مهمة جديدة' : 'مهمة دورية جديدة';
  const HeadIcon = KINDS[kind]?.icon || ListTodo;

  return (
    <TaskPanel
      mobile={mobile}
      layer={2}
      icon={HeadIcon}
      title={heading}
      subtitle={task?.reference || undefined}
      onClose={close}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={close}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {task || template ? 'حفظ التعديلات' : 'إنشاء المهمة'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        {kinds.length > 1 && (
          <div className={`tk-kind n${kinds.length}`} role="radiogroup" aria-label="نوع المهمة">
            {kinds.map(k => {
              const meta = KINDS[k];
              return (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setError(''); }}>
                  <meta.icon size={18} /><strong>{meta.label}</strong><small>{meta.hint}</small>
                </button>
              );
            })}
          </div>
        )}

        <Section icon={FileText} title="المهمة" hint="ما المطلوب إنجازه">
          <label className="tk-field">
            <span className="tk-label">العنوان</span>
            <input className="tk-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus={!mobile && !!(task || template)}
              placeholder={kind === 'trigger' ? 'مثال: تجهيز ملابس {event}' : kind === 'periodic' ? 'مثال: التقرير الأسبوعي للعتاد' : 'مثال: تجهيز أرضية الملعب'} />
            {kind === 'trigger' && <small className="tk-hint"><Info size={12} />اكتب {'{event}'} ليُستبدل باسم الحدث، مثل «مباراة ضد النجم»</small>}
          </label>
          <label className="tk-field">
            <span className="tk-label">الوصف <em>اختياري</em></span>
            <textarea className="tk-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="تفاصيل تساعد المكلف" />
          </label>
        </Section>

        <Section icon={Users} title="التكليف" hint="من ينفذ المهمة، وما أولويتها">
          <UserPicker mobile={mobile} label="المكلف بالتنفيذ" icon={UserRound} value={assignee} users={c.users} onChange={setAssignee} />
          <PriorityPicker value={priority} onChange={setPriority} />
        </Section>

        {kind === 'once' && (
          <Section icon={CalendarClock} title="التوقيت">
            <div className="tk-grid-2">
              <label className="tk-field">
                <span className="tk-label">البداية</span>
                <input className="tk-input" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
              </label>
              <label className="tk-field">
                <span className="tk-label">آخر أجل</span>
                <input className="tk-input" type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
              </label>
            </div>
          </Section>
        )}

        {kind === 'event' && (
          <Section icon={Trophy} title="الحدث" hint="المباريات، الحصص التدريبية، الاجتماعات والتنقلات القادمة">
            <EventPicker type={eventType} onType={setEventType} value={event} onChange={setEvent} />
            {offsetFields}
            {event && eventDue && (
              <p className="tk-preview"><CalendarClock size={14} />آخر أجل: {dateText(toLocal(eventDue))} ({offsetText(offset || 0).replace('الحدث', eventMeta(event.type).the)})</p>
            )}
          </Section>
        )}

        {kind === 'periodic' && (
          <Section icon={Repeat} title="الجدولة" hint="متى تتكرر المهمة">
            <div className="tk-seg three">
              {([['DAILY', 'يومياً'], ['WEEKLY', 'أسبوعياً'], ['MONTHLY', 'شهرياً']] as const).map(([v, l]) => (
                <button key={v} type="button" className={rec.freq === v ? 'on' : ''} onClick={() => patch({ freq: v, days: v === 'WEEKLY' && !rec.days.length ? ['SU'] : rec.days })}>{l}</button>
              ))}
            </div>
            {rec.freq === 'WEEKLY' && (
              <div className="tk-days">
                {WEEK_DAYS.map(d => (
                  <button key={d.code} type="button" className={rec.days.includes(d.code) ? 'on' : ''} onClick={() => toggleDay(d.code)}>{d.label}</button>
                ))}
              </div>
            )}
            <div className="tk-grid-3">
              <label className="tk-field">
                <span className="tk-label">كل</span>
                <div className="tk-inline">
                  <input className="tk-input" type="number" min={1} max={12} value={rec.interval} onChange={e => patch({ interval: Math.max(1, Number(e.target.value) || 1) })} />
                  <span className="tk-unit">{rec.freq === 'DAILY' ? 'يوم' : rec.freq === 'WEEKLY' ? 'أسبوع' : 'شهر'}</span>
                </div>
              </label>
              {rec.freq === 'MONTHLY' && (
                <label className="tk-field">
                  <span className="tk-label">يوم الشهر</span>
                  <input className="tk-input" type="number" min={1} max={31} value={rec.monthDay} onChange={e => patch({ monthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })} />
                </label>
              )}
              <label className="tk-field">
                <span className="tk-label">الساعة</span>
                <input className="tk-input" type="time" value={rec.time} onChange={e => patch({ time: e.target.value || '09:00' })} />
              </label>
            </div>
            <div className="tk-grid-2">
              <label className="tk-field">
                <span className="tk-label">تبدأ من</span>
                <input className="tk-input" type="datetime-local" value={startsOn} onChange={e => setStartsOn(e.target.value)} />
              </label>
              <label className="tk-field">
                <span className="tk-label">تنتهي في <em>اختياري</em></span>
                <input className="tk-input" type="date" value={rec.until} onChange={e => patch({ until: e.target.value })} />
              </label>
            </div>
            <p className="tk-preview"><CalendarRange size={14} />{recurrenceText(rrule)} · تظهر كل مهمة قبل موعدها بـ {PERIODIC_LEAD_DAYS} أيام</p>
          </Section>
        )}

        {kind === 'trigger' && (
          <Section icon={Zap} title="الحدث" hint="تُنشأ المهمة تلقائياً مع كل حدث جديد">
            <div className="tk-choice-list">
              {TRIGGERS.map(t => (
                <button key={t.value} type="button" className={trigger === t.value ? 'on' : ''} onClick={() => setTrigger(t.value)}>
                  <t.icon size={16} />{t.label}
                </button>
              ))}
            </div>
            {offsetFields}
            <p className="tk-preview"><Zap size={14} />آخر أجل كل مهمة {offsetText(offset || 0).replace('الحدث', triggerMeta.event)}</p>
          </Section>
        )}

        {(kind === 'periodic' || kind === 'trigger') && (
          <div className="tk-field">
            <span className="tk-label">المدة المتاحة للإنجاز</span>
            <div className="tk-inline">
              <input className="tk-input num" type="number" min={0} step="0.5" inputMode="decimal" value={durationAmount} onChange={e => setDurationAmount(e.target.value)} />
              {unitSeg(durationUnit, setDurationUnit)}
            </div>
            {duration > 0 && (
              <small className="tk-hint"><Info size={12} />
                {kind === 'periodic' ? `كل مهمة تبدأ في موعدها وآخر أجل لها بعد ${minutesText(duration)}` : `تبدأ المهمة قبل آخر أجل بـ ${minutesText(duration)}`}
              </small>
            )}
          </div>
        )}

        <Section icon={SlidersHorizontal} title="الخيارات">
          <Toggle checked={needsApproval} onChange={setNeedsApproval} icon={ShieldCheck} title="تتطلب مراجعة واعتماد" hint="يعتمدها أو يرجعها من له صلاحية المراجعة" />
          <Toggle checked={needsProof} onChange={setNeedsProof} icon={Paperclip} title="تتطلب إثبات الإنجاز" hint="صورة أو ملف أو نص أو رابط قبل الإرسال" />
        </Section>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </TaskPanel>
  );
};
