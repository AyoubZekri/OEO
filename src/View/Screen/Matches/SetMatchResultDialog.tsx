import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, CheckCircle } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';
import type { Match } from './match_model';

interface SetMatchResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  matchData: Match | null;
}

export const SetMatchResultDialog: React.FC<SetMatchResultDialogProps> = ({ isOpen, onClose, onSave, matchData }) => {
  const [formData, setFormData] = useState({
    team_score: '',
    opponent_score: '',
    match_status: '',
    match_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && matchData) {
      setFormData({
        team_score: matchData.team_score !== undefined && matchData.team_score !== null ? matchData.team_score.toString() : '',
        opponent_score: matchData.opponent_score !== undefined && matchData.opponent_score !== null ? matchData.opponent_score.toString() : '',
        match_status: matchData.match_status === 'مؤجلة' ? 'مؤجلة' : '',
        match_date: matchData.match_status === 'مؤجلة' && matchData.match_date ? matchData.match_date.substring(0, 16) : ''
      });
    }
  }, [isOpen, matchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...matchData,
        coach_id: matchData.coach_id?.id ? matchData.coach_id.id : matchData.coach_id,
        admin_id: matchData.admin_id?.id ? matchData.admin_id.id : matchData.admin_id,
        team_id: matchData.team_id || matchData.team?.id,
        team_score: formData.match_status === 'مؤجلة' ? null : (formData.team_score === '' ? null : formData.team_score),
        opponent_score: formData.match_status === 'مؤجلة' ? null : (formData.opponent_score === '' ? null : formData.opponent_score),
        match_status: formData.match_status === 'مؤجلة' ? 'مؤجلة' : (formData.team_score !== '' ? 'ملعوبة' : ''),
        match_date: formData.match_status === 'مؤجلة' && formData.match_date ? formData.match_date : matchData.match_date
      };
      
      const res = await axios.post(Applink.updateMatch, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving match result:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء الحفظ\n${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !matchData) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '500px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>تعيين النتيجة والحالة</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>
            {matchData.team?.name || 'فريقنا'} ضد {matchData.opponent || 'الخصم'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="task-form" style={{ padding: '24px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <CustomDropdown<string>
              label="حالة المباراة"
              value={formData.match_status}
              onChange={(val) => setFormData({ ...formData, match_status: val })}
              options={[
                { value: '', label: 'مبرمجة / ملعوبة' },
                { value: 'مؤجلة', label: 'مؤجلة' }
              ]}
              placeholder="اختر الحالة"
            />
          </div>

          {formData.match_status === 'مؤجلة' ? (
            <div style={{ marginBottom: '16px' }}>
              <CustomInput
                label="تاريخ المباراة الجديد (اختياري)"
                type="datetime-local"
                value={formData.match_date}
                onChange={e => setFormData({...formData, match_date: e.target.value})}
              />
            </div>
          ) : (
            <div className="responsive-grid-2" style={{ background: 'var(--bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px', gap: '16px' }}>
              <CustomInput
                label="أهداف فريقنا"
                type="number"
                value={formData.team_score}
                onChange={e => setFormData({...formData, team_score: e.target.value})}
              />
              <CustomInput
                label="أهداف الخصم"
                type="number"
                value={formData.opponent_score}
                onChange={e => setFormData({...formData, opponent_score: e.target.value})}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 24px', minWidth: '100px', fontSize: '1rem' }}>
              إلغاء
            </button>
            <button type="submit" className="mc-btn mc-btn-primary" disabled={isSubmitting} style={{ padding: '12px 32px', minWidth: '140px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isSubmitting ? 'جاري الحفظ...' : <><CheckCircle size={18} /> حفظ النتيجة</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
