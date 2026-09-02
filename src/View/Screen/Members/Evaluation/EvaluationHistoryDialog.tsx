import React from 'react';
import { X, TrendingUp, Calendar, AlertCircle, Edit2, Trash2, Check, Star } from 'lucide-react';
import type { MemberModel } from '../member_model';
import type { EvaluationRecord } from './evaluation_data';
import './EvaluationHistory.css';

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
        <div className="eval-history-header">
          <div className="eval-history-title">
            <TrendingUp size={24} className="text-primary" />
            <h2>أرشيف تقييمات اللاعب: {player.first_name} {player.last_name}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="eval-close-btn" onClick={onClose} title="إغلاق">
              <X size={22} />
            </button>
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
                <div key={ev.id} className="eval-history-card">
                  <div className="eval-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div className="eval-date" style={{ margin: 0 }}>
                        <Calendar size={14} />
                        <span style={{ paddingTop: '2px' }}>{ev.evalDate}</span>
                      </div>
                      <div className="eval-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => startEdit(ev)} style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="تعديل">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete && onDelete(ev.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="eval-card-meta">
                      <span className="eval-season-badge">{ev.season}</span>
                      <span className="eval-period-badge">{ev.period}</span>
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
                        <span className="eval-detail-label">السلوك وروح المجموعة</span>
                        <span className="eval-detail-value">{ev.scores.behavior || 0} / 10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="eval-card-footer">
                      <>
                        <div className="eval-info-box success">
                          <div className="eval-info-title success"><Check size={14} /> نقاط القوة</div>
                          <p className="eval-info-text">{ev.strengths || 'لا توجد ملاحظات'}</p>
                        </div>
                        <div className="eval-info-box danger">
                          <div className="eval-info-title danger"><AlertCircle size={14} /> نقاط الضعف</div>
                          <p className="eval-info-text">{ev.weaknesses || 'لا توجد ملاحظات'}</p>
                        </div>
                        <div className="eval-info-box primary">
                          <div className="eval-info-title primary"><Star size={14} /> التوصية</div>
                          <p className="eval-info-text">{ev.recommendation || 'لا توجد توصية'}</p>
                        </div>
                      </>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
