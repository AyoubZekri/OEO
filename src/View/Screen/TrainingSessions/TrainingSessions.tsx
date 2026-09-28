import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Users, ClipboardList, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrainingSessionDialog } from './TrainingSessionDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useTrainingSessionsController } from './TrainingSessionsController';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileTrainingSessions } from '../../Mobile/MobileTrainingSessions/MobileTrainingSessions';
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
  const isMobile = useIsMobile();
  const can = useCan();

  if (isMobile) return <MobileTrainingSessions controller={controller} />;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'مجدولة': return { label: 'مجدولة',    cls: 'status-scheduled' };
      case 'جارية':  return { label: 'جارية الآن', cls: 'status-ongoing' };
      case 'مكتملة': return { label: 'مكتملة',    cls: 'status-completed' };
      case 'ملغاة':  return { label: 'ملغاة',     cls: 'status-cancelled' };
      default:        return { label: status,       cls: '' };
    }
  };

  const getComputedStatus = (session: any) => {
    const rawStatus = session.status ? session.status.trim() : '';
    // If the user manually set a specific status, respect it and override the dynamic time check
    if (rawStatus === 'ملغاة' || rawStatus === 'مكتملة' || rawStatus === 'جارية') {
      return rawStatus;
    }
    
    if (!session.date || !session.start || !session.end) {
      return session.status || 'مجدولة';
    }

    const now = new Date();
    // Safely extract just the YYYY-MM-DD part in case it's an ISO string
    const datePart = session.date.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return session.status;
    
    const [startH, startM] = session.start.split(':').map(Number);
    const [endH, endM] = session.end.split(':').map(Number);

    const startTime = new Date(year, month - 1, day, startH, startM);
    const endTime = new Date(year, month - 1, day, endH, endM);

    if (now < startTime) return 'مجدولة';
    if (now >= startTime && now <= endTime) return 'جارية';
    if (now > endTime) return 'مكتملة';
    
    return session.status;
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
        <div className="header-actions">
          <div className="modern-filter-group">
            <CustomDropdown<string>
              value={controller.selectedTeamId}
              options={teamOptions}
              onChange={controller.setSelectedTeamId}
              placeholder="تصفية حسب الفئة"
            />
          </div>
          {can('trainingSessions', 'add') && (
            <button type="button" className="add-session-btn" onClick={controller.openAddDialog}>
              <Plus size={20} />
              إضافة حصة
            </button>
          )}
        </div>
      </div>

      {controller.isLoading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <div className="premium-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="loading-text">جاري تحميل الحصص...</p>
        </div>
      ) : (
        <div className="training-sessions-grid">
          {controller.sessions.map((session, idx) => {
            const computedStatusText = getComputedStatus(session);
            const status = getStatusInfo(computedStatusText);
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
                      disabled={!can('trainingSessions', 'edit')}
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
                            className={`sc-status-menu-item ${getStatusInfo(opt.value).cls} ${computedStatusText === opt.value ? 'active' : ''}`}
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
                        {formatDate(session.date)}
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
                    <div className="sc-progress-fill" style={{ width: session.attendance_stats && session.attendance_stats.total > 0 ? `${Math.round((session.attendance_stats.present / session.attendance_stats.total) * 100)}%` : '0%' }}></div>
                  </div>
                  <div className="sc-attendance-nums">
                    <span className="sc-att-present">
                      {session.attendance_stats ? `${session.attendance_stats.present} / ${session.attendance_stats.total} لاعب` : '---'}
                    </span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="sc-footer">
                  {can('trainingSessions', 'attendance') && (
                    <Link to={`/training-sessions/${session.id}/attendance`} className="sc-action-btn edit" title="تسجيل الحضور والغياب">
                      <ClipboardList size={15} />
                    </Link>
                  )}
                  <div className="sc-icon-actions">
                    {can('trainingSessions', 'edit') && (
                      <button type="button" className="sc-action-btn edit" onClick={() => controller.openEditDialog(session)} title="تعديل">
                        <Edit2 size={15} />
                      </button>
                    )}
                    {can('trainingSessions', 'delete') && (
                      <button type="button" className="sc-action-btn delete" onClick={() => controller.handleDeleteSession(session.id)} title="حذف">
                        <Trash2 size={15} />
                      </button>
                    )}
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
