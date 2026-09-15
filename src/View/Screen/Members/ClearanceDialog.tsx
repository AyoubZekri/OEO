import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Save, CheckCircle, Package, FileText, UserCheck, Stethoscope, Banknote, PenTool, LogOut, Trash2, Edit2 } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomInput } from '../../widget/CustomInput';
import type { PlayerClearance } from './member_model';

interface ClearanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
}

export const ClearanceDialog: React.FC<ClearanceDialogProps> = ({ isOpen, onClose, player }) => {
  const [formData, setFormData] = useState<Partial<PlayerClearance>>({
    player_id: player?.id,
    exit_date: '',
    exit_reason: '',
    equipment_status: 'غير مكتمل',
    equipment_notes: '',
    equipment_manager_id: '',
    equipment_cleared_at: '',
    admin_status: 'غير مكتمل',
    admin_id: '',
    admin_cleared_at: '',
    sporting_status: 'غير مكتمل',
    sporting_director_id: '',
    sporting_cleared_at: '',
    financial_status: 'غير مكتمل',
    finance_manager_id: '',
    finance_cleared_at: '',
    medical_status: 'غير مكتمل',
    medical_staff_id: '',
    medical_cleared_at: '',
    general_notes: '',
    player_signature: false,
    player_signed_at: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && player) {
      fetchClearanceData();
      fetchStaffList();
    }
  }, [isOpen, player]);

  const fetchClearanceData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.getPlayerClearance(player.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setFormData({
          ...data,
          exit_date: data.exit_date?.split('T')[0] || '',
          equipment_cleared_at: data.equipment_cleared_at?.split('T')[0] || '',
          admin_cleared_at: data.admin_cleared_at?.split('T')[0] || '',
          sporting_cleared_at: data.sporting_cleared_at?.split('T')[0] || '',
          finance_cleared_at: data.finance_cleared_at?.split('T')[0] || '',
          medical_cleared_at: data.medical_cleared_at?.split('T')[0] || '',
          player_signed_at: data.player_signed_at?.split('T')[0] || '',
          equipment_manager_id: data.equipment_manager_id?.toString() || '',
          admin_id: data.admin_id?.toString() || '',
          sporting_director_id: data.sporting_director_id?.toString() || '',
          finance_manager_id: data.finance_manager_id?.toString() || '',
          medical_staff_id: data.medical_staff_id?.toString() || '',
        });
        setMode('view');
      } else {
        setMode('create');
      }
    } catch (error) {
      console.error('Error fetching clearance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.users, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setStaffList(res.data.data);
      } else {
        setStaffList(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(Applink.savePlayerClearance, { ...formData, player_id: player.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم حفظ بطاقة إخلاء الطرف بنجاح');
      onClose();
    } catch (error) {
      console.error('Error saving clearance:', error);
      alert('حدث خطأ أثناء حفظ بطاقة إخلاء الطرف');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف بطاقة الإخلاء؟')) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(Applink.deletePlayerClearance(player.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم حذف بطاقة الإخلاء بنجاح');
      onClose();
    } catch (error) {
      console.error('Error deleting clearance:', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    if (status === 'مكتمل') return '#10b981';
    if (status === 'قيد الإجراء' || status === 'معلق') return '#f59e0b';
    return '#ef4444';
  };

  const renderField = (label: string, value: any) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', color: 'var(--text-p)', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</label>
      <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '1rem', background: 'var(--bg)', padding: '10px 14px', borderRadius: '8px' }}>
        {value || '—'}
      </div>
    </div>
  );

  const renderSection = (title: string, icon: any, statusField: keyof PlayerClearance, idField: keyof PlayerClearance, dateField: keyof PlayerClearance, notesField?: keyof PlayerClearance) => (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 800 }}>{title}</h3>
      </div>
      <div className="responsive-grid-2">
        <CustomDropdown<string>
          label="القرار / الحالة"
          value={formData[statusField]?.toString() || 'غير مكتمل'}
          onChange={(val) => setFormData({ ...formData, [statusField]: val })}
          options={[
            { value: 'غير مكتمل', label: 'غير مكتمل' },
            { value: 'معلق', label: 'معلق (ملاحظات)' },
            { value: 'مكتمل', label: 'مكتمل' }
          ]}
        />
        <CustomDropdown<string>
          label="المسؤول المفوّض"
          value={formData[idField]?.toString() || ''}
          onChange={(val) => setFormData({ ...formData, [idField]: val })}
          options={staffList.map(s => ({ value: s.id.toString(), label: s.name || '' }))}
        />
      </div>
      <div className="responsive-grid-2">
        <CustomInput label="تاريخ التوقيع / الإخلاء" type="date" value={formData[dateField]?.toString() || ''} onChange={(e) => setFormData({ ...formData, [dateField]: e.target.value })} />
        {notesField && (
          <CustomInput label="ملاحظات (إن وجدت)" type="text" value={formData[notesField]?.toString() || ''} onChange={(e) => setFormData({ ...formData, [notesField]: e.target.value })} />
        )}
      </div>
    </div>
  );

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '900px', width: '95%', borderRadius: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '50%', color: 'var(--primary)' }}><CheckCircle size={28} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>بطاقة إخلاء الطرف والتسوية</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-p)', fontSize: '0.9rem' }}>{player?.first_name} {player?.last_name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-h)' }}><X size={24} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', overflowY: 'auto', flexGrow: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</div>
          ) : (
            <div>
              {/* الأساسيات */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}><LogOut size={22} /></div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 800 }}>معلومات المغادرة</h3>
                </div>
                  {mode === 'view' ? (
                    <>
                      {renderField("تاريخ المغادرة", formData.exit_date)}
                      {renderField("سبب المغادرة", formData.exit_reason)}
                    </>
                  ) : (
                    <>
                      <CustomInput label="تاريخ المغادرة" type="date" value={formData.exit_date} onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })} />
                      <CustomInput label="سبب المغادرة" type="text" value={formData.exit_reason} onChange={(e) => setFormData({ ...formData, exit_reason: e.target.value })} placeholder="فسخ عقد، إعارة، نهاية ارتباط..." />
                    </>
                  )}
              </div>

              
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}><PenTool size={22} /></div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 800 }}>المصادقة النهائية للاعب</h3>
                </div>
                {mode === 'view' ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', color: 'var(--text-p)', fontSize: '0.85rem', marginBottom: '4px' }}>حالة المصادقة</label>
                      <div style={{ fontWeight: 600, color: formData.player_signature ? '#10b981' : '#f59e0b', fontSize: '1rem', background: 'var(--bg)', padding: '10px 14px', borderRadius: '8px' }}>
                        {formData.player_signature ? 'تمت المصادقة وتسلم المستحقات' : 'لم يوقع بعد'}
                      </div>
                    </div>
                    {renderField("ملاحظات عامة", formData.general_notes)}
                  </>
                ) : (
                  <>
                    <div style={{ alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 700 }}>
                        <input type="checkbox" checked={formData.player_signature || false} onChange={(e) => setFormData({ ...formData, player_signature: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                        يقر اللاعب بتسلم كافة مستحقاته وإخلاء طرفه
                      </label>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <CustomInput label="ملاحظات عامة" type="text" value={formData.general_notes} onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--card-bg)', borderRadius: '0 0 24px 24px' }}>
          {mode === 'view' ? (
            <>
              <button type="button" onClick={() => handleDelete()} disabled={isSaving} className="mc-btn" style={{ padding: '12px 24px', background: '#fef2f2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} /> حذف
              </button>
              <button type="button" onClick={() => setMode('edit')} className="mc-btn mc-btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} /> تعديل
              </button>
              <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 24px' }}>إغلاق</button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 24px' }}>إلغاء</button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="mc-btn mc-btn-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={20} /> {isSaving ? 'جاري الحفظ...' : 'حفظ المخالصة'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
