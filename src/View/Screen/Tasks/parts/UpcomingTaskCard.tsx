import React from 'react';
import { BellRing } from 'lucide-react';
import { MobileRowMenu, type MobileRowMenuItem } from '../../../Mobile/widgets/MobileRowMenu';
import { dateText, KIND_META, sourceMeta, type Task } from '../taskUtils';

/**
 * Phones: an appointment's task still to come, in short (the rest is in its details, a click away): «موعد» with its
 * event's icon and ⋮ on top, the whole title, its event, and its alert's date.
 */
export const UpcomingTaskCard: React.FC<{ task: Task; onOpen: (t: Task) => void; menu: MobileRowMenuItem[] }> = ({ task: t, onOpen, menu }) => {
  const src = sourceMeta(t);
  const open = () => onOpen(t);
  return (
    <article className="tsk-hcard kind-scheduled" role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <header className="tsk-hcard-top">
        <span className="tsk-hcard-kind"><src.icon size={13} />{KIND_META.scheduled.label}</span>
        {menu.length > 0 && (
          <span className="tsk-menu-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <MobileRowMenu items={menu} label="إجراءات المهمة" />
          </span>
        )}
      </header>

      <h4 className="tsk-hcard-title">{t.title}</h4>
      {t.event_label && <p className="tsk-hcard-event">{t.event_label}</p>}

      <footer className="tsk-hcard-meta">
        <span className="tsk-ucard-alert"><BellRing size={13} />التنبيه <b dir="ltr">{dateText(t.alert_at)}</b></span>
      </footer>
    </article>
  );
};
