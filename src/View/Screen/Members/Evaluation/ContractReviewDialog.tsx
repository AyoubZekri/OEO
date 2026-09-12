import React, { useState, useEffect } from 'react';
import { X, Handshake, Save, Calendar, FileText, AlertTriangle, Scale, DollarSign, Edit2, ArrowRight, CheckCircle, Trash2 } from 'lucide-react';
import { CustomInput } from '../../../widget/CustomInput';
import { ContractReviewData, type ContractReviewRecord } from './contract_review_data';
import type { EvaluationRecord } from './evaluation_data';
import type { MemberModel } from '../member_model';
import './Evaluation.css';

interface ContractReviewDialogProps {
  player: MemberModel;
  evaluation: EvaluationRecord;
  onClose: () => void;
}

const ToggleSwitch = ({ checked, onChange, label, activeColor = 'var(--accent)' }: { checked: boolean, onChange: (c: boolean) => void, label: string, activeColor?: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', transition: 'all 0.2s', boxShadow: checked ? `0 0 0 1px ${activeColor}33` : 'none' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
    <div style={{ position: 'relative', width: '48px', height: '26px', background: checked ? activeColor : 'var(--border)', borderRadius: '24px', transition: '0.3s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '2px', left: checked ? '24px' : '2px', width: '22px', height: '22px', background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ color: checked ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: checked ? '600' : 'normal', transition: '0.3s', fontSize: '0.95rem' }}>{label}</span>
  </label>
);

export const ContractReviewDialog: React.FC<ContractReviewDialogProps> = ({ player, evaluation, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<ContractReviewRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [meetingDate, setMeetingDate] = useState('');
  const [discussedTopics, setDiscussedTopics] = useState('');
  const [clubProposal, setClubProposal] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [outcome, setOutcome] = useState('');
  const [requiresOfficialAvenant, setRequiresOfficialAvenant] = useState(false);
  const [playerSignature, setPlayerSignature] = useState(false);

  const dataService = new ContractReviewData();

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true);
      const existingReview = await dataService.getReviewByEvaluation(evaluation.id);
      if (existingReview) {
        setReview(existingReview);
        setMeetingDate(existingReview.meeting_date ? existingReview.meeting_date.split('T')[0] : '');
        setDiscussedTopics(existingReview.discussed_topics || '');
        setClubProposal(existingReview.club_proposal || '');
        setPlayerPosition(existingReview.player_position || '');
        setOutcome(existingReview.outcome || '');
        setRequiresOfficialAvenant(existingReview.requires_official_avenant);
        setPlayerSignature(existingReview.player_signature);
        setIsEditing(false);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setMeetingDate(today);
        setIsEditing(true);
      }
      setLoading(false);
    };

    fetchReview();
  }, [evaluation.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        evaluation_id: evaluation.id,
        player_id: Number(player.id),
        // club_representative_id: 1, // Optional
        meeting_date: meetingDate,
        discussed_topics: discussedTopics,
        club_proposal: clubProposal,
        player_position: playerPosition,
        outcome: outcome,
        requires_official_avenant: requiresOfficialAvenant,
        player_signature: playerSignature
      };

      if (review && review.id) {
        const updated = await dataService.updateReview({ ...payload, id: review.id });
        if (updated) setReview(updated);
      } else {
        const saved = await dataService.saveReview(payload);
        if (saved) setReview(saved);
      }
      setIsEditing(false); // Return to View mode after save
    } catch (e: any) {
      console.error("Backend Error:", e);
      if (e.response && e.response.data) {
          console.error("Error details:", e.response.data.message || e.response.data.error || e.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!review || !review.id) return;
    if (window.confirm('هل أنت متأكد من حذف هذه المراجعة التعاقدية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setSaving(true);
      try {
        const success = await dataService.deleteReview(review.id);
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
              <Handshake size={28} />
            </div>
            <div className="app-bar-titles">
              <h2 className="eval-main-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '0.5px' }}>
                <span className="desktop-title">عرض وتعديل الوضعية التعاقدية</span>
                <span className="mobile-title">التعاقد</span>
              </h2>
              <p className="eval-main-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>اللاعب: {player.first_name} {player.last_name} {!isEditing && <span style={{background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', marginRight: '8px'}}>وضع العرض</span>}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isEditing && review && (
                <button onClick={handleDelete} disabled={saving} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} title="حذف المراجعة التعاقدية">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {isEditing ? (
                  <CustomInput
                    type="date"
                    label="تاريخ الجلسة"
                    value={meetingDate}
                    onChange={(e: any) => setMeetingDate(e.target.value)}
                  />
                ) : (
                  <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px' }}>
                      <Calendar size={18} color="var(--accent)" /> تاريخ الجلسة
                    </label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{meetingDate || '---'}</div>
                  </div>
                )}
              </div>

              <div className="eval-textarea-wrap">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>
                  <FileText size={18} color="var(--accent)" /> المواضيع التي تمت مناقشتها
                </label>
                {isEditing ? (
                  <textarea 
                    className="eval-textarea" 
                    style={{ height: '90px', padding: '16px', background: 'var(--bg-input)' }}
                    placeholder="مثال: المردودية خلال مرحلة الذهاب، الالتزام التكتيكي..."
                    value={discussedTopics}
                    onChange={(e) => setDiscussedTopics(e.target.value)}
                  />
                ) : (
                  <div style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '90px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {discussedTopics || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                  </div>
                )}
              </div>

              <div className="eval-responsive-grid-2">
                <div className="eval-textarea-wrap">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></span> مقترح النادي
                  </label>
                  {isEditing ? (
                    <textarea 
                      className="eval-textarea" 
                      style={{ height: '100px', padding: '16px', background: 'var(--bg-input)' }}
                      placeholder="مثال: تخفيض الراتب، إعارة..."
                      value={clubProposal}
                      onChange={(e) => setClubProposal(e.target.value)}
                    />
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '100px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {clubProposal || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                    </div>
                  )}
                </div>
                <div className="eval-textarea-wrap">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></span> موقف اللاعب
                  </label>
                  {isEditing ? (
                    <textarea 
                      className="eval-textarea" 
                      style={{ height: '100px', padding: '16px', background: 'var(--bg-input)' }}
                      placeholder="موقف اللاعب ورأيه الشخصي..."
                      value={playerPosition}
                      onChange={(e) => setPlayerPosition(e.target.value)}
                    />
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '100px', color: 'var(--text-color)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {playerPosition || <span style={{color: 'var(--text-muted)'}}>لا توجد بيانات</span>}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-input)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '12px' }}>
                  <CheckCircle size={20} /> النتيجة النهائية للجلسة
                </label>
                {isEditing ? (
                  <select 
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '1rem', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                  >
                    <option value="">-- اختر النتيجة --</option>
                    <option value="استمرار دون تعديل">استمرار دون تعديل</option>
                    <option value="تعديل شروط العقد">تعديل شروط العقد</option>
                    <option value="إعارة">إعارة</option>
                    <option value="فسخ بالتراضي">فسخ بالتراضي</option>
                    <option value="لم يتم الاتفاق">لم يتم الاتفاق (مفتوح)</option>
                  </select>
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>
                    {outcome || <span style={{color: 'var(--text-muted)'}}>لم يتم تحديد نتيجة</span>}
                  </div>
                )}
              </div>

              <div className="eval-responsive-grid-2" style={{ pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.8 }}>
                <ToggleSwitch 
                  checked={requiresOfficialAvenant} 
                  onChange={setRequiresOfficialAvenant} 
                  label="يتطلب إرسال ملحق رسمي (Avenant)" 
                  activeColor="var(--accent)" 
                />
                <ToggleSwitch 
                  checked={playerSignature} 
                  onChange={setPlayerSignature} 
                  label="تم إمضاء المحضر من طرف اللاعب" 
                  activeColor="var(--accent)" 
                />
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '30px', borderTop: '2px dashed var(--border)', paddingBottom: '20px' }}>
                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '60px', fontSize: '1.1rem' }}>إمضاء الإدارة</h4>
                    <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto' }}></div>
                  </div>
                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '60px', fontSize: '1.1rem' }}>إمضاء اللاعب</h4>
                    <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto' }}></div>
                    {playerSignature && <div style={{ color: 'var(--accent)', marginTop: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>✓ مسجل بالإمضاء</div>}
                  </div>
                </div>
              )}


            </div>
          )}
        </div>

        {isEditing && (
          <div className="eval-footer" style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', background: 'var(--card-bg)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            {review && (
              <button className="eval-btn-cancel" onClick={() => setIsEditing(false)} style={{ padding: '12px 28px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--card-bg)'}>إلغاء التعديل</button>
            )}
            <button className="eval-btn-save" onClick={handleSave} disabled={loading || saving} style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : (review ? 'حفظ التعديلات' : 'حفظ المراجعة التعاقدية')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

