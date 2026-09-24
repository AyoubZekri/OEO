import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Search, Inbox, TrendingUp, TrendingDown } from 'lucide-react';
import { useOperationsController } from './OperationsController';
import type { OperationsFilter } from './OperationsController';
import { getOperationDirection } from './operation_model';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import './Operations.css';

const formatAmount = (amount: number) => `${Math.round(amount || 0).toLocaleString('en-US')} د.ج`;

const FILTERS: { key: OperationsFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'in', label: 'الواردات' },
  { key: 'out', label: 'المصاريف' },
  { key: 'transfer', label: 'التحويلات' },
];

const DIRECTION_ICON = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  transfer: ArrowLeftRight,
};

export const Operations: React.FC = () => {
  const navigate = useNavigate();
  const controller = useOperationsController();
  const { totals, groups, filter, setFilter, search, setSearch } = controller;

  // Go back in history, or to home when the page was opened directly
  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="ops-page">
      <div className="ops-appbar-slot">
      <header className="ops-appbar">
        <button className="ops-back" onClick={goBack} aria-label="رجوع">
          <ArrowRight size={22} />
        </button>
        <div className="ops-appbar-title">
          <h1>آخر العمليات</h1>
        </div>
        <span className="ops-appbar-spacer" aria-hidden="true" />
      </header>
      </div>

      <section className="ops-summary">
        <div className="ops-summary-card in">
          <span className="ops-summary-icon"><TrendingUp size={20} /></span>
          <span className="ops-summary-label">الواردات</span>
          <strong>{formatAmount(totals.in)}</strong>
        </div>
        <div className="ops-summary-card out">
          <span className="ops-summary-icon"><TrendingDown size={20} /></span>
          <span className="ops-summary-label">المصاريف</span>
          <strong>{formatAmount(totals.out)}</strong>
        </div>
      </section>

      <div className="ops-toolbar">
        <label className="ops-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="ابحث بالاسم أو نوع العملية..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <div className="ops-chips" role="tablist">
          {FILTERS.map(f => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={`ops-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {controller.isLoading ? (
        <MobileLoader text="جاري تحميل العمليات..." />
      ) : controller.filteredCount === 0 ? (
        <div className="ops-state">
          <Inbox size={40} />
          <p>لا توجد عمليات مطابقة</p>
        </div>
      ) : (
        groups.map(([month, ops]) => (
          <section key={month} className="ops-group">
            <h2 className="ops-group-title">{month}</h2>
            <ul className="ops-list">
              {ops.map(op => {
                const dir = getOperationDirection(op.type);
                const Icon = DIRECTION_ICON[dir];
                const date = new Date(op.date);
                return (
                  <li key={op.id} className={`ops-item ${dir}`}>
                    <span className="ops-item-icon"><Icon size={18} /></span>
                    <div className="ops-item-body">
                      <span className="ops-item-name">{op.name}</span>
                      <span className="ops-item-meta">
                        <span className="ops-item-type">{op.type}</span>
                        {!isNaN(date.getTime()) && (
                          <span>{new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'short' }).format(date)}</span>
                        )}
                      </span>
                    </div>
                    <span className="ops-item-amount">
                      {dir === 'out' ? '-' : dir === 'in' ? '+' : ''}{formatAmount(op.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};
