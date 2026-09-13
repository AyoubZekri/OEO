import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomInput } from '../../widget/CustomInput';
import { CustomMultiSelect } from '../../widget/CustomMultiSelect';

interface AddAbsenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultPlayerId?: number | null;
  isMultiMode?: boolean;
}

export const AddAbsenceDialog: React.FC<AddAbsenceDialogProps> = ({ isOpen, onClose, onSubmit, defaultPlayerId, isMultiMode = false }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [recordMode, setRecordMode] = useState<'record' | 'late' | 'request' | 'leave'>('record');
  const [formData, setFormData] = useState<{
    player_ids: string[];
    absence_type: string;
    event_category: string;
    event_date: string;
    duration: string;
    reason: string;
    record_source: string;
  }>({
    player_ids: [],
    absence_type: 'غياب',
    event_category: 'تدريب',
    event_date: new Date().toISOString().split('T')[0],
    duration: '',
    reason: '',
    record_source: 'يدوي'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customEventCategory, setCustomEventCategory] = useState('');
  const [memberReasons, setMemberReasons] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
      if (defaultPlayerId) {
        setFormData(prev => ({ ...prev, player_ids: [defaultPlayerId.toString()] }));
      } else {
        setFormData(prev => ({ ...prev, player_ids: [] }));
      }
    }
  }, [isOpen, defaultPlayerId]);

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(Applink.individuals, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const allPlayers = res.data.filter((ind: any) => ind.type === 'لاعب' || ind.type === 'player' || !ind.type);
      setPlayers(allPlayers.length > 0 ? allPlayers : res.data);
    } catch (err) {
      console.error('Error fetching players', err);
    }
  };

  const handleModeChange = (mode: 'record' | 'late' | 'request' | 'leave') => {
    setRecordMode(mode);
    if (mode === 'request') {
      setFormData(prev => ({ ...prev, absence_type: 'طلب عطلة' }));
    } else if (mode === 'late') {
      setFormData(prev => ({ ...prev, absence_type: 'تأخر' }));
    } else if (mode === 'leave') {
      setFormData(prev => ({ ...prev, absence_type: 'مغادرة' }));
    } else {
      setFormData(prev => ({ ...prev, absence_type: 'غياب' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.player_ids.length === 0) {
      alert('الرجاء اختيار الأعضاء');
      return;
    }
    if (!formData.event_date) {
      alert('الرجاء اختيار التاريخ');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalEventCategory = formData.event_category === 'أخرى' && customEventCategory.trim() !== '' ? customEventCategory : formData.event_category;
      await onSubmit({ ...formData, event_category: finalEventCategory, mode: recordMode, member_reasons: memberReasons });
      // Reset form
      setFormData({
        player_ids: [],
        absence_type: 'غياب',
        event_category: 'تدريب',
        event_date: new Date().toISOString().split('T')[0],
        duration: '',
        reason: '',
        record_source: 'يدوي'
      });
      setRecordMode('record');
      setCustomEventCategory('');
      setMemberReasons({});
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '650px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>
            {recordMode === 'request' ? 'تقديم طلب عطلة' :
              recordMode === 'late' ? 'تسجيل حالة تأخر' :
              recordMode === 'leave' ? 'تسجيل حالة مغادرة' :
                'تسجيل حالة غياب'}
          </h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => handleModeChange('record')}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: recordMode === 'record' ? '#fff' : 'transparent', color: recordMode === 'record' ? '#dc2626' : '#64748b', fontWeight: recordMode === 'record' ? '700' : '600', boxShadow: recordMode === 'record' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.95rem' }}
            >
              غياب
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('late')}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: recordMode === 'late' ? '#fff' : 'transparent', color: recordMode === 'late' ? '#d97706' : '#64748b', fontWeight: recordMode === 'late' ? '700' : '600', boxShadow: recordMode === 'late' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.95rem' }}
            >
              تأخر
            </button>
            {!isMultiMode && (
              <button
                type="button"
                onClick={() => handleModeChange('request')}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: recordMode === 'request' ? '#fff' : 'transparent', color: recordMode === 'request' ? 'var(--accent-secondary, #8b5cf6)' : '#64748b', fontWeight: recordMode === 'request' ? '700' : '600', boxShadow: recordMode === 'request' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.95rem' }}
              >
                طلب عطلة
              </button>
            )}
            <button
              type="button"
              onClick={() => handleModeChange('leave')}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: recordMode === 'leave' ? '#fff' : 'transparent', color: recordMode === 'leave' ? '#f97316' : '#64748b', fontWeight: recordMode === 'leave' ? '700' : '600', boxShadow: recordMode === 'leave' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '0.95rem' }}
            >
              مغادرة
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            {isMultiMode ? (
              <CustomMultiSelect
                label={<><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> الأعضاء *</>}
                values={formData.player_ids}
                onChange={(vals) => setFormData({ ...formData, player_ids: vals })}
                options={players.map(p => ({
                  value: p.id.toString(),
                  label: `${p.first_name} ${p.last_name}`
                }))}
                placeholder="-- اختر الأعضاء --"
              />
            ) : (
              <CustomDropdown<string>
                label={<><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> العضو *</>}
                value={formData.player_ids[0] || ''}
                onChange={(val) => setFormData({ ...formData, player_ids: [val] })}
                options={players.map(p => ({
                  value: p.id.toString(),
                  label: `${p.first_name} ${p.last_name}`
                }))}
                placeholder="-- اختر العضو --"
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: formData.event_category === 'أخرى' ? '1fr 1fr' : '1fr', gap: '16px', marginTop: '16px' }}>
            <CustomDropdown<string>
              label={<><FileText size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> الفعالية</>}
              value={formData.event_category}
              onChange={(val) => setFormData({ ...formData, event_category: val })}
              options={[
                { value: 'تدريب', label: 'تدريب' },
                { value: 'مباراة', label: 'مباراة' },
                { value: 'اجتماع', label: 'اجتماع' },
                { value: 'أخرى', label: 'أخرى' }
              ]}
            />
            {formData.event_category === 'أخرى' && (
              <CustomInput
                type="text"
                label="تحديد الفعالية *"
                value={customEventCategory}
                onChange={(e) => setCustomEventCategory(e.target.value)}
                placeholder="أدخل نوع الفعالية"
                required
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: (recordMode === 'request' || recordMode === 'late') ? '1fr 1fr' : '1fr', gap: '16px', marginTop: '16px' }}>
            <CustomInput
              type="date"
              label="التاريخ *"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
            {(recordMode === 'request' || recordMode === 'late') && (
              <CustomInput
                type="text"
                label={recordMode === 'late' ? "مدة التأخر (اختياري)" : "المدة (اختياري)"}
                placeholder={recordMode === 'late' ? "مثال: 15 دقيقة..." : "مثال: يومان، ساعتان..."}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            )}
          </div>



          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' :
                recordMode === 'request' ? 'إرسال الطلب' :
                  recordMode === 'late' ? 'تسجيل التأخر' :
                    recordMode === 'leave' ? 'تسجيل المغادرة' :
                      'حفظ الغياب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
