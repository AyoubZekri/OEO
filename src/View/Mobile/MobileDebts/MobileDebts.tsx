import React, { useState } from 'react';
import { Plus, Search, X, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import type { DebtsController } from '../../Screen/Debts/useDebtsController';
import { DebtOverlays } from '../../Screen/Debts/parts/DebtOverlays';
import { DebtCard } from '../../Screen/Debts/parts/DebtCard';
import { filterDebts, sortDebts, STATUS_FILTERS } from '../../Screen/Debts/debtUtils';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import { StateIcon } from '../../widget/StateIcon';

// Phone version of the debts page (the funds' loans): search, status filter, the cards
export const MobileDebts: React.FC<{ c: DebtsController }> = ({ c }) => {
  // The status the address asks for (?status=unpaid, from the home page's unpaid debts card)
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get('status') || '');
  const [query, setQuery] = useState('');

  const visible = sortDebts(filterDebts(c.debts, '', status, query));

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الديون" />

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالدائن أو السبب" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
        <MobileSelect
          label="الحالة"
          icon={Filter}
          value={status || 'all'}
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          onChange={v => setStatus(v === 'all' ? '' : v)}
          renderTrigger={open => (
            <button type="button" className={`tk-filter-btn ${status ? 'active' : ''}`} onClick={open}>
              <Filter size={15} />
              <span><small>الحالة</small><strong>{STATUS_FILTERS.find(f => f.value === status)?.label}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
      </div>

      {c.loading && !c.debts.length ? <PageLoader mobile text="جاري تحميل الديون..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon />
        ) : (
          <div className="tk-list">{visible.map(d => <DebtCard key={d.id} debt={d} onOpen={c.openDebt} actions={c.actionsFor(d)} compact />)}</div>
        )}

      {c.can('add') && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="استلاف جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <DebtOverlays c={c} mobile />
    </div>
  );
};
