import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDecisionsController } from './DecisionsController';
import type { Decision } from './decision_model';
import { useMeetingsController } from '../Meetings/MeetingsController';
import { mockEmployees } from '../Meetings/meetings_data';
import { Plus, Edit2, Trash2, Calendar, Users, CheckCircle, Clock, Filter, X, Eye, ClipboardList } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import './Decisions.css';

export const Decisions: React.FC = () => {
  const { t } = useTranslation();
  const { 
    decisions, 
    updateProgress, 
    toggleChecklistItem,
    selectedMeetingId, setSelectedMeetingId,
    isModalOpen, setIsModalOpen,
    editingId, setEditingId,
    readingDecision, setReadingDecision,
    detailsDecision, setDetailsDecision,
    newItemText, setNewItemText,
    formData, setFormData,
    existingCategories,
    filteredDecisions,
    openAdd,
    openEdit,
    handleSubmit,
    handleDelete
  } = useDecisionsController();
  const { meetings } = useMeetingsController();

  const getMeetingName = (id: string) => {
    return meetings.find(m => m.id === id)?.topic || 'إجتماع غير معروف';
  };

  const getEmployee = (id: string) => {
    return mockEmployees.find(e => e.id === id);
  };

  const handleQuickProgress = (id: string, currentProgress: number, addAmount: number) => {
    updateProgress(id, currentProgress + addAmount);
  };

  return (
    <div style={{ padding: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {t('admin_docs.decisions_tracking', 'متابعة القرارات')}
        </h2>
        <button 
          onClick={openAdd}
          className="premium-btn"
        >
          <Plus size={20} /> {t('admin_docs.add_decision', 'إضافة قرار')}
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--bg-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: '600' }}>{t('admin_docs.filter_by_meeting', 'فرز حسب الاجتماع')}:</span>
        </div>
        <div style={{ minWidth: '300px' }}>
          <CustomDropdown 
            value={selectedMeetingId} 
            onChange={(val) => setSelectedMeetingId(val)}
            options={[
              { value: "", label: t('admin_docs.all_meetings', 'جميع الاجتماعات') },
              ...meetings.map(m => ({ value: m.id, label: `${m.topic} - ${m.date}` }))
            ]}
          />
        </div>
      </div>

      {/* Decisions Grid */}
      {filteredDecisions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--card-bg)', borderRadius: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
          <CheckCircle size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <h3>{t('admin_docs.no_decisions', 'لا توجد قرارات حالياً')}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredDecisions.map(decision => {
            const isCompleted = decision.progress === 100;
            
            return (
              <div 
                key={decision.id} 
                className="super-premium-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--text-muted)" /> {getMeetingName(decision.meetingId)}
                      {decision.category && (
                        <span style={{ background: '#fef2f2', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid #fecaca' }}>
                          {decision.category}
                        </span>
                      )}
                    </div>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      color: 'var(--text-h)', 
                      fontWeight: 'bold', 
                      lineHeight: '1.5', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {decision.type === 'checklist' ? (decision.category || 'قرار مهام متعددة (Checklist)') : decision.text}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                    <button onClick={() => setReadingDecision(decision)} className="premium-icon-btn" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '6px 8px' }} title="قراءة النص كاملاً">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openEdit(decision)} className="decision-edit-btn">
                      <Edit2 size={14} /> تعديل
                    </button>
                    <button onClick={() => handleDelete(decision.id)} className="premium-icon-btn delete" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <button 
                    onClick={() => setDetailsDecision(decision)} 
                    className="premium-btn-outline" 
                    style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }}
                  >
                    <ClipboardList size={18} /> عرض المهام والمسؤولين
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isCompleted ? '#10b981' : 'var(--text)' }}>
                      {isCompleted ? 'مكتمل' : 'نسبة الإنجاز'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isCompleted ? '#10b981' : 'var(--accent)' }}>
                      {decision.progress}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="5"
                    value={decision.progress} 
                    onChange={e => updateProgress(decision.id, parseInt(e.target.value))}
                    disabled={decision.type === 'checklist'}
                    style={{ width: '100%', accentColor: isCompleted ? '#10b981' : 'var(--accent)', opacity: decision.type === 'checklist' ? 0.5 : 1, cursor: decision.type === 'checklist' ? 'not-allowed' : 'pointer' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal" style={{ background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                  {editingId ? <Edit2 size={24} color="var(--accent)" /> : <Plus size={24} color="var(--accent)" />}
                </div>
                {editingId ? 'تعديل القرار' : t('admin_docs.add_decision', 'إضافة قرار جديد')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-hover)'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <form id="decision-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Section 1: Basic Info */}
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', background: 'var(--accent)', borderRadius: '4px' }}></div>
                    المعلومات الأساسية
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <CustomDropdown 
                        label="الاجتماع التابع له"
                        value={formData.meetingId} 
                        onChange={(val) => setFormData({...formData, meetingId: val})}
                        options={[
                          { value: "", label: "-- اختر الاجتماع --" },
                          ...meetings.map(m => ({ value: m.id, label: `${m.topic} - ${m.date}` }))
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>التصنيف (اختياري)</label>
                      <input 
                        type="text" 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        placeholder="مثال: ضوابط تحريرية، تغطيات..."
                        className="premium-input"
                        list="categories-list"
                      />
                      <datalist id="categories-list">
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Section 2: Decision Details */}
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', background: 'var(--accent)', borderRadius: '4px' }}></div>
                    تفاصيل القرار
                  </h4>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '12px', fontWeight: '600' }}>نوع القرار</label>
                    <div style={{ display: 'flex', background: 'var(--bg-hover)', padding: '6px', borderRadius: '14px', gap: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'normal'})}
                        style={{ 
                          flex: 1, padding: '10px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                          background: formData.type === 'normal' ? 'var(--card-bg)' : 'transparent',
                          color: formData.type === 'normal' ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: formData.type === 'normal' ? '700' : '500',
                          boxShadow: formData.type === 'normal' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                        <Edit2 size={16} /> قرار عادي (نسبة إنجاز)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'checklist'})}
                        style={{ 
                          flex: 1, padding: '10px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                          background: formData.type === 'checklist' ? 'var(--card-bg)' : 'transparent',
                          color: formData.type === 'checklist' ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: formData.type === 'checklist' ? '700' : '500',
                          boxShadow: formData.type === 'checklist' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                        <CheckCircle size={16} /> مهام متعددة (Checklist)
                      </button>
                    </div>
                  </div>

                  {formData.type !== 'checklist' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>{t('admin_docs.decision_text', 'نص القرار')}</label>
                      <textarea 
                        required
                        value={formData.text} 
                        onChange={e => setFormData({...formData, text: e.target.value})}
                        placeholder="اكتب تفاصيل القرار بشكل واضح..."
                        className="premium-textarea"
                        style={{ minHeight: '120px', resize: 'vertical' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>قائمة المهام التنفيذية</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <input 
                          type="text"
                          value={newItemText}
                          onChange={e => setNewItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newItemText.trim()) {
                                setFormData({ ...formData, checklistItems: [...formData.checklistItems, { id: Date.now().toString(), text: newItemText.trim(), checked: false }] });
                                setNewItemText('');
                              }
                            }
                          }}
                          placeholder="اكتب مهمة جديدة ثم اضغط Enter للإضافة..."
                          className="premium-input"
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (newItemText.trim()) {
                              setFormData({ ...formData, checklistItems: [...formData.checklistItems, { id: Date.now().toString(), text: newItemText.trim(), checked: false }] });
                              setNewItemText('');
                            }
                          }}
                          className="premium-btn" style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
                        >
                          إضافة مهمة
                        </button>
                      </div>
                      
                      {formData.checklistItems && formData.checklistItems.length > 0 ? (
                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {formData.checklistItems.map((item, index) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{index + 1}</div>
                                <span style={{ fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: '500' }}>{item.text}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setFormData({ ...formData, checklistItems: formData.checklistItems ? formData.checklistItems.filter(i => i.id !== item.id) : [] })}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = 'transparent'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg)', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                          <CheckCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>لا توجد مهام مضافة بعد. ابدأ بكتابة المهام أعلاه.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Assignment & Progress */}
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', background: 'var(--accent)', borderRadius: '4px' }}></div>
                    التنفيذ والمتابعة
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '12px', fontWeight: '600' }}>
                        <Users size={16} color="var(--text-muted)" /> {t('admin_docs.decision_assignees', 'المسؤولون عن التنفيذ')}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg)', minHeight: '100px', maxHeight: '180px', overflowY: 'auto' }}>
                        {mockEmployees.map(emp => {
                          const isSelected = formData.assigneeIds.includes(emp.id);
                          return (
                            <div 
                              key={emp.id}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({...formData, assigneeIds: formData.assigneeIds.filter(id => id !== emp.id)});
                                } else {
                                  setFormData({...formData, assigneeIds: [...formData.assigneeIds, emp.id]});
                                }
                              }}
                              style={{ 
                                padding: '8px 14px', 
                                borderRadius: '20px', 
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg)',
                                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                color: isSelected ? 'var(--accent-secondary)' : 'var(--text)',
                                fontWeight: isSelected ? '600' : '500',
                                fontSize: '0.85rem',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isSelected ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--card-bg)' }}>
                                {isSelected ? <CheckCircle size={12} /> : <span style={{ fontSize: '10px' }}>{emp.name.charAt(0)}</span>}
                              </div>
                              {emp.name}
                            </div>
                          );
                        })}
                      </div>
                      {formData.assigneeIds.length === 0 && (
                        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--accent)' }}>* يرجى اختيار مسؤول واحد على الأقل</p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px', fontWeight: '600' }}>
                          <Calendar size={16} color="var(--text-muted)" /> {t('admin_docs.decision_deadline', 'الأجل الزمني')} <span style={{ fontWeight: '400', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(اختياري)</span>
                        </label>
                        <input 
                          type="date" 
                          value={formData.deadline} 
                          onChange={e => setFormData({...formData, deadline: e.target.value})}
                          className="premium-input"
                          style={{ background: 'var(--card-bg)' }}
                        />
                      </div>
                      
                      {editingId && formData.type === 'normal' && (
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '12px', fontWeight: '600' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="var(--text-muted)" /> {t('admin_docs.decision_progress', 'نسبة الإنجاز')}</span>
                            <span style={{ background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '8px', color: 'var(--text-h)', fontWeight: 'bold' }}>{formData.progress}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" max="100" step="5"
                            value={formData.progress} 
                            onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                            style={{ width: '100%', accentColor: 'var(--accent)', height: '6px', borderRadius: '3px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            {/* Modal Footer */}
            <div style={{ background: 'var(--card-bg)', padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', zIndex: 10, borderTop: '1px solid var(--border)', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.02)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '12px 24px', borderRadius: '12px', color: 'var(--text)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}>إلغاء</button>
              <button 
                type="submit" 
                form="decision-form"
                disabled={formData.assigneeIds.length === 0}
                className="premium-btn"
                style={{ opacity: formData.assigneeIds.length === 0 ? 0.6 : 1, cursor: formData.assigneeIds.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <CheckCircle size={18} /> حفظ القرار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {readingDecision && (
        <div className="premium-modal-overlay">
          <div className="premium-modal" style={{ maxWidth: '600px' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} color="#3b82f6" /> نص القرار كاملاً
              </h3>
              <button onClick={() => setReadingDecision(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '32px', fontSize: '1.1rem', color: 'var(--text)', lineHeight: '1.8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {readingDecision.text}
            </div>
            <div style={{ background: 'var(--bg)', padding: '16px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 0, zIndex: 10 }}>
              <button type="button" onClick={() => setReadingDecision(null)} className="premium-btn">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsDecision && (
        <div className="premium-modal-overlay">
          <div className="premium-modal" style={{ maxWidth: '600px', background: 'var(--bg)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} color="#3b82f6" /> المهام والمسؤولون
              </h3>
              <button onClick={() => setDetailsDecision(null)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-hover)'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
              {/* Assignees */}
              <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent)" /> المسؤولون عن التنفيذ
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {detailsDecision.assigneeIds?.map(id => {
                    const employee = getEmployee(id);
                    return employee ? (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', padding: '8px 16px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--card-bg)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {employee.name.charAt(0)}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>
                          {employee.name}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {(!detailsDecision.assigneeIds || detailsDecision.assigneeIds.length === 0) && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا يوجد مسؤولين محددين.</span>
                  )}
                </div>
                {detailsDecision.deadline && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--text-muted)" /> 
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>الأجل الزمني:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)', background: '#fef2f2', padding: '4px 10px', borderRadius: '8px' }}>
                      {detailsDecision.deadline}
                    </span>
                  </div>
                )}
              </div>

              {/* Checklist */}
              {detailsDecision.type === 'checklist' && detailsDecision.checklistItems && detailsDecision.checklistItems.length > 0 && (
                <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="#10b981" /> مهام التنفيذ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {detailsDecision.checklistItems.map(item => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', cursor: 'pointer', background: 'var(--bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <input 
                          type="checkbox" 
                          checked={item.checked}
                          onChange={() => {
                            toggleChecklistItem(detailsDecision.id, item.id);
                            setDetailsDecision({
                              ...detailsDecision,
                              checklistItems: detailsDecision.checklistItems?.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i)
                            });
                          }}
                          style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
                        />
                        <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'var(--text-h)', fontWeight: item.checked ? 'normal' : '500' }}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ background: 'var(--card-bg)', padding: '16px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 0, zIndex: 10 }}>
              <button type="button" onClick={() => setDetailsDecision(null)} className="premium-btn">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
