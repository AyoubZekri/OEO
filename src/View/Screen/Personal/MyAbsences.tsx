import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, FileWarning } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { AbsenceCard } from '../Absence/AbsenceCard';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { JustificationDialog } from '../Absence/JustificationDialog';
import { ABSENCE_TYPES, kindOf, byDateDesc } from '../Absence/absenceUtils';
import { MobileMyAbsences } from '../../Mobile/MobileAbsences/MobileMyAbsences';
import { useNow } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import { useMyAbsences } from './useMyAbsences';
import { MyAbsenceRequestDialog } from './MyAbsenceRequestDialog';
import '../Absence/Absence.css';
import { StateIcon } from '../../widget/StateIcon';

const noop = () => undefined;

/**
 * Personal space: my absences, lateness, leaves and holiday requests, with the same cards as the management page.
 * I justify a record without a justification (or refused), and I ask for a holiday or announce an absence.
 */
export const MyAbsences: React.FC = () => {
  const c = useMyAbsences();
  const isMobile = useIsMobile();
  // Refreshed every minute: the 24-hour justification window closes on its own
  const now = useNow().getTime();
  const [type, setType] = useState('');
  // ?absence=ID (from an alert): the record's card is brought into view and marked
  const [params] = useSearchParams();
  const focusId = isMobile ? null : params.get('absence');
  useEffect(() => {
    if (!focusId || c.isLoading) return;
    document.getElementById(`absence-card-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, c.isLoading, c.records]);

  if (isMobile) return <MobileMyAbsences c={c} now={now} />;

  const list = c.records.filter(a => !type || kindOf(a) === type).slice().sort(byDateDesc);

  return (
    <div className="ab-page">
      <section className="ab-hero">
        <div className="ab-hero-main">
          <span className="ab-hero-icon"><FileWarning size={30} /></span>
          <div>
            <strong className="title">غياباتي</strong>
          </div>
          <div className="ab-hero-actions">
            <button type="button" className="ab-add" onClick={c.openRequest}>
              <Plus size={18} /> طلب عطلة أو إعلام مسبق
            </button>
          </div>
        </div>
      </section>

      {c.records.length > 0 && (
        <div className="ab-toolbar">
          <div className="ab-select">
            <CustomDropdown value={type} onChange={val => setType(val)} options={[{ value: '', label: 'كل الأنواع' }, ...ABSENCE_TYPES.map(t => ({ value: t.value, label: t.label }))]} />
          </div>
        </div>
      )}

      {list.length === 0 ? (
        c.isLoading ? null : <StateIcon icon={FileWarning} />
      ) : (
        <div className="ab-grid">
          {list.map(a => (
            <AbsenceCard
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

      <JustificationDialog isOpen={c.justifyId !== null} absence={c.justifying} onClose={c.closeJustify} onSubmit={c.justify} withDocument />
      {c.requestOpen && <MyAbsenceRequestDialog onSubmit={c.request} onClose={c.closeRequest} />}
    </div>
  );
};
