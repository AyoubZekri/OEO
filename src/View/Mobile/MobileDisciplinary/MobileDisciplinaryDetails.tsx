import React from 'react';
import {
  Calendar, MapPin, BookOpen, Users, Clock, MessageSquare, Gavel, CheckCircle2, Pencil, ChevronDown,
  Paperclip, Flag, Hash, Quote, Circle, Printer, UploadCloud,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect, type MobileSelectOption } from '../widgets/MobileSelect';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinary.css';
import './MobileDisciplinaryDetails.css';

interface MobileDisciplinaryDetailsProps {
  item: DisciplinaryModel;
  photo: string;
  typeTone: string;
  typeIcon: React.ComponentType<{ size?: number }>;
  statusOptions: MobileSelectOption[];
  statusTone: Record<string, string>;
  canChangeStatus: boolean;
  onChangeStatus: (status: DisciplinaryModel['status']) => void;
  /** Present only when the user may see the reply / decision of this action */
  onViewReply?: () => void;
  /** Clarification requests: the member's reply on its own page (onViewReply then opens the decision) */
  onViewMemberReply?: () => void;
  onEdit?: () => void;
  onViewDocument?: () => void;
  onUploadDocument?: () => void;
  onPrint?: () => void;
  onClose: () => void;
}

type IconType = React.ComponentType<{ size?: number }>;

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value.replace(' ', 'T'));
  return isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: string) => {
  const date = parseDate(value);
  if (!date) return value || '';
  return new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

// "باقي 5 أيام" / "اليوم" / "فات منذ 3 أيام"
const countdown = (value?: string) => {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (days === 0) return { text: 'اليوم', late: false };
  return days > 0
    ? { text: `باقي ${days} ${days === 1 ? 'يوم' : days <= 10 ? 'أيام' : 'يوماً'}`, late: false }
    : { text: `فات منذ ${-days} ${-days === 1 ? 'يوم' : -days <= 10 ? 'أيام' : 'يوماً'}`, late: true };
};

// Names separated by commas become chips
const splitPeople = (value?: string) =>
  (value || '').split(/[,،\n]/).map(p => p.trim()).filter(Boolean);

interface Step {
  key: string;
  icon: IconType;
  title: string;
  done: boolean;
  date?: string;
  body?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

// Full details of one disciplinary action (phone)
export const MobileDisciplinaryDetails: React.FC<MobileDisciplinaryDetailsProps> = ({
  item, photo, typeTone, typeIcon: TypeIcon, statusOptions, statusTone, canChangeStatus,
  onChangeStatus, onViewReply, onViewMemberReply, onEdit, onViewDocument, onUploadDocument, onPrint, onClose,
}) => {
  const due = countdown(item.deadlineOrHearingDate);
  const hasDecision = !!(item.decision_outcome || item.decision_reasons || item.admin_notes);
  const people = splitPeople(item.presentPeople);

  const statusBadge = (open?: () => void) => (
    <button type="button" className={`mdd-status ${statusTone[item.status] || 'open'}`} onClick={open} disabled={!open}>
      <span className="mdd-status-dot" />
      {item.status}
      {open && <ChevronDown size={14} />}
    </button>
  );

  const facts: { icon: IconType; label: string; value: string; note?: { text: string; late: boolean } | null }[] = [
    { icon: Calendar, label: 'تاريخ الحدث', value: formatDate(item.incidentDate) },
    ...(item.deadlineOrHearingDate ? [{ icon: Clock, label: 'الأجل / الجلسة', value: formatDate(item.deadlineOrHearingDate), note: hasDecision ? null : due }] : []),
    ...(item.incidentLocation ? [{ icon: MapPin, label: 'المكان', value: item.incidentLocation }] : []),
    ...(item.hearingLocation ? [{ icon: MapPin, label: 'مكان الجلسة', value: item.hearingLocation }] : []),
    ...(item.violatedRule ? [{ icon: BookOpen, label: 'المادة المخالفة', value: item.violatedRule }] : []),
  ];

  // Life of the action, from the incident to the signed document
  const steps: Step[] = [
    { key: 'incident', icon: Flag, title: 'تسجيل الإجراء', done: true, date: formatDate(item.incidentDate) },
    ...(item.player_statements || !['تنبيه', 'إنذار'].includes(item.actionType) ? [{
      key: 'reply',
      icon: MessageSquare,
      title: 'رد العضو',
      done: !!item.player_statements,
      body: item.player_statements ? <p className="mdd-quote-text">{item.player_statements}</p> : undefined,
      action: onViewMemberReply ? { label: 'رد العضو', onClick: onViewMemberReply } : undefined,
    }] : []),
    ...(hasDecision || !['تنبيه', 'إنذار'].includes(item.actionType) ? [{
      key: 'decision',
      icon: Gavel,
      title: 'القرار',
      done: hasDecision,
      date: formatDate(item.effective_date),
      body: hasDecision ? (
        <div className="mdd-decision">
          {item.decision_outcome && <strong>{item.decision_outcome}</strong>}
          {item.decision_reasons && <p>{item.decision_reasons}</p>}
          {item.admin_notes && <p className="muted">{item.admin_notes}</p>}
        </div>
      ) : undefined,
      action: onViewReply ? { label: onViewMemberReply ? 'القرار' : 'الرد والقرارات', onClick: onViewReply } : undefined,
    }] : []),
    {
      key: 'document',
      icon: Paperclip,
      title: 'الوثيقة الممضاة',
      done: !!item.signed_document,
      action: onViewDocument ? { label: 'عرض الوثيقة', onClick: onViewDocument }
        : onUploadDocument ? { label: 'رفع الوثيقة', onClick: onUploadDocument } : undefined,
    },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <MobileScreen
      title="تفاصيل الإجراء"
      onBack={onClose}
      footer={onEdit && (
        <button type="button" className="me-btn primary" onClick={onEdit}>
          <Pencil size={18} /> تعديل الإجراء
        </button>
      )}
    >
      {/* Hero, tinted with the type colour */}
      <section className={`mdd-hero2 tone-${typeTone}`}>
        <div className="mdd-hero-top">
          <span className="mdd-hero-icon"><TypeIcon size={28} /></span>
          <div className="mdd-hero-title">
            <small>نوع الإجراء</small>
            <strong>{item.actionType}</strong>
          </div>
          {canChangeStatus ? (
            <MobileSelect
              label="تغيير الحالة"
              icon={Clock}
              value={item.status}
              options={statusOptions}
              onChange={v => onChangeStatus(v as DisciplinaryModel['status'])}
              renderTrigger={open => statusBadge(open)}
            />
          ) : statusBadge()}
        </div>

        <div className="mdd-hero-member">
          <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
          <div>
            <strong>{item.memberName}</strong>
            <span><Hash size={12} /> {String(item.id).substring(0, 8)}</span>
          </div>
        </div>
      </section>

      {/* Quick actions, each opens its own page */}
      {(onViewReply || onViewDocument || onUploadDocument || onPrint) && (
        <div className="mdd-quick">
          {onViewReply && (
            <>
              {onViewMemberReply && <button type="button" onClick={onViewMemberReply}><span><MessageSquare size={19} /></span>رد العضو</button>}
              <button type="button" onClick={onViewReply}><span>{onViewMemberReply ? <Gavel size={19} /> : <MessageSquare size={19} />}</span>{onViewMemberReply ? 'القرار' : 'الرد والقرارات'}</button>
            </>
          )}
          {onViewDocument && (
            <button type="button" onClick={onViewDocument}><span><Paperclip size={19} /></span>الوثيقة</button>
          )}
          {onUploadDocument && (
            <button type="button" onClick={onUploadDocument}><span><UploadCloud size={19} /></span>رفع الوثيقة</button>
          )}
          {onPrint && (
            <button type="button" onClick={onPrint}><span><Printer size={19} /></span>طباعة</button>
          )}
        </div>
      )}

      {/* Key facts */}
      <div className="mdd-facts">
        {facts.map(f => (
          <div key={f.label} className="mdd-fact">
            <span className="mdd-fact-icon"><f.icon size={16} /></span>
            <small>{f.label}</small>
            <strong>{f.value}</strong>
            {f.note && <em className={f.note.late ? 'late' : ''}>{f.note.text}</em>}
          </div>
        ))}
      </div>

      {/* Reason */}
      <section className="mdd-reason">
        <Quote size={26} className="mdd-quote-mark" />
        <small>سبب الإجراء</small>
        <p>{item.reason}</p>
        {people.length > 0 && (
          <div className="mdd-people">
            <span><Users size={13} /> الحاضرون:</span>
            {people.map(p => <em key={p}>{p}</em>)}
          </div>
        )}
      </section>

      {/* Timeline */}
      <section className="me-card mdd-timeline-card">
        <div className="mdd-timeline-head">
          <h3>مسار الإجراء</h3>
          <span>{doneCount}/{steps.length}</span>
        </div>
        <div className="mdd-progress"><div style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>

        <ol className="mdd-timeline">
          {steps.map(step => (
            <li key={step.key} className={step.done ? 'done' : ''}>
              <span className="mdd-step-dot">{step.done ? <CheckCircle2 size={18} /> : <Circle size={14} />}</span>
              <div className="mdd-step">
                <div className="mdd-step-head">
                  <step.icon size={15} />
                  <strong>{step.title}</strong>
                  <span className="mdd-step-state">{step.done ? (step.date || 'تم') : 'قيد الانتظار'}</span>
                </div>
                {step.body}
                {step.action && (
                  <button type="button" className="mdd-step-action" onClick={step.action.onClick}>{step.action.label}</button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </MobileScreen>
  );
};
