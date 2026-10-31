import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ArrowRight, Save } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { showSnackbar } from '../../../core/functions/Snacpar';

export interface TrainingSessionModel {
  id?: number;
  team_id?: string;
  team_name?: string;
  date: string;
  location: string;
  start: string;
  end: string;
  status: string;
  attendance_stats?: {
    total: number;
    present: number;
    absent: number;
  };
  /** The attendance sheet was saved (management list) */
  attendance_taken?: boolean;
  /** Personal space: my absence / late record in this session (null when none) */
  my_absence?: string | null;
  my_absence_note?: string;
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
  // The fields to type left empty: their message under them (the category, a choice: a snackbar)
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowErrors(false);
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

  const errors = {
    date: !date ? 'حدد تاريخ التدريب' : null,
    location: !location.trim() ? 'اكتب مكان التدريب' : null,
    start: !start ? 'حدد بداية الحصة' : null,
    end: !end ? 'حدد نهاية الحصة' : start && end <= start ? 'النهاية تكون بعد البداية' : null,
  };
  const error = (field: keyof typeof errors) => (showErrors ? errors[field] : null);
  const missingClass = (field: keyof typeof errors) => (error(field) ? 'is-missing' : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!teamId) return showSnackbar('خطأ', 'اختر الفئة المعنية', '#ef4444');
    if (Object.values(errors).some(Boolean)) return;
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
              label="الفئة المعنية"
              value={teamId}
              options={teamOptions}
              onChange={(val) => setTeamId(val)}
              placeholder=""
            />
          </div>

          <div className="modern-form-group" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <CustomInput
                label="تاريخ التدريب"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={missingClass('date')}
                error={error('date')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <CustomInput
                label="مكان التدريب"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={missingClass('location')}
                error={error('location')}
              />
            </div>
          </div>

          <div className="modern-form-group" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <CustomInput
                label="بداية الحصة"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={missingClass('start')}
                error={error('start')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <CustomInput
                label="نهاية الحصة"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={missingClass('end')}
                error={error('end')}
              />
            </div>
          </div>


        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="modern-btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            {sessionToEdit ? 'حفظ التعديلات' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
