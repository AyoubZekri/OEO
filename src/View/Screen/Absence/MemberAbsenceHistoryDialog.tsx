import React, { useState } from 'react';
import { X, Plus, CalendarX2 } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { AbsenceCard } from './AbsenceCard';
import { ABSENCE_TYPES, kindOf, countsOf, byDateDesc, memberName, memberRole, memberTeam, initials } from './absenceUtils';

interface MemberAbsenceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- members come untyped from the API
  member: any;
  absences: AbsenceRecord[];
  onAdd: () => void;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
}

// A member's absence file: counters and every record, newest first
export const MemberAbsenceHistoryDialog: React.FC<MemberAbsenceHistoryDialogProps> = ({
  isOpen, onClose, member, absences, onAdd, onJustify, onDecide, onDelete,
}) => {
  const can = useCan();
  const [type, setType] = useState('');
  if (!isOpen || !member) return null;

  const c = countsOf(absences);
  const list = absences.filter(a => !type || kindOf(a) === type).sort(byDateDesc);
  const name = memberName(member);

  return (
    <div className="ab-overlay" onClick={onClose}>
      <div className="ab-dialog wide" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`سجل الغيابات: ${name}`}>
        <header className="ab-dialog-head">
          <span className="ab-avatar big light">{initials(name)}</span>
          <div className="ab-dialog-title">
            <h2>{name}</h2>
            <p>{memberRole(member)}{memberTeam(member) ? ` · ${memberTeam(member)}` : ''}</p>
          </div>
          {can('absences', 'add') && (
            <button type="button" className="ab-add" onClick={onAdd}><Plus size={17} /> تسجيل حالة</button>
          )}
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-stats">
          <div className="tone-red"><strong>{c.absent}</strong><small>غياب</small></div>
          <div className="tone-amber"><strong>{c.late}</strong><small>تأخر</small></div>
          <div className="tone-orange"><strong>{c.leave}</strong><small>مغادرة</small></div>
          <div className="tone-violet"><strong>{c.request}</strong><small>طلبات عطلة</small></div>
          <div className="tone-blue"><strong>{c.pending}</strong><small>قيد الدراسة</small></div>
        </div>

        <div className="ab-dialog-body">
          {absences.length > 0 && (
            <div className="ab-chips">
              <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>الكل</button>
              {ABSENCE_TYPES.map(t => (
                <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          )}
          {list.length === 0 ? (
            <div className="ab-empty">
              <span><CalendarX2 size={34} /></span>
              <strong>{absences.length ? 'لا توجد سجلات من هذا النوع' : 'لا توجد غيابات مسجلة لهذا العضو'}</strong>
            </div>
          ) : (
            <div className="ab-grid">
              {list.map(a => (
                <AbsenceCard key={a.id} absence={a} hideMember onJustify={onJustify} onDecide={onDecide} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
