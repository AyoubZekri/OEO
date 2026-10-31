import React, { useState } from 'react';
import { Plus, CalendarX2 } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { useUrlDetails } from '../widgets/useUrlDetails';
import { kindOf, byDateDesc } from '../../Screen/Absence/absenceUtils';
import type { useMyAbsences } from '../../Screen/Personal/useMyAbsences';
import { MobileAbsenceCard } from './MobileAbsenceCard';
import { MobileTypeFilter } from './MobileTypeFilter';
import { MobileJustifySheet } from './MobileJustifySheet';
import { MobileMyAbsenceRequest } from './MobileMyAbsenceRequest';
import './MobileAbsences.css';
import { StateIcon } from '../../widget/StateIcon';

const noop = () => undefined;

// Personal space (phone): my records with my counters, my justifications and my requests
export const MobileMyAbsences: React.FC<{ c: ReturnType<typeof useMyAbsences>; now: number }> = ({ c, now }) => {
  const [type, setType] = useState('');
  // ?absence=ID (from an alert): that record is marked
  const [focusId] = useUrlDetails('absence');
  const list = c.records.filter(a => !type || kindOf(a) === type).slice().sort(byDateDesc);

  return (
    <div className="mab-page">
      <MobileAppBar title="غيابات" />

      {c.records.length > 0 && (
        <MobileTypeFilter value={type} onChange={setType} />
      )}

      {c.isLoading ? (
        <MobileLoader text="جاري تحميل سجلك..." />
      ) : list.length === 0 ? (
        <StateIcon icon={CalendarX2} />
      ) : (
        <div className="mab-list">
          {list.map(a => (
            <MobileAbsenceCard
              key={a.id}
              absence={a}
              hideMember
              personal
              focused={focusId === String(a.id)}
              now={now}
              onJustify={c.openJustify}
              onDecide={noop}
              onDelete={noop}
            />
          ))}
        </div>
      )}

      <button type="button" className="mab-fab" onClick={c.openRequest} aria-label="طلب عطلة أو إعلام مسبق" title="طلب عطلة أو إعلام مسبق">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {c.justifyId !== null && <MobileJustifySheet absence={c.justifying} onSubmit={c.justify} onClose={c.closeJustify} withDocument />}
      {c.requestOpen && <MobileMyAbsenceRequest onSubmit={c.request} onClose={c.closeRequest} />}
    </div>
  );
};
