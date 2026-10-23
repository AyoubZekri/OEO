import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown, Inbox, RefreshCw, Package } from 'lucide-react';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import { useDebtsController } from '../Debts/useDebtsController';
import { DebtCard } from '../Debts/parts/DebtCard';
import { DebtOverlays } from '../Debts/parts/DebtOverlays';
import { sortDebts, type Debt } from '../Debts/debtUtils';
import '../../shared/kit.css';
import '../Debts/Debts.css';

type CreditFilter = 'open' | 'partial' | 'paid' | 'all';

const FILTERS: { value: CreditFilter; label: string }[] = [
  { value: 'open', label: 'غير مسددة' },
  { value: 'partial', label: 'مسددة جزئياً' },
  { value: 'paid', label: 'مسددة' },
  { value: 'all', label: 'الكل' },
];

const matches = (d: Debt, f: CreditFilter) => (
  f === 'all' ? true : d.status === f
);

/**
 * Phone: the in-kind debts (purchases on credit) on their own page, opened from the home page —
 * the unpaid ones (nothing paid yet) first, a search (supplier, purchase, nature) and a status filter; a tap opens the debt.
 */
export const CreditDebtsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const c = useDebtsController({ kind: 'purchase' });
  const [filter, setFilter] = useState<CreditFilter>('open');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = sortDebts(c.debts.filter(d => matches(d, filter)))
    .filter(d => !q || [d.creditor, d.title, d.expense_nature].some(v => (v || '').toLowerCase().includes(q)));
  const label = FILTERS.find(f => f.value === filter)?.label;

  return (
    <MobileScreen title="ديون العينة" onBack={onBack}>
      <div className="tk-scope hf-credit">
        <label className="hf-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالمورّد أو المشتريات..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>

        <MobileSelect
          label="الحالة"
          icon={Filter}
          value={filter}
          options={FILTERS.map(f => ({ value: f.value, label: `${f.label} (${c.debts.filter(d => matches(d, f.value)).length})` }))}
          onChange={v => setFilter(v as CreditFilter)}
          renderTrigger={open => (
            <button type="button" className={`tk-filter-btn ${filter !== 'all' ? 'active' : ''}`} onClick={open}>
              <Filter size={15} />
              <span><small>الحالة</small><strong>{label}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />

        {c.loading && !c.debts.length ? <MobileLoader text="جاري تحميل ديون العينة..." />
          : c.error ? (
            <div className="tk-state">
              <Package size={30} /><p>{c.error}</p>
              <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
            </div>
          ) : list.length === 0 ? (
            <div className="tk-state"><Inbox size={32} /><p>{c.debts.length ? 'لا توجد ديون بهذه التصفية' : 'لا توجد ديون عينة'}</p></div>
          ) : (
            <div className="tk-list">{list.map(d => <DebtCard key={d.id} debt={d} onOpen={c.openDebt} actions={c.actionsFor(d)} compact />)}</div>
          )}
      </div>

      <div className="tk-scope"><DebtOverlays c={c} mobile /></div>
    </MobileScreen>
  );
};
