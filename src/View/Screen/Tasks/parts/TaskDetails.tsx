import React, { useState } from 'react';
import {
  CalendarClock, CalendarPlus, UserRound, PenLine, Paperclip, History, PauseCircle,
  CheckCircle2, Undo2, Pencil, Trash2, Loader2, AlertTriangle, FileText, Image as ImageIcon, Link2, Type,
  Plus, X, ShieldCheck, AlertCircle, ListTodo, Repeat, Power, Hourglass, Users,
} from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { OverdueBadge, PriorityBadge, KindBadge } from './TaskBadges';
import { StatusDropdown, TaskStepper } from './TaskStatus';
import { ReasonPrompt } from './ReasonPrompt';
import { ProofForm } from './ProofForm';
import type { TasksController } from '../useTasksController';
import {
  abilitiesOf, eventMeta, PERIODIC_LEAD_DAYS, recurrenceText, TRIGGERS, blockReasonText, dateText, dueText, HISTORY_LABELS, initials, STATUS_META,
  type Task, type TaskAction, type TaskAttachment, type TaskStatus,
} from '../taskUtils';
import { DeleteTaskDialog } from './DeleteTaskDialog';

const PROOF_ICONS: Record<TaskAttachment['type'], typeof FileText> = { file: FileText, image: ImageIcon, link: Link2, text: Type };

