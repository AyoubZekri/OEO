import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

export interface TrainingSessionModel {
  id?: number;
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
}

export const TrainingSessionDialog: React.FC<TrainingSessionDialogProps> = ({ isOpen, onClose, onSave, sessionToEdit }) => {
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('مجدولة');

  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setDate(sessionToEdit.date);
        setLocation(sessionToEdit.location);
        setStart(sessionToEdit.start);
        setEnd(sessionToEdit.end);
        setStatus(sessionToEdit.status || 'مجدولة');
      } else {
        setDate('');
        setLocation('');
        setStart('');
        setEnd('');
        setStatus('مجدولة');
      }
    }
  }, [isOpen, sessionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: sessionToEdit?.id,
      date,
      location,
      start,
      end,
      status
    });
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>{sessionToEdit ? 'تعديل الحصة' : 'إضافة حصة تدريبية'}</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
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

          <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
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

          <div className="form-row">
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

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-submit">حفظ الحصة</button>
          </div>
        </form>
      </div>
    </div>
  );
};
