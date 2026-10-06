import React, { useState } from 'react';
import { Plus, MapPin, Search, X, Filter, ChevronDown, Inbox, RefreshCw, CalendarClock, Navigation, CheckCircle2 } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { TaskLoader } from '../../Screen/Tasks/parts/TaskLoader';
import type { TravelsController } from '../../Screen/Travels/useTravelsController';
import { TravelOverlays } from '../../Screen/Travels/parts/TravelOverlays';
import { TravelCard } from '../../Screen/Travels/parts/TravelCard';
import { countdownText, filterTravels, sortTravels, statusOf, STATUS_FILTERS } from '../../Screen/Travels/travelUtils';
import '../../Screen/Tasks/Tasks.css';
import '../../Screen/Travels/Travels.css';

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
            <small>{next ? (statusOf(next) === 'ongoing' ? 'التنقل الجاري' : `التنقل القادم · ${countdownText(next)}`) : 'لا يوجد تنقل قادم'}</small>
            <strong className="tv-hero-dest">{next ? next.destination : '—'}</strong>
          </div>
        </div>
        <div className="tk-hero-tiles tv-hero-tiles">
          {[
            { label: 'القادمة', v: upcoming.length, icon: CalendarClock, tone: 'blue' },
            { label: 'الجارية', v: ongoing.length, icon: Navigation, tone: 'orange' },
            { label: 'المنتهية', v: count('done'), icon: CheckCircle2, tone: 'green' },
          ].map(t => (
            <div key={t.label} className={`tone-${t.tone}`}>
              <t.icon size={14} />
              <strong>{t.v}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالوجهة أو المباراة..." />
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

      {c.loading && !c.travels.length ? <TaskLoader mobile text="جاري تحميل التنقلات..." />
        : c.error ? (
          <div className="tk-state">
            <MapPin size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.travels.length ? 'لا توجد تنقلات بهذه التصفية' : c.personal ? 'لست ضمن أي تنقل حالياً' : 'لا توجد تنقلات بعد'}</p></div>
        ) : (
          <div className="tk-list">{visible.map(t => <TravelCard key={t.id} travel={t} onOpen={c.openTravel} compact />)}</div>
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
