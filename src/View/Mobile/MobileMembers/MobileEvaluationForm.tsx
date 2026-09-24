import React, { useState } from 'react';
import {
  ArrowRight, Save, Calendar, SlidersHorizontal, CheckCircle2, MessageSquare, Flag,
  BarChart2, Target, RefreshCw, ClipboardList, ShieldAlert, Minus, Plus,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import type { MemberModel } from '../../Screen/Members/member_model';
import './MobileEvaluationForm.css';

interface EvaluationScores {
  discipline: number;
  physical: number;
  technical: number;
  tactical: number;
  matchOutput: number;
  instructions: number;
  behavior: number;
}

interface EvaluationFormData {
  playerId?: string;
  season: string;
  period: string;
  fromDate: string;
  toDate: string;
  scores: EvaluationScores;
  totalScore: number;
  classification: string;
  strengths: string;
  weaknesses: string;
  recommendation: string;
}

interface MobileEvaluationFormProps {
  player: MemberModel;
  initialData?: Partial<EvaluationFormData>;
  onClose: () => void;
  onSave: (data: EvaluationFormData) => void;
}

// Same axes, maximums and defaults as the desktop EvaluationDialog
const CRITERIA: { key: keyof EvaluationScores; label: string; max: number; initial: number }[] = [
  { key: 'discipline', label: 'الانضباط والحضور', max: 10, initial: 5 },
  { key: 'physical', label: 'الجاهزية البدنية', max: 15, initial: 8 },
  { key: 'technical', label: 'المستوى الفني', max: 20, initial: 10 },
  { key: 'tactical', label: 'الأداء التكتيكي', max: 15, initial: 8 },
  { key: 'matchOutput', label: 'المردودية في المباريات', max: 20, initial: 10 },
  { key: 'instructions', label: 'تنفيذ تعليمات الطاقم الفني', max: 10, initial: 5 },
  { key: 'behavior', label: 'السلوك وروح المجموعة', max: 10, initial: 5 },
];

const PERIODS = ['مرحلة الذهاب', 'مرحلة الإياب', 'شهري', 'نهاية الموسم'];

const RECOMMENDATIONS = [
  { id: 'استمرار عادي', icon: CheckCircle2 },
  { id: 'برنامج تحسين', icon: BarChart2 },
  { id: 'متابعة خاصة', icon: Target },
  { id: 'إعادة تقييم بعد مدة محددة', icon: RefreshCw },
  { id: 'تقييم شامل عند نهاية الذهاب', icon: ClipboardList },
  { id: 'مراجعة الوضعية الرياضية/التعاقدية', icon: ShieldAlert },
];

const classify = (percent: number) =>
  percent >= 85 ? 'excellent' : percent >= 70 ? 'good' : percent >= 55 ? 'acceptable' : 'weak';

const CLASS_LABELS: Record<string, string> = {
  excellent: 'ممتاز',
  good: 'جيد',
  acceptable: 'مقبول',
  weak: 'ضعيف',
};

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export const MobileEvaluationForm: React.FC<MobileEvaluationFormProps> = ({ player, initialData, onClose, onSave }) => {
  const [season, setSeason] = useState(initialData?.season || '2024-2025');
  const [period, setPeriod] = useState(initialData?.period || 'مرحلة الذهاب');
  const [fromDate, setFromDate] = useState(initialData?.fromDate || '');
  const [toDate, setToDate] = useState(initialData?.toDate || '');
  const [scores, setScores] = useState<EvaluationScores>(() => {
    const initial = {} as EvaluationScores;
    CRITERIA.forEach(c => { initial[c.key] = initialData?.scores?.[c.key] ?? c.initial; });
    return initial;
  });
  const [strengths, setStrengths] = useState(initialData?.strengths || '');
  const [weaknesses, setWeaknesses] = useState(initialData?.weaknesses || '');
  const [recommendation, setRecommendation] = useState(initialData?.recommendation || 'استمرار عادي');

  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const scoreClass = classify(totalScore);
  const seasonInvalid = !!season && !/^\d{4}-\d{4}$/.test(season);

  const clamp = (max: number, value: number) => Math.min(max, Math.max(0, value));
  const setScore = (key: keyof EvaluationScores, max: number, value: number) =>
    setScores(prev => ({ ...prev, [key]: clamp(max, value) }));
  // Functional update so quick repeated taps each count
  const stepScore = (key: keyof EvaluationScores, max: number, delta: number) =>
    setScores(prev => ({ ...prev, [key]: clamp(max, prev[key] + delta) }));

  const handleSave = () => {
    onSave({
      playerId: player.id,
      season,
      period,
      fromDate,
      toDate,
      scores,
      totalScore,
      classification: scoreClass,
      strengths,
      weaknesses,
      recommendation,
    });
  };

  const photo = player.photo && !player.photo.includes('ui-avatars.com') ? player.photo : defaultAvatar;

  return (
    <div className="ev-screen" role="dialog" aria-modal="true" aria-label="تقييم اللاعب">
      <header className="ev-appbar">
        <button type="button" className="ev-back" onClick={onClose} aria-label="رجوع">
          <ArrowRight size={22} />
        </button>
        <h1>{initialData ? 'تعديل التقييم' : 'تقييم اللاعب'}</h1>
        <span className="ev-appbar-spacer" aria-hidden="true" />
      </header>

      <div className="ev-body">
        {/* Player + live score */}
        <section className={`ev-hero ${scoreClass}`}>
          <div className="ev-player">
            <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
            <div>
              <strong>{player.first_name} {player.last_name}</strong>
              <span>{season} · {period}</span>
            </div>
          </div>
          <div className="ev-ring" aria-label={`المجموع ${totalScore} من 100`}>
            <svg viewBox="0 0 110 110">
              <circle className="ev-ring-bg" cx="55" cy="55" r={RING_RADIUS} />
              <circle
                className="ev-ring-value"
                cx="55" cy="55" r={RING_RADIUS}
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH - (RING_LENGTH * totalScore) / 100}
              />
            </svg>
            <div className="ev-ring-text">
              <strong>{totalScore}</strong>
              <span>من 100</span>
            </div>
          </div>
          <span className="ev-grade">{CLASS_LABELS[scoreClass]}</span>
        </section>

        {/* Period */}
        <section className="ev-section">
          <h3 className="ev-section-title"><span><Calendar size={16} /></span>فترة التقييم</h3>
          <label className="ev-field">
            <span className="ev-label">الموسم الرياضي</span>
            <input
              className={`ev-input ${seasonInvalid ? 'invalid' : ''}`}
              value={season}
              inputMode="numeric"
              placeholder="2024-2025"
              dir="ltr"
              onChange={e => { if (/^[\d-]{0,9}$/.test(e.target.value)) setSeason(e.target.value); }}
            />
            {seasonInvalid && <small className="ev-error">اكتب الموسم بصيغة 2024-2025</small>}
          </label>
          <div className="ev-field">
            <span className="ev-label">نوع التقييم</span>
            <div className="ev-choices">
              {PERIODS.map(p => (
                <button key={p} type="button" className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          {period === 'شهري' && (
            <label className="ev-field">
              <span className="ev-label">الشهر المعني</span>
              <input
                className="ev-input"
                type="month"
                dir="ltr"
                value={fromDate ? fromDate.substring(0, 7) : ''}
                onChange={e => { setFromDate(`${e.target.value}-01`); setToDate(`${e.target.value}-28`); }}
              />
            </label>
          )}
        </section>

        {/* Scores */}
        <section className="ev-section">
          <h3 className="ev-section-title"><span><SlidersHorizontal size={16} /></span>محاور التقييم والتنقيط</h3>
          <div className="ev-criteria">
            {CRITERIA.map(c => {
              const value = scores[c.key];
              const percent = (value / c.max) * 100;
              return (
                <div key={c.key} className={`ev-criterion ${classify(percent)}`}>
                  <div className="ev-criterion-head">
                    <span>{c.label}</span>
                    <strong>{value}<small>/{c.max}</small></strong>
                  </div>
                  <div className="ev-criterion-control">
                    <button type="button" onClick={() => stepScore(c.key, c.max, -1)} aria-label={`إنقاص ${c.label}`}><Minus size={16} /></button>
                    <input
                      type="range"
                      min={0}
                      max={c.max}
                      value={value}
                      onChange={e => setScore(c.key, c.max, Number(e.target.value))}
                      style={{ '--ev-fill': `${percent}%` } as React.CSSProperties}
                      aria-label={c.label}
                    />
                    <button type="button" onClick={() => stepScore(c.key, c.max, 1)} aria-label={`زيادة ${c.label}`}><Plus size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section className="ev-section">
          <h3 className="ev-section-title"><span><MessageSquare size={16} /></span>الملاحظات</h3>
          <label className="ev-field ev-note strengths">
            <span className="ev-label"><CheckCircle2 size={15} /> أبرز نقاط القوة</span>
            <textarea value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="المهارات والإيجابيات التي تميز بها اللاعب..." rows={3} />
          </label>
          <label className="ev-field ev-note weaknesses">
            <span className="ev-label"><MessageSquare size={15} /> النقائص والملاحظات</span>
            <textarea value={weaknesses} onChange={e => setWeaknesses(e.target.value)} placeholder="الجوانب التي تحتاج إلى تحسين وتطوير..." rows={3} />
          </label>
        </section>

        {/* Recommendation */}
        <section className="ev-section">
          <h3 className="ev-section-title"><span><Flag size={16} /></span>التوصية والإجراء</h3>
          <div className="ev-recs" role="radiogroup" aria-label="التوصية">
            {RECOMMENDATIONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={recommendation === id}
                className={`ev-rec ${recommendation === id ? 'active' : ''}`}
                onClick={() => setRecommendation(id)}
              >
                <span className="ev-rec-icon"><Icon size={17} /></span>
                <span className="ev-rec-text">{id}</span>
                <span className="ev-rec-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="ev-footer">
        <button type="button" className="ev-save" onClick={handleSave} disabled={seasonInvalid}>
          <Save size={18} />
          حفظ التقييم
          <span className="ev-save-score">{totalScore}/100</span>
        </button>
      </footer>
    </div>
  );
};
