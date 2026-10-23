import React from 'react';
import { Pencil, Trash2, MessageCircle, Power, PowerOff } from 'lucide-react';
import { ActionsMenu, type ActionsMenuItem } from '../../../widget/ActionsMenu';
import {
  dateText, isOpen, NATURE_META, scheduleText, templateTimesText, type Task, type TaskTemplate,
} from '../taskUtils';
import { KindBadge, StatusBadge } from './TaskCard';
import '../../Members/Members.css';

/**
 * Desktop: the tasks in a table, like the members. Management: who does it; my tasks: who gave it.
 * A row opens the task; its ⋮ menu: details, the conversation, status, edit, delete.
 */
export const TaskTable: React.FC<{
  tasks: Task[];
  onOpen: (t: Task) => void;
  mine?: boolean;
  menu: (t: Task) => ActionsMenuItem[];
  /** The home page: each row in its kind's colour (urgent red, appointment orange, voice note pale blue, normal white) */
  tint?: boolean;
}> = ({ tasks, onOpen, mine, menu, tint }) => (
  <div className="members-table-wrapper">
    <table className="custom-table tk-table">
      <thead>
        <tr>
          <th>المهمة</th>
          <th>النوع</th>
          <th>الطبيعة</th>
          <th>{mine ? 'من طرف' : 'المكلّف'}</th>
          <th>آخر أجل</th>
          <th>الحالة</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(t => {
          const open = () => onOpen(t);
          const late = t.overdue && isOpen(t);
          return (
            <tr key={t.id} className={`tk-row ${isOpen(t) ? '' : 'done'} ${tint ? `tsk-tint-${t.kind}` : ''}`} tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
              <td data-label="المهمة" className="tk-title-cell">
                <strong>
                  {tint && t.kind === 'urgent' && isOpen(t) && <span className="tsk-live" aria-hidden="true" />}
                  {t.title}
                  {t.unread > 0 && <span className="tsk-unread" title="رسائل جديدة"><MessageCircle size={12} />{t.unread}</span>}
                  {mine && !t.seen && <span className="tsk-dot-new" title="جديدة" />}
                </strong>
                {t.event_label && <small>{t.event_label}</small>}
              </td>
              <td data-label="النوع"><KindBadge task={t} /></td>
              <td data-label="الطبيعة">{NATURE_META[t.nature].label}</td>
              <td data-label={mine ? 'من طرف' : 'المكلّف'}>{(mine ? t.created_by : t.assignee?.name) || '—'}</td>
              <td data-label="آخر أجل"><span className={`tk-due ${late ? 'late' : ''}`}>{t.due_at ? dateText(t.due_at) : '—'}</span></td>
              <td data-label="الحالة"><StatusBadge task={t} /></td>
              <td data-label="إجراءات" className="actions-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                <span className="tsk-menu-cell">
                  <ActionsMenu label="إجراءات المهمة" items={menu(t)} />
                  {t.unread > 0 && <i className="tsk-menu-dot" title="رسائل جديدة" />}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/** Desktop: the appointments in a table; ⋮: edit, stop / start, delete */
export const TemplateTable: React.FC<{
  templates: TaskTemplate[];
  onEdit?: (t: TaskTemplate) => void;
  onToggle?: (t: TaskTemplate) => void;
  onDelete?: (t: TaskTemplate) => void;
}> = ({ templates, onEdit, onToggle, onDelete }) => (
  <div className="members-table-wrapper">
    <table className="custom-table tk-table">
      <thead>
        <tr>
          <th>الموعد</th>
          <th>التكرار</th>
          <th>التنبيه</th>
          <th>آخر أجل</th>
          <th>المكلّف</th>
          <th>المهام</th>
          <th>الحالة</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {templates.map(t => {
          const on = t.status === 'active';
          const times = templateTimesText(t);
          const items = [
            ...(onEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => onEdit(t) }] : []),
            ...(onToggle ? [on
              ? { key: 'stop', label: 'إيقاف', icon: PowerOff, color: '#64748b', onClick: () => onToggle(t) }
              : { key: 'start', label: 'تشغيل', icon: Power, color: '#16a34a', onClick: () => onToggle(t) }] : []),
            ...(onDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) }] : []),
          ];
          return (
            <tr key={t.id} className={`tk-brow ${on ? '' : 'off'}`}>
              <td data-label="الموعد" className="tk-title-cell"><strong>{t.title}</strong></td>
              <td data-label="التكرار" className="tk-next-cell">{scheduleText(t)}</td>
              <td data-label="التنبيه" className="tk-next-cell">{times.alert}</td>
              <td data-label="آخر أجل" className="tk-next-cell">{times.due}</td>
              <td data-label="المكلّف">{t.assignee?.name || '—'}</td>
              <td data-label="المهام"><span className="tk-count">{t.tasks_count}</span></td>
              <td data-label="الحالة">
                <span className={`tk-badge tone-${on ? 'green' : 'slate'}`}>{on ? 'مفعل' : 'متوقف'}</span>
              </td>
              <td data-label="إجراءات" className="actions-cell">
                {items.length ? <ActionsMenu label="إجراءات الموعد" items={items} /> : <span className="tk-muted">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
