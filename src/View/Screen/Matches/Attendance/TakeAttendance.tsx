import React, { useState } from 'react';
import {
  ArrowRight, Save, Check, X, Clock, FileWarning, Search, ClipboardCheck, Stethoscope,
} from 'lucide-react';
import { useTakeAttendanceController } from './TakeAttendanceController';
import type { PlayerAttendance } from './TakeAttendanceController';
import { Applink } from '../../../../LinkApi';
import { useIsMobile } from '../../../../core/functions/useIsMobile';
import { MobileTakeAttendance } from '../../../Mobile/MobileTrainingSessions/MobileTakeAttendance';
import './TakeAttendance.css';
import { StateIcon } from '../../../widget/StateIcon';

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

export const MatchAttendance: React.FC = () => {
  const c = useTakeAttendanceController();
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  // Phone: same attendance page as the training sessions
  if (isMobile) {
    const i = c.matchInfo;
    return (
      <MobileTakeAttendance
        c={c}
        subject="مباراة"
        info={i && { title: i.team_name, date: i.match_date, location: i.location, start_time: i.start_time, end_time: i.end_time }}
      />
    );
  }

  const filtered = c.attendanceList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.shirt_number || '').includes(search)
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
            <h1 className="ta-title">كشف الحضور والغياب</h1>
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
            placeholder="ابحث باسم اللاعب"
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
          <StateIcon />
        ) : (
          filtered.map((player, idx) => (
            <div
              key={player.id}
              className={`ta-player-card ${player.is_injured ? 'ta-card-injured' : ''} ${player.status ? `ta-card-${STATUS_BUTTONS.find(s => s.key === player.status)?.cls ?? ''}` : ''}`}
            >
              {/* Avatar */}
              <div className="ta-player-avatar">
                {getPhotoUrl(player.photo) ? (
                  <img src={getPhotoUrl(player.photo)!} alt={player.name} />
                ) : (
                  <span>{player.shirt_number || (idx + 1)}</span>
                )}
              </div>

              {/* Name */}
              <div className="ta-player-info">
                <span className="ta-player-name">
                  {player.name}
                  {player.is_injured && (
                    <span title="اللاعب مصاب" style={{ color: '#EF4444', marginRight: '6px' }}>
                      <Stethoscope size={16} style={{ verticalAlign: 'middle', display: 'inline-block' }} />
                    </span>
                  )}
                </span>
                {/* The shirt number once: here only when the photo takes its place */}
                {player.shirt_number && getPhotoUrl(player.photo) && (
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
