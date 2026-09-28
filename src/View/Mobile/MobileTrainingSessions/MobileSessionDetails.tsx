import React from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Calendar, Clock, MapPin, Users, ClipboardCheck, Pencil, ChevronDown, Timer, UserCheck, UserX, Dumbbell } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect, type MobileSelectOption } from '../widgets/MobileSelect';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import {
  STATUS_LABELS, STATUS_TONE, computedStatus, dayOf, startOf, durationOf, durationText, longDate, countdownText, attendanceRate,
} from './sessionUtils';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileSessionDetails.css';

interface MobileSessionDetailsProps {
  session: TrainingSessionModel;
  now: Date;
  onChangeStatus: (status: string) => void;
  onAttendance: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const STATUS_OPTIONS: MobileSelectOption[] = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

// Full details of one training session (phone)
export const MobileSessionDetails: React.FC<MobileSessionDetailsProps> = ({
  session, now, onChangeStatus, onAttendance, onEdit, onClose,
}) => {
  const can = useCan();
  const status = computedStatus(session, now);
  const minutes = durationOf(session.start, session.end);
  const stats = session.attendance_stats;
  const rate = attendanceRate(session);
  const other = stats ? Math.max(0, stats.total - stats.present - stats.absent) : 0;

  const statusBadge = (open: () => void) => (
    <button type="button" className={`msd-status tone-${STATUS_TONE[status] || 'scheduled'}`} onClick={open}>
      <i /> {STATUS_LABELS[status] || status} <ChevronDown size={14} />
    </button>
  );

  return (
    <MobileScreen
      title="تفاصيل الحصة"
      onBack={onClose}
      footer={(can('trainingSessions', 'edit') || can('trainingSessions', 'attendance')) ? (
        <>
          {can('trainingSessions', 'edit') && (
            <button type="button" className="me-btn msd-btn" onClick={onEdit}>
              <Pencil size={18} /> تعديل
            </button>
          )}
          {can('trainingSessions', 'attendance') && (
            <button type="button" className="me-btn primary msd-btn" onClick={onAttendance}>
              <ClipboardCheck size={18} /> تسجيل الحضور
            </button>
          )}
        </>
      ) : undefined}
    >
      <section className="msd-hero">
        <div className="msd-hero-top">
          <span className="msd-hero-icon"><Dumbbell size={26} /></span>
          <div className="msd-hero-title">
            <small>حصة تدريبية #{session.id}</small>
            <strong>{session.team_name || 'بدون فئة'}</strong>
          </div>
          {can('trainingSessions', 'edit') ? (
            <MobileSelect
              label="حالة الحصة"
              icon={Clock}
              value={status}
              options={STATUS_OPTIONS}
              onChange={onChangeStatus}
              renderTrigger={statusBadge}
            />
          ) : statusBadge(() => undefined)}
        </div>

        {/* Time line of the session */}
        <div className="msd-clock">
          <div>
            <small>البداية</small>
            <strong dir="ltr">{session.start}</strong>
          </div>
          <span className="msd-clock-line">
            {minutes ? <em>{durationText(minutes)}</em> : null}
          </span>
          <div>
            <small>النهاية</small>
            <strong dir="ltr">{session.end}</strong>
          </div>
        </div>

        {status === 'مجدولة' && (
          <p className="msd-hero-note"><Timer size={14} /> تبدأ {countdownText(startOf(session), now)}</p>
        )}
      </section>

      <div className="msd-facts">
        <div className="msd-fact wide">
          <span className="msd-fact-icon"><Calendar size={16} /></span>
          <small>التاريخ</small>
          <strong>{longDate(dayOf(session))}</strong>
        </div>
        <div className="msd-fact wide">
          <span className="msd-fact-icon"><MapPin size={16} /></span>
          <small>مكان التدريب</small>
          <strong>{session.location || '—'}</strong>
        </div>
      </div>

      {/* Attendance */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Users size={16} /></span>الحضور</h3>
        {stats && stats.total > 0 ? (
          <div className="msd-att">
            <div className="msd-ring" style={{ '--msd-p': rate ?? 0 } as React.CSSProperties}>
              <span><strong>{rate}%</strong><small>حضور</small></span>
            </div>
            <div className="msd-att-list">
              <div className="present"><UserCheck size={16} /> حاضرون <strong>{stats.present}</strong></div>
              <div className="absent"><UserX size={16} /> غائبون <strong>{stats.absent}</strong></div>
              {other > 0 && <div><Users size={16} /> لم يُسجلوا <strong>{other}</strong></div>}
              <div className="total">المجموع <strong>{stats.total}</strong></div>
            </div>
          </div>
        ) : (
          <div className="msd-att-empty">
            <ClipboardCheck size={30} />
            <p>لم يُسجل الحضور لهذه الحصة بعد</p>
            {can('trainingSessions', 'attendance') && (
              <button type="button" onClick={onAttendance}>تسجيل الحضور الآن</button>
            )}
          </div>
        )}
      </section>
    </MobileScreen>
  );
};
