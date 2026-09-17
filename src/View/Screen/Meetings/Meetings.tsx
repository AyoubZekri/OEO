import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Users, List, CheckCircle, XCircle, X, Check } from 'lucide-react';
import { useMeetingsController } from './MeetingsController';
import type { Attendee, Meeting } from './meeting_model';
import { useTranslation } from 'react-i18next';
import './Meetings.css';

export const Meetings: React.FC = () => {
  const { t } = useTranslation();
  const {
    meetings,
    isEditorOpen,
    editingId,
    topic, setTopic,
    date, setDate,
    time, setTime,
    location, setLocation,
    attendees, setAttendees,
    points, setPoints,
    openAdd,
    openEdit,
    closeEditor,
    handleSave,
    handleDelete,
    changeAttendeeStatus,
    mockEmployees,
    
    newAttendeeName, setNewAttendeeName,
    newPoint, setNewPoint,
    activeReasonModal, setActiveReasonModal,
    absenceReason, setAbsenceReason,
    expandedMeetingId, setExpandedMeetingId,
    toggleEmployee,
    handleRemoveAttendee,
    handleAddPoint,
    handleRemovePoint,
    submitAbsence
  } = useMeetingsController();

  return (
    <div className="visits-tab-container fade-in">
      {/* Header Section */}
      <div className="mission-orders-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-h)', marginBottom: '4px' }}>{t('admin_docs.meetings', 'الاجتماعات')}</h2>
        </div>
        <button 
          className="premium-btn" 
          onClick={openAdd}
        >
          <Plus size={18} />
          {t('admin_docs.add_meeting', 'إضافة إجتماع')}
        </button>
      </div>

      {/* Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {meetings.map(meeting => (
          <div 
            key={meeting.id} 
            className="premium-card fade-in"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{meeting.topic}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => openEdit(meeting)} className="premium-icon-btn" title={t('admin_docs.edit', 'تعديل')}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(meeting.id)} className="premium-icon-btn delete" title={t('admin_docs.delete', 'حذف')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <span>{meeting.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--text-muted)" />
                <span>{meeting.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--text-muted)" />
                <span>{meeting.location}</span>
              </div>
            </div>

            <button 
              onClick={() => setExpandedMeetingId(expandedMeetingId === meeting.id ? null : meeting.id)}
              style={{ background: 'var(--bg)', border: '1px dashed var(--border)', padding: '8px', borderRadius: '8px', width: '100%', color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '600' }}
            >
              <Users size={16} /> 
              {expandedMeetingId === meeting.id ? t('admin_docs.hide_details', 'إخفاء التفاصيل') : t('admin_docs.show_details', 'عرض الحضور والنقاط')}
            </button>

            {expandedMeetingId === meeting.id && (
              <div style={{ marginTop: '12px', paddingTop: '12px', animation: 'fadeInDown 0.2s ease-out' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <List size={14} /> {t('admin_docs.agenda_points', 'نقاط الإجتماع')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {meeting.points.length > 0 ? meeting.points.map((pt, i) => (
                      <div key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-bg)', 
                        padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          background: '#fef2f2', color: 'var(--accent)', width: '28px', height: '28px', 
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text)', fontWeight: '500' }}>
                          {pt}
                        </div>
                      </div>
                    )) : <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('admin_docs.no_points', 'لا توجد نقاط محددة')}</div>}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> {t('admin_docs.attendees', 'قائمة الحضور')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {meeting.attendees.length > 0 ? meeting.attendees.map(a => (
                      <div key={a.id} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '12px', 
                        border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '1.2rem'
                          }}>
                            {a.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '1rem' }}>{a.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              {a.status === 'pending' && <span style={{ fontSize: '0.75rem', color: '#d97706', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>{t('admin_docs.status_pending', 'قيد الانتظار')}</span>}
                              {a.status === 'confirmed' && <span style={{ fontSize: '0.75rem', color: '#059669', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>{t('admin_docs.status_confirmed', 'مؤكد')}</span>}
                              {a.status === 'absent' && <span style={{ fontSize: '0.75rem', color: '#dc2626', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>{t('admin_docs.status_absent', 'غائب')}</span>}
                              {a.reason && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>- {a.reason}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => changeAttendeeStatus(meeting.id, a.id, 'confirmed')} style={{ 
                            background: a.status === 'confirmed' ? '#10b981' : 'var(--bg)', color: a.status === 'confirmed' ? 'var(--card-bg)' : '#10b981', 
                            border: `1px solid ${a.status === 'confirmed' ? '#10b981' : 'var(--border)'}`, padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                          }} title={t('admin_docs.confirm_attendance', 'تأكيد الحضور')}>
                            <Check size={16} strokeWidth={a.status === 'confirmed' ? 3 : 2} />
                          </button>
                          <button onClick={() => setActiveReasonModal({ meetingId: meeting.id, attendeeId: a.id })} style={{ 
                            background: a.status === 'absent' ? 'var(--accent)' : 'var(--bg)', color: a.status === 'absent' ? 'var(--card-bg)' : 'var(--accent)', 
                            border: `1px solid ${a.status === 'absent' ? 'var(--accent)' : 'var(--border)'}`, padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                          }} title={t('admin_docs.mark_absent', 'غياب')}>
                            <X size={16} strokeWidth={a.status === 'absent' ? 3 : 2} />
                          </button>
                        </div>
                      </div>
                    )) : <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px', background: 'var(--bg)', borderRadius: '8px' }}>{t('admin_docs.no_attendees', 'لا يوجد حضور محددين')}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {meetings.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border)', marginTop: '24px' }}>
          <div style={{ background: 'var(--bg-hover)', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
            <Users size={48} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: '8px' }}>{t('admin_docs.no_meetings', 'لا توجد اجتماعات حالياً')}</h3>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="premium-modal-overlay" onClick={closeEditor}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div style={{ background: 'var(--bg)', padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-h)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId ? <><Edit2 size={20} color="var(--accent)" /> {t('admin_docs.edit_meeting', 'تعديل الإجتماع')}</> : <><Plus size={20} color="var(--accent)" /> {t('admin_docs.add_meeting', 'إضافة إجتماع')}</>}
                </h3>
                <button type="button" onClick={closeEditor} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <XCircle size={24} />
                </button>
              </div>
              
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.meeting_topic', 'سبب الإجتماع')} *</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required className="premium-input" />
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.meeting_date', 'التاريخ')} *</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.meeting_time', 'الوقت')} *</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="premium-input" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.meeting_location', 'مكان الإجتماع')} *</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="مثال: المقر الرئيسي" className="premium-input" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.agenda_points', 'نقاط الإجتماع')}</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={newPoint} onChange={e => setNewPoint(e.target.value)} placeholder={t('admin_docs.add_point_placeholder', 'اكتب نقطة للمناقشة...')} className="premium-input" style={{ flex: 1 }} onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddPoint(); }}} />
                    <button type="button" onClick={handleAddPoint} className="premium-btn-outline" style={{ padding: '0 24px' }}>{t('admin_docs.add_point', 'إضافة نقطة')}</button>
                  </div>
                  {points.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {points.map((pt, i) => (
                        <div key={i} style={{ 
                          display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-bg)', 
                          padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', 
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' 
                        }}>
                          <div style={{ 
                            background: '#fef2f2', color: 'var(--accent)', width: '28px', height: '28px', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text)', fontWeight: '500' }}>
                            {pt}
                          </div>
                          <button type="button" onClick={() => handleRemovePoint(i)} style={{ 
                            background: '#fef2f2', border: 'none', color: 'var(--accent)', borderRadius: '8px', 
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.attendees', 'قائمة الحضور')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto' }}>
                    {mockEmployees.map(emp => {
                      const isSelected = attendees.some(a => a.id === emp.id);
                      return (
                        <div 
                          key={emp.id} 
                          onClick={() => toggleEmployee(emp.id, emp.name)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', 
                            background: isSelected ? '#fef2f2' : 'var(--card-bg)', 
                            border: `1px solid ${isSelected ? '#fca5a5' : 'var(--border)'}`, 
                            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' 
                          }}
                        >
                          <div style={{ 
                            width: '20px', height: '20px', borderRadius: '4px', 
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <Check size={14} color="var(--card-bg)" strokeWidth={3} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isSelected ? '#991b1b' : 'var(--text)' }}>{emp.name}</div>
                            <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>{emp.role}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'var(--bg)', padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'sticky', bottom: 0, zIndex: 10 }}>
                <button type="button" onClick={closeEditor} className="premium-btn-outline">{t('admin_docs.cancel', 'إلغاء')}</button>
                <button type="submit" className="premium-btn">{t('admin_docs.save_meeting', 'حفظ الإجتماع')}</button>
              </div>
            </form>
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
