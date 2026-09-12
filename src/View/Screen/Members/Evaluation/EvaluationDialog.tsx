import React, { useState } from 'react';
import { X, Save, ClipboardList, ShieldAlert, CheckCircle2, RefreshCw, BarChart2, MessageSquare, Target, Calendar, ArrowRight } from 'lucide-react';
import { CustomInput } from '../../../widget/CustomInput';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import './Evaluation.css';

interface EvaluationDialogProps {
  player: any; // We can use proper type later
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const EvaluationDialog: React.FC<EvaluationDialogProps> = ({ player, initialData, onClose, onSave }) => {
  const [season, setSeason] = useState(initialData?.season || '2024-2025');
  const [period, setPeriod] = useState(initialData?.period || 'مرحلة الذهاب');
  const [fromDate, setFromDate] = useState(initialData?.fromDate || '');
  const [toDate, setToDate] = useState(initialData?.toDate || '');
  
  // Evaluation Scores
  const [discipline, setDiscipline] = useState(initialData?.scores?.discipline ?? 5); // max 10
  const [physical, setPhysical] = useState(initialData?.scores?.physical ?? 8); // max 15
  const [technical, setTechnical] = useState(initialData?.scores?.technical ?? 10); // max 20
  const [tactical, setTactical] = useState(initialData?.scores?.tactical ?? 8); // max 15
  const [matchOutput, setMatchOutput] = useState(initialData?.scores?.matchOutput ?? 10); // max 20
  const [instructions, setInstructions] = useState(initialData?.scores?.instructions ?? 5); // max 10
  const [behavior, setBehavior] = useState(initialData?.scores?.behavior ?? 5); // max 10
  
  // Notes & Recs
  const [strengths, setStrengths] = useState(initialData?.strengths || '');
  const [weaknesses, setWeaknesses] = useState(initialData?.weaknesses || '');
  const [recommendation, setRecommendation] = useState(initialData?.recommendation || 'استمرار عادي');

  const totalScore = discipline + physical + technical + tactical + matchOutput + instructions + behavior;
  
  const getScoreClassification = (score: number) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'acceptable';
    return 'weak';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'ممتاز';
    if (score >= 70) return 'جيد';
    if (score >= 55) return 'مقبول';
    return 'ضعيف';
  };

  const scoreClass = getScoreClassification(totalScore);

  const handleSave = () => {
    const evaluationData = {
      playerId: player.id,
      season,
      period,
      fromDate,
      toDate,
      scores: {
        discipline,
        physical,
        technical,
        tactical,
        matchOutput,
        instructions,
        behavior
      },
      totalScore,
      classification: scoreClass,
      strengths,
      weaknesses,
      recommendation
    };
    onSave(evaluationData);
  };

