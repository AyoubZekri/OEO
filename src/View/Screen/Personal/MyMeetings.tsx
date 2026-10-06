import React, { useState } from 'react';
import {
  Briefcase, Calendar, Clock, MapPin, Users, X, ListChecks, Gavel, MessageSquarePlus, CalendarX2, Eye, UserCheck, Timer,
} from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import { MobileRowMenu } from '../../Mobile/widgets/MobileRowMenu';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import { useNow, longDate, countdownText, dayLabel, daysFromToday } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import { ATTENDEE_STATUS, type AgendaItem } from '../../Mobile/MobileMeetings/meetingUtils';
import { MeetingAgenda } from '../Meetings/MeetingAgenda';
import { DecisionCard } from '../Meetings/MeetingDecisionsList';
import { useMyMeetings, type MyMeeting } from './useMyMeetings';
import '../../Mobile/MobileEvaluations/MobileEvaluations.css';
import '../../Mobile/MobileMeetings/MobileMeetings.css';
import '../Meetings/MeetingDecisionsList.css';
import './MyMeetings.css';

type Section = 'points' | 'decisions' | 'people';

const startOf = (m: MyMeeting) => {
  const [y, mo, d] = (m.date || '').split('-').map(Number);
  const [h, mi] = (m.time || '00:00').split(':').map(Number);
  const date = new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
  return isNaN(date.getTime()) ? null : date;
};

const statusChip = (status: string) => ATTENDEE_STATUS[status] || { label: status || 'مدعو', tone: 'muted' };

/** The day block of a meeting: weekday, number, month */
const DateBlock: React.FC<{ m: MyMeeting }> = ({ m }) => {
  const d = startOf(m);
  return (
    <span className="mmx-date">
      <small>{d ? new Intl.DateTimeFormat('ar-DZ', { weekday: 'long' }).format(d) : ''}</small>
      <strong>{d ? d.getDate() : '—'}</strong>
      <small>{d ? new Intl.DateTimeFormat('ar-DZ', { month: 'long' }).format(d) : ''}</small>
    </span>
  );
};

/** The people invited, as a short stack of initials */
const Faces: React.FC<{ names: string[] }> = ({ names }) => (
  <span className="mmx-faces" title={names.join('، ')}>
    {names.slice(0, 4).map((n, i) => <i key={i}>{n.charAt(0)}</i>)}
    {names.length > 4 && <i className="more">+{names.length - 4}</i>}
  </span>
);

/**
 * The details of a meeting: a head with when, where and my status, then one section at a time:
 * the points (I send mine until it starts), the decisions, or the people invited.
 */
