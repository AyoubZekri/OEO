import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Check, X, Trash2, ExternalLink, MessageSquareText } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { typeMeta, categoryIcon, statusOf, STATUS_LABEL, dateOf, initials } from '../../Screen/Absence/absenceUtils';

interface MobileAbsenceCardProps {
  absence: AbsenceRecord;
  hideMember?: boolean;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
}

// One record on the phone, with the actions its state allows
export const MobileAbsenceCard: React.FC<MobileAbsenceCardProps> = ({ absence: a, hideMember, onJustify, onDecide, onDelete }) => {
  const can = useCan();
  const navigate = useNavigate();
  const type = typeMeta(a.absence_type);
  const status = statusOf(a);

  return (
    <article className={`mab-card tone-${type.tone} st-${status}`}>
      <div className="mab-card-top">
        {hideMember ? (
          <span className="mab-kind"><type.icon size={19} /></span>
        ) : (
          <span className="mab-avatar">{initials(a.player_name || '')}</span>
        )}
        <span className="mab-card-text">
          <strong>{hideMember ? type.label : a.player_name}</strong>
          <small>
            {!hideMember && <em className="mab-type"><type.icon size={11} /> {type.label}</em>}
            <span dir="ltr">{dateOf(a) || '—'}</span>
          </small>
        </span>
        {can('absences', 'delete') && (
          <button type="button" className="mab-del" onClick={() => onDelete(a.id)} aria-label="حذف السجل"><Trash2 size={15} /></button>
        )}
      </div>

      <div className="mab-chips">
        <span className={`mab-status st-${status}`}><i />{STATUS_LABEL[status]}</span>
        {a.event_category && (
          <span>
            {React.createElement(categoryIcon(a.event_category), { size: 12 })} {a.event_category}
            {a.event_category === 'اجتماع' && a.meeting_id && (
              <button type="button" onClick={() => navigate(`/meetings/${a.meeting_id}/attendance`)} aria-label="فتح الاجتماع"><ExternalLink size={11} /></button>
            )}
          </span>
        )}
        {a.duration && <span><Clock size={12} /> {a.duration}</span>}
      </div>

      {a.reason && <p className="mab-reason"><MessageSquareText size={14} /> <span>{a.reason}</span></p>}

      {can('absences', 'justify') && (status === 'none' || status === 'pending') && (
        <div className="mab-actions">
          {status === 'none' ? (
            <button type="button" className="soft" onClick={() => onJustify(a.id)}><FileText size={15} /> تقديم تبرير</button>
          ) : (
            <>
              <button type="button" className="accept" onClick={() => onDecide(a.id, 'مقبول')}><Check size={15} /> قبول</button>
              <button type="button" className="reject" onClick={() => onDecide(a.id, 'مرفوض')}><X size={15} /> رفض</button>
            </>
          )}
        </div>
      )}
    </article>
  );
};
