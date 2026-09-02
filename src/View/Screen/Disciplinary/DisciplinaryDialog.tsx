import React, { useState, useEffect } from 'react';
import { type DisciplinaryModel } from './disciplinary_data';
import { X, Save, AlertTriangle, User, Calendar, FileText } from 'lucide-react';
import './Disciplinary.css'; // Use the new modern styles

interface DisciplinaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DisciplinaryModel) => void;
  editingItem: DisciplinaryModel | null;
}

const mockMembersList = [
  { id: 'm1', name: 'أحمد بن علي' },
  { id: 'm2', name: 'ياسين كريم' },
  { id: 'm3', name: 'رياض محرز' },
  { id: 'm4', name: 'خالد سعيد' },
  { id: 'm5', name: 'إسلام سليماني' }
];

export const DisciplinaryDialog: React.FC<DisciplinaryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem
}) => {
  const [formData, setFormData] = useState<Partial<DisciplinaryModel>>({
    memberId: '',
    memberName: '',
    actionType: 'تنبيه',
    incidentDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'مفتوح'
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        memberId: '',
        memberName: '',
        actionType: 'تنبيه',
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
    const member = mockMembersList.find(m => m.id === memberId);
    if (member) {
      setFormData(prev => ({ ...prev, memberId: member.id, memberName: member.name }));
    }
  };

  return (
    <div className="modern-dialog-overlay printable-overlay" onClick={onClose}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="modern-dialog-header no-print">
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon">
              <AlertTriangle size={24} />
            </div>
            <h2>{editingItem ? 'تعديل الإجراء التأديبي' : 'إضافة إجراء تأديبي جديد'}</h2>
          </div>
          <button type="button" className="modern-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modern-dialog-body">
          <div className="modern-form-group">
            <label>
              <User size={16} /> اللاعب / العضو
            </label>
            <select
              value={formData.memberId}
              onChange={(e) => handleMemberSelect(e.target.value)}
              className="modern-form-input"
              required
            >
              <option value="">اختر اللاعب...</option>
              {mockMembersList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="modern-form-group">
            <label>
              <AlertTriangle size={16} /> نوع الإجراء
            </label>
            <select
              value={formData.actionType}
              onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
              className="modern-form-input"
              required
            >
              <option value="تنبيه">تنبيه</option>
              <option value="إنذار">إنذار</option>
              <option value="طلب توضيح">طلب توضيح</option>
              <option value="إحالة على الجهة التأديبية المختصة">إحالة على الجهة التأديبية المختصة</option>
            </select>
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
            <label>
              <FileText size={16} /> تفاصيل / سبب الإجراء
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="modern-form-input modern-form-textarea"
              rows={4}
              placeholder="اكتب تفاصيل المخالفة أو سبب الإجراء..."
              required
            />
          </div>
          
          <div className="modern-form-group">
            <label>حالة الإجراء</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="modern-form-input"
            >
              <option value="مفتوح">مفتوح</option>
              <option value="منفذ">منفذ</option>
              <option value="ملغى">ملغى</option>
            </select>
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
    </div>
  );
};
