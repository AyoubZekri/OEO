import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Users, ClipboardList, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrainingSessionDialog } from './TrainingSessionDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useTrainingSessionsController } from './TrainingSessionsController';
import './TrainingSessions.css';

const STATUS_OPTIONS = [
  { value: 'مجدولة',  label: 'مجدولة' },
  { value: 'جارية',   label: 'جارية الآن' },
  { value: 'مكتملة', label: 'مكتملة' },
  { value: 'ملغاة',  label: 'ملغاة' },
];

const TrainingSessions: React.FC = () => {
  const controller = useTrainingSessionsController();
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'مجدولة': return { label: 'مجدولة',    cls: 'status-scheduled' };
      case 'جارية':  return { label: 'جارية الآن', cls: 'status-ongoing' };
      case 'مكتملة': return { label: 'مكتملة',    cls: 'status-completed' };
      case 'ملغاة':  return { label: 'ملغاة',     cls: 'status-cancelled' };
      default:        return { label: status,       cls: '' };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return dateStr;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const calcDuration = (start: string, end: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : null;
  };

  const teamOptions = [
    { value: '', label: 'جميع الفئات' },
    ...controller.teams.map(t => ({ value: t.id.toString(), label: t.name }))
  ];

  const handleStatusChange = async (sessionId: number | undefined, newStatus: string) => {
    setOpenStatusMenu(null);
    await controller.handleChangeStatus(sessionId, newStatus);
  };

  return (
    <div className="training-sessions-container">
      <div className="training-sessions-header">
        <h1>حصص التدريب</h1>
        <div className="header-actions">
          <div style={{ width: '200px' }}>
            <CustomDropdown<string>
              value={controller.selectedTeamId}
              options={teamOptions}
              onChange={controller.setSelectedTeamId}
              placeholder="تصفية حسب الفئة"
            />
          </div>
          <button type="button" className="add-session-btn" onClick={controller.openAddDialog}>
            <Plus size={20} />
            إضافة حصة
          </button>
        </div>
      </div>

      {controller.isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
      ) : (
        <div className="training-sessions-grid">
          {controller.sessions.map((session, idx) => {
            const status = getStatusInfo(session.status);
            const duration = calcDuration(session.start, session.end);
            const isMenuOpen = openStatusMenu === (session.id ?? idx);
            return (
              <div key={session.id ?? idx} className="sc-card">

                {/* Top bar: session number + status with dropdown */}
                <div className="sc-topbar">
                  <span className={`sc-status-dot ${status.cls}`}></span>

                  {/* Status change button */}
                  <div className="sc-status-wrapper">
                    <button
                      type="button"
                      className={`sc-status-label ${status.cls}`}
                      onClick={() => setOpenStatusMenu(isMenuOpen ? null : (session.id ?? idx))}
                    >
                      {status.label}
                      <ChevronDown size={11} style={{ marginRight: '3px' }} />
                    </button>
                    {isMenuOpen && (
                      <div className="sc-status-menu">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`sc-status-menu-item ${getStatusInfo(opt.value).cls} ${session.status === opt.value ? 'active' : ''}`}
                            onClick={() => handleStatusChange(session.id, opt.value)}
                          >
                            <span className={`sc-status-dot ${getStatusInfo(opt.value).cls}`}></span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="sc-session-num">حصة تدريب #{session.id ?? (idx + 1)}</span>
                </div>

                {/* Icon + title + team */}
                <div className="sc-hero">
                  <div className="sc-icon-box">
                    <Calendar size={22} strokeWidth={1.5} />
                  </div>
                  <div className="sc-hero-text">
                    <h2 className="sc-title">حصة تدريبية</h2>
                    <div className="sc-team">
                      <Users size={11} />
                      <span>{session.team_name || 'بدون فئة'}</span>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="sc-info-list">
                  <div className="sc-info-row">
                    <div className="sc-info-icon-wrap orange">
                      <Calendar size={13} />
                    </div>
                    <div className="sc-info-content">
                      <span className="sc-info-label">تاريخ الحصة</span>
                      <span className="sc-info-value">
                        {formatDate(session.date)} <span className="sc-info-sub">({session.date})</span>
                      </span>
                    </div>
                  </div>

                  <div className="sc-info-row">
                    <div className="sc-info-icon-wrap blue">
                      <Clock size={13} />
                    </div>
                    <div className="sc-info-content">
                      <span className="sc-info-label">التوقيت والمدة</span>
                      <div className="sc-time-row">
                        <span className="sc-time-value" dir="ltr">{session.start} – {session.end}</span>
                        {duration && <span className="sc-duration">{duration} دقيقة</span>}
                      </div>
                    </div>
                  </div>

                  <div className="sc-info-row">
                    <div className="sc-info-icon-wrap red">
                      <MapPin size={13} />
                    </div>
                    <div className="sc-info-content">
                      <span className="sc-info-label">مكان التدريب</span>
                      <span className="sc-info-value">{session.location}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance progress bar */}
                <div className="sc-attendance">
                  <div className="sc-attendance-header">
                    <span className="sc-attendance-label">قائمة الحضور</span>
                  </div>
                  <div className="sc-progress-bar">
                    <div className="sc-progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <div className="sc-attendance-nums">
                    <span className="sc-att-present">18 / 22 لاعب</span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="sc-footer">
                  <Link to={`/training-sessions/${session.id}/attendance`} className="sc-action-btn edit" title="تسجيل الحضور والغياب">
                    <ClipboardList size={15} />
                  </Link>
                  <div className="sc-icon-actions">
                    <button type="button" className="sc-action-btn edit" onClick={() => controller.openEditDialog(session)} title="تعديل">
                      <Edit2 size={15} />
                    </button>
                    <button type="button" className="sc-action-btn delete" onClick={() => controller.handleDeleteSession(session.id)} title="حذف">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {controller.sessions.length === 0 && (
            <div className="sc-empty">
              <Calendar size={40} strokeWidth={1} />
              <p>لا توجد حصص تدريبية مبرمجة لهذه الفئة.</p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close status menus */}
      {openStatusMenu !== null && (
        <div className="sc-backdrop" onClick={() => setOpenStatusMenu(null)} />
      )}

      {controller.isDialogOpen && (
        <TrainingSessionDialog
          isOpen={controller.isDialogOpen}
          onClose={controller.closeDialog}
          onSave={controller.handleSaveSession}
          sessionToEdit={controller.sessionToEdit}
          teams={controller.teams}
        />
      )}
    </div>
  );
};

export default TrainingSessions;
