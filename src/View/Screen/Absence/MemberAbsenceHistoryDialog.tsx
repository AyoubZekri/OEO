import React from 'react';
import { X, Calendar, Clock, FileText, Check, AlertCircle, FileWarning } from 'lucide-react';
import type { AbsenceRecord } from './AbsenceRequestsController';

interface MemberAbsenceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  absences: AbsenceRecord[];
  onUpdateJustification: (id: number, status: AbsenceRecord['justification_status'], text?: string) => void;
  openJustificationDialog: (id: number) => void;
}

export const MemberAbsenceHistoryDialog: React.FC<MemberAbsenceHistoryDialogProps> = ({
  isOpen,
  onClose,
  member,
  absences,
  onUpdateJustification,
  openJustificationDialog
}) => {
  if (!isOpen || !member) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="task-dialog role-dialog" 
        style={{ fontFamily: 'var(--sans)', width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-dialog-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-h)' }}>سجل الغيابات: {member.first_name} {member.last_name}</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-p)', fontSize: '0.9rem' }}>
              إجمالي الغيابات: {absences.length}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {absences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-p)' }}>
            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>لا توجد غيابات مسجلة لهذا العضو.</p>
          </div>
        ) : (
          <div className="absence-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {absences.map(abs => (
              <div key={`abs-${abs.id}`} className="absence-card premium-card" style={{ marginBottom: '0' }}>
                <div className="card-top-bar">
                  <span className={`status-pill ${abs.justification_status === 'accepted' ? 'accepted' : abs.justification_status === 'rejected' ? 'rejected' : abs.justification_status === 'pending' ? 'pending' : 'rejected'}`}>
                    {abs.justification_status === 'accepted' ? 'غياب مبرر' : abs.justification_status === 'rejected' ? 'تبرير مرفوض' : abs.justification_status === 'pending' ? 'قيد مراجعة التبرير' : 'غياب غير مبرر'}
                  </span>
                  <span className="time-ago" style={{ fontWeight: '600' }}>{abs.event_date || abs.session_date}</span>
                </div>
                
                <div style={{ marginBottom: '12px', marginTop: '12px' }}>
                  <span className="req-type" style={{ background: 'var(--bg, #f3f4f6)', color: 'var(--text-p, #4b5563)' }}>{abs.absence_type}</span>
                </div>

                <div className="details-list" style={{ flex: 1, background: abs.justification_status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg, #f9fafb)', border: abs.justification_status === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : 'none' }}>
                  <div className="detail-row">
                    <FileWarning size={16} color={abs.is_justified ? '#10b981' : '#ef4444'} />
                    <span>الحالة: <strong style={{ color: abs.is_justified ? '#10b981' : '#ef4444' }}>
                      {abs.is_justified ? 'تم قبول التبرير' : 'لا يوجد تبرير مقبول'}
                    </strong></span>
                  </div>
                  {abs.reason && (
                    <div className="detail-row reason-box" style={{ borderColor: abs.justification_status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border, #e5e7eb)' }}>
                      <FileText size={16} color={abs.justification_status === 'pending' ? '#d97706' : '#9ca3af'} />
                      <p>التبرير: <span style={{ color: abs.justification_status === 'pending' ? '#b45309' : 'var(--text-h, #1f2937)' }}>{abs.reason}</span></p>
                    </div>
                  )}
                </div>

                {abs.justification_status === 'none' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" style={{ background: 'linear-gradient(135deg, var(--accent, #3b82f6) 0%, var(--accent-secondary, #8b5cf6) 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', width: '100%' }} onClick={() => openJustificationDialog(abs.id)}>
                      <FileText size={18} /> تقديم تبرير
                    </button>
                  </div>
                )}
                {abs.justification_status === 'pending' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" onClick={() => onUpdateJustification(abs.id, 'accepted')}>
                      <Check size={18} /> قبول التبرير
                    </button>
                    <button className="btn-reject" onClick={() => onUpdateJustification(abs.id, 'rejected')}>
                      <X size={18} /> رفض التبرير
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
