import React from 'react';
import { Repeat, Zap, Pencil, Trash2, ListChecks, Clock } from 'lucide-react';
import type { TasksController } from '../useTasksController';
import { initials, minutesText, parseDate, recurrenceText, TRIGGERS, type TaskTemplate } from '../taskUtils';

const MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const pad = (n: number) => String(n).padStart(2, '0');

/** May the signed-in user edit / stop / delete it: the server says so; older servers don't, then the templates permission */
const canManage = (c: TasksController, t: TaskTemplate) => t.can_manage ?? c.can('templates');

/** One base task: what, how often, when next, who, and its switch / edit / delete */
export const BaseCard: React.FC<{ c: TasksController; t: TaskTemplate; onDelete: (t: TaskTemplate) => void }> = ({ c, t, onDelete }) => {
  const periodic = t.kind === 'periodic';
  const trigger = TRIGGERS.find(x => x.value === t.trigger);
  const Icon = periodic ? Repeat : trigger?.icon || Zap;
  const next = parseDate(t.next_run_at);
  const manage = canManage(c, t);

  return (
    <article className={`tk-base ${t.active ? '' : 'off'}`}>
      <div className="tk-base-head">
        <span className="tk-base-icon"><Icon size={18} /></span>
        <div className="tk-base-title">
          <strong>{t.title.replace('{event}', '«الحدث»')}</strong>
          <small>{periodic ? recurrenceText(t.rrule) : trigger?.label}</small>
        </div>
        {manage ? (
          <button
            type="button"
            className={`tk-base-switch ${t.active ? 'on' : ''}`}
            role="switch"
            aria-checked={t.active}
            aria-label={t.active ? 'إيقاف' : 'تشغيل'}
            title={t.active ? 'مفعلة · اضغط للإيقاف' : 'متوقفة · اضغط للتشغيل'}
            onClick={() => c.toggleTemplate(t)}
          >
            <i />
          </button>
        ) : <span className={`tk-base-state ${t.active ? 'on' : ''}`}>{t.active ? 'مفعلة' : 'متوقفة'}</span>}
      </div>

      <div className="tk-base-next">
        {periodic && t.active && next ? (
          <>
            <span className="tk-base-date" aria-hidden="true">
              <small>{MONTHS[next.getMonth()]}</small>
              <b>{pad(next.getDate())}</b>
            </span>
            <span className="tk-base-next-text">
              <small>المرة التي بعدها</small>
              <strong>{DAYS[next.getDay()]} · {pad(next.getHours())}:{pad(next.getMinutes())}</strong>
            </span>
          </>
        ) : (
          <span className="tk-base-next-text">
            <small>{periodic ? 'المرة التي بعدها' : 'تُنشأ مع'}</small>
            <strong>{!t.active ? 'متوقفة' : periodic ? '—' : trigger?.label.replace('عند إضافة ', 'كل ')}</strong>
          </span>
        )}
        <span className="tk-base-meta"><Clock size={12} />{minutesText(t.duration_minutes)} للإنجاز</span>
      </div>

      <div className="tk-base-foot">
        <span className="tk-base-person">
          <span className="tk-avatar xs">{initials(t.assignee_name)}</span>
          <span>{t.assignee_name}</span>
        </span>
        <span className="tk-base-count" title="المهام التي أنشئت منها"><ListChecks size={12} />{t.tasks_count ?? 0}</span>
        {manage && (
          <span className="tk-base-actions">
            <button type="button" onClick={() => c.openTemplateForm(t)} aria-label="تعديل" title="تعديل"><Pencil size={15} /></button>
            <button type="button" className="danger" onClick={() => onDelete(t)} aria-label="حذف" title="حذف"><Trash2 size={15} /></button>
          </span>
        )}
      </div>
    </article>
  );
};
