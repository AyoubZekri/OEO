import React, { useState } from 'react';
import { Eye, Pencil, Trash2, PauseCircle, Undo2, Paperclip } from 'lucide-react';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { StatusBadge, PriorityBadge, KindBadge } from './TaskBadges';
import type { TasksController } from '../useTasksController';
import { abilitiesOf, blockReasonText, dueText, initials, type Task } from '../taskUtils';
import '../../Members/Members.css';
import { DeleteTaskDialog } from './DeleteTaskDialog';

/**
 * Desktop: the tasks in a table, like the members.
 * Management: who does each task; my tasks (personal): who gave it. A row opens the task;
 * its ⋮ menu: details, edit and delete (with the same rights as the details page).
 */
export const TaskTable: React.FC<{ tasks: Task[]; c: TasksController }> = ({ tasks, c }) => {
  const personal = c.readOnly;
  const [toDelete, setToDelete] = useState<Task | null>(null);

  return (
  <>
  <div className="members-table-wrapper">
    <table className="custom-table tk-table">
      <thead>
        <tr>
          <th>المرجع</th>
          <th>المهمة</th>
          <th>النوع</th>
          <th>الحالة</th>
          <th>الأولوية</th>
          <th>{personal ? 'من طرف' : 'المكلف'}</th>
          <th>الأجل</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const person = personal ? task.creator_name || 'النظام' : task.assignee_name;
          const open = () => c.openTask(task);
          const me = abilitiesOf(task, c.userId, c.can, c.readOnly);
          return (
            <tr
              key={task.id}
              className={`tk-row ${task.status === 'approved' ? 'done' : ''}`}
              tabIndex={0}
              onClick={open}
              onKeyDown={e => { if (e.key === 'Enter') open(); }}
            >
              <td data-label="المرجع" className="tk-ref-cell">{task.reference}</td>
              <td data-label="المهمة" className="tk-title-cell">
                <strong>{task.title}</strong>
                {task.status === 'blocked' && task.block_reason && (
                  <small className="tone-red"><PauseCircle size={12} />{blockReasonText(task)}</small>
                )}
                {task.status === 'returned' && task.return_reason && (
                  <small className="tone-amber"><Undo2 size={12} />{task.return_reason}</small>
                )}
                {(task.attachments_count ?? 0) > 0 && (
                  <small className="tk-attach"><Paperclip size={12} />{task.attachments_count} مرفق</small>
                )}
              </td>
              <td data-label="النوع"><KindBadge task={task} short /></td>
              <td data-label="الحالة"><StatusBadge task={task} /></td>
              <td data-label="الأولوية"><PriorityBadge priority={task.priority} /></td>
              <td data-label={personal ? 'من طرف' : 'المكلف'}>
                <span className="tk-person">
                  <span className="tk-avatar xs" aria-hidden="true">{initials(person)}</span>
                  {person || '—'}
                </span>
              </td>
              <td data-label="الأجل">
                <span className={`tk-due ${task.is_overdue && task.status !== 'approved' ? 'late' : ''}`}>
                  {task.status === 'approved' ? 'منجزة' : dueText(task)}
                </span>
              </td>
              {/* The menu's clicks do not open the row */}
              <td data-label="إجراءات" className="actions-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                <ActionsMenu
                  label="إجراءات المهمة"
                  items={[
                    { key: 'open', label: 'عرض التفاصيل', icon: Eye, color: '#3b82f6', onClick: open },
                    ...(me.canEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => c.openForm(task) }] : []),
                    ...(me.canDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => setToDelete(task) }] : []),
                  ]}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  {toDelete && (
    <DeleteTaskDialog title={toDelete.title} onConfirm={() => { c.deleteTask(toDelete); setToDelete(null); }} onClose={() => setToDelete(null)} />
  )}
  </>
  );
};
