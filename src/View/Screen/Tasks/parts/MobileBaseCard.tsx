import React from 'react';
import { Repeat, Zap, Pencil, Trash2, Power, PowerOff, CalendarClock, UserRound, ListChecks } from 'lucide-react';
import { MobileRowMenu, type MobileRowMenuItem } from '../../../Mobile/widgets/MobileRowMenu';
import type { TasksController } from '../useTasksController';
import { dateText, recurrenceText, TRIGGERS, type TaskTemplate } from '../taskUtils';

/**
 * A base periodic / automatic task on phones, built like the other phone cards:
 * icon, title and schedule with the ⋮ menu, then a row of small chips under a dashed line. Tapping it edits it.
 */
export const MobileBaseCard: React.FC<{ c: TasksController; t: TaskTemplate; onDelete: (t: TaskTemplate) => void }> = ({ c, t, onDelete }) => {
  const periodic = t.kind === 'periodic';
  const trigger = TRIGGERS.find(x => x.value === t.trigger);
  const Icon = periodic ? Repeat : trigger?.icon || Zap;
  const manage = t.can_manage ?? c.can('templates');

  const items: MobileRowMenuItem[] = manage ? [
    { key: 'edit', label: 'تعديل', icon: Pencil, color: '#3b82f6', onClick: () => c.openTemplateForm(t) },
    { key: 'toggle', label: t.active ? 'إيقاف' : 'تشغيل', icon: t.active ? PowerOff : Power, color: t.active ? '#f59e0b' : '#10b981', onClick: () => c.toggleTemplate(t) },
    { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) },
  ] : [];
  const open = () => { if (manage) c.openTemplateForm(t); };

  return (
    <article className={`tk-mbase ${t.active ? '' : 'off'}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <div className="tk-mbase-top">
        <span className="tk-mbase-icon"><Icon size={20} /></span>
        <span className="tk-mbase-text">
          <strong>{t.title.replace('{event}', '«الحدث»')}</strong>
          <small>{periodic ? recurrenceText(t.rrule) : trigger?.label}</small>
        </span>
        {items.length > 0 && <MobileRowMenu items={items} label="إجراءات المهمة الدورية" />}
      </div>
      <div className="tk-mbase-chips">
        <em className={t.active ? 'on' : 'off'}>{t.active ? 'مفعلة' : 'متوقفة'}</em>
        {periodic && t.active && t.next_run_at && <span><CalendarClock size={12} />{dateText(t.next_run_at)}</span>}
        <span><UserRound size={12} />{t.assignee_name}</span>
        <span><ListChecks size={12} />{t.tasks_count ?? 0}</span>
      </div>
    </article>
  );
};
