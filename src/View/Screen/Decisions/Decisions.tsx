import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDecisionsController } from './DecisionsController';
import type { Decision } from './decision_model';
import { useMeetingsController } from '../Meetings/MeetingsController';
import { useMembersController } from '../Members/MembersController';
import { Plus, Edit2, Trash2, Calendar, Users, CheckCircle, Clock, Filter, X, Eye, ClipboardList, FolderOpen, Check } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomInput } from '../../widget/CustomInput';
import './Decisions.css';

export const Decisions: React.FC = () => {
  const { t } = useTranslation();
  const { 
    decisions, 
    addDecision,
    updateDecision,
    deleteDecision,
    updateProgress 
  } = useDecisionsController();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [readingDecision, setReadingDecision] = useState<any>(null);
  const [detailsDecision, setDetailsDecision] = useState<any>(null);
  const [newItemText, setNewItemText] = useState('');
  const [formData, setFormData] = useState<any>({ text: '', category: '', deadline: '', assigneeIds: [], checklistItems: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDecisions = selectedMeetingId 
    ? decisions.filter(d => d.meetingId === selectedMeetingId)
    : decisions;

  const openAdd = () => {
    setEditingId(null);
    setFormData({ text: '', category: '', deadline: '', assigneeIds: [], checklistItems: [] });
    setIsModalOpen(true);
  };

  const openEdit = (decision: Decision) => {
    setEditingId(decision.id);
    setFormData(decision);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      let dataToSubmit = { ...formData };
      
      if (dataToSubmit.type === 'checklist' && !dataToSubmit.text) {
         dataToSubmit.text = dataToSubmit.category || 'قرار مهام متعددة ';
      }

      if (editingId) {
        await updateDecision(editingId, dataToSubmit);
      } else {
        await addDecision({ 
          ...dataToSubmit, 
          progress: dataToSubmit.type === 'checklist' ? 0 : (dataToSubmit.progress || 0), 
          status: 'في الانتظار', 
          meetingId: dataToSubmit.meetingId || selectedMeetingId || '' 
        } as Omit<Decision, 'id'>);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('هل أنت متأكد من حذف هذا القرار؟')) {
      if (deletingId) return;
      setDeletingId(id);
      try {
        await deleteDecision(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const toggleChecklistItem = (decisionId: string, itemId: string) => {
    const decision = decisions.find(d => d.id === decisionId);
    if (!decision) return;
    const newItems = decision.checklistItems?.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item) || [];
    
    let newProgress = decision.progress;
    if (newItems.length > 0) {
       const checkedCount = newItems.filter(i => i.checked).length;
       newProgress = Math.round((checkedCount / newItems.length) * 100);
    }
    
    updateDecision(decisionId, { checklistItems: newItems, progress: newProgress });
  };
  const { meetings } = useMeetingsController();

  const getMeetingName = (id: string) => {
    return meetings.find(m => m.id === id)?.topic || 'إجتماع غير معروف';
  };

  const { members } = useMembersController();

  const getEmployee = (id: string) => {
    const mem = members.find(e => e.id?.toString() === id?.toString());
    return mem ? { ...mem, name: `${mem.first_name} ${mem.last_name}` } : undefined;
  };

  const handleQuickProgress = (id: string, currentProgress: number, addAmount: number) => {
    updateProgress(id, currentProgress + addAmount);
  };

  return (
    <div className="visits-tab-container fade-in" style={{ fontFamily: 'var(--sans)' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={28} style={{ color: 'var(--accent)' }} /> {t('admin_docs.decisions_tracking', 'متابعة القرارات')}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '250px' }}>
            <CustomDropdown 
              value={selectedMeetingId} 
              onChange={(val) => setSelectedMeetingId(val)}
              options={[
                { value: "", label: t('admin_docs.all_meetings', 'جميع الاجتماعات') },
                ...meetings.map(m => ({ value: m.id, label: `${m.topic} - ${m.date}` }))
              ]}
            />
          </div>
          <button 
            className="add-eq-btn"
            onClick={openAdd}
          >
            <Plus size={20} />
            <span>{t('admin_docs.add_decision', 'إضافة قرار')}</span>
          </button>
        </div>
      </div>

      {/* Decisions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '28px' }}>
        {filteredDecisions.map(decision => {
          const isCompleted = decision.progress === 100;
          const assigneesCount = decision.assigneeIds?.length || 0;
          const displayAssignees = decision.assigneeIds?.slice(0, 3) || [];
          
          let checklistInfo = null;
          if (decision.type === 'checklist' && decision.checklistItems) {
            const total = decision.checklistItems.length;
            const done = decision.checklistItems.filter(i => i.checked).length;
            checklistInfo = `${done} / ${total} مهام منجزة`;
          }
          
          return (
            <div 
              key={decision.id} 
              className={`decision-card-wow ${isCompleted ? 'completed' : ''}`}
            >
              <div className="decision-card-content">
                <div className="decision-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="decision-tags">
                      <span className="wow-tag meeting">
                        <Calendar size={14} /> {getMeetingName(decision.meetingId)}
                      </span>
                      {decision.category && (
                        <span className="wow-tag category">
                          {decision.category}
                        </span>
                      )}
                      {decision.type === 'checklist' && (
                        <span className="wow-tag checklist-type">
                          <CheckCircle size={14} /> متعدد المهام
                        </span>
                      )}
                    </div>
                    <h3 className="decision-title">
                      {decision.type === 'checklist' ? (decision.category || 'قرار مهام متعددة ') : decision.text}
                    </h3>
                  </div>
                  
                  <div className="decision-actions">
                    {decision.type !== 'checklist' && (
                      <button onClick={() => setReadingDecision(decision)} className="decision-action-btn" title="قراءة">
                        <Eye size={18} />
                      </button>
                    )}
                    <button onClick={() => openEdit(decision)} className="decision-action-btn" title="تعديل" disabled={isSubmitting || deletingId === decision.id}>
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(decision.id)} 
                      className="decision-action-btn delete" 
                      title="حذف"
                      disabled={deletingId === decision.id}
                      style={{ opacity: deletingId === decision.id ? 0.5 : 1 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="decision-footer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="assignees-stack" title={`${assigneesCount} مسؤول عن التنفيذ`} onClick={() => setDetailsDecision(decision)} style={{ cursor: 'pointer' }}>
                      {displayAssignees.map(id => {
                        const emp = getEmployee(id);
                        return emp ? (
                          <div key={id} className="assignee-avatar" title={emp.name} style={emp.photo && !emp.photo.includes('default') ? { padding: 0, overflow: 'hidden' } : {}}>
                            {emp.photo && !emp.photo.includes('default') ? (
                              <img src={emp.photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              emp.name.charAt(0)
                            )}
                          </div>
                        ) : null;
                      })}
                      {assigneesCount > 3 && (
                        <div className="assignee-avatar more">
                          +{assigneesCount - 3}
                        </div>
                      )}
                      {assigneesCount === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>بدون مسؤول</span>
                      )}
                    </div>
                    
                    <button 
                      className="premium-btn-outline"
                      onClick={() => setDetailsDecision(decision)}
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: '6px' }}
                    >
                      <ClipboardList size={16} /> التفاصيل
                    </button>
                  </div>

                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-text">
                        {checklistInfo ? checklistInfo : (isCompleted ? 'مكتمل' : 'نسبة الإنجاز')}
                      </span>
                      <span className={`progress-percentage ${isCompleted ? 'completed' : ''}`}>
                        {decision.progress}%
                      </span>
                    </div>
                    
                    <div style={{ position: 'relative', height: '10px', display: 'flex', alignItems: 'center' }}>
                      <div className="progress-track" style={{ width: '100%', position: 'absolute' }}>
                        <div 
                          className={`progress-fill ${isCompleted ? 'completed' : ''}`} 
                          style={{ width: `${decision.progress}%` }} 
                        />
                      </div>
                      
                      {decision.type !== 'checklist' && (
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={decision.progress}
                          onChange={e => updateProgress(decision.id, parseInt(e.target.value))}
                          className={`premium-slider-new ${isCompleted ? 'completed' : ''}`}
                          title="تغيير نسبة الإنجاز"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDecisions.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 20px', background: 'linear-gradient(145deg, var(--card-bg), var(--bg-hover))', 
          borderRadius: '24px', border: '1px dashed var(--border)', marginTop: '24px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.1), rgba(139, 92, 246, 0.1))',
            padding: '24px', borderRadius: '50%', marginBottom: '20px',
            border: '1px solid rgba(var(--accent-rgb), 0.2)',
            boxShadow: '0 8px 32px rgba(var(--accent-rgb), 0.15)'
          }}>
            <FolderOpen size={56} color="var(--accent)" style={{ opacity: 0.8 }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-h)', marginBottom: '10px', fontWeight: '800' }}>
            لا توجد قرارات حالياً
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
            لم يتم العثور على أي قرارات. يمكنك إضافة قرار جديد للبدء في تتبع إنجازه.
          </p>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="wow-modal-overlay">
          <div className="wow-modal">
            
            <div className="wow-modal-header">
              <h3 className="wow-modal-title">
                <div className="wow-modal-icon-bg">
                  {editingId ? <Edit2 size={24} color="var(--accent)" /> : <Plus size={24} color="var(--accent)" />}
                </div>
                {editingId ? 'تعديل القرار' : t('admin_docs.add_decision', 'إضافة قرار جديد')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="wow-modal-body">
              <form id="decision-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Section 1: Basic Info */}
                <div className="wow-section-card">
                  <h4 className="wow-section-title">المعلومات الأساسية</h4>
                  
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <CustomDropdown 
                      label="الاجتماع التابع له"
                      value={formData.meetingId} 
                      onChange={(val) => setFormData({...formData, meetingId: val})}
                      options={[
                        { value: "", label: "-- اختر الاجتماع --" },
                        ...meetings.map(m => ({ value: m.id, label: `${m.topic} - ${m.date}` }))
                      ]}
                    />

                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-h)', marginBottom: '12px', fontWeight: '700' }}>نوع القرار</label>
                      <div className="wow-toggle-container">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, type: 'normal'})}
                          className={`wow-toggle-btn ${formData.type === 'normal' ? 'active normal' : ''}`}
                        >
                          <Edit2 size={18} /> نص القرار
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, type: 'checklist'})}
                          className={`wow-toggle-btn ${formData.type === 'checklist' ? 'active checklist' : ''}`}
                        >
                          <CheckCircle size={18} /> مهام متعددة 
                        </button>
                      </div>
                    </div>

                    {formData.type !== 'checklist' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-h)', marginBottom: '8px', fontWeight: '700' }}>{t('admin_docs.decision_text', 'نص القرار')}</label>
                        <textarea 
                          required
                          value={formData.text} 
                          onChange={e => setFormData({...formData, text: e.target.value})}
                          placeholder="اكتب تفاصيل القرار بشكل واضح ليتم فهمه من قبل المسؤولين..."
                          className="premium-textarea"
                          style={{ minHeight: '140px' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                          <div style={{ flex: '1 1 250px' }}>
                            <CustomInput 
                              label="قائمة المهام التنفيذية"
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
                              placeholder="اكتب مهمة جديدة ثم اضغط الزر للإضافة..."
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              if (newItemText.trim()) {
                                setFormData({ ...formData, checklistItems: [...formData.checklistItems, { id: Date.now().toString(), text: newItemText.trim(), checked: false }] });
                                setNewItemText('');
                              }
                            }}
                            className="wow-btn-submit" style={{ padding: '0 24px', height: '48px', flex: 'none', borderRadius: '12px' }}
                          >
                            إضافة مهمة
                          </button>
                        </div>
                        
                        {formData.checklistItems && formData.checklistItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {formData.checklistItems.map((item: any, index: number) => (
                              <div key={item.id} className="task-list-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid var(--border)' }}>{index + 1}</div>
                                  <span style={{ fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: '600' }}>{item.text}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({ ...formData, checklistItems: formData.checklistItems ? formData.checklistItems.filter((i: any) => i.id !== item.id) : [] })}
                                  className="decision-action-btn delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>لا توجد مهام حالياً. أضف مهام لبناء قائمة التشيك ليست.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Execution Info */}
                <div className="wow-section-card">
                  <h4 className="wow-section-title">معلومات التنفيذ</h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-h)', marginBottom: '12px', fontWeight: '700' }}>
                        <Users size={18} color="var(--accent)" /> {t('admin_docs.decision_assignees', 'المسؤولون عن التنفيذ')}
                      </label>
                      <div className="wow-assignee-grid">
                        {members.map(emp => {
                          const empIdStr = emp.id?.toString() || '';
                          const isSelected = formData.assigneeIds.includes(empIdStr);
                          const empName = `${emp.first_name} ${emp.last_name}`;
                          return (
                            <div 
                              key={emp.id}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({...formData, assigneeIds: formData.assigneeIds.filter((id: string) => id !== empIdStr)});
                                } else {
                                  setFormData({...formData, assigneeIds: [...formData.assigneeIds, empIdStr]});
                                }
                              }}
                              className={`wow-assignee-chip ${isSelected ? 'selected' : ''}`}
                            >
                              <div className="wow-assignee-avatar">
                                {isSelected ? <Check size={18} strokeWidth={3} /> : empName.charAt(0)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? '700' : '600', color: isSelected ? 'var(--accent)' : 'var(--text-h)' }}>{empName}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.type === 'player' ? 'لاعب' : emp.type === 'coach' ? 'مدرب' : emp.type === 'staff' ? 'إداري' : emp.type}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {formData.assigneeIds.length === 0 && (
                        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#ef4444' }}>* يرجى اختيار مسؤول واحد على الأقل للمتابعة</p>
                      )}
                    </div>
                    
                    <div>
                      <CustomInput 
                        label={`${t('admin_docs.decision_deadline', 'الأجل الزمني')} (اختياري)`}
                        type="date" 
                        value={formData.deadline} 
                        onChange={e => setFormData({...formData, deadline: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="wow-btn-cancel" disabled={isSubmitting}>
                    {t('admin_docs.cancel', 'إلغاء')}
                  </button>
                  <button type="submit" disabled={formData.assigneeIds.length === 0 || isSubmitting} className="wow-btn-submit" style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'جاري الحفظ...' : t('admin_docs.save_decision', 'حفظ القرار')} <CheckCircle size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {readingDecision && (
        <div className="wow-modal-overlay">
          <div className="wow-modal" style={{ maxWidth: '640px' }}>
            <div className="wow-modal-header">
              <h3 className="wow-modal-title">
                <div className="wow-modal-icon-bg">
                  <Eye size={24} color="var(--accent)" />
                </div>
                نص القرار
              </h3>
              <button onClick={() => setReadingDecision(null)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>
            <div className="wow-modal-body" style={{ fontSize: '1.1rem', color: 'var(--text-h)', lineHeight: '1.8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {readingDecision.text}
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
              <button type="button" onClick={() => setReadingDecision(null)} className="wow-btn-submit" style={{ flex: 'none', padding: '12px 36px' }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsDecision && (
        <div className="wow-modal-overlay">
          <div className="wow-modal" style={{ maxWidth: '640px' }}>
            <div className="wow-modal-header">
              <h3 className="wow-modal-title">
                <div className="wow-modal-icon-bg" style={{ background: 'rgba(var(--accent-rgb), 0.1)' }}>
                  <ClipboardList size={24} color="var(--accent)" />
                </div>
                المهام والمسؤولون
              </h3>
              <button onClick={() => setDetailsDecision(null)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="wow-modal-body">
              {/* Assignees */}
              <div className="wow-section-card">
                <h4 className="wow-section-title">
                  <Users size={18} color="var(--accent)" /> المسؤولون عن التنفيذ
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {detailsDecision.assigneeIds?.map((id: string) => {
                    const employee = getEmployee(id);
                    return employee ? (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)', padding: '8px 16px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {employee.name.charAt(0)}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-h)' }}>
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
                  <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--text-muted)" /> 
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>الأجل الزمني:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)', background: 'rgba(var(--accent-rgb), 0.1)', padding: '4px 12px', borderRadius: '8px' }}>
                      {detailsDecision.deadline}
                    </span>
                  </div>
                )}
              </div>

              {/* Checklist */}
              {detailsDecision.type === 'checklist' && detailsDecision.checklistItems && detailsDecision.checklistItems.length > 0 && (
                <div className="wow-section-card">
                  <h4 className="wow-section-title">
                    <CheckCircle size={18} color="var(--accent)" /> مهام التنفيذ
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {detailsDecision.checklistItems.map((item: any) => (
                      <label key={item.id} className="task-list-item" style={{ cursor: 'pointer', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={item.checked}
                            onChange={() => {
                              toggleChecklistItem(detailsDecision.id, item.id);
                              
                              const newItems = detailsDecision.checklistItems?.map((i: any) => i.id === item.id ? { ...i, checked: !i.checked } : i);
                              let newProg = detailsDecision.progress;
                              if (newItems && newItems.length > 0) {
                                  newProg = Math.round((newItems.filter((i: any) => i.checked).length / newItems.length) * 100);
                              }

                              setDetailsDecision({
                                ...detailsDecision,
                                checklistItems: newItems,
                                progress: newProg
                              });
                            }}
                            style={{ width: '22px', height: '22px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                          />
                          <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'var(--text-h)', fontWeight: item.checked ? 'normal' : '600', fontSize: '1.05rem', transition: 'all 0.2s' }}>
                            {item.text}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ background: 'var(--card-bg)', padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
              <button type="button" onClick={() => setDetailsDecision(null)} className="wow-btn-submit" style={{ flex: 'none', padding: '12px 36px', background: 'var(--accent)', boxShadow: '0 8px 16px -4px rgba(var(--accent-rgb), 0.4)' }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