const MeetingDetails: React.FC<{ m: MyMeeting; now: Date; onAdd: (text: string) => Promise<void>; onRemove: (item: AgendaItem) => Promise<void> }> = ({ m, now, onAdd, onRemove }) => {
  const [section, setSection] = useState<Section>(m.can_propose || !m.decisions.length ? 'points' : 'decisions');
  const start = startOf(m);
  const st = statusChip(m.my_status);
  const mine = m.decisions.filter(d => d.mine).length;

  return (
    <div className="mmd">
      <div className="mmd-info">
        <span><Calendar size={15} /> {longDate(m.date)}</span>
        <span><Clock size={15} /> <bdi dir="ltr">{m.time}</bdi></span>
        {m.location && <span><MapPin size={15} /> {m.location}</span>}
        <span className={`mym-status tone-${st.tone}`}><UserCheck size={14} /> {st.label}</span>
        {m.can_propose && start && <span className="soon"><Timer size={15} /> يبدأ {countdownText(start, now)}</span>}
      </div>

      <div className="mmd-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={section === 'points'} className={section === 'points' ? 'on' : ''} onClick={() => setSection('points')}>
          <ListChecks size={16} /> النقاط <b>{m.points.length}</b>
        </button>
        <button type="button" role="tab" aria-selected={section === 'decisions'} className={section === 'decisions' ? 'on' : ''} onClick={() => setSection('decisions')}>
          <Gavel size={16} /> القرارات <b>{m.decisions.length}</b>
        </button>
        <button type="button" role="tab" aria-selected={section === 'people'} className={section === 'people' ? 'on' : ''} onClick={() => setSection('people')}>
          <Users size={16} /> المدعوون <b>{m.attendees.length}</b>
        </button>
      </div>

      <div className="mmd-panel">
        {section === 'points' && (
          <MeetingAgenda
            items={m.points.map((p, i) => ({ ...p, key: p.id || `o-${i}` }))}
            canAdd={m.can_propose}
            canRemove={p => p.mine && m.can_propose}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        )}

        {section === 'decisions' && (
          m.decisions.length === 0 ? (
            <div className="mmd-empty"><Gavel size={30} /><strong>لم تُتخذ قرارات في هذا الاجتماع بعد</strong></div>
          ) : (
            <>
              {mine > 0 && <p className="mmd-note"><UserCheck size={15} /> أنت مكلف بـ {mine} {mine === 1 ? 'قرار' : 'قرارات'} من هذا الاجتماع</p>}
              <div className="dcd-list">{m.decisions.map(d => <DecisionCard key={d.id} d={d} />)}</div>
            </>
          )
        )}

        {section === 'people' && (
          <div className="mmd-people">
            {m.attendees.map(a => {
              const s = statusChip(a.status);
              return (
                <div key={a.id} className="mmd-person">
                  <i>{a.name.charAt(0)}</i>
                  <span>{a.name}</span>
                  <em className={`mym-status tone-${s.tone}`}>{s.label}</em>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Personal space: the meetings I am concerned with (upcoming, past), each with its points
 * (I send mine until it starts, each point shows who sent it), its decisions and the people invited.
 */
export const MyMeetings: React.FC = () => {
  const { meetings, isLoading, addPoint, removePoint } = useMyMeetings();
  const isMobile = useIsMobile();
  const now = useNow();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [openId, setOpenId] = useUrlDetails('meeting');

  const time = (m: MyMeeting) => startOf(m)?.getTime() ?? 0;
  const isPast = (m: MyMeeting) => daysFromToday(m.date) < 0;
  const upcoming = meetings.filter(m => !isPast(m)).sort((a, b) => time(a) - time(b));
  const past = meetings.filter(isPast).sort((a, b) => time(b) - time(a));
  const list = tab === 'upcoming' ? upcoming : past;
  const open = openId !== null ? meetings.find(m => m.id === openId) : undefined;
  const add = (m: MyMeeting) => (text: string) => addPoint(m.id, text);
  const remove = (m: MyMeeting) => (item: AgendaItem) => removePoint(m.id, item);

  /* ─────────────── Phone ─────────────── */
  if (isMobile) {
    const next = upcoming.find(m => time(m) >= now.getTime() - 2 * 3600000);
    const assigned = meetings.reduce((n, m) => n + m.decisions.filter(d => d.mine).length, 0);
    const groups: { day: string; items: MyMeeting[] }[] = [];
    list.forEach(m => {
      const last = groups[groups.length - 1];
      if (last && last.day === m.date) last.items.push(m);
      else groups.push({ day: m.date, items: [m] });
    });

    return (
      <div className="mmg-page">
        <MobileAppBar title="اجتماعات" />

        {isLoading ? <MobileLoader text="جاري تحميل اجتماعاتك..." /> : (
          <>
            <section className="mmg-hero">
              {next ? (
                <button type="button" className="mmg-hero-main" onClick={() => setOpenId(next.id)}>
                  <span className="mmg-hero-tag">
                    <Clock size={14} /> اجتماعي القادم
                    {startOf(next) && startOf(next)!.getTime() > now.getTime() && ` · ${countdownText(startOf(next)!, now)}`}
                  </span>
                  <strong>{next.topic}</strong>
                  <span className="mmg-hero-meta">
                    <span><Calendar size={13} /> {dayLabel(next.date)} · <bdi dir="ltr">{next.time}</bdi></span>
                    {next.location && <span><MapPin size={13} /> {next.location}</span>}
                  </span>
                </button>
              ) : (
                <p className="mmg-hero-empty"><Briefcase size={22} /> لا يوجد اجتماع قادم معني به</p>
              )}
              <div className="mmg-stats">
                <div><strong>{upcoming.length}</strong><small>قادمة</small></div>
                <div><strong>{past.length}</strong><small>سابقة</small></div>
                <div><strong>{assigned}</strong><small>قرارات مكلف بها</small></div>
              </div>
            </section>

            <div className="mmg-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>القادمة <span>{upcoming.length}</span></button>
              <button type="button" role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>السابقة <span>{past.length}</span></button>
            </div>

            {list.length === 0 ? (
              <div className="mmg-empty">
                <span className="mmg-empty-icon"><Briefcase size={36} /></span>
                <strong>{tab === 'upcoming' ? 'لا توجد اجتماعات قادمة معني بها' : 'لا توجد اجتماعات سابقة'}</strong>
              </div>
            ) : (
              <div className="mmg-list">
                {groups.map(g => (
                  <section key={g.day} className="mmg-day">
                    <h3>{dayLabel(g.day)} <span>{g.items.length}</span></h3>
                    {g.items.map(m => {
                      const openIt = () => setOpenId(m.id);
                      return (
                        <article key={m.id} className="mmg-card" role="button" tabIndex={0} onClick={openIt} onKeyDown={e => { if (e.key === 'Enter') openIt(); }}>
                          <span className="mmg-time"><strong dir="ltr">{m.time || '--:--'}</strong></span>
                          <span className="mmg-card-body">
                            <strong>{m.topic}</strong>
                            {m.location && <span className="mmg-meta"><MapPin size={13} /> {m.location}</span>}
                          </span>
                          <MobileRowMenu
                            items={[
                              { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: openIt },
                              ...(m.can_propose ? [{ key: 'point', label: 'إرسال نقطة للنقاش', icon: MessageSquarePlus, color: '#f97316', onClick: openIt }] : []),
                            ]}
                            label="إجراءات الاجتماع"
                          />
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {open && (
          <MobileScreen title="تفاصيل الاجتماع" onBack={() => setOpenId(null)}>
            <section className="mmd-head mobile">
              <DateBlock m={open} />
              <strong>{open.topic}</strong>
            </section>
            <MeetingDetails key={open.id} m={open} now={now} onAdd={add(open)} onRemove={remove(open)} />
          </MobileScreen>
        )}
      </div>
    );
  }

  /* ─────────────── Computer ─────────────── */
  return (
    <div className="mmx">
      <div className="mmx-tabs" role="tablist">
        <button type="button" className={tab === 'upcoming' ? 'on' : ''} onClick={() => setTab('upcoming')}><Calendar size={15} /> القادمة <b>{upcoming.length}</b></button>
        <button type="button" className={tab === 'past' ? 'on' : ''} onClick={() => setTab('past')}><Briefcase size={15} /> السابقة <b>{past.length}</b></button>
      </div>

      {isLoading ? <div className="mmx-empty"><strong>جاري تحميل اجتماعاتك...</strong></div>
        : list.length === 0 ? (
          <div className="mmx-empty"><CalendarX2 size={34} /><strong>{tab === 'upcoming' ? 'لا توجد اجتماعات قادمة معني بها' : 'لا توجد اجتماعات سابقة'}</strong></div>
        ) : (
          <div className="mmx-grid">
            {list.map(m => {
              const st = statusChip(m.my_status);
              const mine = m.decisions.filter(d => d.mine).length;
              const start = startOf(m);
              return (
                <article key={m.id} className="mmx-card" role="button" tabIndex={0} onClick={() => setOpenId(m.id)} onKeyDown={e => { if (e.key === 'Enter') setOpenId(m.id); }}>
                  <div className="mmx-card-top">
                    <DateBlock m={m} />
                    <div className="mmx-card-title">
                      <h4>{m.topic}</h4>
                      <span className="mmx-line"><Clock size={13} /> <bdi dir="ltr">{m.time}</bdi>{m.location && <><MapPin size={13} /> {m.location}</>}</span>
                      {m.can_propose && start && <span className="mmx-soon"><Timer size={13} /> يبدأ {countdownText(start, now)}</span>}
                    </div>
                  </div>
                  <div className="mmx-card-stats">
                    <span><ListChecks size={14} /> <b>{m.points.length}</b> نقاط</span>
                    <span><Gavel size={14} /> <b>{m.decisions.length}</b> قرارات</span>
                    {mine > 0 && <span className="mine"><UserCheck size={14} /> <b>{mine}</b> مكلف بها</span>}
                  </div>
                  <div className="mmx-card-foot">
                    <em className={`mym-status tone-${st.tone}`}>{st.label}</em>
                    <Faces names={m.attendees.map(a => a.name)} />
                    {m.can_propose && <span className="mmx-propose"><MessageSquarePlus size={14} /> أرسل نقطة</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {open && (
        <div className="mmx-overlay" onClick={() => setOpenId(null)}>
          <div className="mmx-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={open.topic}>
            <header className="mmd-head">
              <DateBlock m={open} />
              <h2>{open.topic}</h2>
              <button type="button" onClick={() => setOpenId(null)} aria-label="إغلاق"><X size={20} /></button>
            </header>
            <div className="mmx-modal-body">
              <MeetingDetails key={open.id} m={open} now={now} onAdd={add(open)} onRemove={remove(open)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
