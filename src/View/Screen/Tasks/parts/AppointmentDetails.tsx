import React from 'react';
import { CalendarClock, UserRound, BellRing, Clock, FileText, Power, PowerOff, ListChecks, Repeat } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { initials } from '../../../shared/dates';
import { NATURE_META, templateTimesText, type TaskTemplate } from '../taskUtils';
import { appointmentKind } from './appointmentMeta';

/**
 * An appointment, to read only (its actions are in its ⋮), like a task's details: an orange head with its kind,
 * state, title, nature, when it comes and the tasks it made; then one block — its timing (alert, deadline), who does
 * it and who made it, its details.
 */
export const AppointmentDetails: React.FC<{ t: TaskTemplate; mobile: boolean; onClose: () => void }> = ({ t, mobile, onClose }) => {
  const on = t.status === 'active';
  const kind = appointmentKind(t);
  // An appointment saved without a known nature: that line is left out
  const nature = NATURE_META[t.nature] as (typeof NATURE_META)[keyof typeof NATURE_META] | undefined;
  const times = templateTimesText(t);
  const people = [
    { label: 'المكلّف', name: t.assignee?.name || '—' },
    { label: 'أنشأه', name: t.created_by || '—' },
  ];

  return (
    <SidePanel
      mobile={mobile}
      icon={CalendarClock}
      title="تفاصيل الموعد"
      onClose={onClose}
      footer={mobile ? undefined : <div className="tk-actions"><button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={onClose}>إغلاق</button></div>}
    >
      <div className="tsk-d">
        <section className="tsk-d-hero kind-scheduled">
          <div className="tsk-d-hero-top">
            <span className="tsk-d-pill"><kind.icon size={13} />{kind.label}</span>
            <span className={`tsk-d-pill status tone-${on ? 'green' : 'slate'}`}>{on ? <Power size={13} /> : <PowerOff size={13} />}{on ? 'مفعل' : 'متوقف'}</span>
          </div>
          <h2>{t.title}</h2>
          <div className="tsk-d-hero-foot">
            {nature && <span><nature.icon size={14} />{nature.label}</span>}
            {kind.when && <span><Repeat size={14} />{kind.when}</span>}
            <span><ListChecks size={14} />{t.tasks_count} مهمة</span>
          </div>
          <span className="tsk-d-hero-mark" aria-hidden="true"><kind.icon size={88} strokeWidth={1.4} /></span>
        </section>

        {/* One block: its timing (the alert beside the deadline), who does it beside who made it, then its details */}
        <section className="tsk-d-block">
          <div className="tsk-d-pair">
            <div className="tsk-d-cell">
              <span className="tsk-d-cell-icon alert"><BellRing size={18} /></span>
              <span><small>التنبيه</small><strong>{times.alert}</strong></span>
            </div>
            <div className="tsk-d-cell">
              <span className="tsk-d-cell-icon"><Clock size={18} /></span>
              <span><small>آخر أجل</small><strong>{times.due}</strong></span>
            </div>
          </div>
          <div className="tsk-d-pair">
            {people.map(p => (
              <div key={p.label} className="tsk-d-cell">
                <span className="tsk-d-avatar">{p.name === '—' ? <UserRound size={18} /> : initials(p.name)}</span>
                <span><small>{p.label}</small><strong>{p.name}</strong></span>
              </div>
            ))}
          </div>
          {t.details && (
            <div className="tsk-d-part">
              <h4><FileText size={15} />التفاصيل</h4>
              <p className="tsk-d-text">{t.details}</p>
            </div>
          )}
        </section>
      </div>
    </SidePanel>
  );
};
