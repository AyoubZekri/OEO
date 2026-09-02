import React from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
import { TrainingSessionDialog } from './TrainingSessionDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { Link } from 'react-router-dom';
import { useTrainingSessionsController } from './TrainingSessionsController';
import './TrainingSessions.css';

const TrainingSessions: React.FC = () => {
  const controller = useTrainingSessionsController();

  return (
    <div className="training-sessions-container">
      <div className="training-sessions-header">
        <h1>حصص التدريب</h1>
        <button type="button" className="add-session-btn" onClick={controller.openAddDialog}>
          <Plus size={20} />
          إضافة حصة
        </button>
      </div>

      <div className="training-sessions-grid">
        {controller.sessions.map(session => (
          <div key={session.id} className="session-card">
            
            <div className="session-header-row">
              <div className="session-icon-wrapper">
                <Calendar size={24} strokeWidth={1.5} />
              </div>
              <h2 className="session-title">حصة تدريبية</h2>
            </div>
            
            <div className="session-info">
              <div className="info-item">
                <Calendar className="info-icon" size={18} />
                <span>{session.date}</span>
              </div>
              <div className="info-item">
                <MapPin className="info-icon" size={18} />
                <span>{session.location}</span>
              </div>
              <div className="info-item">
                <Clock className="info-icon" size={18} />
                <span>{session.start} - {session.end}</span>
              </div>
            </div>
            
            <div className="session-actions">
              <div className="status-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                <CustomDropdown<string>
                  value={session.status}
                  onChange={(val) => controller.handleChangeStatus(session.id, val)}
                  options={[
                    { value: 'مجدولة', label: 'مجدولة', icon: <div className="status-dot dot-scheduled"></div> },
                    { value: 'جارية', label: 'جارية الآن', icon: <div className="status-dot dot-active"></div> },
                    { value: 'مكتملة', label: 'مكتملة', icon: <div className="status-dot dot-completed"></div> },
                    { value: 'ملغاة', label: 'ملغاة', icon: <div className="status-dot dot-cancelled"></div> }
                  ]}
                />
              </div>

              <div className="action-buttons">
                <Link to={`/training-sessions/${session.id}/attendance`} className="session-action-btn attendance" title="تسجيل الحضور" style={{ textDecoration: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>سجل الحضور</span>
                </Link>
                <button type="button" className="session-action-btn edit" onClick={() => controller.openEditDialog(session)} title="تعديل">
                  <Edit2 size={18} />
                </button>
                <button type="button" className="session-action-btn delete" onClick={() => controller.handleDeleteSession(session.id)} title="حذف">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
          </div>
        ))}
      </div>

      <TrainingSessionDialog 
        isOpen={controller.isDialogOpen}
        onClose={controller.closeDialog}
        onSave={controller.handleSaveSession}
        sessionToEdit={controller.sessionToEdit}
      />
    </div>
  );
};

export default TrainingSessions;
