import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Approutes } from '../../../core/constant/routes';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Search, Inbox, Filter, ChevronDown } from 'lucide-react';
import { useOperationsController } from './OperationsController';
import type { OperationsFilter } from './OperationsController';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { moneyText } from '../../Mobile/MobileContracts/contractUtils';
import './Operations.css';

// Same amount format as the desktop: 1.250.000,00 د.ج
const formatAmount = moneyText;

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
  const { groups, filter, setFilter, search, setSearch } = controller;

  // Go back in history, or to home when the page was opened directly
  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(Approutes.Finance);
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
        {/* The operation type: a sheet from the bottom */}
        <MobileSelect
          label="نوع العملية"
          icon={Filter}
          value={filter}
          options={FILTERS.map(f => ({ value: f.key, label: f.label }))}
          onChange={v => setFilter(v as OperationsFilter)}
          renderTrigger={open => (
            <button type="button" className={`ops-filter-btn ${filter !== 'all' ? 'active' : ''}`} onClick={open}>
              <span className="ops-filter-icon"><Filter size={15} /></span>
              <span><small>نوع العملية</small><strong>{FILTERS.find(f => f.key === filter)?.label}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
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
                const dir = op.direction;
                const Icon = DIRECTION_ICON[dir];
                const date = new Date(op.date);
                return (
                  <li key={op.id} className={`ops-item ${dir}`}>
                    {/* In the corner: in / out / transfer, with the operation's type */}
                    <span className="ops-item-tag"><Icon size={14} />{op.type}</span>
                    {/* The name in full, the amount under it, then the date */}
                    <span className="ops-item-name">{op.name}</span>
                    <span className="ops-item-amount">
                      {/* No sign: the colour says it (green in, red out, blue transfer) */}
                      {formatAmount(op.amount)}
                    </span>
                    {!isNaN(date.getTime()) && (
                      <span className="ops-item-date">{new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</span>
                    )}
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
