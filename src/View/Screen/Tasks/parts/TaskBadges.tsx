import React from 'react';
import { AlarmClock, Flag, Repeat, Zap, CalendarCheck } from 'lucide-react';
import { STATUS_META, priorityMeta, sourceText, type Task } from '../taskUtils';

export const StatusBadge: React.FC<{ task: Pick<Task, 'status'> }> = ({ task }) => {
  const meta = STATUS_META[task.status] || STATUS_META.assigned;
  return (
    <span className={`tk-badge tone-${meta.tone}`}>
      <meta.icon size={13} />
      {meta.label}
    </span>
  );
};

export const OverdueBadge: React.FC<{ task: Pick<Task, 'is_overdue'> }> = ({ task }) =>
  task.is_overdue ? <span className="tk-badge tone-red solid"><AlarmClock size={13} />متأخرة</span> : null;

export const PriorityBadge: React.FC<{ priority: string; hideNormal?: boolean }> = ({ priority, hideNormal }) => {
  const meta = priorityMeta(priority);
  if (hideNormal && meta.value === 'normal') return null;
  return <span className={`tk-badge tone-${meta.tone} soft`}><Flag size={12} />{meta.label}</span>;
};

/** One-time, periodic or linked to an event (match / training / meeting) */
export const KindBadge: React.FC<{ task: Pick<Task, 'source_type' | 'source_ref'>; short?: boolean }> = ({ task, short }) => {
  const Icon = task.source_type === 'periodic' ? Repeat : task.source_type === 'event' ? Zap : CalendarCheck;
  const tone = task.source_type === 'periodic' ? 'violet' : task.source_type === 'event' ? 'orange' : 'slate';
  const text = short ? ({ manual: 'مرة واحدة', periodic: 'دورية', event: 'حدث' } as Record<string, string>)[task.source_type] : sourceText(task);
  return <span className={`tk-badge soft tone-${tone}`}><Icon size={12} />{text}</span>;
};
