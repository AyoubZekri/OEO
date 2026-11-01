import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { AbsenceRecord } from './AbsenceRequestsController';
import { AbsenceCard } from './AbsenceCard';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { ABSENCE_TYPES, kindOf, byDateDesc, memberName, memberRole, memberTeam, initials } from './absenceUtils';
import { StateIcon } from '../../widget/StateIcon';

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

// A member's absence file: every record, newest first
export const MemberAbsenceHistoryDialog: React.FC<MemberAbsenceHistoryDialogProps> = ({
  isOpen, onClose, member, absences, onAdd, onJustify, onDecide, onDelete,
}) => {
  const can = useCan();
  const [type, setType] = useState('');
  if (!isOpen || !member) return null;

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

        <div className="ab-dialog-body">
          {absences.length > 0 && (
            <div className="ab-select">
              <CustomDropdown value={type} onChange={val => setType(val)} options={[{ value: '', label: 'كل الأنواع' }, ...ABSENCE_TYPES.map(t => ({ value: t.value, label: t.label }))]} />
            </div>
          )}
          {list.length === 0 ? (
            <StateIcon />
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
