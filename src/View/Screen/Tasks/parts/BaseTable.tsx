import React from 'react';
import { Repeat, Zap, Pencil, Trash2, Power, PowerOff, ListChecks } from 'lucide-react';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import type { TasksController } from '../useTasksController';
import { initials, minutesText, parseDate, recurrenceText, TRIGGERS, type TaskTemplate } from '../taskUtils';
import '../../Members/Members.css';

const MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const pad = (n: number) => String(n).padStart(2, '0');

/** May the signed-in user edit / stop / delete it: the server says so; older servers don't, then the templates permission */
const canManage = (c: TasksController, t: TaskTemplate) => t.can_manage ?? c.can('templates');

/** Desktop: the base periodic (and automatic) tasks in a table, like the tasks; ⋮: edit, stop / start, delete */
export const BaseTable: React.FC<{ c: TasksController; templates: TaskTemplate[]; onDelete: (t: TaskTemplate) => void }> = ({ c, templates, onDelete }) => (
  <div className="members-table-wrapper">
    <table className="custom-table tk-table">
      <thead>
        <tr>
          <th>المهمة</th>
          <th>النوع</th>
          <th>المرة القادمة</th>
          <th>مدة الإنجاز</th>
          <th>المكلف</th>
          <th>المهام المنشأة</th>
          <th>الحالة</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {templates.map(t => {
          const periodic = t.kind === 'periodic';
          const trigger = TRIGGERS.find(x => x.value === t.trigger);
          const Icon = periodic ? Repeat : trigger?.icon || Zap;
          const next = parseDate(t.next_run_at);
          const manage = canManage(c, t);
          return (
            <tr key={t.id} className={`tk-brow ${t.active ? '' : 'off'}`}>
              <td data-label="المهمة" className="tk-title-cell">
                <strong>{t.title.replace('{event}', '«الحدث»')}</strong>
                <small><Icon size={12} />{periodic ? recurrenceText(t.rrule) : trigger?.label}</small>
              </td>
              <td data-label="النوع">
                <span className={`tk-badge soft tone-${periodic ? 'violet' : 'orange'}`}>
                  {periodic ? <Repeat size={12} /> : <Zap size={12} />}{periodic ? 'دورية' : 'مع الأحداث'}
                </span>
              </td>
              <td data-label="المرة القادمة" className="tk-next-cell">
                {!t.active ? <span className="tk-muted">متوقفة</span>
                  : periodic ? (next ? `${DAYS[next.getDay()]} ${pad(next.getDate())} ${MONTHS[next.getMonth()]} · ${pad(next.getHours())}:${pad(next.getMinutes())}` : '—')
                    : trigger?.label.replace('عند إضافة ', 'كل ')}
              </td>
              <td data-label="مدة الإنجاز">{minutesText(t.duration_minutes)}</td>
              <td data-label="المكلف">
                <span className="tk-person">
                  <span className="tk-avatar xs" aria-hidden="true">{initials(t.assignee_name)}</span>
                  {t.assignee_name || '—'}
                </span>
              </td>
              <td data-label="المهام المنشأة">
                <span className="tk-count" title="المهام التي أنشئت منها"><ListChecks size={13} />{t.tasks_count ?? 0}</span>
              </td>
              <td data-label="الحالة">
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
              </td>
              <td data-label="إجراءات" className="actions-cell">
                {manage ? (
                  <ActionsMenu
                    label="إجراءات المهمة الدورية"
                    items={[
                      { key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => c.openTemplateForm(t) },
                      t.active
                        ? { key: 'stop', label: 'إيقاف', icon: PowerOff, color: '#64748b', onClick: () => c.toggleTemplate(t) }
                        : { key: 'start', label: 'تشغيل', icon: Power, color: '#16a34a', onClick: () => c.toggleTemplate(t) },
                      { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) },
                    ]}
                  />
                ) : <span className="tk-muted">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
