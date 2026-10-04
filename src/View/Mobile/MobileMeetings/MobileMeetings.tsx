import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, ClipboardCheck, Pencil, Trash2, MapPin, Clock, Briefcase, Calendar } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useMeetingsController } from '../../Screen/Meetings/MeetingsController';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import { dayLabel, daysFromToday, countdownText, useNow } from '../MobileTrainingSessions/sessionUtils';
import { meetingStart, dayOfMeeting, shortTime, attendanceOf } from './meetingUtils';
import { MobileMeetingDetails } from './MobileMeetingDetails';
import { MobileMeetingForm } from './MobileMeetingForm';
import './MobileMeetings.css';

interface MobileMeetingsProps {
  c: ReturnType<typeof useMeetingsController>;
  canAdd: boolean;
}

type Period = 'upcoming' | 'past';

const attendancePath = (m: Meeting) => `/meetings/${m.id}/attendance`;

// Phone version of the meetings page: next meeting, upcoming / past, meetings grouped by day
export const MobileMeetings: React.FC<MobileMeetingsProps> = ({ c, canAdd }) => {
  const navigate = useNavigate();
  const can = useCan();
  const now = useNow();
  const [period, setPeriod] = useState<Period>('upcoming');
  const [detailsId, setDetailsId] = useUrlDetails('meeting');
  const { meetings } = c;

  const time = (m: Meeting) => meetingStart(m)?.getTime() ?? 0;
  const isPast = (m: Meeting) => daysFromToday(dayOfMeeting(m)) < 0;
  const upcoming = meetings.filter(m => !isPast(m)).sort((a, b) => time(a) - time(b));
  const past = meetings.filter(isPast).sort((a, b) => time(b) - time(a));
  const list = period === 'upcoming' ? upcoming : past;
  const next = upcoming.find(m => (meetingStart(m)?.getTime() ?? 0) >= now.getTime() - 2 * 3600000);

  const rates = meetings.map(attendanceOf).filter(Boolean).map(a => a!.rate);
  const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  // Meetings of the same day under one heading
  const groups: { day: string; items: Meeting[] }[] = [];
  list.forEach(m => {
    const day = dayOfMeeting(m);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  });

  const details = detailsId ? meetings.find(m => String(m.id) === detailsId) : undefined;

  const remove = (m: Meeting) => {
    if (window.confirm(`هل أنت متأكد من حذف اجتماع "${m.topic}"؟`)) c.handleDelete(m.id);
  };

  const menuItems = (m: Meeting): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(m.id) },
    ...(can('meetings', 'attendance') ? [{ key: 'attendance', label: 'تسجيل الحضور', icon: ClipboardCheck, color: '#f97316', onClick: () => navigate(attendancePath(m)) }] : []),
    ...(can('meetings', 'edit') ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => c.openEdit(m) }] : []),
    ...(can('meetings', 'delete') ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => remove(m) }] : []),
  ];

  return (
    <div className="mmg-page">
      <MobileAppBar title="الاجتماعات" />

      {c.isLoading ? (
        <MobileLoader text="جاري تحميل الاجتماعات..." />
      ) : (
        <>
          {/* Next meeting */}
          <section className="mmg-hero">
            {next ? (
              <button type="button" className="mmg-hero-main" onClick={() => setDetailsId(next.id)}>
                <span className="mmg-hero-tag">
                  <Clock size={14} /> الاجتماع القادم
                  {meetingStart(next) && meetingStart(next)!.getTime() > now.getTime() && ` · ${countdownText(meetingStart(next)!, now)}`}
                </span>
                <strong>{next.topic}</strong>
                <span className="mmg-hero-meta">
                  <span><Calendar size={13} /> {dayLabel(dayOfMeeting(next))} · <bdi dir="ltr">{shortTime(next.time)}</bdi></span>
                  {next.location && <span><MapPin size={13} /> {next.location}</span>}
                </span>
              </button>
            ) : (
              <p className="mmg-hero-empty"><Briefcase size={22} /> لا يوجد اجتماع قادم</p>
            )}
            <div className="mmg-stats">
              <div><strong>{upcoming.length}</strong><small>قادمة</small></div>
              <div><strong>{past.length}</strong><small>سابقة</small></div>
              <div><strong>{avg !== null ? `${avg}%` : '—'}</strong><small>معدل الحضور</small></div>
            </div>
          </section>

          <div className="mmg-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={period === 'upcoming'} className={period === 'upcoming' ? 'active' : ''} onClick={() => setPeriod('upcoming')}>
              القادمة <span>{upcoming.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={period === 'past'} className={period === 'past' ? 'active' : ''} onClick={() => setPeriod('past')}>
              السابقة <span>{past.length}</span>
            </button>
          </div>

          {list.length === 0 ? (
            <div className="mmg-empty">
              <span className="mmg-empty-icon"><Briefcase size={36} /></span>
              <strong>{period === 'upcoming' ? 'لا توجد اجتماعات قادمة' : 'لا توجد اجتماعات سابقة'}</strong>
              {period === 'upcoming' && canAdd && <p>أضف اجتماعاً جديداً بالزر +</p>}
            </div>
          ) : (
            <div className="mmg-list">
              {groups.map(g => (
                <section key={g.day} className="mmg-day">
                  <h3>{dayLabel(g.day)} <span>{g.items.length}</span></h3>
                  {g.items.map(m => {
                    const open = () => setDetailsId(m.id);
                    return (
                      <article
                        key={m.id}
                        className="mmg-card"
                        role="button"
                        tabIndex={0}
                        onClick={open}
                        onKeyDown={e => { if (e.key === 'Enter') open(); }}
                      >
                        <span className="mmg-time"><strong dir="ltr">{shortTime(m.time) || '--:--'}</strong></span>
                        <span className="mmg-card-body">
                          <strong>{m.topic}</strong>
                          {m.location && <span className="mmg-meta"><MapPin size={13} /> {m.location}</span>}
                        </span>
                        <MobileRowMenu items={menuItems(m)} label="إجراءات الاجتماع" />
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {canAdd && (
        <button type="button" className="mmg-fab" onClick={() => c.openAdd()} aria-label="إضافة اجتماع" title="إضافة اجتماع">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileMeetingDetails
          meeting={details}
          onChanged={c.reload}
          now={now}
          onAttendance={() => navigate(attendancePath(details))}
          onEdit={() => c.openEdit(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isEditorOpen && <MobileMeetingForm c={c} />}
    </div>
  );
};
