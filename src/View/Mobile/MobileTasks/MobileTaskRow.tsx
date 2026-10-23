import React from 'react';
import { MessageCircle, Pencil, Trash2, Power, PowerOff, UserRound, CalendarClock } from 'lucide-react';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import {
  dateText, dueText, EVENT_META, isOpen, PERIODIC_ICON, scheduleText, sourceMeta, statusView, type Task, type TaskTemplate,
} from '../../Screen/Tasks/taskUtils';
import './MobileTasks.css';

/**
 * Phones: one task per row — its status icon, the title, who and when on one line, the status, and the ⋮ menu
 * (details, the conversation, status, edit, delete). Tapping it opens the details.
 */
export const MobileTaskRow: React.FC<{ task: Task; onOpen: (t: Task) => void; mine?: boolean; menu: MobileRowMenuItem[]; tint?: boolean }> = ({ task: t, onOpen, mine, menu, tint }) => {
  const s = statusView(t);
  const who = (mine ? t.created_by : t.assignee?.name) || '—';
  const open = () => onOpen(t);
  return (
    <article className={`tsk-mrow tone-${s.tone} ${isOpen(t) ? '' : 'done'} ${tint ? `tsk-tint-${t.kind}` : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <span className="tsk-mrow-icon"><s.icon size={19} /></span>
      <span className="tsk-mrow-main">
        <strong>{tint && t.kind === 'urgent' && isOpen(t) && <span className="tsk-live" aria-hidden="true" />}{t.title}</strong>
        <small>
          {who}
          {t.due_at && <> · <b className={t.overdue && isOpen(t) ? 'late' : ''}>{dateText(t.due_at)}</b></>}
        </small>
      </span>
      <span className="tsk-mrow-end">
        {mine && !t.seen ? <em className="tsk-mrow-new">جديدة</em> : <em className={`tsk-mrow-status tone-${s.tone}`}>{s.label}</em>}
        {t.unread > 0 && <span className="tsk-unread"><MessageCircle size={11} />{t.unread}</span>}
      </span>
      <span className="tsk-menu-cell" onClick={e => e.stopPropagation()}>
        <MobileRowMenu items={menu} label="إجراءات المهمة" />
        {t.unread > 0 && <i className="tsk-menu-dot" />}
      </span>
    </article>
  );
};

/** Phones: one appointment per row — its icon, the title, when and who, its state and the ⋮ menu */
export const MobileTemplateRow: React.FC<{
  t: TaskTemplate;
  onEdit?: (t: TaskTemplate) => void;
  onToggle?: (t: TaskTemplate) => void;
  onDelete?: (t: TaskTemplate) => void;
}> = ({ t, onEdit, onToggle, onDelete }) => {
  const on = t.status === 'active';
  const items: MobileRowMenuItem[] = [
    ...(onEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#3b82f6', onClick: () => onEdit(t) }] : []),
    ...(onToggle ? [{ key: 'toggle', label: on ? 'إيقاف' : 'تشغيل', icon: on ? PowerOff : Power, color: on ? '#f59e0b' : '#10b981', onClick: () => onToggle(t) }] : []),
    ...(onDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) }] : []),
  ];
  const open = () => onEdit?.(t);

  return (
    <article className={`tsk-mrow tone-violet ${on ? '' : 'done'}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <span className="tsk-mrow-icon">{React.createElement(t.schedule === 'event' && t.event_type ? EVENT_META[t.event_type].icon : PERIODIC_ICON, { size: 19 })}</span>
      <span className="tsk-mrow-main">
        <strong>{t.title}</strong>
        <small>{scheduleText(t)} · {t.assignee?.name || '—'}</small>
      </span>
      <span className="tsk-mrow-end">
        <em className={`tsk-mrow-status tone-${on ? 'green' : 'slate'}`}>{on ? 'مفعل' : 'متوقف'}</em>
      </span>
      {items.length > 0 && <span onClick={e => e.stopPropagation()}><MobileRowMenu items={items} label="إجراءات الموعد" /></span>}
    </article>
  );
};

/**
 * Phones, the home page: one task as a whole card in its kind's colour — urgent red (glowing), appointment orange,
 * voice note pale blue, normal white. Its kind and status, the full title, the event, the details, then who, the
 * deadline and new messages; the ⋮ menu at the top. Tapping it opens the details.
 */
export const MobileHomeTaskCard: React.FC<{ task: Task; onOpen: (t: Task) => void; menu: MobileRowMenuItem[] }> = ({ task: t, onOpen, menu }) => {
  const s = statusView(t);
  const src = sourceMeta(t);
  const late = t.overdue && isOpen(t);
  const urgent = t.kind === 'urgent' && isOpen(t);
  const open = () => onOpen(t);
  return (
    <article className={`tsk-hcard kind-${t.kind} ${urgent ? 'live' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <header className="tsk-hcard-top">
        <span className="tsk-hcard-kind">
          {urgent && <span className="tsk-live" aria-hidden="true" />}
          <src.icon size={13} />{src.label}
        </span>
        <span className={`tsk-hcard-status tone-${s.tone}`}><s.icon size={12} />{s.label}</span>
        <span className="tsk-menu-cell" onClick={e => e.stopPropagation()}>
          <MobileRowMenu items={menu} label="إجراءات المهمة" />
          {t.unread > 0 && <i className="tsk-menu-dot" />}
        </span>
      </header>

      <h4 className="tsk-hcard-title">{t.title}</h4>
      {t.event_label && <p className="tsk-hcard-event">{t.event_label}</p>}
      {t.details && <p className="tsk-hcard-details">{t.details}</p>}

      <footer className="tsk-hcard-meta">
        <span><UserRound size={13} />{t.assignee?.name || '—'}</span>
        <span className={late ? 'late' : ''}>
          <CalendarClock size={13} />
          {t.due_at ? <><b dir="ltr">{dateText(t.due_at)}</b><em>{dueText(t)}</em></> : 'بدون أجل'}
        </span>
        {t.unread > 0 && <span className="tsk-hcard-unread"><MessageCircle size={13} />{t.unread} جديدة</span>}
      </footer>
    </article>
  );
};
