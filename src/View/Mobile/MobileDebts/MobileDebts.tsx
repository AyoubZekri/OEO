import React, { useState } from 'react';
import { Plus, Landmark, Search, X, Filter, ChevronDown, Inbox, RefreshCw, AlertTriangle, HandCoins, Wallet } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { moneyText } from '../MobileContracts/contractUtils';
import { TaskLoader } from '../../Screen/Tasks/parts/TaskLoader';
import type { DebtsController } from '../../Screen/Debts/useDebtsController';
import { DebtOverlays } from '../../Screen/Debts/parts/DebtOverlays';
import { DebtCard } from '../../Screen/Debts/parts/DebtCard';
import { debtTotals, filterDebts, sortDebts, STATUS_FILTERS } from '../../Screen/Debts/debtUtils';
import '../../Screen/Tasks/Tasks.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';

// Phone version of the debts page (the funds' loans): what is left in the hero, search, status filter, the cards
export const MobileDebts: React.FC<{ c: DebtsController }> = ({ c }) => {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const totals = debtTotals(c.debts);
  const borrowed = c.debts.reduce((s, d) => s + d.amount, 0);
  const visible = sortDebts(filterDebts(c.debts, '', status, query));

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الديون" />

      <section className="tk-hero">
        <div className="tk-hero-top">
          <span className="tk-hero-icon"><Landmark size={26} /></span>
          <div>
            <small>الباقي للتسديد</small>
            <strong className="db-hero-money">{moneyText(totals.remaining)}</strong>
          </div>
        </div>
        <div className="tk-hero-tiles db-hero-tiles">
          {[
            { label: 'المستلف', v: moneyText(borrowed), icon: Wallet, tone: 'blue' },
            { label: 'المسدد', v: moneyText(totals.repaid), icon: HandCoins, tone: 'green' },
            { label: 'غير مسددة', v: String(totals.open), icon: Landmark, tone: 'orange' },
          ].map(t => (
            <div key={t.label} className={`tone-${t.tone}`}>
              <t.icon size={14} />
              <strong>{t.v}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
        {totals.overdue > 0 && <p className="db-hero-late"><AlertTriangle size={14} />{totals.overdue} دين متأخر عن تاريخ استحقاقه</p>}
      </section>

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالدائن أو السبب..." />
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

      {c.loading && !c.debts.length ? <TaskLoader mobile text="جاري تحميل الديون..." />
        : c.error ? (
          <div className="tk-state">
            <Landmark size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.debts.length ? 'لا توجد ديون بهذه التصفية' : 'لا توجد ديون بعد'}</p></div>
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