/** Task details: title and status dropdown with the stages, then description, proofs and history next to timing, people and settings */
export const TaskDetails: React.FC<{ c: TasksController; task: Task; mobile: boolean }> = ({ c, task, mobile }) => {
  const me = abilitiesOf(task, c.userId, c.can, c.readOnly);
  // The reason asked before blocking / returning; set: chosen freely by who manages the tasks ("set" action)
  const [prompt, setPrompt] = useState<{ kind: 'block' | 'return'; set: boolean } | null>(null);
  const [addingProof, setAddingProof] = useState(false);
  const [busy, setBusy] = useState<TaskAction | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSeries, setConfirmSeries] = useState<'stop' | 'delete' | null>(null);
  const series = task.template;
  // The full base task (for its edit form), from the panel's list
  const seriesBase = series ? c.templates.find(x => x.id === series.id) : undefined;

  const attachments = task.attachments || [];
  const history = task.history || [];
  const loaded = task.history !== undefined;
  const proofMissing = task.requires_proof && attachments.length === 0;

  /**
   * A status picked in the dropdown: block / return ask for a reason first, submit needs the proof when required;
   * "set" (who manages the tasks) goes straight to the status, a blocked / returned one asking its reason too
   */
  const act = async (action: TaskAction, status?: TaskStatus) => {
    if (action === 'block' || action === 'return') return setPrompt({ kind: action, set: false });
    if (action === 'set' && (status === 'blocked' || status === 'returned')) {
      return setPrompt({ kind: status === 'blocked' ? 'block' : 'return', set: true });
    }
    if (action === 'submit' && proofMissing) {
      setError('هذه المهمة تتطلب إثباتاً: أضف صورة أو ملفاً أو نصاً أو رابطاً قبل الإرسال');
      setAddingProof(true);
      return;
    }
    setError('');
    setBusy(action);
    try {
      await c.runAction(task, action, action === 'set' ? { status } : {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const footer = (
    <div className="tk-actions">
      {me.canEdit && <button type="button" className="tk-btn ghost" onClick={() => c.openForm(task)}><Pencil size={16} />تعديل</button>}
      {me.canDelete && <button type="button" className="tk-btn ghost danger-text" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />حذف</button>}
      {!mobile && <button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={c.closeTask}>إغلاق</button>}
    </div>
  );
  const hasFooter = !mobile || me.canEdit || me.canDelete || Boolean(task.deleted_at && c.can('delete'));

  const person = (label: string, name: string | null, icon: typeof UserRound, you: boolean, empty = '—') => (
    <div className="tk-person">
      <span className="tk-avatar sm">{name ? initials(name) : '—'}</span>
      <span>
        <small>{React.createElement(icon, { size: 12 })}{label}</small>
        <strong>{name || empty}{you && <em>أنت</em>}</strong>
      </span>
    </div>
  );

  // ── The pieces, laid out below for the phone (one column) or the computer (aligned rows) ──
  const badges = (
    <div className="tk-badges">
      <KindBadge task={task} />
      <PriorityBadge priority={task.priority} />
      <OverdueBadge task={task} />
    </div>
  );
  const statusControl = c.readOnly
    ? <span className={`tk-status-pill tone-${STATUS_META[task.status]?.tone || 'slate'}`}>{STATUS_META[task.status]?.label || task.status}</span>
    : <StatusDropdown task={task} allowed={me.actions} busy={busy !== null} mobile={mobile} onPick={act} />;
  const head = (
    <section className="tk-view-head">
      <div className="tk-view-top">
        <div className="tk-view-title">
          {badges}
          <h2>{task.title}</h2>
        </div>
        {statusControl}
      </div>
      <TaskStepper task={task} />
    </section>
  );

  const alerts = (
    <>
      {task.status === 'blocked' && task.block_reason && (
        <div className="tk-alert tone-red"><PauseCircle size={18} /><span><b>سبب التعطيل</b>{blockReasonText(task)}</span></div>
      )}
      {task.status === 'returned' && task.return_reason && (
        <div className="tk-alert tone-amber"><Undo2 size={18} /><span><b>مطلوب تصحيح</b>{task.return_reason}</span></div>
      )}
      {!c.readOnly && task.status === 'in_review' && !me.actions.includes('approve') && (
        <div className="tk-alert tone-violet"><AlertTriangle size={18} /><span><b>بانتظار المراجعة</b>أُرسلت المهمة، وسيعتمدها أو يرجعها من له صلاحية المراجعة</span></div>
      )}
      {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
    </>
  );

  const descriptionBox = (
    <section className="tk-card-box">
      <div className="tk-section-head"><h3><FileText size={16} />الوصف</h3></div>
      {task.description ? <p className="tk-text">{task.description}</p> : <p className="tk-muted">لا يوجد وصف لهذه المهمة</p>}
    </section>
  );

  const proofsBox = (
    <section className="tk-card-box">
      <div className="tk-section-head">
        <h3><Paperclip size={16} />الإثباتات <b>{attachments.length}</b></h3>
        {me.canAttach && !addingProof && (
          <button type="button" className="tk-btn ghost sm" onClick={() => setAddingProof(true)}><Plus size={15} />إضافة</button>
        )}
      </div>
      {addingProof && <ProofForm onSubmit={proof => c.addProof(task, proof)} onDone={() => setAddingProof(false)} />}
      {!loaded ? (
        <p className="tk-muted"><Loader2 size={14} className="tk-spin" /> جاري التحميل...</p>
      ) : attachments.length === 0 ? (
        !addingProof && <p className="tk-muted">{task.requires_proof ? (c.readOnly ? 'هذه المهمة تتطلب إثباتاً: ارفع صورة أو ملفاً أو نصاً أو رابطاً' : 'لم يُرفع أي إثبات بعد، وهو مطلوب قبل الإرسال') : 'لا توجد إثباتات'}</p>
      ) : (
        <ul className="tk-proofs">
          {attachments.map(a => {
            const Icon = PROOF_ICONS[a.type];
            const canRemove = me.canAttach && String(a.uploaded_by ?? '') === String(c.userId ?? '');
            return (
              <li key={a.id}>
                {a.type === 'image' && a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="tk-proof-thumb"><img src={a.url} alt={a.name || 'صورة'} /></a>
                ) : (
                  <span className="tk-proof-icon"><Icon size={18} /></span>
                )}
                <div className="tk-proof-text">
                  {a.type === 'text' ? <p>{a.body}</p> : (
                    <a href={a.url || '#'} target="_blank" rel="noreferrer" dir={a.type === 'link' ? 'ltr' : undefined}>{a.name || a.url}</a>
                  )}
                  <small>{a.uploader_name} · {dateText(a.created_at)}</small>
                </div>
                {canRemove && (
                  <button type="button" className="tk-icon-btn sm" onClick={() => c.removeProof(task, a)} aria-label="حذف الإثبات"><X size={15} /></button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const historyBox = (
    <section className="tk-card-box">
      <div className="tk-section-head"><h3><History size={16} />السجل <b>{history.length}</b></h3></div>
      {!loaded ? <p className="tk-muted"><Loader2 size={14} className="tk-spin" /> جاري التحميل...</p> : (
        <ol className="tk-timeline">
          {history.slice().reverse().map(h => {
            const tone = h.to_status && h.to_status !== h.from_status ? STATUS_META[h.to_status as TaskStatus]?.tone : 'slate';
            return (
              <li key={h.id} className={`tone-${tone || 'slate'}`}>
                <span className="tk-dot" aria-hidden="true" />
                <div>
                  <strong>{HISTORY_LABELS[h.action] || h.action}</strong>
                  <small>{h.user_name || 'النظام'} · {dateText(h.created_at)}</small>
                  {h.note && <p>{h.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );

  const linkedBox = task.event && (
    <div className="tk-linked">
      <span className="tk-linked-icon">{React.createElement(eventMeta(task.event.type).icon, { size: 18 })}</span>
      <span>
        <small>{eventMeta(task.event.type).linked}</small>
        <strong>{task.event.title}</strong>
        <em>{[dateText(task.event.at), task.event.team, task.event.place].filter(Boolean).join(' · ')}</em>
      </span>
    </div>
  );

  // The periodic / automatic series this task comes from: stop it or delete it here
  const seriesBox = series && !c.readOnly && (
    <section className={`tk-series ${series.active ? '' : 'off'}`}>
      <span className="tk-series-icon"><Repeat size={18} /></span>
      <div className="tk-series-text">
        <strong>{series.kind === 'periodic' ? 'مهمة دورية' : 'مهمة تلقائية'} <em>{series.active ? 'مفعلة' : 'متوقفة'}</em></strong>
        <small>{series.kind === 'periodic' ? recurrenceText(series.rrule) : TRIGGERS.find(t => t.value === series.trigger)?.label}</small>
        <small>
          {series.active && series.next_run_at
            ? `المرة القادمة: ${dateText(series.next_run_at)}${series.kind === 'periodic' ? ` · تظهر قبل موعدها بـ ${PERIODIC_LEAD_DAYS} أيام` : ''}`
            : 'لن تُنشأ مهام جديدة'}
          {' · '}{series.tasks_count} مهمة أنشئت
        </small>
      </div>
      {(series.can_manage ?? c.can('templates')) && (
        <div className="tk-series-actions">
          {seriesBase && (
            <button type="button" className="tk-btn ghost sm" onClick={() => c.openTemplateForm(seriesBase)}><Pencil size={15} />تعديل المهمة الدورية</button>
          )}
          {series.active ? (
            <button type="button" className="tk-btn ghost sm" onClick={() => setConfirmSeries('stop')}><Power size={15} />إيقاف التكرار</button>
          ) : (
            <button type="button" className="tk-btn ghost sm" onClick={() => c.setSeriesActive(task, true)}><Power size={15} />استئناف</button>
          )}
          <button type="button" className="tk-btn ghost sm danger-text" onClick={() => setConfirmSeries('delete')}><Trash2 size={15} />حذف التكرار</button>
        </div>
      )}
    </section>
  );

  const creatorIsMe = String(task.created_by ?? '') === String(c.userId ?? '');
  const rules = (
    <ul className="tk-rule-list">
      <li className={task.requires_approval ? 'on' : ''}><ShieldCheck size={14} />{task.requires_approval ? 'تتطلب مراجعة واعتماد' : 'بدون مراجعة'}</li>
      <li className={task.requires_proof ? 'on' : ''}><Paperclip size={14} />{task.requires_proof ? 'تتطلب إثبات الإنجاز' : 'الإثبات اختياري'}</li>
    </ul>
  );

  /** Computer: one aligned cell of the information strip */
  const fact = (icon: typeof UserRound, label: string, value: React.ReactNode, extra?: React.ReactNode, tone = '') => (
    <div className={`tkd-fact ${tone}`}>
      <small>{React.createElement(icon, { size: 13 })}{label}</small>
      <strong>{value}</strong>
      {extra}
    </div>
  );
  const personValue = (name: string | null, you: boolean) => (
    <span className="tkd-person"><span className="tk-avatar xs">{name ? initials(name) : '—'}</span>{name || '—'}{you && <em>أنت</em>}</span>
  );
  const dueExtra = task.completed_at
    ? <span className="tkd-chip tone-green"><CheckCircle2 size={12} />أُنجزت {dateText(task.completed_at)}</span>
    : task.due_at && task.status !== 'approved'
      ? <span className={`tkd-chip ${task.is_overdue ? 'tone-red' : 'tone-orange'}`}><Hourglass size={12} />{dueText(task)}</span>
      : null;

  return (
    <TaskPanel mobile={mobile} size="xl" icon={ListTodo} title="تفاصيل المهمة" subtitle={task.reference || undefined} onClose={c.closeTask} footer={hasFooter ? footer : undefined}>
      {mobile ? (
        <div className="tk-view">
          {head}
          {alerts}
          <div className="tk-view-grid">
            <div className="tk-view-main">
              {descriptionBox}
              {proofsBox}
              {historyBox}
            </div>
            <aside className="tk-view-side">
              <section className="tk-card-box">
                <h3><CalendarClock size={16} />التوقيت</h3>
                <dl className="tk-facts">
                  <div><dt><CalendarPlus size={13} />البداية</dt><dd>{dateText(task.starts_at)}</dd></div>
                  <div className={task.is_overdue ? 'late' : ''}><dt><CalendarClock size={13} />آخر أجل</dt><dd>{dateText(task.due_at)}</dd></div>
                  {task.completed_at && <div><dt><CheckCircle2 size={13} />أُنجزت</dt><dd>{dateText(task.completed_at)}</dd></div>}
                </dl>
                {task.due_at && task.status !== 'approved' && (
                  <span className={`tk-countdown ${task.is_overdue ? 'late' : ''}`}><Hourglass size={14} />{dueText(task)}</span>
                )}
              </section>
              <section className="tk-card-box">
                <h3><Users size={16} />الأشخاص</h3>
                <div className="tk-people-col">
                  {person('المكلف بالتنفيذ', task.assignee_name, UserRound, me.isAssignee)}
                  {person('أنشأها', task.creator_name || 'النظام', PenLine, creatorIsMe)}
                </div>
              </section>
              <section className="tk-card-box">
                <h3><ShieldCheck size={16} />الإعدادات</h3>
                {rules}
              </section>
              {linkedBox}
              {seriesBox}
            </aside>
          </div>
        </div>
      ) : (
        // Computer: every block on the same lines and widths
        <div className="tk-view tkd">
          {head}
          {alerts}

          <section className="tkd-facts">
            {fact(CalendarPlus, 'البداية', <bdi>{dateText(task.starts_at)}</bdi>)}
            {fact(CalendarClock, 'آخر أجل', <bdi>{dateText(task.due_at)}</bdi>, dueExtra, task.is_overdue && task.status !== 'approved' ? 'late' : '')}
            {fact(UserRound, 'المكلف بالتنفيذ', personValue(task.assignee_name, me.isAssignee))}
            {fact(PenLine, 'أنشأها', personValue(task.creator_name || 'النظام', creatorIsMe))}
          </section>

          <div className="tkd-rules">{rules}</div>

          {descriptionBox}

          <div className="tkd-cols">
            {proofsBox}
            {historyBox}
          </div>

          {linkedBox}
          {seriesBox}
        </div>
      )}

      {prompt && (
        <ReasonPrompt
          mobile={mobile}
          task={task}
          kind={prompt.kind}
          onSubmit={extra => (prompt.set
            ? c.runAction(task, 'set', { ...extra, status: prompt.kind === 'block' ? 'blocked' : 'returned' })
            : c.runAction(task, prompt.kind, extra))}
          onClose={() => setPrompt(null)}
        />
      )}

      {confirmSeries && series && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title={confirmSeries === 'stop' ? 'إيقاف المهمة الدورية' : 'حذف المهمة الدورية'}
          onClose={() => setConfirmSeries(null)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setConfirmSeries(null)}>إلغاء</button>
              <button
                type="button"
                className="tk-btn danger"
                onClick={() => {
                  const what = confirmSeries;
                  setConfirmSeries(null);
                  if (what === 'stop') c.setSeriesActive(task, false);
                  else c.deleteSeries(task);
                }}
              >
                {confirmSeries === 'stop' ? <Power size={17} /> : <Trash2 size={17} />}
                {confirmSeries === 'stop' ? 'إيقاف' : 'حذف'}
              </button>
            </>
          )}
        >
          <p className="tk-text">
            {confirmSeries === 'stop'
              ? 'لن تُنشأ مهام جديدة من هذا التكرار، ويمكن استئنافه لاحقاً.'
              : 'يُحذف التكرار نهائياً ولن تُنشأ مهام جديدة منه.'}
            {' '}المهام القادمة التي لم يبدأ أحد تنفيذها تُلغى، والمهام الجارية أو المنجزة تبقى كما هي.
          </p>
        </TaskPanel>
      )}

      {confirmDelete && (
        <DeleteTaskDialog title={task.title} onConfirm={() => { setConfirmDelete(false); c.deleteTask(task); }} onClose={() => setConfirmDelete(false)} />
      )}
    </TaskPanel>
  );
};
