import React from 'react';
import { useCan } from '../../../core/functions/useCan';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Users, List, CheckCircle, XCircle, X, FolderOpen, ClipboardCheck, FileWarning } from 'lucide-react';
import { useMeetingsController } from './MeetingsController';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext';
import '../Matches/Matches.css';
import '../Equipment/Equipment.css';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileMeetings } from '../../Mobile/MobileMeetings/MobileMeetings';
import './Meetings.css';
import { MeetingAgenda } from './MeetingAgenda';
import { MeetingEditorDialog } from './MeetingEditorDialog';
import { meetingPointsApi } from './meetingPointsApi';
import { meetingStart, agendaOf } from '../../Mobile/MobileMeetings/meetingUtils';
import { useNow } from '../../Mobile/MobileTrainingSessions/sessionUtils';

export const Meetings: React.FC = () => {
  const { t } = useTranslation();
  const controller = useMeetingsController();
  const {
    meetings,
    isLoading,
    isEditorOpen,
    openAdd,
    openEdit,
    handleDelete,
    activeReasonModal, setActiveReasonModal,
    absenceReason, setAbsenceReason,
    expandedMeetingId, setExpandedMeetingId,
    submitAbsence
  } = controller;

  const navigate = useNavigate();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const isMobile = useIsMobile();
  const can = useCan();
  const nowMs = useNow().getTime();
  const { user } = useAuth();

  if (isMobile) return <MobileMeetings c={controller} canAdd={hasAccess(permissions.meetings.add)} />;

  return (
    <div className="visits-tab-container fade-in">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        {hasAccess(permissions.meetings.add) && (
          <button className="add-eq-btn" onClick={() => openAdd()}>
            <Plus size={20} />
            <span>{t('admin_docs.add_meeting', 'إضافة اجتماع')}</span>
          </button>
        )}
      </div>

      {/* Grid Section */}
      {/* Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
        {isLoading ? (
          <div className="loading-container" style={{ gridColumn: '1 / -1' }}>
            <div className="premium-loader">
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-dot"></div>
            </div>
            <p className="loading-text">جاري تحميل الاجتماعات...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px', background: 'linear-gradient(145deg, var(--card-bg), var(--bg-hover))', 
            borderRadius: '24px', border: '1px dashed var(--border)', marginTop: '24px',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              padding: '24px', borderRadius: '50%', marginBottom: '20px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
            }}>
              <FolderOpen size={56} color="var(--primary)" style={{ opacity: 0.8 }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-h)', marginBottom: '10px', fontWeight: '800' }}>
              لا توجد اجتماعات حالياً
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
              لم يتم جدولة أي اجتماعات حتى الآن. يمكنك إضافة اجتماع جديد للبدء في تنظيم فريقك ومناقشة النقاط الهامة.
            </p>
            {hasAccess(permissions.meetings.add) && (
              <button 
                className="add-eq-btn" 
                style={{ marginTop: '24px', padding: '12px 28px', fontSize: '1.05rem' }}
                onClick={() => openAdd()}
              >
                <Plus size={22} />
                <span>إضافة اجتماع جديد</span>
              </button>
            )}
          </div>
        ) : (
          meetings.map(meeting => (
            <div 
              key={meeting.id} 
            className="premium-card fade-in"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: 0,
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              background: 'var(--card-bg)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Top decorative gradient bar */}
            <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--primary), #8b5cf6)' }}></div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-h)', fontWeight: '800', lineHeight: '1.4' }}>{meeting.topic}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '6px 12px', borderRadius: '30px', fontWeight: '500' }}>
                      <Calendar size={14} style={{ color: 'var(--primary)' }} />
                      <span>{meeting.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '6px 12px', borderRadius: '30px', fontWeight: '500' }}>
                      <Clock size={14} style={{ color: '#f59e0b' }} />
                      <span>{meeting.time}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg)', padding: '4px', borderRadius: '12px' }}>
                  {can('meetings', 'edit') && (
                    <button onClick={() => openEdit(meeting)} className="premium-icon-btn" style={{ width: '32px', height: '32px' }} title={t('admin_docs.edit', 'تعديل')}>
                      <Edit2 size={16} />
                    </button>
                  )}
                  {can('meetings', 'delete') && (
                    <button onClick={() => handleDelete(meeting.id)} className="premium-icon-btn delete" style={{ width: '32px', height: '32px' }} title={t('admin_docs.delete', 'حذف')}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.95rem', color: 'var(--text-muted)', background: 'rgba(59, 130, 246, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: '500' }}>{meeting.location}</span>
              </div>

              {/* Attendance Progress Bar */}
              {meeting.attendees && meeting.attendees.length > 0 && (() => {
                const total = meeting.attendees.length;
                const present = meeting.attendees.filter((a: any) => a.status === 'حاضر').length;
                const late = meeting.attendees.filter((a: any) => a.status === 'متأخر').length;
                const excused = meeting.attendees.filter((a: any) => a.status === 'غائب مبرر').length;
                const absent = meeting.attendees.filter((a: any) => a.status === 'غائب غير مبرر').length;
                const totalPresent = present + late;
                const totalAbsent = absent + excused;
                const presentPct = total > 0 ? (totalPresent / total) * 100 : 0;
                return (
                  <div className="mc-attendance-bar-wrap" style={{ marginBottom: '16px' }}>
                    <div className="mc-attendance-bar-header">
                      <span className="mc-attendance-bar-title">الحضور</span>
                      <span className="mc-att-badge mc-att-present">
                        <span className="mc-att-dot mc-att-dot-green"></span>
                        {totalPresent}/{total}
                      </span>
                    </div>
                    <div className="mc-attendance-segbar">
                      <div className="mc-att-seg mc-att-seg-green" style={{ width: `${presentPct}%` }}></div>
                    </div>
                    <div className="mc-attendance-bar-footer">
                      <span>{total > 0 ? `${Math.round(presentPct)}٪ نسبة الحضور` : 'لم يُسجّل الحضور بعد'}</span>
                      <span>{totalAbsent > 0 ? `${totalAbsent} غائب` : ''}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                {can('meetings', 'attendance') && (
                  <button
                    className="mc-action-btn"
                    onClick={() => navigate(`/meetings/${meeting.id}/attendance`)}
                  >
                    <ClipboardCheck size={16} /> تسجيل الحضور
                  </button>
                )}
                <button
                  className="mc-action-btn"
                  onClick={() => setExpandedMeetingId(meeting.id)}
                >
                  <List size={16} /> عرض التفاصيل
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && <MeetingEditorDialog c={controller} />}

      {/* Meeting Details Modal */}
      {expandedMeetingId && meetings.find(m => m.id === expandedMeetingId) && (
        <div className="premium-modal-overlay" onClick={() => setExpandedMeetingId(null)}>
          <div className="premium-modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--bg)', padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <List size={24} style={{ color: 'var(--primary)' }} />
                {t('admin_docs.meeting_details', 'تفاصيل الإجتماع')}
              </h2>
              <button onClick={() => setExpandedMeetingId(null)} className="premium-icon-btn">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {(() => {
                const meeting = meetings.find(m => m.id === expandedMeetingId)!;
                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-h)', fontWeight: '800' }}>{meeting.topic}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 14px', borderRadius: '30px', fontWeight: '600', border: '1px solid var(--border)' }}>
                          <Calendar size={16} style={{ color: 'var(--primary)' }} />
                          <span>{meeting.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 14px', borderRadius: '30px', fontWeight: '600', border: '1px solid var(--border)' }}>
                          <Clock size={16} style={{ color: '#f59e0b' }} />
                          <span>{meeting.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 14px', borderRadius: '30px', fontWeight: '600', border: '1px solid var(--border)' }}>
                          <MapPin size={16} style={{ color: '#8b5cf6' }} />
                          <span>{meeting.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Agenda: the organisers' points and the proposed ones, with who added each */}
                    <div style={{ marginBottom: '36px' }}>
                      <MeetingAgenda
                        items={agendaOf(meeting.points, user?.id)}
                        canAdd={(meetingStart(meeting)?.getTime() ?? 0) > nowMs}
                        canRemove={() => can('meetings', 'edit')}
                        onAdd={async text => { await meetingPointsApi.add(meeting.id, text); await controller.reload(); }}
                        onRemove={async item => { if (await meetingPointsApi.remove(meeting.id, item)) await controller.reload(); }}
                      />
                    </div>

                    {/* Attendees Section */}
                    <div>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                        <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                          <Users size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        {t('admin_docs.attendees', 'قائمة الحضور')}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {meeting.attendees.length > 0 ? meeting.attendees.map(a => (
                          <div key={a.id} className="attendee-item" style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                            background: 'var(--bg)', padding: '16px', borderRadius: '16px', 
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ 
                                width: '52px', height: '52px', borderRadius: '14px', 
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.4rem',
                                border: '1px solid rgba(59,130,246,0.2)'
                              }}>
                                {a.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '1.1rem', marginBottom: '6px' }}>{a.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {a.status === 'pending' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: '700', fontSize: '0.85rem' }}>
                                      <Clock size={14} /> قيد الانتظار
                                    </span>}
                                    {a.status === 'حاضر' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', fontSize: '0.85rem' }}>
                                      <CheckCircle size={14} /> حاضر
                                    </span>}
                                    {a.status === 'متأخر' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: '700', fontSize: '0.85rem' }}>
                                      <Clock size={14} /> متأخر
                                    </span>}
                                    {a.status === 'غائب مبرر' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: '700', fontSize: '0.85rem' }}>
                                      <FileWarning size={14} /> غائب مبرر
                                    </span>}
                                    {a.status === 'غائب غير مبرر' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontWeight: '700', fontSize: '0.85rem' }}>
                                      <XCircle size={14} /> غائب غير مبرر
                                    </span>}
                                  {a.reason && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--card-bg)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.reason}>{a.reason}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : <div style={{ fontSize: '1rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px', background: 'var(--bg)', borderRadius: '12px', fontStyle: 'italic', border: '1px dashed var(--border)' }}>{t('admin_docs.no_attendees', 'لا يوجد حضور محددين')}</div>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Absence Reason Modal */}

      {activeReasonModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal" style={{ maxWidth: '400px' }}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text-h)' }}>{t('admin_docs.absence_reason', 'سبب الغياب')}</h3>
              <textarea 
                value={absenceReason} 
                onChange={e => setAbsenceReason(e.target.value)} 
                placeholder={t('admin_docs.absence_reason_placeholder', 'اكتب سبب الغياب...')}
                rows={3}
                className="premium-textarea"
                style={{ marginBottom: '20px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => { setActiveReasonModal(null); setAbsenceReason(''); }} className="premium-btn-outline">{t('admin_docs.cancel', 'إلغاء')}</button>
                <button onClick={submitAbsence} className="premium-btn">{t('admin_docs.confirm_absence', 'تأكيد الغياب')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
