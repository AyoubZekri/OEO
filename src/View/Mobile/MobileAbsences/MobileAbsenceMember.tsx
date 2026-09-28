import React, { useState } from 'react';
import { Plus, CalendarX2 } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { ABSENCE_TYPES, kindOf, countsOf, byDateDesc, memberName, memberRole, memberTeam, initials } from '../../Screen/Absence/absenceUtils';
import { MobileAbsenceCard } from './MobileAbsenceCard';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileAbsenceMemberProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- members come untyped from the API
  member: any;
  records: AbsenceRecord[];
  onAdd: () => void;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

// A member's absence file (phone): counters, a type filter and every record
export const MobileAbsenceMember: React.FC<MobileAbsenceMemberProps> = ({ member, records, onAdd, onClose, ...cardProps }) => {
  const can = useCan();
  const [type, setType] = useState('');
  const c = countsOf(records);
  const name = memberName(member);
  const list = records.filter(r => !type || kindOf(r) === type).sort(byDateDesc);

  return (
    <MobileScreen
      title="سجل الغيابات"
      onBack={onClose}
      footer={can('absences', 'add') ? <button type="button" className="me-btn primary" onClick={onAdd}><Plus size={18} /> تسجيل حالة</button> : undefined}
    >
      <section className="mab-hero">
        <div className="mab-hero-top">
          <span className="mab-avatar big">{initials(name)}</span>
          <div>
            <small>{memberRole(member)}{memberTeam(member) ? ` · ${memberTeam(member)}` : ''}</small>
            <strong className="name">{name}</strong>
          </div>
        </div>
        <div className="mab-tiles five">
          <div className="tone-red"><strong>{c.absent}</strong><small>غياب</small></div>
          <div className="tone-amber"><strong>{c.late}</strong><small>تأخر</small></div>
          <div className="tone-orange"><strong>{c.leave}</strong><small>مغادرة</small></div>
          <div className="tone-violet"><strong>{c.request}</strong><small>عطلة</small></div>
          <div className="tone-blue"><strong>{c.pending}</strong><small>قيد الدراسة</small></div>
        </div>
      </section>

      {records.length > 0 && (
        <div className="mab-types">
          <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>الكل</button>
          {ABSENCE_TYPES.map(t => (
            <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>{t.label}</button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="mab-empty big"><CalendarX2 size={34} /><strong>{records.length ? 'لا توجد سجلات من هذا النوع' : 'لا توجد غيابات مسجلة لهذا العضو'}</strong></div>
      ) : (
        <div className="mab-list">
          {list.map(a => <MobileAbsenceCard key={a.id} absence={a} hideMember {...cardProps} />)}
        </div>
      )}
    </MobileScreen>
  );
};
