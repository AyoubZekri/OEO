import React, { useState } from 'react';
import { Plus, Search, Landmark, Inbox, RefreshCw, Scale, HandCoins, AlertTriangle, Wallet } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileDebts } from '../../Mobile/MobileDebts/MobileDebts';
import { moneyText } from '../../Mobile/MobileContracts/contractUtils';
import { TaskLoader } from '../Tasks/parts/TaskLoader';
import { useDebtsController } from './useDebtsController';
import { DebtCard } from './parts/DebtCard';
import { DebtOverlays } from './parts/DebtOverlays';
import { debtTotals, filterDebts, sortDebts, STATUS_FILTERS } from './debtUtils';
import '../Tasks/Tasks.css';
import '../Travels/Travels.css';
import './Debts.css';

// The funds' debts: money borrowed from someone and put into a fund, and what is left to pay back.
// (Purchases on credit belong to the payments & expenses page.)
export const Debts: React.FC = () => {
  const c = useDebtsController({ kind: 'loan' });
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  if (isMobile) return <MobileDebts c={c} />;

  const totals = debtTotals(c.debts);
  const borrowed = c.debts.reduce((s, d) => s + d.amount, 0);
  const visible = sortDebts(filterDebts(c.debts, '', status, query));
  const stats = [
    { icon: Scale, label: 'الباقي للتسديد', value: moneyText(totals.remaining), hint: `${totals.open} دين غير مسدد`, tone: 'red' },
    { icon: Wallet, label: 'إجمالي المبالغ المستلفة', value: moneyText(borrowed), hint: `${c.debts.length} دين`, tone: 'blue' },
    { icon: HandCoins, label: 'المسدد', value: moneyText(totals.repaid), hint: `${totals.paid} دين مسدد بالكامل`, tone: 'green' },
    { icon: AlertTriangle, label: 'المتأخرة', value: String(totals.overdue), hint: totals.overdue ? 'تجاوزت تاريخ الاستحقاق' : 'لا توجد ديون متأخرة', tone: 'amber', late: totals.overdue > 0 },
  ];

  return (
    <div className="tk-page tk-scope">
      <div className="db-stats">
        {stats.map(s => (
          <div key={s.label} className={`tone-${s.tone}`}>
            <span className="db-stat-icon"><s.icon size={22} /></span>
            <span className="db-stat-text">
              <small>{s.label}</small>
              <b>{s.value}</b>
              <em className={s.late ? 'late' : ''}>{s.hint}</em>
            </span>
          </div>
        ))}
      </div>

      <div className="tk-actions-row">
        <div className="search-box">
          <Search size={18} />
          <input type="text" className="search-input" placeholder="ابحث بالدائن أو السبب أو الصندوق..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <CustomDropdown
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={status || 'all'}
          onChange={v => setStatus(v === 'all' ? '' : v)}
        />
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />استلاف جديد</button>}
      </div>

      {c.loading && !c.debts.length ? <TaskLoader mobile={false} text="جاري تحميل الديون..." />
        : c.error ? (
          <div className="tk-state">
            <Landmark size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.debts.length ? 'لا توجد ديون بهذه التصفية' : 'لا توجد ديون بعد'}</p></div>
        ) : (
          <div className="tk-grid">
            {visible.map(d => <DebtCard key={d.id} debt={d} onOpen={c.openDebt} onRepay={c.can('repay') ? c.openRepay : undefined} />)}
          </div>
        )}

      <DebtOverlays c={c} mobile={false} />
    </div>
  );
};
