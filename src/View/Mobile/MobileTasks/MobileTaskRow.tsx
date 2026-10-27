import React from 'react';
import { Check, MessageCircle, UserRound } from 'lucide-react';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { TaskSelection } from '../../Screen/Tasks/parts/useTaskSelection';
import { TaskChatButton } from '../../Screen/Tasks/parts/TaskCard';
import {
  dateText, isOpen, shownStatus, sourceMeta, statusView, type Task,
} from '../../Screen/Tasks/taskUtils';
import './MobileTasks.css';

/**
 * Phones: one task per row — its status icon, the title, who and when on one line, the status, and the ⋮ menu
 * (details, the conversation, status, edit, delete). Tapping it opens the details.
 */
export const MobileTaskRow: React.FC<{ task: Task; onOpen: (t: Task) => void; mine?: boolean; menu: MobileRowMenuItem[]; tint?: boolean; select?: TaskSelection; onChat?: (t: Task) => void }> = ({ task: t, onOpen, mine, menu, tint, select, onChat }) => {
  const s = statusView(t);
  // Its status in words: none for a new one (on time)
  const shown = shownStatus(t);
  const who = (mine ? t.created_by : t.assignee?.name) || '—';
  const open = () => onOpen(t);
  const picked = select?.picked(t);
  return (
    <article
      className={`tsk-mrow tone-${s.tone} ${isOpen(t) ? '' : 'done'} ${tint ? `tsk-tint-${t.kind}` : ''} ${select?.enabled ? 'tsk-selectable' : ''} ${picked ? 'tsk-picked' : ''}`}
      role="button"
      tabIndex={0}
      {...(select ? select.rowProps(t, open) : { onClick: open })}
      onKeyDown={e => { if (e.key === 'Enter') open(); }}
    >
      <span className="tsk-mrow-icon">{picked ? <Check size={19} strokeWidth={3} /> : <s.icon size={19} />}</span>
      <span className="tsk-mrow-main">
        <strong>{tint && t.kind === 'urgent' && isOpen(t) && <span className="tsk-live" aria-hidden="true" />}{t.title}</strong>
        <small>
          {who}
          {t.kind !== 'scheduled' && t.due_at && <> ·<b className={t.overdue && isOpen(t) ? 'late' : ''}>{dateText(t.due_at)}</b></>}
        </small>
      </span>
      <span className="tsk-mrow-end">
        {mine && !t.seen ? <em className="tsk-mrow-new">جديدة</em> : shown && <em className={`tsk-mrow-status tone-${shown.tone}`}>{shown.label}</em>}
        {!onChat && t.unread > 0 && <span className="tsk-unread"><MessageCircle size={11} />{t.unread}</span>}
      </span>
      <span className="tsk-menu-cell" onClick={e => e.stopPropagation()}>
        {onChat && <TaskChatButton task={t} onChat={onChat} />}
        <MobileRowMenu items={menu} label="إجراءات المهمة" />
        {!onChat && t.unread > 0 && <i className="tsk-menu-dot" />}
      </span>
    </article>
  );
};

/**
 * Phones, the home page: one task as a whole card in its kind's colour — urgent red (glowing), appointment orange,
 * voice note pale blue, normal white. Its kind and status, the full title, the event, the details, then who and new
 * messages (its deadline: in the details only); the ⋮ menu at the top. Tapping it opens the details.
 */
export const MobileHomeTaskCard: React.FC<{ task: Task; onOpen: (t: Task) => void; menu: MobileRowMenuItem[]; mine?: boolean; select?: TaskSelection; onChat?: (t: Task) => void }> = ({ task: t, onOpen, menu, mine, select, onChat }) => {
  // Its status: none for a new one (on time)
  const s = shownStatus(t);
  const src = sourceMeta(t);
  const urgent = t.kind === 'urgent' && isOpen(t);
  const open = () => onOpen(t);
  const picked = select?.picked(t);
  return (
    <article
      className={`tsk-hcard kind-${t.kind} ${urgent ? 'live' : ''} ${select?.enabled ? 'tsk-selectable' : ''} ${picked ? 'tsk-picked' : ''}`}
      role="button"
      tabIndex={0}
      {...(select ? select.rowProps(t, open) : { onClick: open })}
      onKeyDown={e => { if (e.key === 'Enter') open(); }}
    >
      <header className="tsk-hcard-top">
        {picked && <span className="tsk-pick" aria-label="محددة"><Check size={13} strokeWidth={3} /></span>}
        <span className="tsk-hcard-kind">
          {urgent && <span className="tsk-live" aria-hidden="true" />}
          <src.icon size={13} />{src.label}
        </span>
        {s && <span className={`tsk-hcard-status tone-${s.tone}`}><s.icon size={12} />{s.label}</span>}
        <span className="tsk-menu-cell" onClick={e => e.stopPropagation()}>
          {onChat && <TaskChatButton task={t} onChat={onChat} />}
          <MobileRowMenu items={menu} label="إجراءات المهمة" />
          {!onChat && t.unread > 0 && <i className="tsk-menu-dot" />}
        </span>
      </header>

      <h4 className="tsk-hcard-title">{t.title}</h4>
      {/* An appointment (match, training…): the task and who only — its event's date, deadline and details in the details */}
      {t.kind !== 'scheduled' && t.event_label && <p className="tsk-hcard-event">{t.event_label}</p>}
      {t.kind !== 'scheduled' && t.details && <p className="tsk-hcard-details">{t.details}</p>}

      <footer className="tsk-hcard-meta">
        {/* Mine (personal space): who gave it; otherwise who does it */}
        <span><UserRound size={13} />{mine ? `من طرف ${t.created_by || 'النظام'}` : t.assignee?.name || '—'}</span>
        {/* The deadline: in the details only */}
        {!onChat && t.unread > 0 && <span className="tsk-hcard-unread"><MessageCircle size={13} />{t.unread} جديدة</span>}
      </footer>
    </article>
  );
};
