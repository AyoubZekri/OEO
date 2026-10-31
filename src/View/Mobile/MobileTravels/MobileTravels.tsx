import React, { useState } from 'react';
import { Plus, MapPin, Search, X, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import type { TravelsController } from '../../Screen/Travels/useTravelsController';
import { TravelOverlays } from '../../Screen/Travels/parts/TravelOverlays';
import { TravelCard } from '../../Screen/Travels/parts/TravelCard';
import { travelMenu } from '../../Screen/Travels/parts/travelMenu';
import { filterTravels, sortTravels, statusOf, STATUS_FILTERS } from '../../Screen/Travels/travelUtils';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import { StateIcon } from '../../widget/StateIcon';

// Phone version of the travels page: the next trip in the hero, search, the status filter in a bottom sheet, the cards
export const MobileTravels: React.FC<{ c: TravelsController }> = ({ c }) => {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const visible = sortTravels(filterTravels(c.travels, status, query));
  const upcoming = sortTravels(c.travels.filter(t => statusOf(t) === 'upcoming'));
  const ongoing = c.travels.filter(t => statusOf(t) === 'ongoing');
  const next = ongoing[0] || upcoming[0];
  const count = (v: string) => c.travels.filter(t => !v || statusOf(t) === v).length;

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title={c.personal ? 'تنقلات' : 'التنقلات'} />

      <section className="tk-hero">
        <div className="tk-hero-top">
          <span className="tk-hero-icon"><MapPin size={26} /></span>
          <div>
            <small>{next ? (statusOf(next) === 'ongoing' ? 'التنقل الجاري' : 'التنقل القادم') : 'لا يوجد تنقل قادم'}</small>
            <strong className="tv-hero-dest">{next ? next.destination : '—'}</strong>
          </div>
        </div>
      </section>

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالوجهة أو المباراة" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
        <MobileSelect
          label="الحالة"
          icon={Filter}
          value={status || 'all'}
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: f.label, hint: String(count(f.value)) }))}
          onChange={v => setStatus(v === 'all' ? '' : v)}
          renderTrigger={open => (
            <button type="button" className={`tk-filter-btn ${status ? 'active' : ''}`} onClick={open}>
              <Filter size={15} />
              <span><small>الحالة</small><strong>{STATUS_FILTERS.find(f => f.value === status)?.label || 'كل التنقلات'}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
      </div>

      {c.loading && !c.travels.length ? <PageLoader mobile text="جاري تحميل التنقلات..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon icon={MapPin} />
        ) : (
          <div className="tk-list">{visible.map(t => <TravelCard key={t.id} travel={t} onOpen={c.openTravel} compact menu={travelMenu(t, c)} />)}</div>
        )}

      {c.can('add') && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="تنقل جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <TravelOverlays c={c} mobile />
    </div>
  );
};
