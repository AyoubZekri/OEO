import React from 'react';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, AlertTriangle, User, Calendar, FileText, Scale, ArrowRight } from 'lucide-react';
import '../Disciplinary.css';

interface DisciplinaryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: DisciplinaryModel | null;
}

export const DisciplinaryDetailsDialog: React.FC<DisciplinaryDetailsDialogProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  return createPortal(
    <div className="modern-dialog-overlay" onClick={onClose}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="modern-dialog-header app-bar-header no-print">
          <button type="button" className="mobile-back-btn" onClick={onClose}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <FileText size={24} />
            </div>
            <h2>
              <span className="desktop-title">تفاصيل الإجراء التأديبي</span>
              <span className="mobile-title">تفاصيل الإجراء</span>
            </h2>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modern-dialog-body" style={{ gap: '20px' }}>
          {/* Player Info Section */}
          <div className="player-info-premium" style={{ marginBottom: '8px' }}>
            <div className="player-avatar-premium">
              <User size={24} />
            </div>
            <div className="player-details-premium">
              <span className="player-name-premium">{item.memberName}</span>
              <span className="incident-date-premium">
                <Calendar size={14} /> تاريخ الحدث: {new Date(item.incidentDate).toLocaleDateString('ar-DZ')}
              </span>
            </div>
            <div style={{ marginRight: 'auto' }}>
              <div className="action-type-pill">
                <span>{item.actionType}</span>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="incident-reason-premium">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> الوصف / السبب
            </h4>
            <p>{item.reason}</p>
          </div>

          {/* Other Details Grid */}
          {(item.incidentLocation || item.violatedRule || item.presentPeople || item.attachments || item.deadlineOrHearingDate || item.hearingLocation) && (
            <div className="card-data-grid" style={{ padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {item.incidentLocation && (
                <div className="card-data-item">
                  <span className="card-data-label"><FileText size={14} /> مكان الواقعة</span>
                  <span className="card-data-value">{item.incidentLocation}</span>
                </div>
              )}
              {item.violatedRule && (
                <div className="card-data-item">
                  <span className="card-data-label"><AlertTriangle size={14} /> القاعدة المخالفة</span>
                  <span className="card-data-value">{item.violatedRule}</span>
                </div>
              )}
              {item.presentPeople && (
                <div className="card-data-item full-width">
                  <span className="card-data-label"><User size={14} /> الحاضرون</span>
                  <span className="card-data-value">{item.presentPeople}</span>
                </div>
              )}
              {item.attachments && (
                <div className="card-data-item full-width">
                  <span className="card-data-label"><FileText size={14} /> المرفقات</span>
                  <span className="card-data-value">{item.attachments}</span>
                </div>
              )}

              {(item.actionType === 'استدعاء جلسة' || item.actionType === 'طلب توضيح') && (
                <>
                  {item.deadlineOrHearingDate && (
                    <div className="card-data-item">
                      <span className="card-data-label"><Calendar size={14} /> {item.actionType === 'طلب توضيح' ? 'أجل الرد' : 'موعد الجلسة'}</span>
                      <span className="card-data-value">{new Date(item.deadlineOrHearingDate).toLocaleDateString('ar-DZ')}</span>
                    </div>
                  )}
                  {item.hearingLocation && (
                    <div className="card-data-item">
                      <span className="card-data-label"><FileText size={14} /> مكان الجلسة</span>
                      <span className="card-data-value">{item.hearingLocation}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* Admin Notes & Decisions */}
          {(item.admin_notes || item.decision_outcome || item.effective_date) && (
            <div className="premium-admin-card" style={{ marginTop: '24px' }}>
              <div className="premium-admin-header">
                <div className="premium-admin-header-icon">
                  <AlertTriangle size={20} />
                </div>
                <h3>قرارات وملاحظات الإدارة</h3>
              </div>
              
              <div className="premium-admin-body">
                {item.admin_notes && (
                  <div className="premium-admin-data-block">
                    <span className="premium-admin-data-label"><FileText size={16} /> ملاحظات الإدارة</span>
                    <span className="premium-admin-data-value">{item.admin_notes}</span>
                  </div>
                )}
                
                {(item.decision_outcome || item.effective_date) && (
                  <div className="premium-admin-data-grid">
                    {item.decision_outcome && (
                      <div className="premium-admin-data-item">
                        <span className="premium-admin-data-label"><Scale size={16} /> نوع القرار</span>
                        <span className="premium-admin-data-value">
                          <span className={`badge badge-${item.decision_outcome === 'فصل' ? 'red' : 'purple'}`} style={{ padding: '6px 14px' }}>{item.decision_outcome}</span>
                        </span>
                      </div>
                    )}
                    {item.effective_date && (
                      <div className="premium-admin-data-item">
                        <span className="premium-admin-data-label"><Calendar size={16} /> تاريخ سريان العقوبة</span>
                        <span className="premium-admin-data-value" style={{ fontSize: '1rem', fontWeight: '700' }}>{new Date(item.effective_date).toLocaleDateString('ar-DZ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.decision_reasons && (
                  <div className="premium-admin-data-block">
                    <span className="premium-admin-data-label"><FileText size={16} /> أسباب القرار</span>
                    <span className="premium-admin-data-value">{item.decision_reasons}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
