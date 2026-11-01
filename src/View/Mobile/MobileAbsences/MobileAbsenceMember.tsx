import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { kindOf, byDateDesc, memberName, memberRole, memberTeam, initials } from '../../Screen/Absence/absenceUtils';
import { MobileAbsenceCard } from './MobileAbsenceCard';
import { MobileTypeFilter } from './MobileTypeFilter';
import '../MobileEvaluations/MobileEvaluations.css';
import { StateIcon } from '../../widget/StateIcon';

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

// A member's absence file (phone): a type filter and every record
export const MobileAbsenceMember: React.FC<MobileAbsenceMemberProps> = ({ member, records, onAdd, onClose, ...cardProps }) => {
  const can = useCan();
  const [type, setType] = useState('');
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
      </section>

      {records.length > 0 && (
        <MobileTypeFilter value={type} onChange={setType} />
      )}

      {list.length === 0 ? (
        <StateIcon />
      ) : (
        <div className="mab-list">
          {list.map(a => <MobileAbsenceCard key={a.id} absence={a} hideMember {...cardProps} />)}
        </div>
      )}
    </MobileScreen>
  );
};
