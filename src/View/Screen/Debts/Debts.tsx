import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileDebts } from '../../Mobile/MobileDebts/MobileDebts';
import { PageLoader } from '../../shared/PageLoader';
import { useDebtsController } from './useDebtsController';
import { DebtCard } from './parts/DebtCard';
import { DebtOverlays } from './parts/DebtOverlays';
import { filterDebts, sortDebts, STATUS_FILTERS } from './debtUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import './Debts.css';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { StateIcon } from '../../widget/StateIcon';

// The funds' debts: money borrowed from someone and put into a fund, and what is left to pay back.
// (Purchases on credit belong to the payments & expenses page.)
export const Debts: React.FC = () => {
  const c = useDebtsController({ kind: 'loan' });
  const isMobile = useIsMobile();
  // The status the address asks for (?status=unpaid, from the home page's unpaid debts card)
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get('status') || '');
  const [query, setQuery] = useState('');

  if (isMobile) return <MobileDebts c={c} />;

  const visible = sortDebts(filterDebts(c.debts, '', status, query));

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => setQuery(v)} placeholder="ابحث بالدائن أو السبب" />
        <CustomDropdown
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={status || 'all'}
          onChange={v => setStatus(v === 'all' ? '' : v)}
        />
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />استلاف جديد</button>}
      </div>

      {c.loading && !c.debts.length ? <PageLoader mobile={false} text="جاري تحميل الديون..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon />
        ) : (
          <div className="tk-grid">
            {visible.map(d => <DebtCard key={d.id} debt={d} onOpen={c.openDebt} actions={c.actionsFor(d)} />)}
          </div>
        )}

      <DebtOverlays c={c} mobile={false} />
    </div>
  );
};
