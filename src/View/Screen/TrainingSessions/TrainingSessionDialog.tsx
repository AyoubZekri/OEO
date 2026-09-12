import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ArrowRight, Save } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

export interface TrainingSessionModel {
  id?: number;
  team_id?: string;
  team_name?: string;
  date: string;
  location: string;
  start: string;
  end: string;
  status: string;
}

interface TrainingSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: TrainingSessionModel) => void;
  sessionToEdit?: TrainingSessionModel | null;
  teams: any[];
}

export const TrainingSessionDialog: React.FC<TrainingSessionDialogProps> = ({ isOpen, onClose, onSave, sessionToEdit, teams }) => {
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('مجدولة');
  const [teamId, setTeamId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setDate(sessionToEdit.date);
        setLocation(sessionToEdit.location);
        setStart(sessionToEdit.start);
        setEnd(sessionToEdit.end);
        setStatus(sessionToEdit.status || 'مجدولة');
        setTeamId(sessionToEdit.team_id || '');
      } else {
        setDate('');
        setLocation('');
        setStart('');
        setEnd('');
        setStatus('مجدولة');
        setTeamId('');
      }
    }
  }, [isOpen, sessionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: sessionToEdit?.id,
      team_id: teamId,
      date,
      location,
      start,
      end,
      status
    });
  };

  const teamOptions = teams.map(t => ({ value: t.id.toString(), label: t.name }));

  return createPortal(
    <div className="modern-dialog-overlay" onClick={onClose}>
      <div className="modern-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="modern-dialog-header app-bar-header">
          <button type="button" className="mobile-back-btn" onClick={onClose}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <Calendar size={24} />
            </div>
            <h2>
              <span className="desktop-title">{sessionToEdit ? 'تعديل الحصة التدريبية' : 'إضافة حصة تدريبية جديدة'}</span>
              <span className="mobile-title">{sessionToEdit ? 'تعديل حصة' : 'إضافة حصة'}</span>
            </h2>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modern-dialog-body">
          
          <div className="modern-form-group">
            <CustomDropdown<string>
              label="الفئة المعنية (الفريق)"
              value={teamId}
              options={teamOptions}
              onChange={(val) => setTeamId(val)}
              placeholder="اختر الفئة المعنية..."
            />
          </div>

          <div className="modern-form-group" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <CustomInput 
                label="تاريخ التدريب"
                required 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <CustomInput 
                label="مكان التدريب"
                required 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="مثال: القاعة الرئيسية" 
              />
            </div>
          </div>

          <div className="modern-form-group" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <CustomInput 
                label="بداية الحصة"
                required 
                type="time" 
                value={start} 
                onChange={(e) => setStart(e.target.value)} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <CustomInput 
                label="نهاية الحصة"
                required 
                type="time" 
                value={end} 
                onChange={(e) => setEnd(e.target.value)} 
              />
            </div>
          </div>

          <div className="modern-form-group">
            <CustomDropdown<string>
              label="حالة الحصة"
              value={status}
              options={[
                { value: 'مجدولة', label: 'مجدولة' },
                { value: 'جارية', label: 'جارية الآن' },
                { value: 'مكتملة', label: 'مكتملة' },
                { value: 'ملغاة', label: 'ملغاة' }
              ]}
              onChange={(val) => setStatus(val)}
              placeholder="اختر حالة الحصة"
            />
          </div>

        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="modern-btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            {sessionToEdit ? 'حفظ التعديلات' : 'إضافة الحصة'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
