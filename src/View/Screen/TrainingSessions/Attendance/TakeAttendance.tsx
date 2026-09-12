import React, { useState } from 'react';
import {
  ArrowRight, Save, Check, X, Clock, FileWarning,
  Users, MapPin, Calendar, CheckCircle2, Search,
  ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { useTakeAttendanceController } from './TakeAttendanceController';
import type { PlayerAttendance } from './TakeAttendanceController';
import { Applink } from '../../../../LinkApi';
import './TakeAttendance.css';

const STATUS_BUTTONS: {
  key: PlayerAttendance['status'];
  label: string;
  icon: React.ReactNode;
  cls: string;
}[] = [
  { key: 'حاضر',            label: 'حاضر',         icon: <Check size={15} />,       cls: 'present' },
  { key: 'متأخر',           label: 'متأخر',        icon: <Clock size={15} />,       cls: 'late'    },
  { key: 'غائب مبرر',      label: 'مبرر',         icon: <FileWarning size={15} />, cls: 'excused' },
  { key: 'غائب غير مبرر', label: 'غير مبرر',     icon: <X size={15} />,           cls: 'absent'  },
];

const getPhotoUrl = (photo?: string) => {
  if (!photo || photo === '' || photo.includes('default')) return null;
  if (photo.startsWith('http')) return photo;
  const cleanPath = photo.startsWith('/') ? photo.substring(1) : photo;
  return `${Applink.image}/${cleanPath}`;
};

export const TakeAttendance: React.FC = () => {
  const c = useTakeAttendanceController();
  const [search, setSearch] = useState('');

  const filtered = c.attendanceList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.shirt_number || '').includes(search)
  );

  const progressPct = c.stats.total > 0
    ? Math.round((c.stats.present / c.stats.total) * 100)
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
          <p>جاري تحميل بيانات الحصة...</p>
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
            <h1 className="ta-title">كشف الحضور والغياب</h1>
            {c.sessionInfo && (
              <div className="ta-session-meta">
                <span><Users size={13} /> {c.sessionInfo.team_name}</span>
                <span><Calendar size={13} /> {c.sessionInfo.session_date}</span>
                <span><MapPin size={13} /> {c.sessionInfo.location}</span>
                <span><Clock size={13} /> {c.sessionInfo.start_time} – {c.sessionInfo.end_time}</span>
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
          <span className="ta-stat-lbl">إجمالي اللاعبين</span>
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
            placeholder="بحث باسم اللاعب أو رقم القميص..."
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

      {/* ═══ PLAYERS GRID ═══ */}
      <div className="ta-players-grid">
        {filtered.length === 0 ? (
          <div className="ta-empty">
            <Users size={48} strokeWidth={1} />
            <p>لا يوجد لاعبون مطابقون للبحث.</p>
          </div>
        ) : (
          filtered.map((player, idx) => (
            <div
              key={player.id}
              className={`ta-player-card ${player.status ? `ta-card-${STATUS_BUTTONS.find(s => s.key === player.status)?.cls ?? ''}` : ''}`}
            >
              {/* Avatar */}
              <div className="ta-player-avatar">
                {getPhotoUrl(player.photo) ? (
                  <img src={getPhotoUrl(player.photo)!} alt={player.name} />
                ) : (
                  <span>{player.shirt_number || (idx + 1)}</span>
                )}
                {player.status && (
                  <div className={`ta-status-badge ta-badge-${STATUS_BUTTONS.find(s => s.key === player.status)?.cls}`}>
                    {STATUS_BUTTONS.find(s => s.key === player.status)?.icon}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="ta-player-info">
                <span className="ta-player-name">{player.name}</span>
                {player.shirt_number && (
                  <span className="ta-shirt-num">#{player.shirt_number}</span>
                )}
              </div>

              {/* Status buttons */}
              <div className="ta-status-btns">
                {STATUS_BUTTONS.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    title={s.key ?? ''}
                    className={`ta-status-btn ta-status-${s.cls} ${player.status === s.key ? 'ta-active' : ''}`}
                    onClick={() => c.handleStatusChange(player.id, s.key)}
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
                value={player.note}
                onChange={e => c.handleNoteChange(player.id, e.target.value)}
              />
            </div>
          ))
        )}
      </div>

    </div>
  );
};
