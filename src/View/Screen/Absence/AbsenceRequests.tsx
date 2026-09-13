import React from 'react';
import { useAbsenceRequestsController } from './AbsenceRequestsController';
import { User, Calendar, Clock, FileText, Check, X, Paperclip, AlertCircle, FileWarning, Users, Plus } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { JustificationDialog } from './JustificationDialog';
import { AddAbsenceDialog } from './AddAbsenceDialog';
import { MemberAbsenceHistoryDialog } from './MemberAbsenceHistoryDialog';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
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
              onChange={(val) => controller.setActiveTab(val as any)}
              options={[
                { value: 'members', label: 'قائمة الأعضاء' },
                { value: 'requests', label: 'طلبات التبرير المعلقة' },
                { value: 'registry', label: 'سجل الغيابات العام' }
              ]}
            />
          </div>
          <div className="header-actions">
            <button className="add-absence-btn" onClick={() => controller.openAddAbsenceDialog(undefined, false)} style={{ marginRight: '8px' }}>
              <Plus size={18} /> تسجيل 
            </button>
            <button className="add-absence-btn multi-btn" onClick={() => controller.openAddAbsenceDialog(undefined, true)} style={{ background: 'var(--accent-secondary, #8b5cf6)' }}>
              <Users size={18} /> تسجيل 
            </button>
          </div>
        </div>
      </div>

      <div className="unified-absence-layout">
        
        {/* Section: Members List */}
        {controller.activeTab === 'members' && (() => {
          const indexOfLastItem = controller.currentPage * controller.itemsPerPage;
          const indexOfFirstItem = indexOfLastItem - controller.itemsPerPage;
          const paginatedMembers = controller.members.slice(indexOfFirstItem, indexOfLastItem);

          return (
            <div className="absence-section">
              <div className="table-pagination-wrapper">
                <ItemsPerPageSelector 
                  itemsPerPage={controller.itemsPerPage} 
                  onItemsPerPageChange={controller.setItemsPerPage} 
                  onPageChange={controller.setCurrentPage} 
                />
                <div className="members-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>العضو</th>
                        <th>المنصب</th>
                        <th>الفريق</th>
                        <th style={{ textAlign: 'center' }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((member: any) => (
                        <tr key={`member-${member.id}`} className="member-row">
                          <td data-label="العضو">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="avatar-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', width: '40px', height: '40px' }}>
                                <User size={20} />
                              </div>
                              <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{member.first_name} {member.last_name}</span>
                            </div>
                          </td>
                          <td data-label="المنصب">
                            <span className="req-type" style={{ background: 'var(--bg)' }}>
                              {member.type === 'player' ? 'لاعب' : 
                               member.type === 'coach' ? 'مدرب' : 
                               member.type === 'assistant_coach' ? 'مساعد مدرب' : 
                               member.type === 'goalkeeper_coach' ? 'مدرب حراس' : 
                               member.type === 'employee' ? 'موظف/إداري' : 
                               (member.type || 'لاعب')}
                            </span>
                          </td>
                          <td data-label="الفريق">
                            {member.team_name || 'الفريق الأول'}
                          </td>
                          <td data-label="إجراءات" className="actions-cell">
                            <div className="action-buttons-wrapper" style={{ justifyContent: 'center' }}>
                              <button 
                                className="btn-action edit-btn"
                                onClick={() => controller.openAddAbsenceDialog(member.id)}
                                title="تسجيل"
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                className="btn-action view-btn"
                                onClick={() => controller.openHistoryDialog(member.id)}
                                title="سجل الغيابات"
                              >
                                <Calendar size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {controller.members.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '1.1rem' }}>
                            جاري تحميل الأعضاء...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination 
                  totalItems={controller.members.length} 
                  itemsPerPage={controller.itemsPerPage} 
                  currentPage={controller.currentPage} 
                  onPageChange={controller.setCurrentPage} 
                  onItemsPerPageChange={controller.setItemsPerPage} 
                />
              </div>
            </div>
          );
        })()}

        {/* Section 1: Historical Absences */}
        {controller.activeTab === 'registry' && (
          <div className="absence-section">
            <div className="absence-grid">
              {controller.absences.map(abs => (
                <div key={`abs-${abs.id}`} className="absence-card premium-card">
                  <div className="card-top-bar">
                    <span className={`status-pill ${(abs.justification_status === 'مقبول' || abs.justification_status === 'accepted') ? 'accepted' : (abs.justification_status === 'مرفوض' || abs.justification_status === 'rejected') ? 'rejected' : (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? 'pending' : 'rejected'}`}>
                      {(abs.justification_status === 'مقبول' || abs.justification_status === 'accepted') ? 'غياب مبرر' : (abs.justification_status === 'مرفوض' || abs.justification_status === 'rejected') ? 'تبرير مرفوض' : (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? 'قيد مراجعة التبرير' : (abs.absence_type || 'غياب')}
                    </span>
                    <span className="time-ago" style={{ fontWeight: '600' }}>{abs.event_date || abs.session_date}</span>
                  </div>

                  <div className="player-info" style={{ marginBottom: '16px' }}>
                    <div className="avatar-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent, #3b82f6)' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text-h, #1f2937)' }}>{abs.player_name}</h3>
                    </div>
                  </div>

                  {abs.justification_status !== 'لا_يوجد' && abs.justification_status !== 'none' && (
                    <div className="details-list" style={{ flex: 1, background: (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg, #f9fafb)', border: (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? '1px solid rgba(245, 158, 11, 0.3)' : 'none' }}>
                      <div className="detail-row">
                        <FileWarning size={16} color={abs.is_justified ? '#10b981' : '#ef4444'} />
                        <span>الحالة: <strong style={{ color: abs.is_justified ? '#10b981' : '#ef4444' }}>
                          {abs.is_justified ? 'تم قبول التبرير' : 'لا يوجد تبرير مقبول'}
                        </strong></span>
                      </div>
                      {abs.reason && (
                        <div className="detail-row reason-box" style={{ borderColor: (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? 'rgba(245, 158, 11, 0.3)' : 'var(--border, #e5e7eb)' }}>
                          <FileText size={16} color={(abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? '#d97706' : '#9ca3af'} />
                          <p>التبرير: <span style={{ color: (abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') ? '#b45309' : 'var(--text-h, #1f2937)' }}>{abs.reason}</span></p>
                        </div>
                      )}
                    </div>
                  )}

                  {(abs.justification_status === 'لا_يوجد' || abs.justification_status === 'none') && (
                    <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                      <button className="btn-accept" style={{ background: 'linear-gradient(135deg, var(--accent, #3b82f6) 0%, var(--accent-secondary, #8b5cf6) 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', width: '100%' }} onClick={() => controller.openJustificationDialog(abs.id)}>
                        <FileText size={18} /> تقديم تبرير
                      </button>
                    </div>
                  )}
                  {(abs.justification_status === 'قيد_الدراسة' || abs.justification_status === 'pending') && (
                    <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                      <button className="btn-accept" onClick={() => controller.handleUpdateJustification(abs.id, 'مقبول')}>
                        <Check size={18} /> قبول التبرير
                      </button>
                      <button className="btn-reject" onClick={() => controller.handleUpdateJustification(abs.id, 'مرفوض')}>
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
              {/* Render Justifications */}
              {controller.absences.filter(a => a.justification_status === 'قيد_الدراسة').map(just => (
                <div key={`just-${just.id}`} className="absence-card premium-card">
                  <div className="card-top-bar">
                    <span className={`status-pill ${just.justification_status === 'مقبول' ? 'accepted' : just.justification_status === 'مرفوض' ? 'rejected' : 'pending'}`}>
                      {just.justification_status === 'مقبول' ? 'مقبول' : just.justification_status === 'مرفوض' ? 'مرفوض' : 'قيد الانتظار'}
                    </span>
                    <span className="time-ago" style={{ fontWeight: '600' }}>{just.event_date || just.session_date}</span>
                  </div>

                  <div className="player-info" style={{ marginBottom: '16px' }}>
                    <div className="avatar-circle" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary, #8b5cf6)' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text-h, #1f2937)' }}>{just.player_name}</h3>
                      <span className="req-type alert-type" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary, #8b5cf6)' }}>
                        <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                        تبرير غياب
                      </span>
                    </div>
                  </div>

                  <div className="details-list" style={{ flex: 1, background: 'var(--bg, #f9fafb)', border: 'none' }}>
                    <div className="detail-row">
                      <Calendar size={16} color="var(--text-p, #6b7280)" />
                      <span>تاريخ الغياب: <strong>{just.event_date || just.session_date}</strong></span>
                    </div>
                    <div className="detail-row reason-box" style={{ borderColor: 'var(--border, #e5e7eb)' }}>
                      <FileText size={16} color="var(--text-p, #6b7280)" />
                      <p>التبرير: <span style={{ color: 'var(--text-h, #1f2937)' }}>{just.reason}</span></p>
                    </div>
                  </div>

                  {just.justification_status === 'قيد_الدراسة' && (
                    <div className="action-buttons-row" style={{ marginTop: '16px' }}>
                      <button className="btn-accept" onClick={() => controller.handleUpdateJustification(just.id, 'مقبول')}>
                        <Check size={18} /> قبول
                      </button>
                      <button className="btn-reject" onClick={() => controller.handleUpdateJustification(just.id, 'مرفوض')}>
                        <X size={18} /> رفض
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {controller.absences.filter(a => a.justification_status === 'قيد_الدراسة').length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-p)' }}>
                  لا توجد طلبات تبرير معلقة حالياً.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <AddAbsenceDialog 
        isOpen={controller.isAddAbsenceDialogOpen} 
        onClose={controller.closeAddAbsenceDialog} 
        onSubmit={controller.handleAddAbsence}
        defaultPlayerId={controller.selectedMemberForAbsenceId}
        isMultiMode={controller.isMultiMode}
      />
      <JustificationDialog
        isOpen={controller.isJustificationDialogOpen}
        onClose={controller.closeJustificationDialog}
        onSubmit={controller.submitJustification}
      />
      <MemberAbsenceHistoryDialog
        isOpen={controller.isHistoryDialogOpen}
        onClose={controller.closeHistoryDialog}
        member={controller.members.find(m => m.id === controller.selectedMemberId)}
        absences={controller.absences.filter(a => a.player_id === controller.selectedMemberId)}
        onUpdateJustification={controller.handleUpdateJustification}
        openJustificationDialog={controller.openJustificationDialog}
      />
    </div>
  );
};
