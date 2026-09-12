import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from './disciplinary_data';
import { X, Save, AlertTriangle, User, Calendar, FileText, ArrowRight } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomMultiSelect } from '../../widget/CustomMultiSelect';
import { MemberModel } from '../Members/member_model';
import './Disciplinary.css'; // Use the new modern styles

interface DisciplinaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DisciplinaryModel) => void;
  editingItem: DisciplinaryModel | null;
  members: MemberModel[];
}

export const DisciplinaryDialog: React.FC<DisciplinaryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  members
}) => {
  const [formData, setFormData] = useState<Partial<DisciplinaryModel>>({
    memberId: '',
    memberName: '',
    actionType: 'طلب توضيح',
    incidentDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'مفتوح',
    incidentLocation: '',
    violatedRule: '',
    presentPeople: '',
    attachments: '',
    deadlineOrHearingDate: '',
    hearingLocation: '',
    player_statements: '',
    admin_notes: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        memberId: '',
        memberName: '',
        actionType: 'طلب توضيح',
        incidentDate: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'مفتوح'
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.reason) return;
    onSave(formData as DisciplinaryModel);
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find(m => String(m.id) === String(memberId));
    if (member) {
      setFormData(prev => ({ ...prev, memberId: String(member.id), memberName: `${member.first_name} ${member.last_name}` }));
    }
  };

  return createPortal(
    <div className="modern-dialog-overlay printable-overlay" onClick={onClose}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()}>
        {/* App Bar Header */}
        <div className="modern-dialog-header app-bar-header no-print">
          <button type="button" className="mobile-back-btn" onClick={onClose}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <AlertTriangle size={24} />
            </div>
            <h2>
              <span className="desktop-title">{editingItem ? 'تعديل الإجراء التأديبي' : 'إضافة إجراء تأديبي جديد'}</span>
              <span className="mobile-title">{editingItem ? 'تعديل الإجراء' : 'إضافة إجراء'}</span>
            </h2>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modern-dialog-body">
          <div className="modern-form-group">
            <CustomDropdown
              label="اللاعب / العضو"
              value={formData.memberId || ''}
              onChange={(val) => handleMemberSelect(val)}
              options={members.map(m => ({ value: String(m.id), label: `${m.first_name} ${m.last_name}`, icon: <User size={16} /> }))}
              placeholder="اختر اللاعب..."
            />
          </div>

          <div className="modern-form-group">
            <CustomDropdown
              label="نوع الإجراء"
              value={formData.actionType as any}
              onChange={(val) => setFormData({ ...formData, actionType: val as any })}
              options={[
                { value: 'طلب توضيح', label: 'طلب توضيح', icon: <AlertTriangle size={16} /> },
                { value: 'استدعاء جلسة', label: 'استدعاء جلسة', icon: <AlertTriangle size={16} /> },

                { value: 'واقعة', label: 'واقعة', icon: <AlertTriangle size={16} /> },
              ]}
              placeholder="اختر النوع..."
            />
          </div>

          <div className="modern-form-group">
            <label>
              <Calendar size={16} /> تاريخ الحدث
            </label>
            <input
              type="date"
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              className="modern-form-input"
              required
            />
          </div>

          <div className="modern-form-group">
            <label>مكان الواقعة</label>
            <input
              type="text"
              value={formData.incidentLocation || ''}
              onChange={e => setFormData({ ...formData, incidentLocation: e.target.value })}
              placeholder="أين حدثت المخالفة؟"
              className="modern-form-input"
            />
          </div>

          <div className="modern-form-group">
            <label>المادة / القاعدة المخالفة</label>
            <input
              type="text"
              value={formData.violatedRule || ''}
              onChange={e => setFormData({ ...formData, violatedRule: e.target.value })}
              placeholder="أذكر المادة المخالفة"
              className="modern-form-input"
            />
          </div>

          <div className="modern-form-group">
            <label>
              <FileText size={16} /> وصف دقيق للواقعة
            </label>
            <textarea
              value={formData.reason || ''}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="modern-form-input modern-form-textarea"
              rows={3}
              placeholder="وصف محايد وتفصيلي..."
              required
            />
          </div>

          <div className="modern-form-group">
            <label>الأشخاص الحاضرون وقت الواقعة</label>
            <CustomMultiSelect
              options={members.map(m => ({ 
                value: `${m.first_name} ${m.last_name}`, 
                label: `${m.first_name} ${m.last_name}`, 
                icon: m.photo ? <img src={m.photo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" /> : <User size={16} /> 
              }))}
              values={formData.presentPeople ? formData.presentPeople.split('، ').filter(Boolean) : []}
              onChange={vals => setFormData({ ...formData, presentPeople: vals.join('، ') })}
              placeholder="اختر الأعضاء الحاضرين..."
            />
          </div>
            
          <div className="modern-form-group">
            <label>المرفقات (إن وجدت)</label>
            <input
              type="text"
              value={formData.attachments || ''}
              onChange={e => setFormData({ ...formData, attachments: e.target.value })}
              className="modern-form-input"
              placeholder="رابط أو مسار الأدلة"
            />
          </div>

          {(formData.actionType === 'استدعاء جلسة' || formData.actionType === 'طلب توضيح') && (
            <>
              <div className="modern-form-group">
                <label>{formData.actionType === 'طلب توضيح' ? 'أجل الرد' : 'موعد الجلسة'}</label>
                <input
                  type="date"
                  value={formData.deadlineOrHearingDate || ''}
                  onChange={e => setFormData({ ...formData, deadlineOrHearingDate: e.target.value })}
                  className="modern-form-input"
                />
              </div>

              {formData.actionType !== 'طلب توضيح' && (
                <div className="modern-form-group">
                  <label>مكان جلسة الاستماع</label>
                  <input
                    type="text"
                    value={formData.hearingLocation || ''}
                    onChange={e => setFormData({ ...formData, hearingLocation: e.target.value })}
                    placeholder="أين ستعقد الجلسة؟"
                    className="modern-form-input"
                  />
                </div>
              )}
            </>
          )}

          <div className="modern-form-group">
            <CustomDropdown
              label="حالة الإجراء"
              value={formData.status as any}
              onChange={(val) => setFormData({ ...formData, status: val as any })}
              options={[
                { value: 'مفتوح', label: 'مفتوح' },
                { value: 'منفذ', label: 'منفذ' },
                { value: 'ملغى', label: 'ملغى' },
              ]}
            />
          </div>
        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="modern-btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            {editingItem ? 'حفظ التعديلات' : 'إضافة الإجراء'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
