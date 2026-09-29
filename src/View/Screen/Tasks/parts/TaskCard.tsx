import React from 'react';
import { CalendarClock, Paperclip, UserRound, PenLine, PauseCircle, Undo2 } from 'lucide-react';
import { StatusBadge, PriorityBadge, KindBadge } from './TaskBadges';
import { blockReasonText, dueText, initials, STATUS_META, type Task } from '../taskUtils';

/** One task in a list. Tasks of other people show who does them; my own tasks show who gave them */
export const TaskCard: React.FC<{ task: Task; onOpen: (t: Task) => void; userId: string | number | undefined }> = ({ task, onOpen, userId }) => {
  const showAssignee = String(task.assignee_id) !== String(userId ?? '');
  const tone = task.is_overdue ? 'red' : STATUS_META[task.status]?.tone || 'blue';
  const open = () => onOpen(task);

  return (
    <article
      className={`tk-card tone-${tone} ${task.status === 'approved' ? 'done' : ''}`}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter') open(); }}
    >
      <div className="tk-card-top">
        <StatusBadge task={task} />
        <PriorityBadge priority={task.priority} hideNormal />
        <KindBadge task={task} short />
        <span className="tk-card-ref">{task.reference}</span>
      </div>

      <h3 className="tk-card-title">{task.title}</h3>

      {task.status === 'blocked' && task.block_reason && (
        <p className="tk-card-note tone-red"><PauseCircle size={13} />{blockReasonText(task)}</p>
      )}
      {task.status === 'returned' && task.return_reason && (
        <p className="tk-card-note tone-amber"><Undo2 size={13} />{task.return_reason}</p>
      )}

      <div className="tk-card-foot">
        <span className={`tk-due ${task.is_overdue ? 'late' : ''}`}>
          <CalendarClock size={14} />{task.status === 'approved' ? 'منجزة' : dueText(task)}
        </span>
        {(task.attachments_count ?? 0) > 0 && <span className="tk-meta"><Paperclip size={13} />{task.attachments_count}</span>}
        <span className="tk-card-people">
          {showAssignee ? (
            <span className="tk-meta" title="المكلف"><UserRound size={13} />{task.assignee_name}</span>
          ) : (
            <span className="tk-meta" title="أنشأها"><PenLine size={13} />{task.creator_name || 'النظام'}</span>
          )}
          <span className="tk-avatar xs" aria-hidden="true">{initials(showAssignee ? task.assignee_name : task.creator_name)}</span>
        </span>
      </div>
    </article>
  );
};
