import React, { useState } from 'react';
import { Repeat, Zap, UserRound, UserCheck, Clock, Pencil, Trash2, CalendarClock, Power, Plus, ListTodo } from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { TaskLoader } from './TaskLoader';
import type { TasksController } from '../useTasksController';
import { dateText, minutesText, offsetText, recurrenceText, TRIGGERS, type TaskTemplate } from '../taskUtils';

/** Periodic and event-driven templates, with on / off, edit and delete */
export const TemplateList: React.FC<{ c: TasksController; mobile: boolean }> = ({ c, mobile }) => {
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);

  if (c.loading && !c.templates.length) {
    return <TaskLoader mobile={mobile} text="جاري تحميل المهام التلقائية..." />;
  }
  if (c.error) return <div className="tk-state"><ListTodo size={30} /><p>{c.error}</p></div>;

  const groups = [
    { kind: 'periodic', title: 'مهام دورية', icon: Repeat, hint: 'تُنشأ تلقائياً حسب جدول التكرار' },
    { kind: 'event', title: 'مهام مرتبطة بالأحداث', icon: Zap, hint: 'تُنشأ عند إضافة مباراة أو حصة تدريبية أو اجتماع' },
  ] as const;

  if (!c.templates.length) {
    return (
      <div className="tk-state big">
        <Repeat size={34} />
        <strong>لا توجد مهام تلقائية بعد</strong>
        <p>أنشئ مهمة تتكرر (كتقرير أسبوعي)، أو مهمة تُنشأ مع كل مباراة أو حصة تدريبية أو اجتماع.</p>
        <button type="button" className="tk-btn primary" onClick={() => c.openTemplateForm()}><Plus size={17} />مهمة تلقائية جديدة</button>
      </div>
    );
  }

  return (
    <div className="tk-templates">
      {groups.map(g => {
        const list = c.templates.filter(t => t.kind === g.kind);
        if (!list.length) return null;
        return (
          <section key={g.kind}>
            <h3 className="tk-group-title"><g.icon size={17} />{g.title}<b>{list.length}</b><small>{g.hint}</small></h3>
            <div className={mobile ? 'tk-list' : 'tk-grid'}>
              {list.map(t => {
                const trigger = TRIGGERS.find(x => x.value === t.trigger);
                const Icon = t.kind === 'periodic' ? Repeat : trigger?.icon || Zap;
                return (
                  <article key={t.id} className={`tk-tpl ${t.active ? '' : 'off'}`}>
                    <div className="tk-tpl-head">
                      <span className="tk-tpl-icon"><Icon size={19} /></span>
                      <div>
                        <strong>{t.title}</strong>
                        <small>{t.kind === 'periodic' ? recurrenceText(t.rrule) : trigger?.label}</small>
                      </div>
                      <button
                        type="button"
                        className={`tk-switch-btn ${t.active ? 'on' : ''}`}
                        onClick={() => c.toggleTemplate(t)}
                        role="switch"
                        aria-checked={t.active}
                        title={t.active ? 'إيقاف' : 'تفعيل'}
                      >
                        <Power size={14} />{t.active ? 'مفعلة' : 'متوقفة'}
                      </button>
                    </div>
                    <ul className="tk-tpl-facts">
                      <li><UserRound size={13} />{t.assignee_name}</li>
                      {t.requires_approval && <li><UserCheck size={13} />تتطلب مراجعة</li>}
                      <li><Clock size={13} />مدة الإنجاز {minutesText(t.duration_minutes)}</li>
                      {t.kind === 'event' && <li><CalendarClock size={13} />آخر أجل {offsetText(t.offset_minutes)}</li>}
                      {t.kind === 'periodic' && t.active && t.next_run_at && <li><CalendarClock size={13} />القادمة {dateText(t.next_run_at)}</li>}
                    </ul>
                    <div className="tk-tpl-foot">
                      <span>{t.tasks_count ?? 0} مهمة أنشئت</span>
                      <button type="button" className="tk-icon-btn sm" onClick={() => c.openTemplateForm(t)} aria-label="تعديل"><Pencil size={15} /></button>
                      <button type="button" className="tk-icon-btn sm danger" onClick={() => setToDelete(t)} aria-label="حذف"><Trash2 size={15} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {toDelete && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title="حذف المهمة التلقائية"
          onClose={() => setToDelete(null)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setToDelete(null)}>إلغاء</button>
              <button type="button" className="tk-btn danger" onClick={() => { c.deleteTemplate(toDelete); setToDelete(null); }}><Trash2 size={17} />حذف</button>
            </>
          )}
        >
          <p className="tk-text">لن تُنشأ مهام جديدة من «{toDelete.title}». المهام التي أنشئت سابقاً تبقى كما هي.</p>
        </TaskPanel>
      )}
    </div>
  );
};
