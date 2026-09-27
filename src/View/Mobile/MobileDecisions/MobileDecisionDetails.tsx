import React from 'react';
import { Gavel, ListChecks, Calendar, Clock, Users, Pencil, Check, FileText, Minus, Plus } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import type { Decision } from '../../Screen/Decisions/decision_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { fullName, memberPhoto } from '../MobileTeams/teamRoster';
import { longDate } from '../MobileTrainingSessions/sessionUtils';
import { decisionTitle, decisionState, STATE_LABEL, deadlineText, tasksDone } from './decisionUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileDecisionDetailsProps {
  decision: Decision;
  meetingName?: string;
  members: MemberModel[];
  onProgress: (progress: number) => void;
  onToggleTask: (itemId: string) => void;
  onEdit: () => void;
  onClose: () => void;
}

const STEPS = [0, 25, 50, 75, 100];

// Full details of one decision (phone): progress, text or tasks, people in charge, deadline
export const MobileDecisionDetails: React.FC<MobileDecisionDetailsProps> = ({
  decision, meetingName, members, onProgress, onToggleTask, onEdit, onClose,
}) => {
  const state = decisionState(decision);
  const progress = decision.progress || 0;
  const due = deadlineText(decision.deadline);
  const isTasks = decision.type === 'checklist';
  const tasks = tasksDone(decision);
  const people = (decision.assigneeIds || [])
    .map(id => members.find(m => String(m.id) === String(id)))
    .filter((m): m is MemberModel => !!m);

  return (
    <MobileScreen
      title="تفاصيل القرار"
      onBack={onClose}
      footer={<button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> تعديل القرار</button>}
    >
      <section className="mdc-hero">
        <div className="mdc-hero-top">
          <div className={`mdc-ring st-${state}`} style={{ '--mdc-p': progress } as React.CSSProperties}>
            <span><strong>{progress}%</strong><small>{STATE_LABEL[state]}</small></span>
          </div>
          <div className="mdc-hero-text">
            <small>{isTasks ? <><ListChecks size={12} /> قرار متعدد المهام</> : <><Gavel size={12} /> قرار</>}</small>
            <strong className="title">{decisionTitle(decision)}</strong>
            {meetingName && <span><Calendar size={12} /> {meetingName}</span>}
          </div>
        </div>
        {decision.category && !isTasks && <span className="mdc-tag">{decision.category}</span>}
      </section>

      {/* Progress */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Check size={16} /></span>نسبة الإنجاز</h3>
        {isTasks ? (
          <>
            <div className="mdc-progress big">
              <div className="mdc-bar"><div style={{ width: `${progress}%` }} /></div>
              <b>{tasks.done}/{tasks.total}</b>
            </div>
            <div className="mdc-tasks">
              {(decision.checklistItems || []).map(item => (
                <button key={item.id} type="button" className={`mdc-task ${item.checked ? 'done' : ''}`} onClick={() => onToggleTask(item.id)}>
                  <i>{item.checked && <Check size={14} strokeWidth={3} />}</i>
                  <span>{item.text}</span>
                </button>
              ))}
              {!tasks.total && <p className="me-text empty">لا توجد مهام</p>}
            </div>
          </>
        ) : (
          <>
            <div className="mdc-stepper">
              <button type="button" onClick={() => onProgress(Math.max(0, progress - 5))} aria-label="إنقاص"><Minus size={18} /></button>
              <strong>{progress}%</strong>
              <button type="button" onClick={() => onProgress(Math.min(100, progress + 5))} aria-label="زيادة"><Plus size={18} /></button>
            </div>
            <input
              className="mdc-range"
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={e => onProgress(parseInt(e.target.value))}
              style={{ '--mdc-p': progress } as React.CSSProperties}
            />
            <div className="mdc-steps">
              {STEPS.map(v => (
                <button key={v} type="button" className={progress === v ? 'active' : ''} onClick={() => onProgress(v)}>{v}%</button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Text */}
      {!isTasks && (
        <section className="me-card">
          <h3 className="me-section-title"><span><FileText size={16} /></span>نص القرار</h3>
          <p className="mdc-text">{decision.text}</p>
        </section>
      )}

      {/* People + deadline */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Users size={16} /></span>المسؤولون عن التنفيذ</h3>
        {people.length ? (
          <div className="mdc-people">
            {people.map(m => (
              <div key={m.id} className="mdc-person">
                <img src={memberPhoto(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                <span><strong>{fullName(m)}</strong><small>{TYPE_LABELS[m.type] || m.type}</small></span>
              </div>
            ))}
          </div>
        ) : <p className="me-text empty">لا يوجد مسؤولون محددون</p>}
        {decision.deadline && (
          <div className={`mdc-deadline ${due?.late && state !== 'done' ? 'late' : ''}`}>
            <Clock size={16} />
            <span>الأجل: <strong>{longDate(decision.deadline.split('T')[0])}</strong></span>
            {due && state !== 'done' && <em>{due.text}</em>}
          </div>
        )}
      </section>
    </MobileScreen>
  );
};
