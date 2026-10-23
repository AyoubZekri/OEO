import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, CalendarDays, Inbox, Eye, Target, Handshake, Pencil, Trash2, Printer } from 'lucide-react';
import { PrintSheet } from '../../widget/PrintSheet';
import { PrintableEvaluation } from './Evaluation/Printable/PrintableEvaluation';
import type { MemberModel } from './member_model';
import type { ActionsMenuItem } from '../../widget/ActionsMenu';
import { MobileRowMenu } from '../../Mobile/widgets/MobileRowMenu';
import { ViewEvaluationDialog } from './Evaluation/ViewEvaluationDialog';
import { ImprovementProgramDialog } from './Evaluation/ImprovementProgramDialog';
import { ContractReviewDialog } from './Evaluation/ContractReviewDialog';
import { MobileImprovementProgram } from '../../Mobile/MobileEvaluations/MobileImprovementProgram';
import { MobileContractReview } from '../../Mobile/MobileEvaluations/MobileContractReview';
import { EvaluationsData, periodLabel, type EvaluationRecord } from './Evaluation/evaluation_data';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { ScoreRing } from '../../Mobile/MobileEvaluations/EvaluationWidgets';
import { GRADE_LABELS, gradeOf } from '../../Mobile/MobileEvaluations/evaluationShared';
import { MobileEvaluationReport } from '../../Mobile/MobileEvaluations/MobileEvaluationReport';
import '../../Mobile/MobileEvaluations/MobileEvaluations.css';
import '../../Mobile/MobileEvaluations/MobileEvaluationHistory.css';
import './Evaluation/EvaluationHistory.css';
import './Evaluation/Evaluation.css';
import './MemberEvaluationsPanel.css';

const evalsData = new EvaluationsData();

/** The seven axes and their maximum (same as the evaluation form) */
const AXES: { key: keyof EvaluationRecord['scores']; label: string; max: number }[] = [
  { key: 'discipline', label: 'الانضباط والحضور', max: 10 },
  { key: 'physical', label: 'الجاهزية البدنية', max: 15 },
  { key: 'technical', label: 'المستوى الفني', max: 20 },
  { key: 'tactical', label: 'الأداء التكتيكي', max: 15 },
  { key: 'matchOutput', label: 'المردودية في المباريات', max: 20 },
  { key: 'instructions', label: 'تنفيذ التعليمات', max: 10 },
  { key: 'behavior', label: 'السلوك', max: 10 },
];

/** The full history's grades (same thresholds and words) */
const badgeClass = (score: number) => (score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'poor');
const BADGE_LABEL: Record<string, string> = { excellent: 'ممتاز', good: 'جيد', average: 'مقبول', poor: 'ضعيف' };

/** The score's tone: low, middle, good */
const toneOf = (score: number) => (score >= 70 ? 'good' : score >= 50 ? 'mid' : 'low');

/**
 * A player's evaluations, inside the tracking record (adding one is in the member's menu):
 * the figures, then every evaluation with its own actions — view, print, improvement programme,
 * contractual review, edit, delete — all from here.
 * `refreshKey` changes when an evaluation was saved or deleted: the list is read again.
 */
