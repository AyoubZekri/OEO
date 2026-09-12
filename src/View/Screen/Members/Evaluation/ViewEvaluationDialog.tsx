import React from 'react';
import { X, TrendingUp, CheckCircle2, AlertTriangle, Target, Activity, Calendar, ShieldCheck, Trophy, Brain, ArrowRight, Trash2 } from 'lucide-react';

interface ViewEvaluationDialogProps {
  player: any;
  evaluation: any;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const ViewEvaluationDialog: React.FC<ViewEvaluationDialogProps> = ({ player, evaluation, onClose, onDelete }) => {
  if (!evaluation) return null;

  // Helpers to get styling based on score percentage
  const getScoreColor = (val: number, max: number) => {
    const perc = (val / max) * 100;
    if (perc >= 85) return '#10b981'; // Green
    if (perc >= 70) return '#3b82f6'; // Blue
    if (perc >= 55) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreClassification = (score: number) => {
    if (score >= 85) return 'ممتاز';
    if (score >= 70) return 'جيد';
    if (score >= 55) return 'مقبول';
    return 'ضعيف';
  };

  const totalScoreClassColor = getScoreColor(evaluation.totalScore, 100);

  const ScoreBar = ({ label, value, max, icon: Icon }: { label: string, value: number, max: number, icon: any }) => {
    const color = getScoreColor(value, max);
    const perc = (value / max) * 100;
    return (
      <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', transition: 'all 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontWeight: '600' }}>
            <Icon size={18} style={{ color }} />
            {label}
          </div>
          <div style={{ fontWeight: 'bold', color, fontSize: '1.1rem' }}>
            {value} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {max}</span>
          </div>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${perc}%`, background: color, borderRadius: '4px', transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}></div>
        </div>
      </div>
    );
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
            <div className="desktop-icon-container">
              <TrendingUp size={28} />
            </div>
            <div className="app-bar-titles">
              <h2 className="eval-main-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '0.5px' }}>
                <span className="desktop-title">تقرير التقييم الشامل</span>
                <span className="mobile-title">التقييم</span>
              </h2>
              <p className="eval-main-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>عرض تفصيلي لأداء والمردودية الرياضية للاعب</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onDelete && (
                <button onClick={() => {
                  if (window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
                    onDelete(evaluation.id);
                    onClose();
                  }
                }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} title="حذف التقييم">
                  <Trash2 size={18} /> <span className="desktop-title">حذف</span>
                </button>
              )}
              <button className="desktop-close-btn" onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'background 0.2s' }}>
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="view-eval-dialog-body" style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Info Card */}
          <div className="view-eval-player-card" style={{ background: 'var(--bg-input)', padding: '24px 32px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '4px' }}>اسم اللاعب المعني بالتقييم</p>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.8rem', fontWeight: 'bold' }}>{player.first_name || player.nom} {player.last_name || player.prenom}</h3>
              </div>
              <div className="flex-wrap" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Calendar size={18} />
                  <span>الموسم الرياضي: <strong style={{ color: 'var(--text-color)' }}>{evaluation.season || '2024-2025'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Activity size={18} />
                  <span>فترة التقييم: <strong style={{ color: 'var(--text-color)' }}>{evaluation.period || 'مرحلة الذهاب'}</strong></span>
                </div>
              </div>
            </div>
            
            <div className="view-eval-score-divider" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: totalScoreClassColor, lineHeight: '1', fontFamily: 'system-ui' }}>
                {evaluation.totalScore || 0}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '4px' }}>المجموع من 100</div>
              <div style={{ marginTop: '12px', background: `${totalScoreClassColor}15`, color: totalScoreClassColor, padding: '8px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', border: `1px solid ${totalScoreClassColor}33` }}>
                مستوى: {getScoreClassification(evaluation.totalScore || 0)}
              </div>
            </div>
          </div>

          {/* Scores Section */}
          <div>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={22} color="var(--accent)" />
              التنقيط التفصيلي للمحاور
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <ScoreBar label="الانضباط والحضور" value={evaluation.scores?.discipline || 0} max={10} icon={ShieldCheck} />
              <ScoreBar label="الجاهزية البدنية" value={evaluation.scores?.physical || 0} max={15} icon={Activity} />
              <ScoreBar label="المستوى الفني" value={evaluation.scores?.technical || 0} max={20} icon={Trophy} />
              <ScoreBar label="الأداء التكتيكي" value={evaluation.scores?.tactical || 0} max={15} icon={Brain} />
              <ScoreBar label="المردودية في المباريات" value={evaluation.scores?.matchOutput || 0} max={20} icon={TrendingUp} />
              <ScoreBar label="تنفيذ التعليمات" value={evaluation.scores?.instructions || 0} max={10} icon={Target} />
              <ScoreBar label="السلوك وروح المجموعة" value={evaluation.scores?.behavior || 0} max={10} icon={CheckCircle2} />
            </div>
          </div>

          {/* Feedback Section */}
          <div className="view-eval-feedback-grid">
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px', borderRadius: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <CheckCircle2 size={22} /> أبرز نقاط القوة
              </h4>
              <p style={{ margin: 0, color: 'var(--text-color)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                {evaluation.strengths || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>لم يتم تسجيل نقاط قوة</span>}
              </p>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <AlertTriangle size={22} /> النقائص والملاحظات
              </h4>
              <p style={{ margin: 0, color: 'var(--text-color)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                {evaluation.weaknesses || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>لم يتم تسجيل أي نقائص</span>}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="view-eval-rec-box" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--border)', padding: '28px', borderRadius: '20px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--accent)' }}>
              <Trophy size={32} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                التوصية والقرار الفني النهائي
              </h4>
              <p style={{ margin: 0, color: 'var(--text-h)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                {evaluation.recommendation || 'استمرار عادي'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
