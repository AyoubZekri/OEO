import React from 'react';
import { Pencil, Trash2, Power, PowerOff, BellRing, CalendarClock, UserRound, ListChecks } from 'lucide-react';
import { ActionsMenu, type ActionsMenuItem } from '../../../widget/ActionsMenu';
import { MobileRowMenu } from '../../../Mobile/widgets/MobileRowMenu';
import { initials } from '../../../shared/dates';
import { EVENT_META, PERIODIC_ICON, scheduleText, templateTimesText, type TaskTemplate } from '../taskUtils';

/**
 * An appointment as a card. Computer: its icon (the event, or periodic), title and state on top; a periodic one's
 * days («كل أسبوع · الخميس»: an event's is in its icon); its alert and deadline; then who does it and how many tasks it
 * created. Phones: a compact one. ⋮: edit, stop / start, delete; a click edits it. A stopped one is dimmed.
 */
export const AppointmentCard: React.FC<{
  t: TaskTemplate;
  mobile: boolean;
  onEdit?: (t: TaskTemplate) => void;
  onToggle?: (t: TaskTemplate) => void;
  onDelete?: (t: TaskTemplate) => void;
}> = ({ t, mobile, onEdit, onToggle, onDelete }) => {
  const on = t.status === 'active';
  const event = t.schedule === 'event';
  const Icon = event && t.event_type ? EVENT_META[t.event_type].icon : PERIODIC_ICON;
  const times = templateTimesText(t);
  const items: ActionsMenuItem[] = [
    ...(onEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#3b82f6', onClick: () => onEdit(t) }] : []),
    ...(onToggle ? [{ key: 'toggle', label: on ? 'إيقاف' : 'تشغيل', icon: on ? PowerOff : Power, color: on ? '#f59e0b' : '#10b981', onClick: () => onToggle(t) }] : []),
    ...(onDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) }] : []),
  ];
  const open = () => onEdit?.(t);
  const menu = items.length > 0 && (
    <span className="tsk-menu-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      {mobile ? <MobileRowMenu items={items} label="إجراءات الموعد" /> : <ActionsMenu label="إجراءات الموعد" items={items} />}
    </span>
  );
  const clickable = {
    role: onEdit ? 'button' : undefined,
    tabIndex: onEdit ? 0 : undefined,
    onClick: open,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') open(); },
  };

  // Phones: compact, like the other pages' tickets — a tile (the event's icon and kind), the title, a periodic one's
  // days, and who does it; its state and ⋮ on the side
  if (mobile) {
    return (
      <article className={`tsk-acard compact ${event ? 'event' : 'periodic'} ${on ? '' : 'off'}`} {...clickable}>
        <span className="tsk-acard-tile" aria-hidden="true">
          <small>{event && t.event_type ? EVENT_META[t.event_type].label : 'دورية'}</small>
          <b><Icon size={22} /></b>
        </span>
        <div className="tsk-acard-body">
          <h4>{t.title}</h4>
          {!event && <span className="tsk-acard-line sched">{scheduleText(t)}</span>}
          <span className="tsk-acard-line"><UserRound size={12} />{t.assignee?.name || 'بلا مكلّف'}</span>
        </div>
        <div className="tsk-acard-side">
          {menu}
          <span className={`tsk-acard-state ${on ? 'on' : ''}`}><i />{on ? 'مفعل' : 'متوقف'}</span>
        </div>
      </article>
    );
  }

  return (
    <article className={`tsk-acard ${event ? 'event' : 'periodic'} ${on ? '' : 'off'}`} {...clickable}>
      <header className="tsk-acard-top">
        <span className="tsk-acard-icon"><Icon size={20} /></span>
        <div className="tsk-acard-title">
          <h4>{t.title}</h4>
          {!event && <small>{scheduleText(t)}</small>}
        </div>
        <span className={`tsk-acard-state ${on ? 'on' : ''}`}><i />{on ? 'مفعل' : 'متوقف'}</span>
        {menu}
      </header>

      <div className="tsk-acard-times">
        <span className="alert"><BellRing size={14} /><small>التنبيه</small><b>{times.alert}</b></span>
        <span className="due"><CalendarClock size={14} /><small>آخر أجل</small><b>{times.due}</b></span>
      </div>

      <footer className="tsk-acard-foot">
        <span className="tsk-acard-who">
          <i aria-hidden="true">{t.assignee ? initials(t.assignee.name) : <UserRound size={13} />}</i>
          {t.assignee?.name || 'بلا مكلّف'}
        </span>
        <span className="tsk-acard-chip"><ListChecks size={13} />{t.tasks_count} مهمة</span>
      </footer>
    </article>
  );
};
