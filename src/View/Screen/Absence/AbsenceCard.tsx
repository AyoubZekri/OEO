import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Check, X, Trash2, ExternalLink, MessageSquareText, Paperclip, Hourglass, TimerOff, BadgeCheck, XCircle, CircleDashed } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, categoryIcon, statusOf, statusLabelOf, dateOf, initials, isMemberRequest, recordTitle } from './absenceUtils';
import { cardFooter, longDay, statusShort } from './absenceCardState';
import { RejectionView } from './RejectionView';

interface AbsenceCardProps {
  absence: AbsenceRecord;
  /** Hide the member row (inside a member's own file) */
  hideMember?: boolean;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
  /** Personal space: my own record. No delete or decision; I justify it within 24 hours */
  personal?: boolean;
  /** Opened from an alert: marked */
  focused?: boolean;
  /** Personal space: the current time, for the 24-hour justification window */
  now?: number;
}

const INFO_ICONS = { muted: CircleDashed, blue: Hourglass, green: BadgeCheck, red: XCircle, amber: TimerOff };

/**
 * One absence / late / leave / holiday request. Every card has the same parts in the same place
 * (kind and date, member, facts, justification, bottom line), so they all have the same size;
 * the bottom line holds the action or tells where the record stands.
 */
export const AbsenceCard: React.FC<AbsenceCardProps> = ({ absence: a, hideMember, onJustify, onDecide, onDelete, personal, focused, now = 0 }) => {
  const can = useCan();
  const navigate = useNavigate();
  const [showRefusal, setShowRefusal] = useState(false);
  const type = typeMeta(a.absence_type);
  const status = statusOf(a);
  const leave = isMemberRequest(a);
  const footer = cardFooter(a, { personal, canJustify: can('absences', 'justify'), now });
  const infoIcon = footer.kind === 'info' ? React.createElement(footer.expired ? TimerOff : INFO_ICONS[footer.tone], { size: 15 }) : null;

  return (
    <article id={`absence-card-${a.id}`} className={`abx tone-${type.tone} st-${status} ${focused ? 'focused' : ''}`}>
      <header className="abx-head">
        <span className="abx-kind"><type.icon size={20} /></span>
        <div className="abx-title">
          <strong>{recordTitle(a)}</strong>
          <small>{longDay(dateOf(a))}</small>
        </div>
        <span className={`abx-status st-${status}`} title={statusLabelOf(a)}><i />{statusShort(a)}</span>
        {!personal && can('absences', 'delete') && (
          <button type="button" className="abx-del" onClick={() => onDelete(a.id)} title="حذف السجل" aria-label="حذف السجل">
            <Trash2 size={15} />
          </button>
        )}
      </header>

      {!hideMember && (
        <div className="abx-member">
          <span className="ab-avatar">{initials(a.player_name || '')}</span>
          <div>
            <strong>{a.player_name}</strong>
            <small>{a.team_name || '—'}</small>
          </div>
        </div>
      )}

      <div className="abx-facts">
        {/* The document first: the line never wraps, it is never the one cut off */}
        {a.attachment_url && (
          <a href={a.attachment_url} target="_blank" rel="noreferrer" className="doc"><Paperclip size={13} /> الوثيقة</a>
        )}
        {a.event_category && (
          <span>
            {React.createElement(categoryIcon(a.event_category), { size: 13 })} {a.event_category}
            {a.event_category === 'اجتماع' && a.meeting_id && (
              <button type="button" onClick={() => navigate(`/meetings/${a.meeting_id}/attendance`)} title={`الاجتماع: ${a.meeting_topic || ''}`}>
                <ExternalLink size={12} />
              </button>
            )}
          </span>
        )}
        {a.duration && <span><Clock size={13} /> {a.duration}</span>}
        {!a.event_category && !a.duration && !a.attachment_url && <span className="none">لا توجد تفاصيل إضافية</span>}
      </div>

      <div className={`abx-note ${a.reason ? '' : 'empty'}`}>
        <MessageSquareText size={15} />
        <p title={a.reason || undefined}>
          {a.reason || (a.attachment_url ? (leave ? 'السبب في الوثيقة المرفقة' : 'التبرير في الوثيقة المرفقة') : leave ? 'بدون سبب مكتوب' : 'لم يُكتب تبرير')}
        </p>
      </div>

      <footer className="abx-foot">
        {footer.kind === 'justify' && (
          <>
            {footer.left && <span className="abx-left"><Hourglass size={13} /> {footer.left}</span>}
            <button type="button" className="abx-btn primary" onClick={() => onJustify(a.id)}>
              <FileText size={15} /> تقديم تبرير
            </button>
          </>
        )}
        {footer.kind === 'decide' && (
          <>
            <button type="button" className="abx-btn accept" onClick={() => onDecide(a.id, 'مقبول')}><Check size={15} /> {leave ? 'قبول الطلب' : 'قبول التبرير'}</button>
            <button type="button" className="abx-btn reject" onClick={() => onDecide(a.id, 'مرفوض')}><X size={15} /> رفض</button>
          </>
        )}
        {footer.kind === 'info' && (
          <span className={`abx-info tone-${footer.tone}`} title={footer.text}>{infoIcon} <em>{footer.text}</em></span>
        )}
        {/* A refusal: its whole reason, and what had been sent */}
        {status === 'rejected' && (
          <button type="button" className="abx-btn ghost" onClick={() => setShowRefusal(true)}>عرض السبب</button>
        )}
      </footer>
      {showRefusal && <RejectionView absence={a} onClose={() => setShowRefusal(false)} />}
    </article>
  );
};
