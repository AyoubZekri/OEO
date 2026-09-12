import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, Save, MessageSquare, AlertTriangle, Scale, Calendar, FileText, ArrowRight } from 'lucide-react';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import '../Disciplinary.css';

interface IncidentDecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DisciplinaryModel) => void;
  editingItem: DisciplinaryModel | null;
}

export const IncidentDecisionDialog: React.FC<IncidentDecisionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [formData, setFormData] = useState<Partial<DisciplinaryModel>>({
    player_statements: '',
    admin_notes: '',
    decision_outcome: '',
    decision_reasons: '',
    effective_date: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        player_statements: editingItem.player_statements || '',
        admin_notes: editingItem.admin_notes || '',
        decision_outcome: editingItem.decision_outcome || '',
        decision_reasons: editingItem.decision_reasons || '',
        effective_date: editingItem.effective_date || '',
      });
    } else {
      setFormData({
        player_statements: '',
        admin_notes: '',
        decision_outcome: '',
        decision_reasons: '',
        effective_date: '',
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen || !editingItem) return null;

  return createPortal(
    <div className="modern-dialog-overlay" onClick={onClose}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="modern-dialog-header app-bar-header no-print">
          <button type="button" className="mobile-back-btn" onClick={onClose}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <Scale size={24} />
            </div>
            <h2>
              <span className="desktop-title">قرار الإدارة وأقوال اللاعب (واقعة)</span>
              <span className="mobile-title">تعديل الرد والقرار</span>
            </h2>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form className="modern-dialog-body" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData as DisciplinaryModel);
        }}>
          {/* Player Section */}
          <div className="epic-form-section player-section">
            <div className="epic-section-header">
              <div className="epic-section-header-icon">
                <MessageSquare size={18} />
              </div>
              <h3>أقوال اللاعب وتبريراته</h3>
            </div>
            
            <div className="modern-form-group">
              <textarea
                value={formData.player_statements || ''}
                onChange={e => setFormData({ ...formData, player_statements: e.target.value })}
                className="modern-form-input modern-form-textarea"
                rows={3}
                placeholder="أدخل أقوال وتبريرات اللاعب هنا..."
              />
            </div>
          </div>

          {/* Admin Section */}
          <div className="premium-admin-card">
            <div className="premium-admin-header">
              <div className="premium-admin-header-icon">
                <AlertTriangle size={20} />
              </div>
              <h3>قرارات وملاحظات الإدارة</h3>
            </div>
            
            <div className="premium-admin-body">
              <div className="modern-form-group">
                <label>الملاحظات الإدارية</label>
                <textarea
                  value={formData.admin_notes || ''}
                  onChange={e => setFormData({ ...formData, admin_notes: e.target.value })}
                  className="modern-form-input modern-form-textarea"
                  rows={2}
                  placeholder="أدخل ملاحظات وقرارات الإدارة..."
                />
              </div>

              <div className="modern-form-group" style={{ zIndex: 10 }}>
                <CustomDropdown
                  label={<><Scale size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/> نوع القرار التأديبي</>}
                  value={formData.decision_outcome || ''}
                  onChange={(val) => setFormData({ ...formData, decision_outcome: val })}
                  options={[
                    { value: 'حفظ', label: 'حفظ' },
                    { value: 'تنبيه', label: 'تنبيه' },
                    { value: 'تنبيه كتابي', label: 'تنبيه كتابي' },
                    { value: 'إنذار', label: 'إنذار' },
                    { value: 'عقوبة', label: 'عقوبة' },
                    { value: 'فصل', label: 'فصل' },
                  ]}
                  placeholder="اختر نوع القرار..."
                />
              </div>

              <div className="modern-form-group">
                <label><Calendar size={16} /> تاريخ السريان</label>
                <input
                  type="date"
                  value={formData.effective_date ? formData.effective_date.split('T')[0] : ''}
                  onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                  className="modern-form-input"
                />
              </div>

              <div className="modern-form-group">
                <label><FileText size={16} /> أسباب القرار</label>
                <textarea
                  value={formData.decision_reasons || ''}
                  onChange={e => setFormData({ ...formData, decision_reasons: e.target.value })}
                  className="modern-form-input modern-form-textarea"
                  rows={2}
                  placeholder="ما هي أسباب هذا القرار؟"
                />
              </div>
            </div>
          </div>

        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="modern-btn-primary" onClick={() => onSave(formData as DisciplinaryModel)}>
            <Save size={18} />
            حفظ الرد والقرار
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
