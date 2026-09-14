import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Save, FileText, Settings, AlertTriangle, FileWarning, ClipboardList, MapPin, Bus, Users, Package, Home, ShieldAlert, AlertCircle, Gavel } from 'lucide-react';
import type { Match } from './match_model';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

interface AdministrativeReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const AdministrativeReportDialog: React.FC<AdministrativeReportDialogProps> = ({ isOpen, onClose, matchData }) => {
  const [formData, setFormData] = useState({
    travel_as_planned: true,
    attendance_status: 'كامل',
    equipment_status: 'كاملة',
    equipment_notes: '',
    accommodation_catering_notes: '',
    organizational_incidents: '',
    disciplinary_incidents: '',
    refereeing_notes: '',
    required_actions: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && matchData) {
      fetchReport();
    } else {
      resetForm();
    }
  }, [isOpen, matchData]);

  const resetForm = () => {
    setFormData({
      travel_as_planned: true,
      attendance_status: 'كامل',
      equipment_status: 'كاملة',
      equipment_notes: '',
      accommodation_catering_notes: '',
      organizational_incidents: '',
      disciplinary_incidents: '',
      refereeing_notes: '',
      required_actions: ''
    });
  };

  const fetchReport = async () => {
    if (!matchData) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.getAdministrativeReport(matchData.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data) {
        const report = res.data.data;
        setFormData({
          travel_as_planned: report.travel_as_planned !== 0 && report.travel_as_planned !== false,
          attendance_status: report.attendance_status || 'كامل',
          equipment_status: report.equipment_status || 'كاملة',
          equipment_notes: report.equipment_notes || '',
          accommodation_catering_notes: report.accommodation_catering_notes || '',
          organizational_incidents: report.organizational_incidents || '',
          disciplinary_incidents: report.disciplinary_incidents || '',
          refereeing_notes: report.refereeing_notes || '',
          required_actions: report.required_actions || ''
        });
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error fetching report', error);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        match_id: matchData.id
      };
      
      const res = await axios.post(Applink.saveAdministrativeReport, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        alert('تم حفظ التقرير الإداري بنجاح!');
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving report:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء حفظ التقرير\n${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTextAreaStyle = (fieldName: string, errorColor?: string) => ({
    width: '100%', 
    padding: '16px', 
    borderRadius: '14px', 
    border: `1px solid ${focusedField === fieldName ? (errorColor || 'var(--text-h)') : 'var(--border)'}`, 
    background: 'var(--bg)', 
    color: 'var(--text)', 
    outline: 'none', 
    resize: 'vertical' as 'vertical', 
    minHeight: '110px', 
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    boxShadow: focusedField === fieldName ? `0 0 0 4px ${errorColor ? `${errorColor}15` : 'rgba(15, 23, 42, 0.05)'}` : 'none'
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

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ 
      backdropFilter: 'blur(10px)', 
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div 
        className="task-dialog role-dialog" 
        style={{ 
          fontFamily: 'var(--sans)', maxWidth: '900px', width: '95%', 
          borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', 
          display: 'flex', flexDirection: 'column', maxHeight: '92vh',
          background: 'var(--bg)',
          animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Premium Header */}
        <div className="dialog-app-bar" style={{ 
          padding: '24px 32px',
          background: 'var(--card-bg)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderRadius: '28px 28px 0 0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                background: 'var(--bg)', 
                padding: '14px', 
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={26} color="var(--text-h)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>التقرير الإداري للمباراة</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--text-p)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem'}}>
                    {matchData?.match_title}
                  </span>
                  <span style={{color: 'var(--text-muted)'}}>•</span>
                  <span style={{fontWeight: 600, color: 'var(--text-h)'}}>{matchData?.opponent}</span>
                </p>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', 
            width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }} onMouseOver={e => {e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.05)'}}
             onMouseOut={e => {e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'scale(1)'}}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
           <div style={{ padding: '100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--text-h)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
             <div style={{ color: 'var(--text-p)', fontWeight: 600, fontSize: '1.1rem' }}>جاري تحميل التقرير...</div>
           </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ padding: '32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Section 1: Logistics */}
              <div style={sectionStyle} className="hover-card">
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '12px', color: '#0ea5e9' }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#0ea5e9', fontWeight: 800, fontSize: '1.2rem' }}>التقييم اللوجستي</h3>
                    <div style={{color: 'var(--text-p)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500}}>التنقل، الإقامة، والمعدات</div>
                  </div>
                </div>
                
                <div className="responsive-grid-2" style={{ gap: '24px' }}>
                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                      <Bus size={18} color="var(--text-muted)" /> هل تم التنقل حسب البرنامج؟
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: formData.travel_as_planned ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-bg)', border: `1px solid ${formData.travel_as_planned ? '#10b981' : 'var(--border)'}`, padding: '12px 24px', borderRadius: '12px', flex: 1, transition: 'all 0.2s' }}>
                        <input type="radio" checked={formData.travel_as_planned === true} onChange={() => setFormData({...formData, travel_as_planned: true})} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
                        <span style={{ fontWeight: formData.travel_as_planned ? 700 : 500, color: formData.travel_as_planned ? '#10b981' : 'var(--text-p)' }}>نعم</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: !formData.travel_as_planned ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg)', border: `1px solid ${!formData.travel_as_planned ? '#ef4444' : 'var(--border)'}`, padding: '12px 24px', borderRadius: '12px', flex: 1, transition: 'all 0.2s' }}>
                        <input type="radio" checked={formData.travel_as_planned === false} onChange={() => setFormData({...formData, travel_as_planned: false})} style={{ accentColor: '#ef4444', width: '18px', height: '18px' }} />
                        <span style={{ fontWeight: !formData.travel_as_planned ? 700 : 500, color: !formData.travel_as_planned ? '#ef4444' : 'var(--text-p)' }}>لا</span>
                      </label>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                        <Users size={18} color="var(--text-muted)" /> حالة الحضور
                     </div>
                     <CustomDropdown<string>
                      label=""
                      value={formData.attendance_status}
                      onChange={(val) => setFormData({ ...formData, attendance_status: val })}
                      options={[{ value: 'كامل', label: 'كامل' }, { value: 'ناقص', label: 'ناقص' }]}
                    />
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '24px' }}>
                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                        <Package size={18} color="var(--text-muted)" /> حالة المعدات والعتاد
                     </div>
                    <CustomDropdown<string>
                      label=""
                      value={formData.equipment_status}
                      onChange={(val) => setFormData({ ...formData, equipment_status: val })}
                      options={[{ value: 'كاملة', label: 'كاملة' }, { value: 'بها نقص', label: 'بها نقص' }]}
                    />
                  </div>
                  
                  {formData.equipment_status === 'بها نقص' && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <CustomInput
                        label="ما هو النقص في المعدات؟"
                        type="text"
                        value={formData.equipment_notes}
                        onChange={e => setFormData({...formData, equipment_notes: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                    <Home size={18} color="var(--text-muted)" /> ملاحظات الإقامة والإعاشة
                  </label>
                  <textarea 
                    value={formData.accommodation_catering_notes}
                    onChange={e => setFormData({...formData, accommodation_catering_notes: e.target.value})}
                    onFocus={() => setFocusedField('accommodation')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="تفاصيل حول الفندق، جودة الوجبات، الاستقبال، إلخ..."
                    style={getTextAreaStyle('accommodation')}
                  />
                </div>
              </div>

              {/* Section 2: Incidents */}
              <div style={sectionStyle} className="hover-card">
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontWeight: 800, fontSize: '1.2rem' }}>الحوادث والملاحظات الهامة</h3>
                    <div style={{color: 'var(--text-p)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500}}>التنظيم، الانضباط، التحكيم</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                      <AlertCircle size={18} color="#f59e0b" /> الحوادث التنظيمية (أمن، تنظيم، جماهير)
                    </label>
                    <textarea 
                      value={formData.organizational_incidents}
                      onChange={e => setFormData({...formData, organizational_incidents: e.target.value})}
                      onFocus={() => setFocusedField('organizational')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="اذكر أي خلل تنظيمي حدث قبل أو أثناء أو بعد المباراة..."
                      style={getTextAreaStyle('organizational', '#f59e0b')}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                      <FileWarning size={18} color="#ef4444" /> الحوادث الانضباطية (للاعبين أو الطاقم)
                    </label>
                    <textarea 
                      value={formData.disciplinary_incidents}
                      onChange={e => setFormData({...formData, disciplinary_incidents: e.target.value})}
                      onFocus={() => setFocusedField('disciplinary')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="بطاقات حمراء، تصرفات غير رياضية، غيابات غير مبررة..."
                      style={getTextAreaStyle('disciplinary', '#ef4444')}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                      <Gavel size={18} color="var(--text-muted)" /> ملاحظات التحكيم (إدارياً وليس فنياً)
                    </label>
                    <textarea 
                      value={formData.refereeing_notes}
                      onChange={e => setFormData({...formData, refereeing_notes: e.target.value})}
                      onFocus={() => setFocusedField('refereeing')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="تأخر الحكام، قرارات أثرت على سير التنظيم..."
                      style={getTextAreaStyle('refereeing')}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Recommendations */}
              <div style={sectionStyle} className="hover-card">
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>التوصيات والإجراءات</h3>
                    <div style={{color: 'var(--text-p)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500}}>القرارات المطلوبة</div>
                  </div>
                </div>
                
                <div>
                  <textarea 
                    value={formData.required_actions}
                    onChange={e => setFormData({...formData, required_actions: e.target.value})}
                    onFocus={() => setFocusedField('actions')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="مثال: خصم من راتب اللاعب، إرسال شكوى للرابطة، استدعاء مجلس الإدارة..."
                    style={getTextAreaStyle('actions', '#10b981')}
                  />
                </div>
              </div>

            </div>

            <div style={{ 
              padding: '20px 32px', 
              background: 'var(--card-bg)', 
              borderTop: '1px solid var(--border)', 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'flex-end',
              zIndex: 10,
              borderRadius: '0 0 28px 28px'
            }}>
              <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 28px', minWidth: '120px', borderRadius: '14px', fontSize: '1rem', fontWeight: 600 }}>
                إلغاء
              </button>
              
              {/* Uses the app's primary class, removing inline hardcoded colors to respect the theme */}
              <button type="submit" disabled={isSubmitting} className="mc-btn mc-btn-primary" style={{ 
                padding: '12px 36px', 
                minWidth: '180px', 
                borderRadius: '14px', 
                fontSize: '1rem', 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }} 
              onMouseOver={e => {if(!isSubmitting) {e.currentTarget.style.transform = 'translateY(-2px)'}}} 
              onMouseOut={e => {if(!isSubmitting) {e.currentTarget.style.transform = 'translateY(0)'}}}>
                <Save size={20} /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقرير الإداري'}
              </button>
            </div>
          </form>
        )}
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
};

