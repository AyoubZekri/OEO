import React, { useMemo, useState } from 'react';
import { Plus, MapPin, Inbox, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileTravels } from '../../Mobile/MobileTravels/MobileTravels';
import { PageLoader } from '../../shared/PageLoader';
import { useTravelsController } from './useTravelsController';
import { TravelCard } from './parts/TravelCard';
import { TravelOverlays } from './parts/TravelOverlays';
import { travelMenu } from './parts/travelMenu';
import { filterTravels, sortTravels, statusOf, STATUS_FILTERS } from './travelUtils';
import '../../shared/kit.css';
import './Travels.css';
import { TopbarSearch } from '../../widget/TopbarSearch';

// Team trips: search, status filter (upcoming / ongoing / done), the trip cards.
// personal: the personal space's page (the trips I am on, read only, with my role)
export const Travels: React.FC<{ personal?: boolean }> = ({ personal = false }) => {
  const c = useTravelsController({ personal });
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => Object.fromEntries(STATUS_FILTERS.map(f => [f.value, c.travels.filter(t => !f.value || statusOf(t) === f.value).length])), [c.travels]);

  if (isMobile) return <MobileTravels c={c} />;

  const visible = sortTravels(filterTravels(c.travels, status, query));

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => setQuery(v)} placeholder="ابحث بالوجهة أو السبب أو المباراة أو رئيس الوفد..." />
        <CustomDropdown
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${counts[f.value]})` }))}
          value={status || 'all'}
          onChange={v => setStatus(v === 'all' ? '' : v)}
        />
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />تنقل جديد</button>}
      </div>

      {c.loading && !c.travels.length ? <PageLoader mobile={false} text="جاري تحميل التنقلات..." />
        : c.error ? (
          <div className="tk-state">
            <MapPin size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.travels.length ? 'لا توجد تنقلات بهذه التصفية' : personal ? 'لست ضمن أي تنقل حالياً' : 'لا توجد تنقلات بعد'}</p></div>
        ) : (
          <div className="tk-grid">
            {visible.map(t => <TravelCard key={t.id} travel={t} onOpen={c.openTravel} menu={travelMenu(t, c)} />)}
          </div>
        )}

      <TravelOverlays c={c} mobile={false} />
    </div>
  );
};
