import React from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Briefcase, Calendar, Clock, MapPin, Users, ClipboardCheck, Pencil, Timer } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import { longDate, countdownText } from '../MobileTrainingSessions/sessionUtils';
import { meetingStart, dayOfMeeting, shortTime, attendanceOf, statusOf, invitedText, agendaOf } from './meetingUtils';
import { MeetingAgenda } from '../../Screen/Meetings/MeetingAgenda';
import { meetingPointsApi } from '../../Screen/Meetings/meetingPointsApi';
import { useAuth } from '../../../core/context/AuthContext';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileMeetingDetailsProps {
  meeting: Meeting;
  now: Date;
  onAttendance: () => void;
  onEdit: () => void;
  onClose: () => void;
  /** After a point is sent / removed: the meetings are reloaded */
  onChanged?: () => Promise<void> | void;
}

// Full details of one meeting (phone): when and where, agenda, invited members and their attendance
export const MobileMeetingDetails: React.FC<MobileMeetingDetailsProps> = ({ meeting, now, onAttendance, onEdit, onClose, onChanged }) => {
  const can = useCan();
  const { user } = useAuth();
  const start = meetingStart(meeting);
  const att = attendanceOf(meeting);
  const points = meeting.points || [];
  const attendees = meeting.attendees || [];
  const upcoming = start && start.getTime() > now.getTime();

  return (
    <MobileScreen
      title="تفاصيل الاجتماع"
      onBack={onClose}
      footer={(can('meetings', 'edit') || can('meetings', 'attendance')) ? (
        <>
          {can('meetings', 'edit') && <button type="button" className="me-btn mmg-btn" onClick={onEdit}><Pencil size={18} /> تعديل</button>}
          {can('meetings', 'attendance') && <button type="button" className="me-btn primary mmg-btn" onClick={onAttendance}><ClipboardCheck size={18} /> تسجيل الحضور</button>}
        </>
      ) : undefined}
    >
      <section className="mmg-hero">
        <div className="mmg-hero-top">
          <span className="mmg-hero-icon"><Briefcase size={24} /></span>
          <strong>{meeting.topic}</strong>
        </div>
        <div className="mmg-hero-facts">
          <div><Calendar size={15} /><span>{longDate(dayOfMeeting(meeting))}</span></div>
          <div><Clock size={15} /><span dir="ltr">{shortTime(meeting.time)}</span></div>
          {meeting.location && <div><MapPin size={15} /><span>{meeting.location}</span></div>}
        </div>
        {upcoming && <p className="mmg-hero-note"><Timer size={14} /> يبدأ {countdownText(start!, now)}</p>}
      </section>

      {/* Agenda: the organisers' points and the proposed ones, with who added each */}
      <section className="me-card">
        <MeetingAgenda
          items={agendaOf(points, user?.id)}
          canAdd={Boolean(upcoming)}
          canRemove={() => can('meetings', 'edit')}
          onAdd={async text => { await meetingPointsApi.add(meeting.id, text); await onChanged?.(); }}
          onRemove={async item => { if (await meetingPointsApi.remove(meeting.id, item)) await onChanged?.(); }}
        />
      </section>

      {/* Invited members */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Users size={16} /></span>الحضور <em className="mmg-count">{invitedText(attendees.length)}</em></h3>
        {att && (
          <div className="mmg-att">
            <div className="mmg-att-bar"><div style={{ width: `${att.rate}%` }} /></div>
            <span>{att.came}/{att.total} حضروا · {att.rate}%</span>
          </div>
        )}
        {attendees.length ? (
          <div className="mmg-people">
            {attendees.map(a => {
              const st = statusOf(a);
              return (
                <div key={a.id} className="mmg-person">
                  <span className="mmg-avatar">{a.name.charAt(0)}</span>
                  <span className="mmg-person-text">
                    <strong>{a.name}</strong>
                    {a.reason && <small>{a.reason}</small>}
                  </span>
                  <em className={`mmg-status ${st.tone}`}>{st.label}</em>
                </div>
              );
            })}
          </div>
        ) : <p className="me-text empty">لا يوجد مدعوون</p>}
      </section>
    </MobileScreen>
  );
};
