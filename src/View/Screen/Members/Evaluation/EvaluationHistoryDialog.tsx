import React, { useState } from 'react';
import { X, TrendingUp, Calendar, AlertCircle, Edit2, Trash2, Check, Star, Eye, Target, Handshake, ArrowRight } from 'lucide-react';
import type { MemberModel } from '../member_model';
import type { EvaluationRecord } from './evaluation_data';
import { ViewEvaluationDialog } from './ViewEvaluationDialog';
import { ImprovementProgramDialog } from './ImprovementProgramDialog';
import { ContractReviewDialog } from './ContractReviewDialog';
import './EvaluationHistory.css';
import './Evaluation.css';

interface EvaluationHistoryDialogProps {
  player: MemberModel;
  evaluations: EvaluationRecord[];
  onClose: () => void;
  onAddTest?: () => void;
  onEdit?: (evaluation: EvaluationRecord) => void;
  onDelete?: (id: string) => void;
}

export const EvaluationHistoryDialog: React.FC<EvaluationHistoryDialogProps> = ({ 
  player, 
  evaluations, 
  onClose,
  onEdit,
  onDelete
}) => {
  const [viewingEvaluation, setViewingEvaluation] = useState<EvaluationRecord | null>(null);
  const [improvementProgramFor, setImprovementProgramFor] = useState<EvaluationRecord | null>(null);
  const [contractReviewFor, setContractReviewFor] = useState<EvaluationRecord | null>(null);

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  const getScoreBadgeLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'مقبول';
    return 'ضعيف';
  };

  const startEdit = (ev: EvaluationRecord) => {
    if (onEdit) onEdit(ev);
  };

  return (
    <div className="eval-dialog-overlay" onClick={onClose}>
      <div className="eval-history-dialog" onClick={e => e.stopPropagation()}>
        <div className="view-eval-title-bar app-bar-header">
          <div className="app-bar-inner">
            <button className="mobile-back-btn" onClick={onClose}>
              <ArrowRight size={24} />
            </button>
            <div className="desktop-icon-container" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '16px', color: 'var(--accent)' }}>
              <TrendingUp size={28} />
            </div>
            <div className="app-bar-titles">
              <h2 className="eval-main-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '0.5px' }}>
                <span className="desktop-title">أرشيف تقييمات اللاعب</span>
                <span className="mobile-title">التقييمات</span>
              </h2>
              <p className="eval-main-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>اللاعب: {player.first_name} {player.last_name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="desktop-close-btn" onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'background 0.2s' }}>
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="eval-history-body">
          {evaluations.length === 0 ? (
            <div className="eval-empty-state">
              <AlertCircle size={48} className="text-muted" />
              <h3>لا توجد تقييمات سابقة</h3>
              <p>هذا اللاعب لم يحصل على أي تقييم مسجل في النظام حتى الآن.</p>
            </div>
          ) : (
            <div className="eval-cards-grid">
              {evaluations.map((ev) => (
                <div key={ev.id} className="eval-history-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="eval-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div className="eval-date" style={{ margin: 0 }}>
                        <Calendar size={14} />
                        <span style={{ paddingTop: '2px' }}>{ev.evalDate}</span>
                      </div>
                      <div className="eval-card-meta" style={{ margin: 0 }}>
                        <span className="eval-season-badge">{ev.season}</span>
                        <span className="eval-period-badge">{ev.period}</span>
                      </div>
                    </div>
                  </div>
                  
                    <div className="eval-card-body">
                      <div className="eval-score-ring-container">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path className={`circle stroke-${getScoreBadgeClass(ev.totalScore)}`}
                            strokeDasharray={`${ev.totalScore}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className={`percentage text-${getScoreBadgeClass(ev.totalScore)}`}>
                            {ev.totalScore}
                          </text>
                        </svg>
                      </div>
                      
                        <div className={`eval-status-badge ${getScoreBadgeClass(ev.totalScore)}`}>
                          {getScoreBadgeLabel(ev.totalScore)}
                        </div>
                      
                      <div className="eval-details-grid">
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">الانضباط والحضور</span>
                        <span className="eval-detail-value">{ev.scores.discipline || 0} / 10</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">الجاهزية البدنية</span>
                        <span className="eval-detail-value">{ev.scores.physical || 0} / 15</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">المستوى الفني</span>
                        <span className="eval-detail-value">{ev.scores.technical || 0} / 20</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">الأداء التكتيكي</span>
                        <span className="eval-detail-value">{ev.scores.tactical || 0} / 15</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">المردودية في المباريات</span>
                        <span className="eval-detail-value">{ev.scores.matchOutput || 0} / 20</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">تنفيذ تعليمات الطاقم الفني</span>
                        <span className="eval-detail-value">{ev.scores.instructions || 0} / 10</span>
                      </div>
                      <div className="eval-detail-item">
                        <span className="eval-detail-label">السلوك</span>
                        <span className="eval-detail-value">{ev.scores.behavior || 0} / 10</span>
                      </div>
                      </div>
                    </div>
                    
                    {/* Action Bar at the bottom of the card */}
                    <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', marginTop: 'auto', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setViewingEvaluation(ev)} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', border: 'none', cursor: 'pointer', color: '#3b82f6', minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="عرض التقييم">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => setImprovementProgramFor(ev)} style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: 'none', cursor: 'pointer', color: '#f59e0b', minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="برنامج التحسين">
                        <Target size={18} />
                      </button>
                      <button onClick={() => setContractReviewFor(ev)} style={{ flex: 1, background: 'rgba(139, 92, 246, 0.1)', border: 'none', cursor: 'pointer', color: '#8b5cf6', minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="المراجعة التعاقدية">
                        <Handshake size={18} />
                      </button>
                      <button onClick={() => startEdit(ev)} style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: 'none', cursor: 'pointer', color: '#10b981', minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="تعديل">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDelete && onDelete(ev.id)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: '#ef4444', minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="حذف">
                        <Trash2 size={18} />
                      </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {viewingEvaluation && (
        <ViewEvaluationDialog
          player={player}
          evaluation={viewingEvaluation}
          onClose={() => setViewingEvaluation(null)}
          onDelete={onDelete}
        />
      )}
      {improvementProgramFor && (
        <ImprovementProgramDialog
          player={player}
          evaluation={improvementProgramFor}
          onClose={() => setImprovementProgramFor(null)}
        />
      )}
      {contractReviewFor && (
        <ContractReviewDialog
          player={player}
          evaluation={contractReviewFor}
          onClose={() => setContractReviewFor(null)}
        />
      )}
    </div>
  );
};
