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
            {absences.map((abs) => {
              const isLate = abs.absence_type === 'تأخر';
              const isRequest = abs.absence_type === 'طلب عطلة';
              const isLeave = abs.absence_type === 'مغادرة';
              const isAbsence = abs.absence_type === 'غياب';

              let effectiveStatus = abs.justification_status as string;
              if ((effectiveStatus === 'لا_يوجد' || effectiveStatus === 'none') && (abs.reason || (abs as any).attachment_url)) {
                effectiveStatus = 'قيد_الدراسة';
              }
              const hasJustification = effectiveStatus !== 'لا_يوجد' && effectiveStatus !== 'none';

              return (
              <div key={`abs-${abs.id}`} className="absence-card premium-card" style={{ marginBottom: '0' }}>
                <div className="card-top-bar">
                  <span className={`status-pill ${(effectiveStatus === 'مقبول' || effectiveStatus === 'accepted') ? 'accepted' : (effectiveStatus === 'مرفوض' || effectiveStatus === 'rejected') ? 'rejected' : (effectiveStatus === 'قيد_الدراسة' || effectiveStatus === 'pending') ? 'pending' : 'rejected'}`}>
                    {(effectiveStatus === 'مقبول' || effectiveStatus === 'accepted') ? (isRequest ? 'طلب مقبول' : 'غياب مبرر') : (effectiveStatus === 'مرفوض' || effectiveStatus === 'rejected') ? (isRequest ? 'طلب مرفوض' : 'تبرير مرفوض') : (effectiveStatus === 'قيد_الدراسة' || effectiveStatus === 'pending') ? 'قيد المراجعة' : (isRequest ? 'طلب مرفوض' : (abs.absence_type || 'غياب'))}
                  </span>
                  <span className="time-ago" style={{ fontWeight: '600' }}>{abs.event_date || abs.session_date}</span>
                </div>

                <div className="details-list" style={{ flex: 1, background: 'var(--bg, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', borderRadius: '8px', padding: '16px' }}>
                  
                  {isRequest ? (
                    <>
                      <div className="detail-row" style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>الحدث:</span>
                        <span>{abs.event_category || 'غير محدد'}</span>
                      </div>
                      <div className="detail-row" style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>مدة الغياب:</span>
                        <span>{abs.duration || 'غير محددة'}</span>
                      </div>
                      <div className="detail-row reason-box" style={{ marginTop: '12px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', display: 'block', marginBottom: '6px' }}>ملاحظات وسبب الطلب:</span>
                        <p style={{ margin: 0, color: 'var(--text-p)', fontSize: '0.9rem', lineHeight: '1.5' }}>{abs.reason || 'لا يوجد سبب مرفق'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="detail-row" style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>النوع:</span>
                        <span style={{ color: abs.is_justified ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {abs.is_justified ? 'مبرر' : 'غير مبرر'}
                        </span>
                      </div>
                      <div className="detail-row" style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>تاريخ {isLate ? 'التأخر' : 'الغياب'}:</span>
                        <span>{abs.event_date || abs.session_date}</span>
                      </div>
                      <div className="detail-row" style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>الحدث:</span>
                        <span>{abs.event_category || 'غير محدد'}</span>
                      </div>
                      {isLate && (
                        <div className="detail-row" style={{ marginBottom: '10px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>مدة التأخر:</span>
                          <span>{abs.duration || 'غير محددة'}</span>
                        </div>
                      )}
                      
                      {hasJustification && (
                        <div className="detail-row reason-box" style={{ marginTop: '12px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-h)', display: 'block', marginBottom: '6px' }}>التبرير:</span>
                          <p style={{ margin: 0, color: 'var(--text-p)', fontSize: '0.9rem', lineHeight: '1.5' }}>{abs.reason || 'لا يوجد تبرير'}</p>
                        </div>
                      )}
                    </>
                  )}

                  {hasJustification && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                      <div className="detail-row" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px' }}>قرار الإدارة:</span>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: (effectiveStatus === 'مقبول' || effectiveStatus === 'accepted') ? '#d1fae5' : (effectiveStatus === 'مرفوض' || effectiveStatus === 'rejected') ? '#fee2e2' : '#fef3c7', color: (effectiveStatus === 'مقبول' || effectiveStatus === 'accepted') ? '#059669' : (effectiveStatus === 'مرفوض' || effectiveStatus === 'rejected') ? '#dc2626' : '#d97706' }}>
                          {(effectiveStatus === 'مقبول' || effectiveStatus === 'accepted') ? 'مقبول' : (effectiveStatus === 'مرفوض' || effectiveStatus === 'rejected') ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </div>
                      
                      <div className="detail-row" style={{ marginTop: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-h)', width: '120px', display: 'inline-block' }}>المرفق:</span>
                        {/* Placeholder for attachment if any */}
                        {(abs as any).attachment_url ? (
                          <a href={(abs as any).attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
                            <FileText size={16} /> عرض المرفق
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>لا يوجد مرفق</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!hasJustification && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" style={{ background: 'linear-gradient(135deg, var(--accent, #3b82f6) 0%, var(--accent-secondary, #8b5cf6) 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', width: '100%' }} onClick={() => openJustificationDialog(abs.id)}>
                      <FileText size={18} /> تقديم تبرير
                    </button>
                  </div>
                )}
                {(effectiveStatus === 'قيد_الدراسة' || effectiveStatus === 'pending') && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" onClick={() => onUpdateJustification(abs.id, 'مقبول')}>
                      <Check size={18} /> قبول التبرير
                    </button>
                    <button className="btn-reject" onClick={() => onUpdateJustification(abs.id, 'مرفوض')}>
                      <X size={18} /> رفض التبرير
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
