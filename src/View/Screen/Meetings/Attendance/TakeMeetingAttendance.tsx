import React, { useState } from 'react';
import {
  ArrowRight, Save, Check, X, Clock, FileWarning, Search, ClipboardCheck,
} from 'lucide-react';
import { useTakeMeetingAttendanceController } from './TakeMeetingAttendanceController';
import type { MeetingAttendeeFull } from './TakeMeetingAttendanceController';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileTakeAttendance } from '../../../Mobile/MobileTrainingSessions/MobileTakeAttendance';
import '../../Matches/Attendance/TakeAttendance.css';
import { StateIcon } from '../../../widget/StateIcon';

const STATUS_BUTTONS: {
  key: MeetingAttendeeFull['status'];
  label: string;
  icon: React.ReactNode;
  cls: string;
}[] = [
  { key: 'حاضر',            label: 'حاضر',       icon: <Check size={15} />,       cls: 'present' },
  { key: 'متأخر',           label: 'متأخر',      icon: <Clock size={15} />,       cls: 'late'    },
  { key: 'غائب مبرر',      label: 'مبرر',       icon: <FileWarning size={15} />, cls: 'excused' },
  { key: 'غائب غير مبرر', label: 'غير مبرر',   icon: <X size={15} />,           cls: 'absent'  },
];

export const TakeMeetingAttendance: React.FC = () => {
  const c = useTakeMeetingAttendanceController();
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  // Phone: same attendance page as the training sessions and matches
  if (isMobile) {
    const i = c.meetingInfo;
    return (
      <MobileTakeAttendance
        c={c}
        subject="اجتماع"
        info={i && { title: i.topic, date: i.date, location: i.location, start_time: i.time }}
      />
    );
  }

  const filtered = c.attendanceList.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Loading ── */
  if (c.isLoading) {
    return (
      <div className="ta-container">
        <div className="ta-loading">
          <div className="ta-spinner" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (c.error) {
    return (
      <div className="ta-container">
        <div className="ta-error-box">
          <StateIcon failed />
          <button type="button" className="ta-back-btn" onClick={c.handleBack}>
            <ArrowRight size={18} /> رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ta-container">

      <div className="ta-top-actions">
        <button type="button" className="ta-back-btn" onClick={c.handleBack}>
          <ArrowRight size={18} />
          رجوع
        </button>
      </div>

      {/* ═══ TOP HEADER BAR ═══ */}
      <div className="ta-header">
        <div className="ta-header-center">
          <div className="ta-header-icon">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="ta-title">{c.meetingInfo?.topic || 'الحضور'}</h1>
          </div>
        </div>

        <button
          type="button"
          className="ta-save-btn"
          onClick={c.handleSave}
          disabled={c.isSaving}
        >
          <Save size={18} />
          {c.isSaving ? 'جاري الحفظ...' : 'حفظ الكشف'}
        </button>
      </div>

      {/* ═══ TOOLBAR: Search + Mark All ═══ */}
      <div className="ta-toolbar">
        <div className="ta-search-wrap">
          <Search size={15} />
          <input
            type="text"
            className="ta-search"
            placeholder="ابحث باسم العضو"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ta-mark-all">
          <span>تحديد الكل:</span>
          {STATUS_BUTTONS.map(s => (
            <button
              key={s.key}
              type="button"
              className={`ta-mark-btn ta-mark-${s.cls}`}
              onClick={() => c.markAll(s.key)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MEMBERS GRID ═══ */}
      <div className="ta-players-grid">
        {filtered.length === 0 ? (
          <StateIcon />
        ) : (
          filtered.map(attendee => (
            <div
              key={attendee.id}
              className={`ta-player-card ${attendee.status ? `ta-card-${STATUS_BUTTONS.find(s => s.key === attendee.status)?.cls ?? ''}` : ''}`}
            >
              {/* Avatar */}
              <div className="ta-player-avatar">
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {attendee.name.charAt(0)}
                </span>
              </div>

              {/* Name */}
              <div className="ta-player-info">
                <span className="ta-player-name">{attendee.name}</span>
                {attendee.role && (
                  <span className="ta-shirt-num">{attendee.role}</span>
                )}
              </div>

              {/* Status buttons */}
              <div className="ta-status-btns">
                {STATUS_BUTTONS.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    title={s.key ?? ''}
                    className={`ta-status-btn ta-status-${s.cls} ${attendee.status === s.key ? 'ta-active' : ''}`}
                    onClick={() => c.handleStatusChange(attendee.id, s.key)}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Note */}
              <input
                type="text"
                className="ta-note-input"
                placeholder="ملاحظة..."
                value={attendee.note}
                onChange={e => c.handleNoteChange(attendee.id, e.target.value)}
              />
            </div>
          ))
        )}
      </div>

    </div>
  );
};
