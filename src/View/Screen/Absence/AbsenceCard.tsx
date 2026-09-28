import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, Check, X, Trash2, ExternalLink, MessageSquareText } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, categoryIcon, statusOf, STATUS_LABEL, dateOf, initials } from './absenceUtils';

interface AbsenceCardProps {
  absence: AbsenceRecord;
  /** Hide the member row (inside a member's own file) */
  hideMember?: boolean;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
}

// One absence / late / leave / holiday request, with the actions its state allows
export const AbsenceCard: React.FC<AbsenceCardProps> = ({ absence: a, hideMember, onJustify, onDecide, onDelete }) => {
  const can = useCan();
  const navigate = useNavigate();
  const type = typeMeta(a.absence_type);
  const status = statusOf(a);

  return (
    <article className={`ab-card tone-${type.tone} st-${status}`}>
      <header className="ab-card-top">
        <span className="ab-type"><type.icon size={15} /> {type.label}</span>
        <span className={`ab-status st-${status}`}><i />{STATUS_LABEL[status]}</span>
        {can('absences', 'delete') && (
          <button type="button" className="ab-card-del" onClick={() => onDelete(a.id)} title="حذف السجل" aria-label="حذف السجل">
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {!hideMember && (
        <div className="ab-card-member">
          <span className="ab-avatar">{initials(a.player_name || '')}</span>
          <div>
            <strong>{a.player_name}</strong>
            {a.team_name && <small>{a.team_name}</small>}
          </div>
        </div>
      )}

      <div className="ab-facts">
        <span><Calendar size={14} /> <b dir="ltr">{dateOf(a) || '—'}</b></span>
        {a.event_category && (
          <span className="ab-cat">
            {React.createElement(categoryIcon(a.event_category), { size: 14 })} {a.event_category}
            {a.event_category === 'اجتماع' && a.meeting_id && (
              <button type="button" onClick={() => navigate(`/meetings/${a.meeting_id}/attendance`)} title={`الاجتماع: ${a.meeting_topic || ''}`}>
                <ExternalLink size={12} />
              </button>
            )}
          </span>
        )}
        {a.duration && <span><Clock size={14} /> {a.duration}</span>}
      </div>

      {a.reason && (
        <p className="ab-reason"><MessageSquareText size={15} /> <span>{a.reason}</span></p>
      )}

      {can('absences', 'justify') && (status === 'none' || status === 'pending') && (
        <footer className="ab-card-actions">
          {status === 'none' ? (
            <button type="button" className="ab-btn soft" onClick={() => onJustify(a.id)}>
              <FileText size={16} /> تقديم تبرير
            </button>
          ) : (
            <>
              <button type="button" className="ab-btn accept" onClick={() => onDecide(a.id, 'مقبول')}><Check size={16} /> قبول التبرير</button>
              <button type="button" className="ab-btn reject" onClick={() => onDecide(a.id, 'مرفوض')}><X size={16} /> رفض</button>
            </>
          )}
        </footer>
      )}
    </article>
  );
};
