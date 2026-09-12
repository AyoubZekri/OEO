import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, Save, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import '../Disciplinary.css';

interface HearingResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DisciplinaryModel) => void;
  editingItem: DisciplinaryModel | null;
}

export const HearingResponseDialog: React.FC<HearingResponseDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [formData, setFormData] = useState<Partial<DisciplinaryModel>>({
    player_statements: '',
    admin_notes: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        player_statements: editingItem.player_statements || '',
        admin_notes: editingItem.admin_notes || '',
      });
    } else {
      setFormData({
        player_statements: '',
        admin_notes: '',
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
              <MessageSquare size={24} />
            </div>
            <h2>
              <span className="desktop-title">أقوال اللاعب (جلسة استماع)</span>
              <span className="mobile-title">جلسة استماع</span>
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
              <h3>أقوال اللاعب وتبريراته خلال الجلسة</h3>
            </div>
            
            <div className="modern-form-group">
              <textarea
                value={formData.player_statements || ''}
                onChange={e => setFormData({ ...formData, player_statements: e.target.value })}
                className="modern-form-input modern-form-textarea"
                rows={4}
                placeholder="أدخل أقوال وتبريرات اللاعب..."
              />
            </div>
          </div>

          {/* Admin Section */}
          <div className="premium-admin-card">
            <div className="premium-admin-header">
              <div className="premium-admin-header-icon">
                <AlertTriangle size={20} />
              </div>
              <h3>ملاحظات لجنة الاستماع والقرارات</h3>
            </div>
            
            <div className="premium-admin-body">
              <div className="modern-form-group">
                <textarea
                  value={formData.admin_notes || ''}
                  onChange={e => setFormData({ ...formData, admin_notes: e.target.value })}
                  className="modern-form-input modern-form-textarea"
                  rows={4}
                  placeholder="أدخل ملاحظات اللجنة..."
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
            حفظ الرد
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
