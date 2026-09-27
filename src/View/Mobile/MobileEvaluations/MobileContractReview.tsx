import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Save, Calendar, FileText, Building2, User, CheckCircle } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import type { MobileSelectOption } from '../widgets/MobileSelect';
import { MobileToggle } from './EvaluationWidgets';
import { ContractReviewData, type ContractReviewRecord } from '../../Screen/Members/Evaluation/contract_review_data';
import type { EvaluationRecord } from '../../Screen/Members/Evaluation/evaluation_data';
import type { MemberModel } from '../../Screen/Members/member_model';
import './MobileEvaluations.css';

interface MobileContractReviewProps {
  player: MemberModel;
  evaluation: EvaluationRecord;
  onClose: () => void;
}

// Same outcomes as the desktop dialog
const OUTCOME_OPTIONS: MobileSelectOption[] = [
  { value: '', label: 'لم تُحدد بعد' },
  { value: 'استمرار دون تعديل', label: 'استمرار دون تعديل' },
  { value: 'تعديل شروط العقد', label: 'تعديل شروط العقد' },
  { value: 'إعارة', label: 'إعارة' },
  { value: 'فسخ بالتراضي', label: 'فسخ بالتراضي' },
  { value: 'لم يتم الاتفاق', label: 'لم يتم الاتفاق (مفتوح)' },
];

// Contract review linked to one evaluation: view mode, edit mode, save and delete
export const MobileContractReview: React.FC<MobileContractReviewProps> = ({ player, evaluation, onClose }) => {
  const dataService = useMemo(() => new ContractReviewData(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<ContractReviewRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [meetingDate, setMeetingDate] = useState('');
  const [discussedTopics, setDiscussedTopics] = useState('');
  const [clubProposal, setClubProposal] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [outcome, setOutcome] = useState('');
  const [requiresOfficialAvenant, setRequiresOfficialAvenant] = useState(false);
  const [playerSignature, setPlayerSignature] = useState(false);

  const fillFrom = (r: ContractReviewRecord) => {
    setMeetingDate(r.meeting_date ? r.meeting_date.split('T')[0] : '');
    setDiscussedTopics(r.discussed_topics || '');
    setClubProposal(r.club_proposal || '');
    setPlayerPosition(r.player_position || '');
    setOutcome(r.outcome || '');
    setRequiresOfficialAvenant(!!r.requires_official_avenant);
    setPlayerSignature(!!r.player_signature);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const existing = await dataService.getReviewByEvaluation(evaluation.id);
      if (existing) {
        setReview(existing);
        fillFrom(existing);
        setIsEditing(false);
      } else {
        setMeetingDate(new Date().toISOString().split('T')[0]);
        setIsEditing(true);
      }
      setLoading(false);
    };
    load();
  }, [dataService, evaluation.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        evaluation_id: evaluation.id,
        player_id: Number(player.id),
        meeting_date: meetingDate,
        discussed_topics: discussedTopics,
        club_proposal: clubProposal,
        player_position: playerPosition,
        outcome,
        requires_official_avenant: requiresOfficialAvenant,
        player_signature: playerSignature,
      };
      const saved = review?.id
        ? await dataService.updateReview({ ...payload, id: review.id })
        : await dataService.saveReview(payload);
      if (saved) setReview(saved);
      setIsEditing(false);
    } catch (e) {
      console.error('Backend Error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!review?.id) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه المراجعة التعاقدية؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setSaving(true);
    try {
      if (await dataService.deleteReview(review.id)) onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (review) fillFrom(review);
    setIsEditing(false);
  };

  const textBlocks = [
    { label: 'المواضيع التي تمت مناقشتها', icon: FileText, value: discussedTopics, set: setDiscussedTopics, placeholder: 'مثال: المردودية خلال مرحلة الذهاب، الالتزام التكتيكي...' },
    { label: 'مقترح النادي', icon: Building2, value: clubProposal, set: setClubProposal, placeholder: 'مثال: تخفيض الراتب، إعارة...' },
    { label: 'موقف اللاعب', icon: User, value: playerPosition, set: setPlayerPosition, placeholder: 'موقف اللاعب ورأيه الشخصي...' },
  ];

  return (
    <MobileScreen
      title="المراجعة التعاقدية"
      onBack={onClose}
      layer={3}
      footer={!loading && (isEditing ? (
        <>
          {review && <button type="button" className="me-btn" onClick={cancelEdit}>إلغاء</button>}
          <button type="button" className="me-btn primary" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : review ? 'حفظ التعديلات' : 'حفظ المراجعة'}
          </button>
        </>
      ) : (
        <>
          {review && (
            <button type="button" className="me-btn danger" onClick={handleDelete} disabled={saving}>
              <Trash2 size={18} /> حذف
            </button>
          )}
          <button type="button" className="me-btn primary" onClick={() => setIsEditing(true)}>
            <Pencil size={18} /> تعديل
          </button>
        </>
      ))}
    >
      {loading ? (
        <MobileLoader text="جاري تحميل المراجعة..." />
      ) : (
        <>
          <section className="me-card">
            <h3 className="me-section-title"><span><Calendar size={16} /></span>الجلسة</h3>
            {isEditing ? (
              <>
                <label className="me-field">
                  <span className="me-label"><Calendar size={14} /> تاريخ الجلسة</span>
                  <input className="me-input" type="date" dir="ltr" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                </label>
                <MobileSelect
                  label="النتيجة النهائية للجلسة"
                  icon={CheckCircle}
                  value={outcome}
                  options={OUTCOME_OPTIONS}
                  onChange={setOutcome}
                  placeholder="اختر النتيجة"
                />
              </>
            ) : (
              <div className="me-dates">
                <div className="me-date-tile">
                  <span><Calendar size={13} /> تاريخ الجلسة</span>
                  <strong dir="ltr" style={{ textAlign: 'right' }}>{meetingDate || '—'}</strong>
                </div>
                <div className="me-date-tile">
                  <span><CheckCircle size={13} /> النتيجة</span>
                  <strong>{outcome || 'لم تُحدد'}</strong>
                </div>
              </div>
            )}
          </section>

          {textBlocks.map(b => (
            <section key={b.label} className="me-card">
              <h3 className="me-section-title"><span><b.icon size={16} /></span>{b.label}</h3>
              {isEditing ? (
                <textarea className="me-textarea" value={b.value} onChange={e => b.set(e.target.value)} placeholder={b.placeholder} />
              ) : (
                <p className={`me-text ${b.value ? '' : 'empty'}`}>{b.value || 'لا توجد بيانات'}</p>
              )}
            </section>
          ))}

          <MobileToggle checked={requiresOfficialAvenant} onChange={setRequiresOfficialAvenant} label="يتطلب إرسال ملحق رسمي (Avenant)" disabled={!isEditing} />
          <MobileToggle checked={playerSignature} onChange={setPlayerSignature} label="تم إمضاء المحضر من طرف اللاعب" disabled={!isEditing} />

          {!isEditing && (
            <div className="me-signatures">
              <div className="me-signature">إمضاء الإدارة<i /></div>
              <div className={`me-signature ${playerSignature ? 'done' : ''}`}>
                إمضاء اللاعب<i />
                {playerSignature && <span>✓ مسجل بالإمضاء</span>}
              </div>
            </div>
          )}
        </>
      )}
    </MobileScreen>
  );
};
