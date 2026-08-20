import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { TeamModel } from './team_model';
import { validInput } from '../../../core/functions/valiedinput';

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Omit<TeamModel, 'id' | 'toJson'>) => void;
  teamToEdit?: TeamModel | null;
}

export const TeamDialog: React.FC<TeamDialogProps> = ({ isOpen, onClose, onSave, teamToEdit }) => {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{name?: string}>({});

  useEffect(() => {
    if (isOpen) {
      if (teamToEdit) {
        setName(teamToEdit.name);
      } else {
        setName('');
      }
      setErrors({});
    }
  }, [isOpen, teamToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {name?: string} = {};
    const nameErr = validInput(name, 2, 50, 'text');
    if (nameErr) newErrors.name = nameErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        name
      });
    }
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>{teamToEdit ? 'تعديل فريق' : 'إضافة فريق جديد'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <CustomInput 
              label="اسم الفريق"
              required 
              type="text" 
              value={name} 
              onChange={(e) => {setName(e.target.value); setErrors(p => ({...p, name: undefined}));}} 
              placeholder="مثال: الفريق الأول" 
              error={errors.name}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-submit">حفظ الفريق</button>
          </div>
        </form>
      </div>
    </div>
  );
};
