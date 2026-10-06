import React from 'react';
import { Gavel, CalendarClock, UserCheck, CheckCircle2, Circle, Briefcase, AlarmClock, ChevronLeft } from 'lucide-react';
import { daysFromToday } from '../../Mobile/MobileTrainingSessions/sessionUtils';
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
  /** A decision of several tasks */
  checklist_items?: { text: string; checked: boolean }[];
  /** I am one of the people in charge */
  mine: boolean;
}

type State = 'done' | 'late' | 'active' | 'new';

/** Same rule as the decisions page: done at 100%, late past its deadline, else started or not */
const stateOf = (d: MyMeetingDecision): State => {
  if ((d.progress || 0) >= 100) return 'done';
  if (d.deadline && daysFromToday(d.deadline.slice(0, 10)) < 0) return 'late';
  return (d.progress || 0) > 0 ? 'active' : 'new';
};

const STATE_LABEL: Record<State, string> = { done: 'مكتمل', late: 'متأخر', active: 'قيد التنفيذ', new: 'لم يبدأ' };

const dayText = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long' }).format(date);
};

/** "باقي 4 أيام" / "آخر أجل اليوم" / "متأخر يومين" */
const leftText = (deadline: string, done: boolean) => {
  if (done) return 'أُنجز';
  const days = daysFromToday(deadline.slice(0, 10));
  const n = Math.abs(days);
  const count = n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`;
  if (days === 0) return 'آخر أجل اليوم';
  return days > 0 ? `باقي ${count}` : `متأخر ${count}`;
};

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('');

/** The progress as a ring */
const Ring: React.FC<{ value: number; state: State }> = ({ value, state }) => {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <span className={`dcd-ring st-${state}`} aria-label={`${value}%`}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle cx="28" cy="28" r={r} className="track" />
        <circle cx="28" cy="28" r={r} className="bar" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
      </svg>
      <b dir="ltr">{value}<small>%</small></b>
    </span>
  );
};

/**
 * One decision: its state, what was decided (or its tasks), who is in charge (mine marked), the deadline and
 * the time left, and how far it went. meeting: the meeting it comes from (on the "my decisions" list).
 */
export const DecisionCard: React.FC<{ d: MyMeetingDecision; meeting?: { topic: string; date: string }; onOpenMeeting?: () => void }> = ({ d, meeting, onOpenMeeting }) => {
  const state = stateOf(d);
  const progress = Math.max(0, Math.min(100, Math.round(d.progress || 0)));
  const tasks = d.checklist_items || [];
  const doneTasks = tasks.filter(t => t.checked).length;
  const title = d.text?.trim() || d.category || 'قرار';

  return (
    <article className={`dcd st-${state} ${d.mine ? 'mine' : ''}`}>
      <header className="dcd-head">
        <span className={`dcd-state st-${state}`}><i />{STATE_LABEL[state]}</span>
        {d.category && d.text?.trim() && <span className="dcd-chip">{d.category}</span>}
        {d.mine && <span className="dcd-mine"><UserCheck size={13} /> مكلف بها</span>}
      </header>

      <div className="dcd-main">
        <div className="dcd-text">
          <h5>{title}</h5>
          {tasks.length > 0 && (
            <ul className="dcd-tasks">
              {tasks.map((t, i) => (
                <li key={i} className={t.checked ? 'done' : ''}>
                  {t.checked ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Ring value={progress} state={state} />
      </div>

      <footer className="dcd-foot">
        {d.deadline ? (
          <span className={`dcd-deadline st-${state}`}>
            {state === 'late' ? <AlarmClock size={14} /> : <CalendarClock size={14} />}
            <span><small>آخر أجل</small><b>{dayText(d.deadline)}</b></span>
            <em>{leftText(d.deadline, state === 'done')}</em>
          </span>
        ) : (
          <span className="dcd-deadline none"><CalendarClock size={14} /><span><small>آخر أجل</small><b>بدون أجل</b></span></span>
        )}

        {d.assignees.length > 0 && (
          <span className="dcd-people" title={d.assignees.join('، ')}>
            {d.assignees.slice(0, 4).map(name => <i key={name}>{initials(name)}</i>)}
            {d.assignees.length > 4 && <i className="more">+{d.assignees.length - 4}</i>}
            <small>{d.assignees.length === 1 ? d.assignees[0] : `${d.assignees.length} مكلفين`}</small>
          </span>
        )}
        {tasks.length > 0 && <span className="dcd-count">{doneTasks}/{tasks.length} مهام</span>}
      </footer>

      {meeting && (
        <button type="button" className="dcd-meeting" onClick={onOpenMeeting}>
          <Briefcase size={13} /> {meeting.topic} · {dayText(meeting.date)} <ChevronLeft size={14} />
        </button>
      )}
    </article>
  );
};

/** The decisions taken in the meeting */
export const MeetingDecisionsList: React.FC<{ decisions: MyMeetingDecision[] }> = ({ decisions }) => (
  <section className="mag">
    <h4 className="mag-title"><span className="mdl-icon"><Gavel size={17} /></span>القرارات <em>{decisions.length}</em></h4>
    {decisions.length === 0 ? (
      <p className="mag-empty">لم تُتخذ قرارات في هذا الاجتماع بعد</p>
    ) : (
      <div className="dcd-list">
        {decisions.map(d => <DecisionCard key={d.id} d={d} />)}
      </div>
    )}
  </section>
);
