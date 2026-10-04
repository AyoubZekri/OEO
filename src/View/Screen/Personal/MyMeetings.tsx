import React, { useState } from 'react';
import { Briefcase, Calendar, Clock, MapPin, Users, X, ListChecks, Gavel, MessageSquarePlus, CalendarX2 } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import { useNow, longDate, countdownText } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import { ATTENDEE_STATUS, type AgendaItem } from '../../Mobile/MobileMeetings/meetingUtils';
import { MeetingAgenda } from '../Meetings/MeetingAgenda';
import { MeetingDecisionsList } from '../Meetings/MeetingDecisionsList';
import { useMyMeetings, type MyMeeting } from './useMyMeetings';
import '../../Mobile/MobileEvaluations/MobileEvaluations.css';
import './MyMeetings.css';

const startOf = (m: MyMeeting) => {
  const [y, mo, d] = (m.date || '').split('-').map(Number);
  const [h, mi] = (m.time || '00:00').split(':').map(Number);
  const date = new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
  return isNaN(date.getTime()) ? null : date;
};

const statusChip = (status: string) => ATTENDEE_STATUS[status] || { label: status || 'مدعو', tone: 'muted' };

/** The details of one meeting: when and where, my status, the agenda (I may add points before it starts), decisions, attendees */
const MeetingDetailsBody: React.FC<{ m: MyMeeting; now: Date; onAdd: (text: string) => Promise<void>; onRemove: (item: AgendaItem) => Promise<void> }> = ({ m, now, onAdd, onRemove }) => {
  const start = startOf(m);
  const st = statusChip(m.my_status);
  return (
    <div className="mym-details">
      <section className="mym-info">
        <div className="mym-facts">
          <span><Calendar size={15} /> {longDate(m.date)}</span>
          <span><Clock size={15} /> <bdi dir="ltr">{m.time}</bdi></span>
          {m.location && <span><MapPin size={15} /> {m.location}</span>}
        </div>
        <div className="mym-facts">
          <span className={`mym-status tone-${st.tone}`}>حالتي: {st.label}</span>
          {m.can_propose && start && <span className="mym-soon">يبدأ {countdownText(start, now)}</span>}
        </div>
      </section>

      <MeetingAgenda
        items={m.points.map((p, i) => ({ ...p, key: p.id || `o-${i}` }))}
        canAdd={m.can_propose}
        canRemove={p => p.mine && m.can_propose}
        onAdd={onAdd}
        onRemove={onRemove}
      />

      <MeetingDecisionsList decisions={m.decisions} />

      <section className="mag">
        <h4 className="mag-title"><span className="mym-att-icon"><Users size={17} /></span>المدعوون <em>{m.attendees.length}</em></h4>
        <div className="mym-people">
          {m.attendees.map(a => {
            const s = statusChip(a.status);
            return (
              <span key={a.id} className="mym-person">
                <i>{a.name.charAt(0)}</i> {a.name}
                <em className={`tone-${s.tone}`}>{s.label}</em>
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
};

/**
 * Personal space: the meetings I am concerned with (upcoming first, then past), each with its agenda,
 * where I propose discussion points until it starts (each point shows who added it), and its decisions.
 */
export const MyMeetings: React.FC = () => {
  const { meetings, isLoading, addPoint, removePoint } = useMyMeetings();
  const isMobile = useIsMobile();
  const now = useNow();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [openId, setOpenId] = useUrlDetails('meeting');

  const time = (m: MyMeeting) => startOf(m)?.getTime() ?? 0;
  const upcoming = meetings.filter(m => time(m) >= now.getTime() - 3 * 3600000).sort((a, b) => time(a) - time(b));
  const past = meetings.filter(m => time(m) < now.getTime() - 3 * 3600000).sort((a, b) => time(b) - time(a));
  const list = tab === 'upcoming' ? upcoming : past;
  const open = openId !== null ? meetings.find(m => m.id === openId) : undefined;

  const card = (m: MyMeeting) => {
    const start = startOf(m);
    const st = statusChip(m.my_status);
    const pointsCount = m.points.length;
    return (
      <article key={m.id} className="mym-card" role="button" tabIndex={0} onClick={() => setOpenId(m.id)} onKeyDown={e => { if (e.key === 'Enter') setOpenId(m.id); }}>
        <span className="mym-date">
          <strong>{start ? start.getDate() : '—'}</strong>
          <small>{start ? new Intl.DateTimeFormat('ar-DZ', { month: 'short' }).format(start) : ''}</small>
        </span>
        <span className="mym-card-body">
          <strong className="mym-topic">{m.topic}</strong>
          <span className="mym-line"><Clock size={13} /> <bdi dir="ltr">{m.time}</bdi>{m.location && <><MapPin size={13} /> {m.location}</>}</span>
          <span className="mym-tags">
            <em className={`mym-status tone-${st.tone}`}>{st.label}</em>
            <em><ListChecks size={12} /> {pointsCount} نقاط</em>
            <em><Gavel size={12} /> {m.decisions.length} قرارات</em>
            {m.can_propose && <em className="propose"><MessageSquarePlus size={12} /> أرسل نقطة</em>}
          </span>
        </span>
      </article>
    );
  };

  const tabs = (
    <div className="mym-tabs" role="tablist">
      <button type="button" className={tab === 'upcoming' ? 'on' : ''} onClick={() => setTab('upcoming')}>القادمة <b>{upcoming.length}</b></button>
      <button type="button" className={tab === 'past' ? 'on' : ''} onClick={() => setTab('past')}>السابقة <b>{past.length}</b></button>
    </div>
  );

  const content = isLoading ? (
    isMobile ? <MobileLoader text="جاري تحميل اجتماعاتك..." /> : <p className="mym-empty">جاري تحميل اجتماعاتك...</p>
  ) : list.length === 0 ? (
    <div className="mym-empty"><CalendarX2 size={34} /><strong>{tab === 'upcoming' ? 'لا توجد اجتماعات قادمة معني بها' : 'لا توجد اجتماعات سابقة'}</strong></div>
  ) : (
    <div className="mym-grid">{list.map(card)}</div>
  );

  const details = open && (
    isMobile ? (
      <MobileScreen title="تفاصيل الاجتماع" onBack={() => setOpenId(null)}>
        <section className="mym-mobile-head"><span><Briefcase size={22} /></span><strong>{open.topic}</strong></section>
        <MeetingDetailsBody m={open} now={now} onAdd={text => addPoint(open.id, text)} onRemove={item => removePoint(open.id, item)} />
      </MobileScreen>
    ) : (
      <div className="mym-overlay" onClick={() => setOpenId(null)}>
        <div className="mym-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={open.topic}>
          <header>
            <span><Briefcase size={22} /></span>
            <h2>{open.topic}</h2>
            <button type="button" onClick={() => setOpenId(null)} aria-label="إغلاق"><X size={20} /></button>
          </header>
          <div className="mym-modal-body">
            <MeetingDetailsBody m={open} now={now} onAdd={text => addPoint(open.id, text)} onRemove={item => removePoint(open.id, item)} />
          </div>
        </div>
      </div>
    )
  );

  if (isMobile) {
    return (
      <div className="mym-page mobile">
        <MobileAppBar title="اجتماعاتي" />
        {tabs}
        {content}
        {details}
      </div>
    );
  }

  return (
    <div className="mym-page">
      {tabs}
      {content}
      {details}
    </div>
  );
};
