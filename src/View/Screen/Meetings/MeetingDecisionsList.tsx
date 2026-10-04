import React from 'react';
import { Gavel, CalendarClock, Users, UserCheck } from 'lucide-react';
import './MeetingAgenda.css';
import './MeetingDecisionsList.css';

/** A decision of the meeting, as /meetings/mine returns it */
export interface MyMeetingDecision {
  id: number;
  text: string;
  category?: string | null;
  type?: string | null;
  deadline?: string | null;
  progress: number;
  execution_status?: string | null;
  assignees: string[];
  /** I am one of the people in charge */
  mine: boolean;
}

const dayText = (value?: string | null) => {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

/** The decisions taken in the meeting: what, who is in charge, by when, how far it went (mine marked) */
export const MeetingDecisionsList: React.FC<{ decisions: MyMeetingDecision[] }> = ({ decisions }) => (
  <section className="mag">
    <h4 className="mag-title"><span className="mdl-icon"><Gavel size={17} /></span>القرارات <em>{decisions.length}</em></h4>
    {decisions.length === 0 ? (
      <p className="mag-empty">لم تُتخذ قرارات في هذا الاجتماع بعد</p>
    ) : (
      <div className="mdl-list">
        {decisions.map(d => {
          const progress = Math.max(0, Math.min(100, d.progress || 0));
          return (
            <article key={d.id} className={`mdl ${d.mine ? 'mine' : ''}`}>
              <div className="mdl-head">
                {d.mine && <span className="mdl-mine"><UserCheck size={12} /> مكلف بها</span>}
                {[d.category, d.type].filter(Boolean).map(x => <span key={x} className="mdl-chip">{x}</span>)}
                {d.execution_status && <span className="mdl-chip status">{d.execution_status}</span>}
              </div>
              <p className="mdl-text">{d.text}</p>
              <div className="mdl-meta">
                {d.assignees.length > 0 && <span><Users size={13} /> {d.assignees.join('، ')}</span>}
                {d.deadline && <span><CalendarClock size={13} /> قبل {dayText(d.deadline)}</span>}
              </div>
              <div className="mdl-progress">
                <div><i style={{ width: `${progress}%` }} /></div>
                <b>{progress}%</b>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
);