  const getSliderClass = (val: number, max: number) => {
    const percentage = (val / max) * 100;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 55) return 'acceptable';
    return 'weak';
  };

  const renderSlider = (label: string, value: number, max: number, setter: (val: number) => void) => {
    const sliderClass = getSliderClass(value, max);
    const percentage = (value / max) * 100;
    
    return (
      <div className="eval-slider-group">
        <div className="eval-slider-header">
          <span className="eval-slider-label">{label} (/{max})</span>
          <span className={`eval-slider-value text-${sliderClass}`}>{value}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={max} 
          value={value}
          onChange={(e) => setter(parseInt(e.target.value))}
          className={`custom-range bg-${sliderClass} range-${sliderClass}`}
          style={{ '--val': `${percentage}%` } as any}
        />
      </div>
    );
  };

  const recOptions = [
    { id: 'استمرار عادي', label: 'استمرار عادي', icon: <CheckCircle2 size={16} /> },
    { id: 'برنامج تحسين', label: 'برنامج تحسين', icon: <BarChart2 size={16} /> },
    { id: 'متابعة خاصة', label: 'متابعة خاصة', icon: <Target size={16} /> },
    { id: 'إعادة تقييم بعد مدة محددة', label: 'إعادة تقييم بعد مدة محددة', icon: <RefreshCw size={16} /> },
    { id: 'تقييم شامل عند نهاية الذهاب', label: 'تقييم شامل عند نهاية الذهاب', icon: <ClipboardList size={16} /> },
    { id: 'مراجعة الوضعية الرياضية/التعاقدية', label: 'مراجعة الوضعية الرياضية/التعاقدية', icon: <ShieldAlert size={16} /> },
  ];

  return (
    <div className="eval-dialog-overlay" style={{ zIndex: 11000 }}>
      <div className="eval-dialog">
        {/* Header - App Bar style */}
        <div className="eval-header app-bar-header" style={{ padding: 0 }}>
          <div className="app-bar-inner" style={{ padding: '24px 32px' }}>
            <button className="mobile-back-btn" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <ArrowRight size={24} />
            </button>
            <div className="desktop-icon-container" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '16px', color: 'var(--accent)' }}>
              <ClipboardList size={28} />
            </div>
            <div className="app-bar-titles">
              <h2 className="eval-main-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '0.5px' }}>
                <span className="desktop-title">تقييم فني وبدني: {player.nom} {player.prenom}</span>
                <span className="mobile-title">التقييم</span>
              </h2>
            </div>
            <button className="desktop-close-btn" onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'background 0.2s' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="eval-body">
          <div className="eval-main">
            <div className="eval-meta-card">
              <div className="meta-card-header">
                <Calendar size={18} />
                <span>إعدادات فترة التقييم</span>
              </div>
              <div className="eval-meta-grid">
                <CustomInput
                  label="الموسم الرياضي"
                  placeholder="مثال: 2024-2025"
                  value={season}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    // Allow only digits and hyphen, max length 9
                    if (/^[\d-]{0,9}$/.test(val)) {
                      setSeason(val);
                    }
                  }}
                  error={season && !/^\d{4}-\d{4}$/.test(season) ? "يرجى كتابة الموسم بصيغة YYYY-YYYY" : null}
                />
                <CustomDropdown
                  label="نوع التقييم"
                  options={[
                    { value: 'مرحلة الذهاب', label: 'مرحلة الذهاب' },
                    { value: 'مرحلة الإياب', label: 'مرحلة الإياب' },
                    { value: 'شهري', label: 'شهري' },
                    { value: 'نهاية الموسم', label: 'نهاية الموسم' }
                  ]}
                  value={period}
                  onChange={setPeriod}
                />
                {period === 'شهري' && (
                  <CustomInput type="month" label="الشهر المعني" value={fromDate ? fromDate.substring(0, 7) : ''} onChange={(e: any) => { setFromDate(e.target.value + '-01'); setToDate(e.target.value + '-28'); }} className="eval-input" />
                )}
              </div>
            </div>

            <div className="eval-sliders-container">
              <h3 className="eval-section-title">محاور التقييم والتنقيط</h3>
              <div className="eval-sliders-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {renderSlider('الانضباط والحضور', discipline, 10, setDiscipline)}
                  {renderSlider('الجاهزية البدنية', physical, 15, setPhysical)}
                  {renderSlider('المستوى الفني', technical, 20, setTechnical)}
                  {renderSlider('الأداء التكتيكي', tactical, 15, setTactical)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {renderSlider('المردودية في المباريات', matchOutput, 20, setMatchOutput)}
                  {renderSlider('تنفيذ تعليمات الطاقم الفني', instructions, 10, setInstructions)}
                  {renderSlider('السلوك وروح المجموعة', behavior, 10, setBehavior)}
                </div>
              </div>
            </div>

            <div className="eval-notes-grid">
              <div className="eval-textarea-wrap strengths-wrap">
                <label><CheckCircle2 size={20} /> أبرز نقاط القوة</label>
                <textarea 
                  className="eval-textarea textarea-strengths" 
                  placeholder="سجل هنا المهارات والإيجابيات التي تميز بها اللاعب..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                />
              </div>
              <div className="eval-textarea-wrap weaknesses-wrap">
                <label><MessageSquare size={20} /> النقائص والملاحظات</label>
                <textarea 
                  className="eval-textarea textarea-weaknesses" 
                  placeholder="سجل هنا الجوانب التي تحتاج إلى تحسين وتطوير..."
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="eval-sidebar">
            <div className="eval-score-widget">
              <div className="score-circle">
                <svg width="100%" height="100%" viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle className="score-circle-bg" cx="80" cy="80" r="70" />
                  <circle 
                    className={`score-circle-progress stroke-${scoreClass}`} 
                    cx="80" cy="80" r="70" 
                    style={{ strokeDasharray: 440, strokeDashoffset: 440 - (440 * totalScore) / 100 }}
                  />
                </svg>
                <div className="score-text">
                  <span className={`score-value text-${scoreClass}`}>{totalScore}</span>
                  <span className="score-total">من 100</span>
                </div>
              </div>
              
              <div className={`score-badge ${scoreClass}`}>
                {getScoreLabel(totalScore)}
              </div>
            </div>

            <div>
              <h3 className="eval-section-title" style={{ marginTop: '16px' }}>التوصية والإجراء</h3>
              <div className="eval-recommendations">
                {recOptions.map(opt => (
                  <div 
                    key={opt.id}
                    className={`recommendation-card ${recommendation === opt.id ? 'selected' : ''}`}
                    onClick={() => setRecommendation(opt.id)}
                  >
                    <div className="rec-icon">{opt.icon}</div>
                    <span className="rec-text">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="eval-footer">
          <button className="eval-btn eval-btn-cancel" onClick={onClose}>
            إلغاء
          </button>
          <button className="eval-btn eval-btn-save" onClick={handleSave}>
            <Save size={18} />
            حفظ التقييم
          </button>
        </div>
      </div>
    </div>
  );
};
