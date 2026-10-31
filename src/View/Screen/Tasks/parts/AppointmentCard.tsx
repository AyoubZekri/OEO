import React from 'react';
import { UserRound } from 'lucide-react';
import { MobileRowMenu } from '../../../Mobile/widgets/MobileRowMenu';
import { templateTimesText, type TaskTemplate } from '../taskUtils';
import { appointmentKind, appointmentMenu, type AppointmentActions } from './appointmentMeta';

/**
 * An appointment on phones (the computer has its table): a compact card, the same for every kind (one colour, one
 * size) — a tile with its kind, the title, when it comes (an event: its alert), who does it; its state and ⋮ on the
 * side. A tap opens its details; a stopped one is dimmed; a long title or name is cut, shown whole on hover.
 */
export const AppointmentCard: React.FC<{ t: TaskTemplate } & AppointmentActions> = ({ t, ...actions }) => {
  const on = t.status === 'active';
  const kind = appointmentKind(t);
  const who = t.assignee?.name || 'بلا مكلّف';
  const items = appointmentMenu(t, actions);
  const open = () => actions.onView?.(t);

  return (
    <article
      className={`tsk-acard compact ${on ? '' : 'off'}`}
      role={actions.onView ? 'button' : undefined}
      tabIndex={actions.onView ? 0 : undefined}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter') open(); }}
    >
      <span className="tsk-acard-tile" aria-hidden="true">
        <small>{kind.label}</small>
        <b><kind.icon size={22} /></b>
      </span>
      <div className="tsk-acard-body">
        <h4 title={t.title}>{t.title}</h4>
        <span className="tsk-acard-line sched">{kind.event ? templateTimesText(t).alert : kind.when}</span>
        <span className="tsk-acard-line" title={who}><UserRound size={12} />{who}</span>
      </div>
      <div className="tsk-acard-side">
        {items.length > 0 && (
          <span className="tsk-menu-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <MobileRowMenu items={items} label="إجراءات الموعد" />
          </span>
        )}
        <span className={`tsk-acard-state ${on ? 'on' : ''}`}><i />{on ? 'مفعل' : 'متوقف'}</span>
      </div>
    </article>
  );
};
