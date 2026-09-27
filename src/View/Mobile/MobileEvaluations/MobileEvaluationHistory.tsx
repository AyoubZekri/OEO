import React, { useEffect, useState } from 'react';
import { Calendar, ClipboardList, MoreVertical, Eye, Target, Handshake, Pencil, Trash2 } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { ScoreRing } from './EvaluationWidgets';
import { GRADE_LABELS, gradeOf } from './evaluationShared';
import { revealMenu, menuPositionUnder } from '../widgets/revealMenu';
import { MobileEvaluationReport } from './MobileEvaluationReport';
import { MobileImprovementProgram } from './MobileImprovementProgram';
import { MobileContractReview } from './MobileContractReview';
import type { EvaluationRecord } from '../../Screen/Members/Evaluation/evaluation_data';
import type { MemberModel } from '../../Screen/Members/member_model';
import './MobileEvaluations.css';
import './MobileEvaluationHistory.css';

interface MobileEvaluationHistoryProps {
  player: MemberModel;
  evaluations: EvaluationRecord[];
  onClose: () => void;
  onEdit?: (evaluation: EvaluationRecord) => void;
  onDelete?: (id: string) => void;
}

// Phone version of the evaluation archive: short cards with a ⋮ menu holding every action;
// tapping a card opens its full report
export const MobileEvaluationHistory: React.FC<MobileEvaluationHistoryProps> = ({ player, evaluations, onClose, onEdit, onDelete }) => {
  // The evaluation being worked on, whether its report is open, and an optional page on top
  const [openedTarget, setTarget] = useState<EvaluationRecord | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [child, setChild] = useState<'program' | 'contract' | null>(null);
  // An evaluation that was deleted is no longer shown
  const target = openedTarget && evaluations.some(ev => ev.id === openedTarget.id) ? openedTarget : null;

  // ⋮ menu: which card it belongs to
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // Menu position under the ⋮ button, measured when it opens
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!menuFor) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuFor(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuFor]);

  const photo = player.photo && !player.photo.includes('ui-avatars.com') ? player.photo : defaultAvatar;
  const average = evaluations.length
    ? Math.round(evaluations.reduce((sum, ev) => sum + (ev.totalScore || 0), 0) / evaluations.length)
    : 0;
  const best = evaluations.reduce((max, ev) => Math.max(max, ev.totalScore || 0), 0);

  const closeReport = () => {
    setChild(null);
    setShowReport(false);
    setTarget(null);
  };

  const openReport = (ev: EvaluationRecord) => {
    setTarget(ev);
    setChild(null);
    setShowReport(true);
  };

  // Programme / contract review straight from the menu (back returns to the list)
  const openChild = (ev: EvaluationRecord, kind: 'program' | 'contract') => {
    setTarget(ev);
    setShowReport(false);
    setChild(kind);
  };

  const edit = (ev: EvaluationRecord) => {
    closeReport();
    onEdit?.(ev);
  };

  const toggleMenu = (ev: EvaluationRecord) => setMenuFor(current => (current === ev.id ? null : ev.id));

  const menuAction = (action: () => void) => {
    setMenuFor(null);
    action();
  };

  return (
    <>
      <MobileScreen title="التقييمات" onBack={onClose}>
        {/* Player summary */}
        <section className="me-card eh-summary">
          <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
          <div className="eh-summary-name">
            <strong>{player.first_name} {player.last_name}</strong>
            <span>أرشيف التقييمات</span>
          </div>
          <div className="eh-stats">
            <div><strong>{evaluations.length}</strong><span>تقييم</span></div>
            <div className={`grade-${gradeOf(average)}`}><strong style={{ color: 'var(--me-grade)' }}>{average}</strong><span>المعدل</span></div>
            <div className={`grade-${gradeOf(best)}`}><strong style={{ color: 'var(--me-grade)' }}>{best}</strong><span>الأفضل</span></div>
          </div>
        </section>

        {evaluations.length === 0 ? (
          <div className="me-empty">
            <ClipboardList size={44} />
            <strong>لا توجد تقييمات سابقة</strong>
            <p>هذا اللاعب لم يحصل على أي تقييم مسجل حتى الآن.</p>
          </div>
        ) : (
          evaluations.map(ev => {
            const grade = gradeOf(ev.totalScore || 0);
            return (
              <div
                key={ev.id}
                role="button"
                tabIndex={0}
                className={`eh-card grade-${grade}`}
                onClick={() => openReport(ev)}
                onKeyDown={e => { if (e.key === 'Enter') openReport(ev); }}
              >
                <ScoreRing score={ev.totalScore || 0} size={58} stroke={8} />
                <span className="eh-card-info">
                  <span className="eh-card-line">
                    <strong>{ev.period || 'تقييم'}</strong>
                    <span className="me-grade">{GRADE_LABELS[grade]}</span>
                  </span>
                  <span className="eh-card-meta">
                    <Calendar size={12} /> {ev.evalDate || '—'} · {ev.season}
                  </span>
                </span>
                <button
                  type="button"
                  className={`eh-more ${menuFor === ev.id ? 'open' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    if (menuFor !== ev.id) setMenuPos(menuPositionUnder(e.currentTarget, 200)); // .eh-menu width
                    toggleMenu(ev);
                  }}
                  aria-label="إجراءات التقييم"
                  aria-haspopup="menu"
                  aria-expanded={menuFor === ev.id}
                >
                  <MoreVertical size={20} />
                </button>

                {menuFor === ev.id && (
                  <>
                    <div className="eh-menu-backdrop" onClick={e => { e.stopPropagation(); setMenuFor(null); }} />
                    <div ref={revealMenu} className="eh-menu" style={menuPos} role="menu" aria-label="إجراءات التقييم" onClick={e => e.stopPropagation()}>
                      <button role="menuitem" className="view" onClick={() => menuAction(() => openReport(ev))}><Eye size={17} /> عرض</button>
                      <button role="menuitem" className="program" onClick={() => menuAction(() => openChild(ev, 'program'))}><Target size={17} /> برنامج التحسين</button>
                      <button role="menuitem" className="contract" onClick={() => menuAction(() => openChild(ev, 'contract'))}><Handshake size={17} /> المراجعة التعاقدية</button>
                      {onEdit && <button role="menuitem" className="edit" onClick={() => menuAction(() => edit(ev))}><Pencil size={17} /> تعديل</button>}
                      {onDelete && <button role="menuitem" className="delete" onClick={() => menuAction(() => onDelete(ev.id))}><Trash2 size={17} /> حذف</button>}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </MobileScreen>

      {target && showReport && (
        <MobileEvaluationReport
          evaluation={target}
          onClose={closeReport}
        />
      )}
      {target && child === 'program' && (
        <MobileImprovementProgram player={player} evaluation={target} onClose={() => setChild(null)} />
      )}
      {target && child === 'contract' && (
        <MobileContractReview player={player} evaluation={target} onClose={() => setChild(null)} />
      )}
    </>
  );
};
