import React, { useState } from 'react';
import {
  ArrowRight, Save, Check, X, Clock, FileWarning,
  Users, MapPin, Calendar, CheckCircle2, Search,
  ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { useTakeMeetingAttendanceController } from './TakeMeetingAttendanceController';
import type { MeetingAttendeeFull } from './TakeMeetingAttendanceController';
import '../../Matches/Attendance/TakeAttendance.css';

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

  const filtered = c.attendanceList.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const progressPct = c.stats.total > 0
    ? Math.round(((c.stats.present + c.stats.late) / c.stats.total) * 100)
    : 0;

  const circleRadius = 35;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (progressPct / 100) * circleCircumference;

  /* ── Loading ── */
  if (c.isLoading) {
    return (
      <div className="ta-container">
        <div className="ta-loading">
          <div className="ta-spinner" />
          <p>جاري تحميل بيانات الاجتماع...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (c.error) {
    return (
      <div className="ta-container">
        <div className="ta-error-box">
          <AlertTriangle size={40} />
          <p>{c.error}</p>
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
            <h1 className="ta-title">كشف حضور الاجتماع</h1>
            {c.meetingInfo && (
              <div className="ta-match-meta">
                <span><ClipboardCheck size={13} /> {c.meetingInfo.topic}</span>
                <span><Calendar size={13} /> {c.meetingInfo.date}</span>
                <span><Clock size={13} /> {c.meetingInfo.time}</span>
                <span><MapPin size={13} /> {c.meetingInfo.location}</span>
              </div>
            )}
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

      {/* ═══ STATS ROW ═══ */}
      <div className="ta-stats-row">
        <div className="ta-stat-card ta-stat-total">
          <span className="ta-stat-num">{c.stats.total}</span>
          <span className="ta-stat-lbl">إجمالي الأعضاء</span>
        </div>
        <div className="ta-stat-card ta-stat-present">
          <CheckCircle2 size={18} />
          <span className="ta-stat-num">{c.stats.present}</span>
          <span className="ta-stat-lbl">حاضر</span>
        </div>
        <div className="ta-stat-card ta-stat-late">
          <Clock size={18} />
          <span className="ta-stat-num">{c.stats.late}</span>
          <span className="ta-stat-lbl">متأخر</span>
        </div>
        <div className="ta-stat-card ta-stat-excused">
          <FileWarning size={18} />
          <span className="ta-stat-num">{c.stats.excused}</span>
          <span className="ta-stat-lbl">غائب مبرر</span>
        </div>
        <div className="ta-stat-card ta-stat-absent">
          <X size={18} />
          <span className="ta-stat-num">{c.stats.absent}</span>
          <span className="ta-stat-lbl">غائب غير مبرر</span>
        </div>

        {/* Progress */}
        <div className="ta-progress-card">
          <div className="ta-circular-wrap">
            <svg className="ta-circular-svg" viewBox="0 0 100 100">
              <circle className="ta-circular-bg" cx="50" cy="50" r={circleRadius} />
              <circle
                className="ta-circular-fill"
                cx="50" cy="50" r={circleRadius}
                style={{
                  strokeDasharray: circleCircumference,
                  strokeDashoffset: circleOffset
                }}
              />
            </svg>
            <div className="ta-circular-text">
              <strong>{progressPct}%</strong>
              <span>نسبة الحضور</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TOOLBAR: Search + Mark All ═══ */}
      <div className="ta-toolbar">
        <div className="ta-search-wrap">
          <Search size={15} />
          <input
            type="text"
            className="ta-search"
            placeholder="بحث باسم العضو..."
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
          <div className="ta-empty">
            <Users size={48} strokeWidth={1} />
            <p>لا يوجد أعضاء مطابقون للبحث أو لم يتم إضافة أعضاء لهذا الاجتماع.</p>
          </div>
        ) : (
          filtered.map((attendee, idx) => (
            <div
              key={attendee.id}
              className={`ta-player-card ${attendee.status ? `ta-card-${STATUS_BUTTONS.find(s => s.key === attendee.status)?.cls ?? ''}` : ''}`}
            >
              {/* Avatar */}
              <div className="ta-player-avatar">
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {attendee.name.charAt(0)}
                </span>
                {attendee.status && (
                  <div className={`ta-status-badge ta-badge-${STATUS_BUTTONS.find(s => s.key === attendee.status)?.cls}`}>
                    {STATUS_BUTTONS.find(s => s.key === attendee.status)?.icon}
                  </div>
                )}
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
                placeholder="ملاحظة أو سبب الغياب..."
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
