import React from 'react';
import { ListTodo, CheckCircle2, AlarmClock, PauseCircle, Eye, Undo2, Users, CalendarRange, X } from 'lucide-react';
import { TaskLoader } from './TaskLoader';
import type { TasksController } from '../useTasksController';
import { initials } from '../taskUtils';

const Ring: React.FC<{ value: number | null }> = ({ value }) => {
  const r = 42;
  const len = 2 * Math.PI * r;
  const v = value ?? 0;
  const tone = value === null ? 'slate' : v >= 80 ? 'green' : v >= 50 ? 'amber' : 'red';
  return (
    <div className={`tk-ring tone-${tone}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="bg" />
        <circle cx="50" cy="50" r={r} className="fg" strokeDasharray={len} strokeDashoffset={len * (1 - v / 100)} />
      </svg>
      <span><strong>{value === null ? '—' : `${v}%`}</strong><small>في الوقت</small></span>
    </div>
  );
};

/** Manager dashboard: counts, the on-time rate (approved by the deadline ÷ approved) and a row per assignee */
export const TaskDashboard: React.FC<{ c: TasksController; mobile: boolean }> = ({ c, mobile }) => {
  const s = c.stats;

  const period = (
    <div className="tk-period">
      <CalendarRange size={16} />
      <label><small>من</small><input type="date" value={c.period.from} onChange={e => c.setPeriod({ ...c.period, from: e.target.value })} /></label>
      <label><small>إلى</small><input type="date" value={c.period.to} onChange={e => c.setPeriod({ ...c.period, to: e.target.value })} /></label>
      {(c.period.from || c.period.to) && (
        <button type="button" className="tk-icon-btn sm" onClick={() => c.setPeriod({ from: '', to: '' })} aria-label="كل الفترات"><X size={15} /></button>
      )}
    </div>
  );

  if (!s) {
    return (
      <div className="tk-dash">
        {period}
        {c.error ? <div className="tk-state"><ListTodo size={30} /><p>{c.error}</p></div> : <TaskLoader mobile={mobile} text="جاري تحميل لوحة المتابعة..." />}
      </div>
    );
  }

  const tiles = [
    { label: 'كل المهام', value: s.total, icon: ListTodo, tone: 'blue' },
    { label: 'منجزة', value: s.approved, icon: CheckCircle2, tone: 'green' },
    { label: 'متأخرة', value: s.overdue, icon: AlarmClock, tone: 'red' },
    { label: 'معطلة', value: s.blocked, icon: PauseCircle, tone: 'red' },
    { label: 'قيد المراجعة', value: s.in_review, icon: Eye, tone: 'violet' },
    { label: 'مُرجعة', value: s.returned, icon: Undo2, tone: 'amber' },
  ];

  return (
    <div className={`tk-dash ${mobile ? 'mobile' : ''}`}>
      {period}
      <div className="tk-dash-top">
        <section className="tk-panel tk-rate">
          <Ring value={s.on_time_rate} />
          <div>
            <h3>نسبة الإنجاز في الوقت</h3>
            <p>المهام المعتمدة قبل آخر أجل من بين كل المهام المعتمدة{c.period.from || c.period.to ? ' في الفترة المحددة' : ''}.</p>
            <div className="tk-rate-bar">
              <span style={{ width: `${s.total ? (s.approved * 100) / s.total : 0}%` }} />
            </div>
            <small>{s.approved} منجزة من {s.total} · {s.open} مفتوحة</small>
          </div>
        </section>
        <div className="tk-tiles">
          {tiles.map(t => (
            <div key={t.label} className={`tk-tile tone-${t.tone}`}>
              <span className="tk-tile-icon"><t.icon size={18} /></span>
              <strong>{t.value}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      </div>

      <section className="tk-panel">
        <h3 className="tk-panel-title"><Users size={17} />حسب المكلف</h3>
        {s.by_assignee.length === 0 ? <p className="tk-muted">لا توجد مهام في هذه الفترة</p> : (
          <div className="tk-people-table">
            {!mobile && (
              <div className="tk-pt-head">
                <span>المكلف</span><span>المهام</span><span>منجزة</span><span>متأخرة</span><span>معطلة</span><span>في الوقت</span>
              </div>
            )}
            {s.by_assignee.map(row => (
              <div key={row.assignee_id} className="tk-pt-row">
                <span className="tk-pt-name"><span className="tk-avatar sm">{initials(row.assignee_name)}</span>{row.assignee_name || '—'}</span>
                {mobile ? (
                  <span className="tk-pt-chips">
                    <em>{row.total} مهمة</em>
                    <em className="tone-green">{row.approved} منجزة</em>
                    {row.overdue > 0 && <em className="tone-red">{row.overdue} متأخرة</em>}
                    {row.blocked > 0 && <em className="tone-red">{row.blocked} معطلة</em>}
                    <b>{row.on_time_rate === null ? '—' : `${row.on_time_rate}%`}</b>
                  </span>
                ) : (
                  <>
                    <span>{row.total}</span>
                    <span className="tone-green">{row.approved}</span>
                    <span className={row.overdue ? 'tone-red' : ''}>{row.overdue}</span>
                    <span className={row.blocked ? 'tone-red' : ''}>{row.blocked}</span>
                    <span className="tk-pt-rate">
                      <i><em style={{ width: `${row.on_time_rate ?? 0}%` }} /></i>
                      {row.on_time_rate === null ? '—' : `${row.on_time_rate}%`}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
