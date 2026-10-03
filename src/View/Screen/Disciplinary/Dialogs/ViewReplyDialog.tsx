import React from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, MessageSquare, Edit2, AlertTriangle, Scale, FileText, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../core/context/AuthContext';
import '../Disciplinary.css';

interface ViewReplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: DisciplinaryModel | null;
  /** Absent: read only (personal space) */
  onEdit?: (item: DisciplinaryModel) => void;
  /** Clarification requests: the member's reply and the decision are shown apart. Absent: both */
  section?: 'reply' | 'decision';
}

export const ViewReplyDialog: React.FC<ViewReplyDialogProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  section,
}) => {
  const showReply = section !== 'decision';
  const showDecision = section !== 'reply';
  // The reply of a clarification request is written by the member, not edited here
  const canEdit = onEdit && !(section === 'reply' && item?.actionType === 'طلب توضيح');
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  if (!isOpen || !item) return null;

  return createPortal(
    <div className="modern-dialog-overlay" onClick={onClose}>
      <div className="modern-dialog-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modern-dialog-header app-bar-header no-print">
          <button type="button" className="mobile-back-btn" onClick={onClose}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <MessageSquare size={24} />
            </div>
            <h2>
              <span className="desktop-title">{section === 'reply' ? 'رد العضو' : section === 'decision' ? 'القرار' : 'عرض الرد والقرارات'}</span>
              <span className="mobile-title">{section === 'reply' ? 'رد العضو' : section === 'decision' ? 'القرار' : 'الردود'}</span>
            </h2>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modern-dialog-body" style={{ gap: '20px' }}>
          {/* Player Response */}
          {showReply && (
          <div className="epic-form-section player-section">
            <div className="epic-section-header">
              <div className="epic-section-header-icon">
                <MessageSquare size={18} />
              </div>
              <h3>{item.actionType === 'طلب توضيح' ? 'رد العضو' : 'أقوال العضو وتبريراته'}</h3>
            </div>
            {item.player_statements ? (
              <div className="card-data-value" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '0.95rem', fontWeight: 500, padding: '10px 0', border: 'none', background: 'transparent' }}>
                {item.player_statements}
              </div>
            ) : (
              <div className="card-data-value" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500, padding: '10px 0', border: 'none', background: 'transparent' }}>
                لا يوجد رد حالياً.
              </div>
            )}
          </div>
          )}

          {/* Admin Notes & Decisions */}
          {showDecision && (
          <div className="premium-admin-card">
            <div className="premium-admin-header">
              <div className="premium-admin-header-icon">
                <AlertTriangle size={20} />
              </div>
              <h3>{section === 'decision' ? 'قرار الإدارة' : 'ملاحظات وقرارات الإدارة'}</h3>
            </div>
            <div className="premium-admin-body">
              {item.admin_notes && (
                <div className="premium-admin-data-block">
                  <div className="premium-admin-data-label"><FileText size={16} /> ملاحظات الإدارة</div>
                  <div className="premium-admin-data-value">{item.admin_notes}</div>
                </div>
              )}
              {!item.admin_notes && (
                <div className="premium-admin-data-value" style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  {section === 'decision' ? 'لم يصدر القرار بعد.' : 'لا توجد ملاحظات حالياً.'}
                </div>
              )}
              
              {item.actionType === 'واقعة' && (
                <>
                  <div className="premium-admin-data-grid">
                    <div className="premium-admin-data-item">
                      <span className="premium-admin-data-label"><Scale size={16} /> نوع القرار</span>
                      <div className="premium-admin-data-value">
                        {item.decision_outcome ? (
                          <span className={`badge badge-${item.decision_outcome === 'فصل' ? 'red' : 'purple'}`} style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                            {item.decision_outcome}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.95rem' }}>لم يحدد</span>
                        )}
                      </div>
                    </div>

                    <div className="premium-admin-data-item">
                      <span className="premium-admin-data-label"><Calendar size={16} /> تاريخ سريان العقوبة</span>
                      <div className="premium-admin-data-value" style={{ fontSize: '1rem', fontWeight: '700' }}>
                        {item.effective_date ? new Date(item.effective_date).toLocaleDateString('ar-DZ') : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 'normal' }}>لم يحدد</span>}
                      </div>
                    </div>
                  </div>
                  
                  {item.decision_reasons && (
                    <div className="premium-admin-data-block">
                      <div className="premium-admin-data-label"><FileText size={16} /> أسباب القرار</div>
                      <div className="premium-admin-data-value">{item.decision_reasons}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          )}
        </div>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إغلاق
          </button>
          {canEdit && onEdit && hasAccess(permissions.disciplinary.editReply) && (
            <button 
              type="button" 
              className="modern-btn-primary" 
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Edit2 size={16} />
              {section === 'decision'
                ? (item.admin_notes ? 'تعديل القرار' : 'إضافة القرار')
                : item.player_statements || item.admin_notes ? 'تعديل الرد والقرارات' : 'إضافة رد وقرار'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
