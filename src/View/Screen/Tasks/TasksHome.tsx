import React, { useState } from 'react';
import { CalendarClock, Hourglass } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { useCan } from '../../../core/functions/useCan';
import { Appointments } from './Appointments';
import { UpcomingTasks } from './UpcomingTasks';

type Tab = 'appointments' | 'upcoming';
const TAB_KEY = 'appointmentsTab';

/**
 * The appointments page, two sides: the appointments, and their tasks still to come (not on the home page yet: for
 * who has «عرض المهام القادمة»).
 * The tasks themselves are on the home page.
 */
export const TasksHome: React.FC = () => {
  const isMobile = useIsMobile();
  // The upcoming side: its own permission (المواعيد · عرض المهام القادمة)
  const withUpcoming = useCan()('appointments', 'viewUpcoming');
  const [tab, setTab] = useState<Tab>(() => {
    try { return sessionStorage.getItem(TAB_KEY) === 'upcoming' ? 'upcoming' : 'appointments'; } catch { return 'appointments'; }
  });
  const pick = (next: Tab) => {
    setTab(next);
    try { sessionStorage.setItem(TAB_KEY, next); } catch { /* only not remembered */ }
  };

  const tabs = (
    <div className={`${isMobile ? 'tk-mtabs' : 'tk-tabs'} tsk-tabs`} role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'appointments'} className={tab === 'appointments' ? 'on' : ''} onClick={() => pick('appointments')}>
        <CalendarClock size={16} />المواعيد
      </button>
      <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? 'on' : ''} onClick={() => pick('upcoming')}>
        <Hourglass size={16} />مهام قادمة
      </button>
    </div>
  );

  if (!withUpcoming) return <Appointments />;
  return tab === 'appointments' ? <Appointments tabs={tabs} /> : <UpcomingTasks tabs={tabs} />;
};
