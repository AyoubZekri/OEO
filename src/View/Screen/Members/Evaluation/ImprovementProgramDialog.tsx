import React, { useState, useEffect } from 'react';
import { X, Target, Save, Calendar, Clock, Activity, Flag, Edit2, ArrowRight, ClipboardList, CheckSquare, Trash2 } from 'lucide-react';
import { ImprovementProgramData, type ImprovementProgramRecord } from './improvement_program_data';
import type { EvaluationRecord } from './evaluation_data';
import type { MemberModel } from '../member_model';
import './Evaluation.css';

interface ImprovementProgramDialogProps {
  player: MemberModel;
  evaluation: EvaluationRecord;
  onClose: () => void;
}

const ToggleSwitch = ({ checked, onChange, label, activeColor = 'var(--accent)' }: { checked: boolean, onChange: (c: boolean) => void, label: string, activeColor?: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px 20px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '16px', transition: 'all 0.2s', boxShadow: checked ? `0 0 0 1px ${activeColor}33` : 'none' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
    <div style={{ position: 'relative', width: '52px', height: '28px', background: checked ? activeColor : 'var(--border)', borderRadius: '24px', transition: '0.3s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '2px', left: checked ? '26px' : '2px', width: '24px', height: '24px', background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ color: checked ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: checked ? 'bold' : '600', transition: '0.3s', fontSize: '1rem' }}>{label}</span>
  </label>
);

export const ImprovementProgramDialog: React.FC<ImprovementProgramDialogProps> = ({ player, evaluation, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<ImprovementProgramRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [programStart, setProgramStart] = useState('');
  const [programEnd, setProgramEnd] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [specificGoals, setSpecificGoals] = useState('');
  const [actionsRequired, setActionsRequired] = useState('');
  const [nextEvalDate, setNextEvalDate] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const dataService = new ImprovementProgramData();

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true);
      const existingProgram = await dataService.getProgramByEvaluation(evaluation.id);
      if (existingProgram) {
        setProgram(existingProgram);
        setProgramStart(existingProgram.program_start ? existingProgram.program_start.split('T')[0] : '');
        setProgramEnd(existingProgram.program_end ? existingProgram.program_end.split('T')[0] : '');
        setAreasToImprove(existingProgram.areas_to_improve || '');
        setSpecificGoals(existingProgram.specific_goals || '');
        setActionsRequired(existingProgram.actions_required || '');
        setNextEvalDate(existingProgram.next_evaluation_date ? existingProgram.next_evaluation_date.split('T')[0] : '');
        setIsAcknowledged(existingProgram.is_acknowledged);
        setIsEditing(false); // Switch to View mode if data exists
      } else {
        const today = new Date().toISOString().split('T')[0];
        setProgramStart(today);
        setAreasToImprove(evaluation.weaknesses || '');
        setIsEditing(true); // Switch to Edit mode if new
      }
      setLoading(false);
    };

    fetchProgram();
  }, [evaluation.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        evaluation_id: evaluation.id,
        player_id: Number(player.id),
        program_start: programStart,
        program_end: programEnd,
        areas_to_improve: areasToImprove,
        specific_goals: specificGoals,
        actions_required: actionsRequired,
        next_evaluation_date: nextEvalDate,
        is_acknowledged: isAcknowledged
      };

      if (program && program.id) {
        const updated = await dataService.updateProgram({ ...payload, id: program.id });
        if (updated) setProgram(updated);
      } else {
        const saved = await dataService.saveProgram(payload);
        if (saved) setProgram(saved);
      }
      setIsEditing(false); // Return to View mode after save
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!program || !program.id) return;
    if (window.confirm('هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setSaving(true);
      try {
        const success = await dataService.deleteProgram(program.id);
        if (success) {
          onClose();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="eval-dialog-overlay" onClick={onClose} style={{ zIndex: 11000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0 }}>
      <div className="eval-dialog" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '850px', background: 'var(--card-bg)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header - App Bar style */}
        <div className="view-eval-title-bar app-bar-header">
          <div className="app-bar-inner">
            <button className="mobile-back-btn" onClick={onClose}>
              <ArrowRight size={24} />
            </button>
            <div className="desktop-icon-container" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '16px', color: 'var(--accent)' }}>
              <Target size={28} />
            </div>
            <div className="app-bar-titles">
              <h2 className="eval-main-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '0.5px' }}>
                <span className="desktop-title">برنامج تحسين المردودية</span>
                <span className="mobile-title">البرنامج</span>
              </h2>
              <p className="eval-main-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>اللاعب: {player.first_name} {player.last_name} {!isEditing && <span style={{background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', marginRight: '8px'}}>وضع العرض</span>}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isEditing && program && (
                <button onClick={handleDelete} disabled={saving} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} title="حذف البرنامج">
                  <Trash2 size={18} /> <span className="desktop-title">حذف</span>
                </button>
              )}
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-input)'} title="تعديل">
                  <Edit2 size={18} /> <span className="desktop-title">تعديل</span>
                </button>
              )}
              <button className="desktop-close-btn" onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'background 0.2s' }}>
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="view-eval-dialog-body" style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري تحميل البيانات...</div>
          ) : (
            <>
              {/* Dates Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px' }}>
                    <Calendar size={18} color="var(--accent)" /> تاريخ البداية
                  </label>
                  {isEditing ? (
                    <input type="date" value={programStart} onChange={e => setProgramStart(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{programStart || '---'}</div>
                  )}
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px' }}>
                    <Calendar size={18} color="var(--accent)" /> تاريخ النهاية
                  </label>
                  {isEditing ? (
                    <input type="date" value={programEnd} onChange={e => setProgramEnd(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{programEnd || '---'}</div>
                  )}
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px' }}>
                    <Activity size={18} color="var(--accent)" /> موعد إعادة التقييم
                  </label>
                  {isEditing ? (
                    <input type="date" value={nextEvalDate} onChange={e => setNextEvalDate(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }} />
                  ) : (
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{nextEvalDate || '---'}</div>
                  )}
                </div>
              </div>

              {/* Textareas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '16px' }}>
                    <ClipboardList size={22} /> الجوانب المطلوب تحسينها
                  </label>
                  {isEditing ? (
                    <textarea 
                      value={areasToImprove}
                      onChange={(e) => setAreasToImprove(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', padding: '16px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-color)', fontSize: '1rem', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px var(--bg-hover)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                      placeholder="انقر هنا لإضافة التفاصيل..."
                    />
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '80px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {areasToImprove || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '16px' }}>
                    <Target size={22} /> الأهداف المحددة
                  </label>
                  {isEditing ? (
                    <textarea 
                      value={specificGoals}
                      onChange={(e) => setSpecificGoals(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', padding: '16px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-color)', fontSize: '1rem', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px var(--bg-hover)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                      placeholder="انقر هنا لإضافة التفاصيل..."
                    />
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '80px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {specificGoals || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '16px' }}>
                    <CheckSquare size={22} /> الإجراءات المطلوبة (العمل)
                  </label>
                  {isEditing ? (
                    <textarea 
                      value={actionsRequired}
                      onChange={(e) => setActionsRequired(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', padding: '16px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-color)', fontSize: '1rem', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px var(--bg-hover)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                      placeholder="انقر هنا لإضافة التفاصيل..."
                    />
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '80px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {actionsRequired || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Acknowledgment Toggle */}
              <div style={{ marginTop: '8px', pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.8 }}>
                <ToggleSwitch 
                  checked={isAcknowledged} 
                  onChange={setIsAcknowledged} 
                  label="تم إطلاع اللاعب على البرنامج وموافقته" 
                  activeColor="var(--accent)" 
                />
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '30px', borderTop: '2px dashed var(--border)', paddingBottom: '20px' }}>
                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '60px', fontSize: '1.1rem' }}>إمضاء المدرب</h4>
                    <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto' }}></div>
                  </div>
                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '60px', fontSize: '1.1rem' }}>إمضاء اللاعب</h4>
                    <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto' }}></div>
                    {isAcknowledged && <div style={{ color: 'var(--accent)', marginTop: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>✓ تم الإطلاع والموافقة</div>}
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {isEditing && (
          <div className="eval-footer" style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', background: 'var(--card-bg)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            {program && (
              <button className="eval-btn-cancel" onClick={() => setIsEditing(false)} style={{ padding: '12px 28px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--card-bg)'}>إلغاء التعديل</button>
            )}
            <button className="eval-btn-save" onClick={handleSave} disabled={loading || saving} style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : (program ? 'حفظ التعديلات' : 'حفظ البرنامج')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


