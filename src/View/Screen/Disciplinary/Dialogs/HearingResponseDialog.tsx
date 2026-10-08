import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, Save, MessageSquare, AlertTriangle, ArrowRight, UserCheck, Clock, Printer } from 'lucide-react';
import { DecisionFields } from './DecisionFields';
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
        hearingEndTime: editingItem.hearingEndTime || '',
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
              <span className="desktop-title">أقوال العضو (جلسة استماع)</span>
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
          {/* The session: who runs it (set when it was created), and when it closes (its minutes are printed once it is closed) */}
          {editingItem.actionType === 'استدعاء جلسة' && (
            <div className="epic-form-section">
              <div className="epic-section-header">
                <div className="epic-section-header-icon">
                  <UserCheck size={18} />
                </div>
                <h3>سير الجلسة</h3>
              </div>
              <div className="hr-session-grid">
                <div className="modern-form-group">
                  <label className="modern-form-label"><UserCheck size={14} /> مسؤول الجلسة</label>
                  <div className="modern-form-input hr-session-officer">{editingItem.hearingOfficer || 'لم يُعيَّن عند إنشاء الجلسة'}</div>
                </div>
                <div className="modern-form-group">
                  <label className="modern-form-label"><Clock size={14} /> توقيت اختتام الجلسة</label>
                  <input
                    className="modern-form-input"
                    type="time"
                    dir="ltr"
                    value={formData.hearingEndTime || ''}
                    onChange={e => setFormData({ ...formData, hearingEndTime: e.target.value })}
                  />
                </div>
              </div>
              <p className="hr-session-hint">
                <Printer size={14} />
                {editingItem.hearingEndTime
                  ? 'اختُتمت الجلسة: محضرها متاح للطباعة من زر الطباعة'
                  : 'بعد تحديد توقيت الاختتام والحفظ، يصبح محضر الجلسة متاحاً للطباعة'}
              </p>
            </div>
          )}

          {/* Player Section */}
          <div className="epic-form-section player-section">
            <div className="epic-section-header">
              <div className="epic-section-header-icon">
                <MessageSquare size={18} />
              </div>
              <h3>أقوال العضو وتبريراته خلال الجلسة</h3>
            </div>
            
            <div className="modern-form-group">
              <textarea
                value={formData.player_statements || ''}
                onChange={e => setFormData({ ...formData, player_statements: e.target.value })}
                className="modern-form-input modern-form-textarea"
                rows={4}
                placeholder="أدخل أقوال وتبريرات العضو..."
              />
            </div>
          </div>

          {/* Admin Section */}
          <div className="premium-admin-card">
            <div className="premium-admin-header">
              <div className="premium-admin-header-icon">
                <AlertTriangle size={20} />
              </div>
              <h3>قرار الإدارة</h3>
            </div>
            
            <div className="premium-admin-body">
              <DecisionFields
                key={editingItem.id}
                value={formData}
                onChange={patch => setFormData(prev => ({ ...prev, ...patch }))}
              />
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
