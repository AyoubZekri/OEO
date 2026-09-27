import React from 'react';
import { Calendar, Activity, Target, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { ScoreRing } from './EvaluationWidgets';
import { CRITERIA, GRADE_LABELS, gradeOf } from './evaluationShared';
import type { EvaluationRecord } from '../../Screen/Members/Evaluation/evaluation_data';
import './MobileEvaluations.css';

interface MobileEvaluationReportProps {
  evaluation: EvaluationRecord;
  onClose: () => void;
}

// Full evaluation report (read only; the actions live in the card's ⋮ menu)
export const MobileEvaluationReport: React.FC<MobileEvaluationReportProps> = ({ evaluation, onClose }) => {
  const total = evaluation.totalScore || 0;
  const grade = gradeOf(total);

  return (
    <MobileScreen
      title="تقرير التقييم"
      onBack={onClose}
      layer={2}
    >
      <section className={`me-card grade-${grade}`} style={{ alignItems: 'center', textAlign: 'center' }}>
        <ScoreRing score={total} size={132} stroke={8} showLabel />
        <span className="me-grade">مستوى: {GRADE_LABELS[grade]}</span>
        <div className="me-chips" style={{ justifyContent: 'center' }}>
          <span className="me-chip"><Calendar size={13} /> {evaluation.season || '—'}</span>
          <span className="me-chip"><Activity size={13} /> {evaluation.period || '—'}</span>
          {evaluation.evalDate && <span className="me-chip">{evaluation.evalDate}</span>}
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><Target size={16} /></span>التنقيط التفصيلي للمحاور</h3>
        <div className="me-bars">
          {CRITERIA.map(({ key, label, max, icon: Icon }) => {
            const value = evaluation.scores?.[key] || 0;
            const percent = (value / max) * 100;
            return (
              <div key={key} className={`grade-${gradeOf(percent)}`}>
                <div className="me-bar-head">
                  <span><Icon size={16} />{label}</span>
                  <span dir="ltr" className="me-bar-score"><strong>{value}</strong><small>/{max}</small></span>
                </div>
                <div className="me-bar-track"><div className="me-bar-fill" style={{ width: `${percent}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title" style={{ color: 'var(--me-excellent)' }}>
          <span style={{ background: 'color-mix(in srgb, var(--me-excellent) 15%, transparent)', color: 'var(--me-excellent)' }}><CheckCircle2 size={16} /></span>
          أبرز نقاط القوة
        </h3>
        <p className={`me-text ${evaluation.strengths ? '' : 'empty'}`}>{evaluation.strengths || 'لم يتم تسجيل نقاط قوة'}</p>

        <h3 className="me-section-title" style={{ color: 'var(--me-weak)', marginTop: 4 }}>
          <span style={{ background: 'color-mix(in srgb, var(--me-weak) 15%, transparent)', color: 'var(--me-weak)' }}><AlertTriangle size={16} /></span>
          النقائص والملاحظات
        </h3>
        <p className={`me-text ${evaluation.weaknesses ? '' : 'empty'}`}>{evaluation.weaknesses || 'لم يتم تسجيل أي نقائص'}</p>
      </section>

      <section className="me-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(249, 115, 22, 0.14)', color: 'var(--ms-accent)' }}>
          <Trophy size={24} />
        </span>
        <div>
          <div className="me-label">التوصية والقرار الفني</div>
          <strong style={{ fontSize: '1.05rem' }}>{evaluation.recommendation || 'استمرار عادي'}</strong>
        </div>
      </section>
    </MobileScreen>
  );
};