export const MemberEvaluationsPanel: React.FC<{
  player: MemberModel;
  onEdit?: (evaluation: EvaluationRecord) => void;
  onDelete?: (id: string) => void;
  refreshKey?: unknown;
}> = ({ player, onEdit, onDelete, refreshKey }) => {
  const memberId = player.id;
  // The page / window opened over the record for one evaluation
  const [opened, setOpened] = useState<{ ev: EvaluationRecord; what: 'view' | 'program' | 'contract' } | null>(null);
  // The evaluation being printed (the print sheet opens at once)
  const [printing, setPrinting] = useState<EvaluationRecord | null>(null);
  const actionsOf = (ev: EvaluationRecord): ActionsMenuItem[] => [
    { key: 'view', label: 'عرض', icon: Eye, color: '#3b82f6', onClick: () => setOpened({ ev, what: 'view' }) },
    { key: 'print', label: 'طباعة', icon: Printer, color: '#ea580c', onClick: () => setPrinting(ev) },
    { key: 'program', label: 'برنامج التحسين', icon: Target, color: '#f59e0b', onClick: () => setOpened({ ev, what: 'program' }) },
    { key: 'contract', label: 'المراجعة التعاقدية', icon: Handshake, color: '#8b5cf6', onClick: () => setOpened({ ev, what: 'contract' }) },
    ...(onEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => onEdit(ev) }] : []),
    ...(onDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(ev.id) }] : []),
  ];
  const [items, setItems] = useState<EvaluationRecord[] | null>(null);
  const isMobile = useIsMobile();
  // Phone: the evaluation whose full report is open
  const [report, setReport] = useState<EvaluationRecord | null>(null);

  useEffect(() => {
    let alive = true;
    evalsData.getEvaluationsByMember(Number(memberId))
      .then(list => { if (alive) setItems(list); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [memberId, refreshKey]);

  const list = (items || []).slice().sort((a, b) => String(b.evalDate || '').localeCompare(String(a.evalDate || '')));
  const last = list[0];
  const average = list.length ? Math.round(list.reduce((s, e) => s + (Number(e.totalScore) || 0), 0) / list.length) : 0;

  return (
    <section className="mep">
      <div className="mep-kpis">
        <div><small>عدد التقييمات</small><strong>{items === null ? '…' : list.length}</strong></div>
        <div><small>آخر تقييم</small><strong className={last ? `tone-${toneOf(last.totalScore)}` : ''}>{last ? `${last.totalScore}%` : '—'}</strong></div>
        <div><small>المعدل</small><strong className={list.length ? `tone-${toneOf(average)}` : ''}>{list.length ? `${average}%` : '—'}</strong></div>
      </div>

      {items === null ? (
        <p className="mep-empty">جاري تحميل التقييمات...</p>
      ) : list.length === 0 ? (
        <div className="mep-empty"><Inbox size={28} /><span>لا توجد تقييمات لهذا اللاعب</span></div>
      ) : isMobile ? (
        /* Phone: the same cards as the full history; a tap opens the evaluation's full report */
        <div className="mep-mobile-list">
          {list.map(e => {
            const grade = gradeOf(e.totalScore || 0);
            return (
              <div key={e.id} role="button" tabIndex={0} className={`eh-card grade-${grade}`} onClick={() => setReport(e)} onKeyDown={k => { if (k.key === 'Enter') setReport(e); }}>
                <ScoreRing score={e.totalScore || 0} size={58} stroke={8} />
                <span className="eh-card-info">
                  <span className="eh-card-line">
                    <strong>{periodLabel(e) || 'تقييم'}</strong>
                    <span className="me-grade">{GRADE_LABELS[grade]}</span>
                  </span>
                  <span className="eh-card-meta">
                    <CalendarDays size={12} /> {String(e.evalDate || '').slice(0, 10) || '—'} · {e.season}
                  </span>
                </span>
                <span onClick={k => k.stopPropagation()}>
                  <MobileRowMenu label="إجراءات التقييم" items={actionsOf(e).map(a => (a.key === 'view' ? { ...a, label: 'عرض', onClick: () => setReport(e) } : a))} />
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Computer: the same cards as the full history — date, season and period, the score ring and grade,
           the seven axes, and every action at the bottom */
        <div className="eval-cards-grid mep-desktop-grid">
          {list.map(ev => {
            const cls = badgeClass(ev.totalScore);
            return (
              <div key={ev.id} className="eval-history-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="eval-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="eval-date" style={{ margin: 0 }}>
                      <CalendarDays size={14} />
                      <span style={{ paddingTop: '2px' }}>{String(ev.evalDate || '').slice(0, 10)}</span>
                    </div>
                    <div className="eval-card-meta" style={{ margin: 0 }}>
                      {ev.season && <span className="eval-season-badge">{ev.season}</span>}
                      <span className="eval-period-badge">{periodLabel(ev)}</span>
                    </div>
                  </div>
                </div>

                <div className="eval-card-body">
                  <div className="eval-score-ring-container">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`circle stroke-${cls}`} strokeDasharray={`${ev.totalScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.35" className={`percentage text-${cls}`}>{ev.totalScore}</text>
                    </svg>
                  </div>
                  <div className={`eval-status-badge ${cls}`}>{BADGE_LABEL[cls]}</div>
                  {ev.recommendation && <div className="mep-reco"><Star size={13} /> {ev.recommendation}</div>}

                  <div className="eval-details-grid">
                    {AXES.map(a => (
                      <div key={a.key} className="eval-detail-item">
                        <span className="eval-detail-label">{a.label}</span>
                        <span className="eval-detail-value">{Number(ev.scores?.[a.key]) || 0} / {a.max}</span>
                      </div>
                    ))}
                  </div>
                  {(ev.strengths || ev.weaknesses) && (
                    <div className="mep-notes">
                      {ev.strengths && <p><b>نقاط القوة:</b> {ev.strengths}</p>}
                      {ev.weaknesses && <p><b>نقاط الضعف:</b> {ev.weaknesses}</p>}
                    </div>
                  )}
                </div>

                {/* Every action, at the bottom of the card */}
                <div className="mep-card-actions">
                  {actionsOf(ev).map(a => (
                    <button key={a.key} type="button" title={a.label} aria-label={a.label} onClick={a.onClick} style={{ '--act': a.danger ? '#ef4444' : a.color } as React.CSSProperties}>
                      <a.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {report && createPortal(<MobileEvaluationReport evaluation={report} onClose={() => setReport(null)} />, document.body)}

      {printing && (
        <PrintSheet onDone={() => setPrinting(null)}>
          <PrintableEvaluation evaluation={printing} player={player} />
        </PrintSheet>
      )}

      {/* Over the record, on the page body (never clipped by the record's own frame) */}
      {opened && createPortal(
        isMobile ? (
          opened.what === 'program'
            ? <MobileImprovementProgram player={player} evaluation={opened.ev} onClose={() => setOpened(null)} />
            : <MobileContractReview player={player} evaluation={opened.ev} onClose={() => setOpened(null)} />
        ) : opened.what === 'view'
          ? <ViewEvaluationDialog player={player} evaluation={opened.ev} onClose={() => setOpened(null)} onDelete={onDelete} />
          : opened.what === 'program'
            ? <ImprovementProgramDialog player={player} evaluation={opened.ev} onClose={() => setOpened(null)} />
            : <ContractReviewDialog player={player} evaluation={opened.ev} onClose={() => setOpened(null)} />,
        document.body,
      )}
    </section>
  );
};
