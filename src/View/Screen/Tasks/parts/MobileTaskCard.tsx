import React from 'react';
import { Eye, Pencil, Trash2, CalendarClock, UserRound, PenLine, Paperclip, Flag, Repeat, Zap, PauseCircle, Undo2 } from 'lucide-react';
import { MobileRowMenu, type MobileRowMenuItem } from '../../../Mobile/widgets/MobileRowMenu';
import type { TasksController } from '../useTasksController';
import { abilitiesOf, blockReasonText, dueText, priorityMeta, STATUS_META, type Task } from '../taskUtils';

/**
 * A task on phones, built like the other phone cards: the status icon box, title and reference with the ⋮ menu,
 * then a row of small chips under a dashed line. Tapping it opens the details.
 */
export const MobileTaskCard: React.FC<{ c: TasksController; task: Task; onDelete: (t: Task) => void }> = ({ c, task: t, onDelete }) => {
  const meta = STATUS_META[t.status] || STATUS_META.assigned;
  const tone = t.is_overdue ? 'red' : meta.tone;
  const me = abilitiesOf(t, c.userId, c.can);
  const mine = String(t.assignee_id) === String(c.userId ?? '');
  const prio = priorityMeta(t.priority);
  const KindIcon = t.source_type === 'periodic' ? Repeat : t.source_type === 'event' ? Zap : null;

  const items: MobileRowMenuItem[] = [
    { key: 'open', label: 'التفاصيل وتغيير الحالة', icon: Eye, color: '#3b82f6', onClick: () => c.openTask(t) },
    ...(me.canEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => c.openForm(t) }] : []),
    ...(me.canDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) }] : []),
  ];
  const open = () => c.openTask(t);

  return (
    <article className={`tk-mcard tone-${tone} ${t.status === 'approved' ? 'done' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <div className="tk-mbase-top">
        <span className="tk-mcard-status"><meta.icon size={20} /></span>
        <span className="tk-mbase-text">
          <strong>{t.title}</strong>
          <small>
            {KindIcon && <KindIcon size={11} />}
            {t.reference}
            {' · '}
            <b className={`tone-${tone}`}>{t.is_overdue ? 'متأخرة' : meta.label}</b>
          </small>
        </span>
        <MobileRowMenu items={items} label="إجراءات المهمة" />
      </div>

      {t.status === 'blocked' && t.block_reason && <p className="tk-mcard-note tone-red"><PauseCircle size={12} />{blockReasonText(t)}</p>}
      {t.status === 'returned' && t.return_reason && <p className="tk-mcard-note tone-amber"><Undo2 size={12} />{t.return_reason}</p>}

      <div className="tk-mbase-chips">
        <span className={t.is_overdue ? 'late' : ''}><CalendarClock size={12} />{t.status === 'approved' ? 'منجزة' : dueText(t)}</span>
        {prio.value !== 'normal' && <span className={`prio tone-${prio.tone}`}><Flag size={12} />{prio.label}</span>}
        {mine
          ? <span><PenLine size={12} />{t.creator_name || 'النظام'}</span>
          : <span><UserRound size={12} />{t.assignee_name}</span>}
        {(t.attachments_count ?? 0) > 0 && <span><Paperclip size={12} />{t.attachments_count}</span>}
      </div>
    </article>
  );
};
