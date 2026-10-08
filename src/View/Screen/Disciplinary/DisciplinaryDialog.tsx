import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from './disciplinary_data';
import { X, Save, AlertTriangle, User, Calendar, FileText, ArrowRight, Clock } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MemberSelect } from '../../widget/MemberSelect';
import { MemberModel } from '../Members/member_model';
import './Disciplinary.css'; // Use the new modern styles

interface DisciplinaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DisciplinaryModel) => void;
  editingItem: DisciplinaryModel | null;
  members: MemberModel[];
  isSubmitting?: boolean;
}

export const DisciplinaryDialog: React.FC<DisciplinaryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  members,
  isSubmitting = false
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

  const memberOf = (id?: string | number) => members.find(m => String(m.id) === String(id));
  const chosenMember = memberOf(formData.memberId);

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
            <label><User size={16} /> العضو المعني</label>
            <MemberSelect
              members={members}
              value={chosenMember ? `${chosenMember.first_name} ${chosenMember.last_name}`.trim() : formData.memberId ? formData.memberName || '' : ''}
              onChange={(name, member) => setFormData(prev => ({ ...prev, memberId: member ? String(member.id) : '', memberName: member ? name : '' }))}
              placeholder="اختر العضو المعني..."
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
              ]}
              placeholder="اختر النوع..."
            />
          </div>

          <div className="dd-date-time">
            <div className="modern-form-group">
              <label>
                <Calendar size={16} /> تاريخ الحدث
              </label>
              <input
                type="date"
                value={(formData.incidentDate || '').split(/[ T]/)[0]}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                className="modern-form-input"
                required
              />
            </div>
            <div className="modern-form-group">
              <label><Clock size={16} /> الساعة</label>
              <input
                type="time"
                dir="ltr"
                value={formData.incidentTime || ''}
                onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                className="modern-form-input"
              />
            </div>
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
            <MemberSelect
              multiple
              allowFreeText
              members={members}
              values={formData.presentPeople ? formData.presentPeople.split(/[,،\n]/).map(p => p.trim()).filter(Boolean) : []}
              onChange={vals => setFormData(prev => ({ ...prev, presentPeople: vals.join('، ') }))}
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
              <div className={formData.actionType === 'استدعاء جلسة' ? 'dd-date-time' : ''}>
                <div className="modern-form-group">
                  <label>{formData.actionType === 'طلب توضيح' ? 'أجل الرد' : 'موعد الجلسة'}</label>
                  <input
                    type="date"
                    value={(formData.deadlineOrHearingDate || '').split(/[ T]/)[0]}
                    onChange={e => setFormData({ ...formData, deadlineOrHearingDate: e.target.value })}
                    className="modern-form-input"
                  />
                </div>
                {formData.actionType === 'استدعاء جلسة' && (
                  <div className="modern-form-group">
                    <label><Clock size={16} /> ساعة الجلسة</label>
                    <input
                      type="time"
                      dir="ltr"
                      value={formData.hearingTime || ''}
                      onChange={e => setFormData({ ...formData, hearingTime: e.target.value })}
                      className="modern-form-input"
                    />
                  </div>
                )}
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

              {formData.actionType === 'استدعاء جلسة' && (
                <div className="modern-form-group">
                  <label>مسؤول الجلسة</label>
                  <MemberSelect
                    allowFreeText
                    members={members}
                    value={formData.hearingOfficer || ''}
                    onChange={name => setFormData(prev => ({ ...prev, hearingOfficer: name }))}
                    placeholder="من يدير جلسة الاستماع؟"
                  />
                </div>
              )}
            </>
          )}

          {/* Status dropdown removed as per user request to auto-manage it */}
        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </button>
          <button type="submit" className="modern-btn-primary" onClick={handleSubmit} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
            <Save size={18} />
            {isSubmitting ? 'جاري الحفظ...' : (editingItem ? 'حفظ التعديلات' : 'إضافة الإجراء')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
