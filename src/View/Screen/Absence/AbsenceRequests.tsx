import React from 'react';
import { useAbsenceRequestsController } from './AbsenceRequestsController';
import { User, Calendar, Clock, FileText, Check, X, Paperclip, AlertCircle, FileWarning } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { JustificationDialog } from './JustificationDialog';
import './AbsenceRequests.css';

export const AbsenceRequests: React.FC = () => {
  const controller = useAbsenceRequestsController();

  return (
    <div className="absence-container">
      <div className="absence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>الغيابات والتبريرات</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '220px', zIndex: 10, height: '44px' }}>
            <CustomDropdown
              value={controller.activeTab}
              onChange={(val) => controller.setActiveTab(val)}
              options={[
                { value: 'requests', label: 'طلبات الغياب' },
                { value: 'registry', label: 'سجل الغيابات' }
              ]}
            />
          </div>
          <button className="add-absence-btn">
            <FileText size={20} />
            تقديم طلب غياب
          </button>
        </div>
      </div>


      <div className="unified-absence-layout">
        
        {/* Section 1: Historical Absences */}
        {controller.activeTab === 'registry' && (
        <div className="absence-section">
          <div className="absence-grid">
            {controller.historicalAbsences.map(abs => (
              <div key={`abs-${abs.id}`} className="absence-card premium-card">
                <div className="card-top-bar">
                  <span className={`status-pill ${abs.justificationStatus === 'accepted' ? 'accepted' : abs.justificationStatus === 'rejected' ? 'rejected' : abs.justificationStatus === 'pending' ? 'pending' : 'rejected'}`}>
                    {abs.justificationStatus === 'accepted' ? 'غياب مبرر' : abs.justificationStatus === 'rejected' ? 'تبرير مرفوض' : abs.justificationStatus === 'pending' ? 'قيد مراجعة التبرير' : 'غياب غير مبرر'}
                  </span>
                  <span className="time-ago" style={{ fontWeight: '600' }}>{abs.date}</span>
                </div>
                
                <div className="player-info" style={{ marginBottom: '16px' }}>
                  <div className="avatar-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent, #3b82f6)' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text-h, #1f2937)' }}>{abs.playerName}</h3>
                    <span className="req-type" style={{ background: 'var(--bg, #f3f4f6)', color: 'var(--text-p, #4b5563)' }}>{abs.sessionName}</span>
                  </div>
                </div>

                <div className="details-list" style={{ flex: 1, background: abs.justificationStatus === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg, #f9fafb)', border: abs.justificationStatus === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : 'none' }}>
                  <div className="detail-row">
                    <FileWarning size={16} color={abs.isJustified ? '#10b981' : '#ef4444'} />
                    <span>الحالة: <strong style={{ color: abs.isJustified ? '#10b981' : '#ef4444' }}>
                      {abs.isJustified ? 'تم قبول التبرير' : 'لا يوجد تبرير مقبول'}
                    </strong></span>
                  </div>
                  {abs.justificationText && (
                    <div className="detail-row reason-box" style={{ borderColor: abs.justificationStatus === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border, #e5e7eb)' }}>
                      <FileText size={16} color={abs.justificationStatus === 'pending' ? '#d97706' : '#9ca3af'} />
                      <p>التبرير: <span style={{ color: abs.justificationStatus === 'pending' ? '#b45309' : 'var(--text-h, #1f2937)' }}>{abs.justificationText}</span></p>
                    </div>
                  )}
                </div>

                {abs.justificationStatus === 'none' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" style={{ background: 'linear-gradient(135deg, var(--accent, #3b82f6) 0%, var(--accent-secondary, #8b5cf6) 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', width: '100%' }} onClick={() => controller.openJustificationDialog(abs.id)}>
                      <FileText size={18} /> تقديم تبرير
                    </button>
                  </div>
                )}
                {abs.justificationStatus === 'pending' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" onClick={() => controller.handleUpdateHistoricalJustificationStatus(abs.id, 'accepted')}>
                      <Check size={18} /> قبول التبرير
                    </button>
                    <button className="btn-reject" onClick={() => controller.handleUpdateHistoricalJustificationStatus(abs.id, 'rejected')}>
                      <X size={18} /> رفض التبرير
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Section 2: Requests & Justifications */}
        {controller.activeTab === 'requests' && (
        <div className="absence-section">
          <div className="absence-grid">
            {/* Render Requests */}
            {controller.requests.map(req => (
              <div key={`req-${req.id}`} className="absence-card premium-card">
                <div className="card-top-bar">
                  <span className={`status-pill ${req.status === 'مقبول' ? 'accepted' : req.status === 'مرفوض' ? 'rejected' : 'pending'}`}>
                    {req.status}
                  </span>
                  <span className="time-ago" style={{ fontWeight: '600' }}>{req.submittedAt}</span>
                </div>
                
                <div className="player-info" style={{ marginBottom: '16px' }}>
                  <div className="avatar-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text-h, #1f2937)' }}>{req.playerName}</h3>
                    <span className="req-type alert-type">{req.type}</span>
                  </div>
                </div>

                <div className="details-list" style={{ flex: 1, background: 'var(--bg, #f9fafb)', border: 'none' }}>
                  <div className="detail-row">
                    <Calendar size={16} color="var(--text-p, #6b7280)" />
                    <span>التاريخ: <strong>{req.date}</strong></span>
                  </div>
                  {req.duration && (
                    <div className="detail-row">
                      <Clock size={16} color="var(--text-p, #6b7280)" />
                      <span>المدة: <strong>{req.duration}</strong></span>
                    </div>
                  )}
                  <div className="detail-row reason-box" style={{ borderColor: 'var(--border, #e5e7eb)' }}>
                    <FileText size={16} color="var(--text-p, #6b7280)" />
                    <p>السبب: <span style={{ color: 'var(--text-h, #1f2937)' }}>{req.reason}</span></p>
                  </div>
                </div>

                {req.status === 'قيد الانتظار' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" onClick={() => controller.handleUpdateReqStatus(req.id, 'مقبول')}>
                      <Check size={18} /> قبول
                    </button>
                    <button className="btn-reject" onClick={() => controller.handleUpdateReqStatus(req.id, 'مرفوض')}>
                      <X size={18} /> رفض
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Render Justifications */}
            {controller.justifications.map(just => (
              <div key={`just-${just.id}`} className="absence-card premium-card">
                <div className="card-top-bar">
                  <span className={`status-pill ${just.status === 'مقبول' ? 'accepted' : just.status === 'مرفوض' ? 'rejected' : 'pending'}`}>
                    {just.status}
                  </span>
                  <span className="time-ago" style={{ fontWeight: '600' }}>{just.submittedAt}</span>
                </div>
                
                <div className="player-info" style={{ marginBottom: '16px' }}>
                  <div className="avatar-circle" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary, #8b5cf6)' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text-h, #1f2937)' }}>{just.playerName}</h3>
                    <span className="req-type alert-type" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary, #8b5cf6)' }}>
                      <AlertCircle size={14} style={{display:'inline', verticalAlign:'middle', marginLeft:'4px'}}/>
                      تبرير غياب
                    </span>
                  </div>
                </div>

                <div className="details-list" style={{ flex: 1, background: 'var(--bg, #f9fafb)', border: 'none' }}>
                  <div className="detail-row">
                    <Calendar size={16} color="var(--text-p, #6b7280)" />
                    <span>تاريخ الغياب: <strong>{just.absenceDate}</strong></span>
                  </div>
                  <div className="detail-row reason-box" style={{ borderColor: 'var(--border, #e5e7eb)' }}>
                    <FileText size={16} color="var(--text-p, #6b7280)" />
                    <p>التبرير: <span style={{ color: 'var(--text-h, #1f2937)' }}>{just.reason}</span></p>
                  </div>
                  {just.hasAttachment && (
                    <div className="attachment-box" style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: '8px', padding: '12px' }}>
                      <Paperclip size={16} color="var(--accent-secondary, #8b5cf6)" />
                      <span style={{ color: 'var(--text-h, #374151)', fontWeight: '500' }}>يوجد وثيقة مرفقة</span>
                      <button className="view-attachment-btn" style={{ background: 'transparent', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border, #d1d5db)', color: 'var(--accent, #3b82f6)', fontWeight: '600', marginLeft: 'auto' }}>عرض المرفق</button>
                    </div>
                  )}
                </div>

                {just.status === 'قيد الانتظار' && (
                  <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                    <button className="btn-accept" onClick={() => controller.handleUpdateJustStatus(just.id, 'مقبول')}>
                      <Check size={18} /> قبول
                    </button>
                    <button className="btn-reject" onClick={() => controller.handleUpdateJustStatus(just.id, 'مرفوض')}>
                      <X size={18} /> رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

      </div>

      <JustificationDialog
        isOpen={controller.isJustificationDialogOpen}
        onClose={controller.closeJustificationDialog}
        onSubmit={controller.submitJustification}
      />
    </div>
  );
};
