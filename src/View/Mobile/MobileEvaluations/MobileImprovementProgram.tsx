import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Save, Calendar, Activity, ClipboardList, Target, CheckSquare } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileToggle } from './EvaluationWidgets';
import { ImprovementProgramData, type ImprovementProgramRecord } from '../../Screen/Members/Evaluation/improvement_program_data';
import type { EvaluationRecord } from '../../Screen/Members/Evaluation/evaluation_data';
import type { MemberModel } from '../../Screen/Members/member_model';
import './MobileEvaluations.css';

interface MobileImprovementProgramProps {
  player: MemberModel;
  evaluation: EvaluationRecord;
  onClose: () => void;
}

const dateOnly = (value?: string) => (value ? value.split('T')[0] : '');

// Improvement programme linked to one evaluation: view mode, edit mode, save and delete
export const MobileImprovementProgram: React.FC<MobileImprovementProgramProps> = ({ player, evaluation, onClose }) => {
  const dataService = useMemo(() => new ImprovementProgramData(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<ImprovementProgramRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [programStart, setProgramStart] = useState('');
  const [programEnd, setProgramEnd] = useState('');
  const [nextEvalDate, setNextEvalDate] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [specificGoals, setSpecificGoals] = useState('');
  const [actionsRequired, setActionsRequired] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const fillFrom = (p: ImprovementProgramRecord) => {
    setProgramStart(dateOnly(p.program_start));
    setProgramEnd(dateOnly(p.program_end));
    setNextEvalDate(dateOnly(p.next_evaluation_date));
    setAreasToImprove(p.areas_to_improve || '');
    setSpecificGoals(p.specific_goals || '');
    setActionsRequired(p.actions_required || '');
    setIsAcknowledged(!!p.is_acknowledged);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const existing = await dataService.getProgramByEvaluation(evaluation.id);
      if (existing) {
        setProgram(existing);
        fillFrom(existing);
        setIsEditing(false);
      } else {
        // New programme: start today, prefill the weaknesses from the evaluation
        setProgramStart(new Date().toISOString().split('T')[0]);
        setAreasToImprove(evaluation.weaknesses || '');
        setIsEditing(true);
      }
      setLoading(false);
    };
    load();
  }, [dataService, evaluation.id, evaluation.weaknesses]);

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
        is_acknowledged: isAcknowledged,
      };
      const saved = program?.id
        ? await dataService.updateProgram({ ...payload, id: program.id })
        : await dataService.saveProgram(payload);
      if (saved) setProgram(saved);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!program?.id) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setSaving(true);
    try {
      if (await dataService.deleteProgram(program.id)) onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (program) fillFrom(program);
    setIsEditing(false);
  };

  const textBlocks = [
    { label: 'الجوانب المطلوب تحسينها', icon: ClipboardList, value: areasToImprove, set: setAreasToImprove },
    { label: 'الأهداف المحددة', icon: Target, value: specificGoals, set: setSpecificGoals },
    { label: 'الإجراءات المطلوبة (العمل)', icon: CheckSquare, value: actionsRequired, set: setActionsRequired },
  ];

  const dates = [
    { label: 'تاريخ البداية', icon: Calendar, value: programStart, set: setProgramStart },
    { label: 'تاريخ النهاية', icon: Calendar, value: programEnd, set: setProgramEnd },
    { label: 'موعد إعادة التقييم', icon: Activity, value: nextEvalDate, set: setNextEvalDate },
  ];

  return (
    <MobileScreen
      title="برنامج التحسين"
      onBack={onClose}
      layer={3}
      footer={!loading && (isEditing ? (
        <>
          {program && <button type="button" className="me-btn" onClick={cancelEdit}>إلغاء</button>}
          <button type="button" className="me-btn primary" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : program ? 'حفظ التعديلات' : 'حفظ البرنامج'}
          </button>
        </>
      ) : (
        <>
          {program && (
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
        <MobileLoader text="جاري تحميل البرنامج..." />
      ) : (
        <>
          <section className="me-card">
            <h3 className="me-section-title"><span><Calendar size={16} /></span>مدة البرنامج</h3>
            {isEditing ? (
              dates.map(d => (
                <label key={d.label} className="me-field">
                  <span className="me-label"><d.icon size={14} /> {d.label}</span>
                  <input className="me-input" type="date" dir="ltr" value={d.value} onChange={e => d.set(e.target.value)} />
                </label>
              ))
            ) : (
              <div className="me-dates">
                {dates.map((d, i) => (
                  <div key={d.label} className="me-date-tile" style={i === 2 ? { gridColumn: '1 / -1' } : undefined}>
                    <span><d.icon size={13} /> {d.label}</span>
                    <strong dir="ltr" style={{ textAlign: 'right' }}>{d.value || '—'}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          {textBlocks.map(b => (
            <section key={b.label} className="me-card">
              <h3 className="me-section-title"><span><b.icon size={16} /></span>{b.label}</h3>
              {isEditing ? (
                <textarea className="me-textarea" value={b.value} onChange={e => b.set(e.target.value)} placeholder="أضف التفاصيل هنا..." />
              ) : (
                <p className={`me-text ${b.value ? '' : 'empty'}`}>{b.value || 'لا توجد بيانات'}</p>
              )}
            </section>
          ))}

          <MobileToggle
            checked={isAcknowledged}
            onChange={setIsAcknowledged}
            label="تم إطلاع اللاعب على البرنامج وموافقته"
            disabled={!isEditing}
          />

          {!isEditing && (
            <div className="me-signatures">
              <div className="me-signature">إمضاء المدرب<i /></div>
              <div className={`me-signature ${isAcknowledged ? 'done' : ''}`}>
                إمضاء اللاعب<i />
                {isAcknowledged && <span>✓ تم الإطلاع والموافقة</span>}
              </div>
            </div>
          )}
        </>
      )}
    </MobileScreen>
  );
};
