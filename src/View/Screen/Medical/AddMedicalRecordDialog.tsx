import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Save, Activity, HeartPulse, User, Calendar, Stethoscope, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import type { PlayerMedicalRecord } from './medical_model';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

interface AddMedicalRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  recordData: PlayerMedicalRecord | null;
  mode?: 'injury' | 'initial_exam' | 'final_exam' | 'return_decision';
}

export const AddMedicalRecordDialog: React.FC<AddMedicalRecordDialogProps> = ({ isOpen, onClose, onSave, recordData, mode = 'injury' }) => {
  const [formData, setFormData] = useState({
    player_id: '',
    doctor_id: '',
    injury_date: '',
    incident_location: '',
    injury_nature: '',
    diagnosis: '',
    initial_recommendation: '',
    last_exam_date: '',
    medical_decision: '',
    restrictions: '',
    next_exam_date: '',
    record_status: 'مفتوح/مصاب'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
      if (recordData) {
        setFormData({
          player_id: recordData.player_id?.toString() || '',
          doctor_id: recordData.doctor_id?.toString() || '',
          injury_date: recordData.injury_date?.split('T')[0] || '',
          incident_location: recordData.incident_location || '',
          injury_nature: recordData.injury_nature || '',
          diagnosis: recordData.diagnosis || '',
          initial_recommendation: recordData.initial_recommendation || '',
          last_exam_date: recordData.last_exam_date?.split('T')[0] || '',
          medical_decision: recordData.medical_decision || '',
          restrictions: recordData.restrictions || '',
          next_exam_date: recordData.next_exam_date?.split('T')[0] || '',
          record_status: recordData.record_status || 'مفتوح/مصاب'
        });
      } else {
        setFormData({
          player_id: '',
          doctor_id: '',
          injury_date: '',
          incident_location: '',
          injury_nature: '',
          diagnosis: '',
          initial_recommendation: '',
          last_exam_date: '',
          medical_decision: '',
          restrictions: '',
          next_exam_date: '',
          record_status: 'مفتوح/مصاب'
        });
      }
    }
  }, [isOpen, recordData]);

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.individuals, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allInds = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      let playerList = allInds.filter((ind: any) => ind.type === 'لاعب' || ind.type === 'player' || !ind.type || ind.role?.name?.trim() === 'لاعب');
      let doctorList = allInds.filter((ind: any) => {
        const type = ind.type?.trim();
        const role = ind.role?.name?.trim();
        return (
          type === 'طبيب' || type === 'doctor' || 
          role === 'طبيب' || role === 'طبيب الفريق' || 
          (role && role.includes('طبيب')) || (type && type.includes('طبيب'))
        );
      });
      
      if (recordData) {
        if (recordData.player && !playerList.some((p: any) => p.id == recordData.player_id)) {
          playerList.push(recordData.player);
        }
        if (recordData.doctor && !doctorList.some((d: any) => d.id == recordData.doctor_id)) {
          doctorList.push(recordData.doctor);
        }
      }
      
      setPlayers(playerList);
      setDoctors(doctorList);
      
    } catch (error) {
      console.error('Error fetching individuals for medical', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = recordData ? Applink.updateMedicalRecord(recordData.id) : Applink.createMedicalRecord;
      
      const payload: any = { ...formData };

      // الترقية التلقائية لحالة الملف بناءً على القسم الذي تم تعبئته
      if (!recordData) {
        payload.record_status = 'مفتوح/مصاب';
      } else if (mode === 'initial_exam') {
        payload.record_status = 'بانتظار الفحص النهائي';
      } else if (mode === 'final_exam') {
        payload.record_status = 'بانتظار قرار العودة';
      } else if (mode === 'return_decision') {
        payload.record_status = 'مغلق/متعافي';
      }
      
      // Convert IDs to numbers
      if (payload.player_id) payload.player_id = Number(payload.player_id);
      if (payload.doctor_id) payload.doctor_id = Number(payload.doctor_id);
      
      // Clean up empty strings for optional fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving medical record', error);
      let serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat().join('\n');
        serverMsg += '\nتفاصيل الخطأ:\n' + validationErrors;
      }
      alert(`حدث خطأ أثناء الحفظ: ${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getTextAreaStyle = (fieldName: string, errorColor?: string) => ({
    width: '100%', 
    padding: '16px', 
    borderRadius: '14px', 
    border: `1px solid ${focusedField === fieldName ? (errorColor || 'var(--accent)') : 'var(--border)'}`, 
    background: 'var(--bg)', 
    color: 'var(--text)', 
    outline: 'none', 
    resize: 'vertical' as 'vertical', 
    minHeight: '110px', 
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    boxShadow: focusedField === fieldName ? `0 0 0 4px ${errorColor ? `${errorColor}15` : 'var(--accent-bg)'}` : 'none'
  });

  const sectionStyle = {
    background: 'var(--card-bg)', 
    padding: '28px', 
    borderRadius: '20px', 
    border: '1px solid var(--border)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '24px',
    flexShrink: 0,
    position: 'relative' as 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 23, 42, 0.6)', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '550px', width: '95%', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', background: 'var(--bg)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="dialog-app-bar" style={{ padding: '16px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', position: 'relative', borderRadius: '28px 28px 0 0' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', right: '24px', background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-h)', transition: 'all 0.2s ease', zIndex: 10 }} onMouseOver={e => e.currentTarget.style.background = 'var(--border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}>
            <ArrowRight size={20} />
          </button>
          
          <h2 style={{ margin: '0 auto', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.5px', lineHeight: 1, textAlign: 'center' }}>
            {mode === 'injury' ? (recordData ? 'تعديل الإصابة' : 'إصابة جديدة') : mode === 'initial_exam' ? 'الفحص الأولي والتشخيص' : mode === 'final_exam' ? 'الفحص النهائي' : 'قرار العودة للنشاط'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ padding: '32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* بيانات الإصابة الأولية */}
              {mode === 'injury' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <CustomDropdown<string>
                      label="اللاعب المصاب"
                      value={formData.player_id}
                      onChange={(val) => setFormData({ ...formData, player_id: val })}
                      options={players.map(p => ({ 
                        value: p.id?.toString(), 
                        label: p.name || (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name) || `لاعب ${p.id}` 
                      }))}
                      required
                    />
                    <CustomDropdown<string>
                      label="الطبيب / المختص المشرف"
                      value={formData.doctor_id}
                      onChange={(val) => setFormData({ ...formData, doctor_id: val })}
                      options={doctors.map(d => {
                        const name = d.name || (d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : d.first_name) || `عضو ${d.id}`;
                        const type = d.role?.name || d.type || 'غير محدد';
                        return { 
                          value: d.id?.toString(), 
                          label: `${name} (${type})` 
                        };
                      })}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <CustomInput label="تاريخ الإصابة" type="date" value={formData.injury_date} onChange={e => setFormData({...formData, injury_date: e.target.value})} required />
                    <CustomInput label="مكان حدوثها (تدريب، مباراة، خارج النشاط)" type="text" value={formData.incident_location} onChange={e => setFormData({...formData, incident_location: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <CustomInput label="طبيعة الإصابة (كدمة، تمزق، كسر..)" type="text" value={formData.injury_nature} onChange={e => setFormData({...formData, injury_nature: e.target.value})} />
                  </div>
                </>
              )}

              {/* التشخيص والفحص الأولي */}
              {mode === 'initial_exam' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <CustomInput 
                      label="التوصية الأولية" 
                      type="text" 
                      value={formData.initial_recommendation} 
                      onChange={e => setFormData({...formData, initial_recommendation: e.target.value})} 
                    />
                    <CustomInput label="موعد الفحص القادم" type="date" value={formData.next_exam_date} onChange={e => setFormData({...formData, next_exam_date: e.target.value})} />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                      <FileText size={18} color="var(--text-muted)" /> التشخيص الطبي الدقيق (سري)
                    </label>
                    <textarea 
                      value={formData.diagnosis}
                      onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                      onFocus={() => setFocusedField('diagnosis')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="وصف طبي دقيق لحالة اللاعب..."
                      style={getTextAreaStyle('diagnosis')}
                    />
                  </div>
                </>
              )}

              {/* الفحص النهائي */}
              {mode === 'final_exam' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <CustomInput label="تاريخ الفحص النهائي" type="date" value={formData.last_exam_date} onChange={e => setFormData({...formData, last_exam_date: e.target.value})} />
                    <CustomInput 
                      label="القرار الطبي / النتيجة" 
                      type="text" 
                      value={formData.medical_decision} 
                      onChange={e => setFormData({...formData, medical_decision: e.target.value})} 
                    />
                  </div>
                </>
              )}

              {/* قرار العودة */}
              {mode === 'return_decision' && (
                <>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>القيود والتعليمات للطاقم الفني</label>
                    <textarea 
                      value={formData.restrictions}
                      onChange={e => setFormData({...formData, restrictions: e.target.value})}
                      onFocus={() => setFocusedField('restrictions')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="مثال: تجنب الاحتكاك البدني، المشاركة لمدة 30 دقيقة فقط..."
                      style={{ ...getTextAreaStyle('restrictions'), minHeight: '90px' }}
                    />
                  </div>
                </>
              )}

          </div>
          <div className="dialog-actions-section" style={{ padding: '16px 24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', zIndex: 10, borderRadius: '0 0 28px 28px' }}>
            <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '10px 20px', minWidth: '100px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600 }}>إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="mc-btn mc-btn-primary" style={{ 
              padding: '10px 24px', 
              minWidth: '140px', 
              borderRadius: '10px', 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              opacity: isSubmitting ? 0.7 : 1, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {if(!isSubmitting) {e.currentTarget.style.transform = 'translateY(-2px)'}}} 
            onMouseOut={e => {if(!isSubmitting) {e.currentTarget.style.transform = 'translateY(0)'}}}
            >
              <Save size={18} /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ الملف'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }
        @media (max-width: 768px) {
          .dialog-app-bar {
            padding: 16px !important;
          }
          .dialog-app-bar button {
            right: 16px !important;
            padding: 8px !important;
          }
          .dialog-app-bar button svg {
            width: 16px !important;
            height: 16px !important;
          }
          .dialog-app-bar h2 {
            font-size: 1.1rem !important;
          }
          .dialog-app-bar p {
            font-size: 0.75rem !important;
          }
          .dialog-actions-section {
            padding: 12px 16px !important;
            flex-wrap: wrap;
            justify-content: center !important;
          }
          .dialog-actions-section button {
            flex: 1 1 auto;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
