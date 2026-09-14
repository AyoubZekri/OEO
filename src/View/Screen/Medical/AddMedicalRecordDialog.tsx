import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Save, Activity, HeartPulse, User, Calendar, Stethoscope, AlertCircle, FileText } from 'lucide-react';
import type { PlayerMedicalRecord } from './medical_model';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

interface AddMedicalRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  recordData: PlayerMedicalRecord | null;
}

export const AddMedicalRecordDialog: React.FC<AddMedicalRecordDialogProps> = ({ isOpen, onClose, onSave, recordData }) => {
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
      if (res.data.status === 'success' && res.data.data) {
        const allInds = res.data.data;
        const playerList = allInds.filter((ind: any) => ind.role?.name?.trim() === 'لاعب');
        const doctorList = allInds.filter((ind: any) => ind.role?.name?.trim() === 'طبيب' || ind.role?.name?.trim() === 'طبيب الفريق');
        setPlayers(playerList);
        // If doctorList is empty, just use allinds for doctors as fallback, or assume logged in user is doctor. For now let's just let them select any staff if no doctor.
        setDoctors(doctorList.length > 0 ? doctorList : allInds);
      }
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
      const res = await axios.post(url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving medical record', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء الحفظ: ${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sectionStyle = {
    background: 'var(--card-bg)', 
    padding: '28px', 
    borderRadius: '20px', 
    border: '1px solid var(--border)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '24px',
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 23, 42, 0.6)', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '900px', width: '95%', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', background: 'var(--bg)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="dialog-app-bar" style={{ padding: '24px 32px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: '28px 28px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={26} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>{recordData ? 'تحديث الملف الطبي' : 'ملف طبي / إصابة جديدة'}</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-p)', fontSize: '0.95rem' }}>سجل البيانات الطبية والتشخيص وتصريح العودة</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onMouseOver={e => {e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.05)'}} onMouseOut={e => {e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'scale(1)'}}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ padding: '32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* الاساسيات */}
            <div style={sectionStyle} className="hover-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
                  <User size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#3b82f6', fontWeight: 800, fontSize: '1.2rem' }}>الأطراف المعنية</h3>
                </div>
              </div>
              <div className="responsive-grid-2">
                <CustomDropdown<string>
                  label="اللاعب المصاب"
                  value={formData.player_id}
                  onChange={(val) => setFormData({ ...formData, player_id: val })}
                  options={players.map(p => ({ value: p.id.toString(), label: p.name || `لاعب ${p.id}` }))}
                  required
                />
                <CustomDropdown<string>
                  label="الطبيب / المختص المشرف"
                  value={formData.doctor_id}
                  onChange={(val) => setFormData({ ...formData, doctor_id: val })}
                  options={doctors.map(d => ({ value: d.id.toString(), label: d.name || `طبيب ${d.id}` }))}
                  required
                />
              </div>
            </div>

            {/* بيانات الإصابة الأولية */}
            <div style={sectionStyle} className="hover-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#ef4444', fontWeight: 800, fontSize: '1.2rem' }}>بيانات الإصابة الأولية</h3>
                </div>
              </div>
              
              <div className="responsive-grid-2">
                <CustomInput label="تاريخ الإصابة" type="date" value={formData.injury_date} onChange={e => setFormData({...formData, injury_date: e.target.value})} required />
                <CustomInput label="مكان حدوثها (تدريب، مباراة، خارج النشاط)" type="text" value={formData.incident_location} onChange={e => setFormData({...formData, incident_location: e.target.value})} />
              </div>
              
              <div className="responsive-grid-2">
                <CustomInput label="طبيعة الإصابة (كدمة، تمزق، كسر..)" type="text" value={formData.injury_nature} onChange={e => setFormData({...formData, injury_nature: e.target.value})} />
                <CustomDropdown<string>
                  label="التوصية الأولية"
                  value={formData.initial_recommendation}
                  onChange={(val) => setFormData({ ...formData, initial_recommendation: val })}
                  options={[
                    {value: 'راحة تامة', label: 'راحة تامة'},
                    {value: 'فحوصات إضافية', label: 'فحوصات إضافية'},
                    {value: 'علاج طبيعي', label: 'علاج طبيعي'},
                    {value: 'تدخل جراحي', label: 'تدخل جراحي'}
                  ]}
                />
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
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: focusedField === 'diagnosis' ? '1px solid var(--primary)' : '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical', minHeight: '110px', fontFamily: 'inherit', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* المتابعة وقرار العودة */}
            <div style={sectionStyle} className="hover-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>الفحص وقرار العودة</h3>
                </div>
              </div>

              <div className="responsive-grid-2">
                <CustomInput label="تاريخ آخر فحص" type="date" value={formData.last_exam_date} onChange={e => setFormData({...formData, last_exam_date: e.target.value})} />
                <CustomDropdown<string>
                  label="القرار الطبي الحالي"
                  value={formData.medical_decision}
                  onChange={(val) => setFormData({ ...formData, medical_decision: val })}
                  options={[
                    {value: 'غير جاهز اطلاقاً', label: 'غير جاهز اطلاقاً'},
                    {value: 'تدريب فردي / تأهيل', label: 'تدريب فردي / تأهيل'},
                    {value: 'عودة تدريجية للمجموعة', label: 'عودة تدريجية للمجموعة'},
                    {value: 'جاهز تماماً للمنافسة', label: 'جاهز تماماً للمنافسة'}
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>القيود للطاقم الفني</label>
                <textarea 
                  value={formData.restrictions}
                  onChange={e => setFormData({...formData, restrictions: e.target.value})}
                  onFocus={() => setFocusedField('restrictions')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="مثال: تجنب الاحتكاك البدني، المشاركة لمدة 30 دقيقة فقط..."
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: focusedField === 'restrictions' ? '1px solid var(--primary)' : '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical', minHeight: '90px', fontFamily: 'inherit', fontSize: '0.95rem' }}
                />
              </div>

              <div className="responsive-grid-2">
                <CustomInput label="موعد الفحص القادم" type="date" value={formData.next_exam_date} onChange={e => setFormData({...formData, next_exam_date: e.target.value})} />
                <CustomDropdown<string>
                  label="حالة الملف ككل"
                  value={formData.record_status}
                  onChange={(val) => setFormData({ ...formData, record_status: val })}
                  options={[
                    {value: 'مفتوح/مصاب', label: 'مفتوح / مصاب'},
                    {value: 'قيد التأهيل', label: 'قيد التأهيل'},
                    {value: 'مغلق/متعافي', label: 'مغلق / متعافي'}
                  ]}
                  required
                />
              </div>
            </div>

          </div>
          <div style={{ padding: '20px 32px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', justifyContent: 'flex-end', zIndex: 10, borderRadius: '0 0 28px 28px' }}>
            <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 28px', minWidth: '120px', borderRadius: '14px', fontSize: '1rem', fontWeight: 600 }}>إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="mc-btn mc-btn-primary" style={{ padding: '12px 36px', minWidth: '180px', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              <Save size={20} /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ الملف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
