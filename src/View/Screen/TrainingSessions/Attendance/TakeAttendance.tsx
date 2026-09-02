import React from 'react';
import { ArrowRight, Check, X, Clock, FileWarning, Save } from 'lucide-react';
import { useTakeAttendanceController } from './TakeAttendanceController';
import type { PlayerAttendance } from './TakeAttendanceController';
import './TakeAttendance.css';

export const TakeAttendance: React.FC = () => {
  const controller = useTakeAttendanceController();

  const getStatusIcon = (status: PlayerAttendance['status']) => {
    switch(status) {
      case 'حاضر': return <Check size={16} />;
      case 'متأخر': return <Clock size={16} />;
      case 'غائب مبرر': return <FileWarning size={16} />;
      case 'غائب غير مبرر': return <X size={16} />;
      default: return null;
    }
  };

  return (
    <div className="take-attendance-container">
      <div className="take-attendance-header">
        <button type="button" className="back-btn" onClick={controller.handleBack}>
          <ArrowRight size={20} />
          رجوع
        </button>
        <div className="header-titles">
          <h1>كشف حضور التدريبات</h1>
          <p>تسجيل الحضور للحصة رقم {controller.sessionId}</p>
        </div>
        <button type="button" className="save-btn" onClick={controller.handleSave}>
          <Save size={20} />
          حفظ الكشف
        </button>
      </div>

      <div className="attendance-table-card">
        <div className="table-responsive">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>اللاعب</th>
                <th className="status-col">حاضر</th>
                <th className="status-col">متأخر</th>
                <th className="status-col">غائب مبرر</th>
                <th className="status-col">غائب غير مبرر</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {controller.attendanceList.map(player => (
                <tr key={player.id} className={player.status ? 'row-selected' : ''}>
                  <td className="player-name-cell">
                    <div className="player-avatar">
                      {player.name.charAt(0)}
                    </div>
                    <span className="player-name">{player.name}</span>
                  </td>
                  
                  <td className="status-cell">
                    <button 
                      type="button" 
                      className={`status-btn present ${player.status === 'حاضر' ? 'active' : ''}`}
                      onClick={() => controller.handleStatusChange(player.id, 'حاضر')}
                    >
                      {player.status === 'حاضر' && <Check size={16} />}
                    </button>
                  </td>
                  <td className="status-cell">
                    <button 
                      type="button" 
                      className={`status-btn late ${player.status === 'متأخر' ? 'active' : ''}`}
                      onClick={() => controller.handleStatusChange(player.id, 'متأخر')}
                    >
                      {player.status === 'متأخر' && <Clock size={16} />}
                    </button>
                  </td>
                  <td className="status-cell">
                    <button 
                      type="button" 
                      className={`status-btn excused ${player.status === 'غائب مبرر' ? 'active' : ''}`}
                      onClick={() => controller.handleStatusChange(player.id, 'غائب مبرر')}
                    >
                      {player.status === 'غائب مبرر' && <FileWarning size={16} />}
                    </button>
                  </td>
                  <td className="status-cell">
                    <button 
                      type="button" 
                      className={`status-btn absent ${player.status === 'غائب غير مبرر' ? 'active' : ''}`}
                      onClick={() => controller.handleStatusChange(player.id, 'غائب غير مبرر')}
                    >
                      {player.status === 'غائب غير مبرر' && <X size={16} />}
                    </button>
                  </td>

                  <td className="note-cell">
                    <input 
                      type="text" 
                      className="note-input" 
                      placeholder="أضف ملاحظة..." 
                      value={player.note}
                      onChange={(e) => controller.handleNoteChange(player.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
