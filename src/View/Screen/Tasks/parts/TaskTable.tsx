import React from 'react';
import { MessageCircle, AlertTriangle, CalendarClock } from 'lucide-react';
import { ActionsMenu, type ActionsMenuItem } from '../../../widget/ActionsMenu';
import {
  dateText, isOpen, KIND_META, NATURE_META, showSoon, sourceMeta, type Task,
} from '../taskUtils';
import { initials } from '../../../shared/dates';
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

/**
 * Desktop: the appointments' tasks still to come, in a table like the tasks', each row edged in how soon it shows on
 * the home page (a day: red, three days: orange, later: blue): the task with its event's icon and its event, its kind
 * (موعد), its alert's date, its deadline, who does it (or «بلا مكلّف»). A row opens it.
 */
export const UpcomingTable: React.FC<{ tasks: Task[]; onOpen: (t: Task) => void; menu: (t: Task) => ActionsMenuItem[]; mine?: boolean }> = ({ tasks, onOpen, menu, mine }) => (
  <div className="members-table-wrapper">
    <table className="custom-table tk-table tsk-utable">
      <thead>
        <tr>
          <th>المهمة</th>
          <th>النوع</th>
          <th>تاريخ التنبيه</th>
          <th>آخر أجل</th>
          <th>{mine ? 'من طرف' : 'المكلّف'}</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(t => {
          const open = () => onOpen(t);
          const src = sourceMeta(t);
          return (
            <tr key={t.id} className={`tk-row tsk-urow ${showSoon(t.alert_at)} ${t.source === 'periodic' ? 'periodic' : 'event'}`} tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
              <td data-label="المهمة" className="tk-title-cell">
                <span className="tsk-utitle">
                  <span className="tsk-uicon"><src.icon size={18} /></span>
                  <span>
                    <strong>{t.title}</strong>
                    {t.event_label && <small>{t.event_label}</small>}
                  </span>
                </span>
              </td>
              <td data-label="النوع"><span className="tk-badge soft tone-orange"><CalendarClock size={12} />{KIND_META.scheduled.label}</span></td>
              <td data-label="تاريخ التنبيه"><span className="tsk-ushow" dir="ltr">{dateText(t.alert_at)}</span></td>
              <td data-label="آخر أجل"><span className="tk-due" dir="ltr">{t.due_at ? dateText(t.due_at) : '—'}</span></td>
              <td data-label={mine ? 'من طرف' : 'المكلّف'}>
                {mine ? (t.created_by || 'النظام') : t.assignee
                  ? <span className="tsk-uwho"><span className="tk-avatar xs">{initials(t.assignee.name)}</span>{t.assignee.name}</span>
                  : <span className="tsk-unassigned"><AlertTriangle size={13} />بلا مكلّف</span>}
              </td>
              <td data-label="إجراءات" className="actions-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                <ActionsMenu label="إجراءات المهمة" items={menu(t)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
