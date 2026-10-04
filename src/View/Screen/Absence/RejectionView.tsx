import React from 'react';
import { X, XCircle, MessageSquareText, Paperclip, CalendarCheck } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileSheet } from '../../Mobile/widgets/MobileSheet';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { typeMeta, dateOf, isMemberRequest, recordTitle } from './absenceUtils';
import { longDay } from './absenceCardState';

const decidedOn = (value?: string | null) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d.getTime())
    ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
    : '';
};

/** The refusal of a justification or a request: why (in full), when, and what had been sent */
export const RejectionView: React.FC<{ absence: AbsenceRecord; onClose: () => void }> = ({ absence: a, onClose }) => {
  const isMobile = useIsMobile();
  const type = typeMeta(a.absence_type);
  const request = isMemberRequest(a);
  const when = decidedOn(a.decision_date);

  const body = (
    <div className="abr">
      <div className={`ab-remind tone-${type.tone}`}>
        <span><type.icon size={18} /></span>
        <div>
          <strong>{recordTitle(a)}{a.event_category ? ` · ${a.event_category}` : ''}</strong>
          <small>{a.player_name} · {longDay(dateOf(a))}</small>
        </div>
      </div>

      <section className="abr-reason">
        <h4><XCircle size={16} /> سبب الرفض</h4>
        <p>{a.decision_note?.trim() || 'لم يُكتب سبب للرفض'}</p>
        {when && <small><CalendarCheck size={13} /> {when}</small>}
      </section>

      <section className="abr-sent">
        <h4><MessageSquareText size={15} /> {request ? 'السبب المرسل' : 'التبرير المرسل'}</h4>
        <p>{a.reason?.trim() || 'بدون نص'}</p>
        {a.attachment_url && (
          <a href={a.attachment_url} target="_blank" rel="noreferrer"><Paperclip size={14} /> فتح الوثيقة المرفقة</a>
        )}
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet title={request ? 'رفض الطلب' : 'رفض التبرير'} onClose={onClose}>
        {body}
      </MobileSheet>
    );
  }

  return (
    <div className="ab-overlay" onClick={onClose}>
      <div className="ab-dialog tone-red" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="سبب الرفض">
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><XCircle size={22} /></span>
          <div className="ab-dialog-title">
            <h2>{request ? 'رفض الطلب' : 'رفض التبرير'}</h2>
            <p>القرار نهائي</p>
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>
        <div className="ab-dialog-body">{body}</div>
        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose}>إغلاق</button>
        </footer>
      </div>
    </div>
  );
};
