import React from 'react';
import { CalendarRange, ChevronDown, User, Tag, Wallet, ArrowRightLeft, Filter, Layers } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect, type MobileSelectOption } from '../widgets/MobileSelect';
import type { useReportsController } from '../../Screen/Reports/ReportsController';
import type { ReportCategory } from '../../Screen/Reports/report_model';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { groupOf } from '../../Screen/Reports/reportMath';
import {
  CATEGORIES, INDIVIDUAL_TABS, PERIODS, INDIVIDUAL_NATURES, EXPENSE_TYPES, expenseNatures, FUND_TX_TYPES, withAll,
} from './reportUtils';
import { ReportSummary } from './ReportSummary';
import { ReportRecords } from './ReportRecords';
import './MobileReports.css';

interface MobileReportsProps {
  c: ReturnType<typeof useReportsController>;
  /** Report categories the user may open */
  allowed: ReportCategory[];
  canDeleteTransaction: boolean;
}

// One filter button that opens a bottom sheet
const Pick: React.FC<{
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  value: string;
  options: MobileSelectOption[];
  onChange: (v: string) => void;
  searchable?: boolean;
  wide?: boolean;
}> = ({ label, icon: Icon, value, options, onChange, searchable, wide }) => (
  <MobileSelect
    label={label}
    icon={Icon}
    value={value}
    options={options}
    onChange={onChange}
    searchable={searchable}
    renderTrigger={open => (
      <button type="button" className={`mrp-filter ${value ? 'active' : ''} ${wide ? 'wide' : ''}`} onClick={open}>
        <Icon size={16} />
        <span><small>{label}</small><strong>{options.find(o => o.value === value)?.label || 'الكل'}</strong></span>
        <ChevronDown size={16} />
      </button>
    )}
  />
);

// Phone version of the financial reports: category tiles, filters in bottom sheets, summary and record cards
export const MobileReports: React.FC<MobileReportsProps> = ({ c, allowed, canDeleteTransaction }) => {
  const categories = CATEGORIES.filter(x => allowed.includes(x.id));
  const cat = c.activeCategory;
  const period = PERIODS.find(p => p.value === c.presetDate);

  const memberOptions = [
    { value: '', label: 'الكل' },
    ...c.members
      .filter(m => (cat === 'individuals' ? groupOf(m.type) === groupOf(c.activeIndividualTab) : true))
      .map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}`, group: cat === 'contracts' ? TYPE_LABELS[m.type] || 'أخرى' : undefined })),
  ];

  return (
    <div className="mrp-page">
      <MobileAppBar title="التقارير" />

      {/* Report category */}
      <div className="mrp-cats">
        {categories.map(x => (
          <button key={x.id} type="button" className={`tone-${x.tone} ${cat === x.id ? 'on' : ''}`} onClick={() => c.setActiveCategory(x.id)}>
            <span><x.icon size={19} /></span>
            {x.short}
          </button>
        ))}
      </div>

      {cat === 'individuals' && (
        <div className="mrp-seg">
          {INDIVIDUAL_TABS.map(tab => (
            <button key={tab.id} type="button" className={c.activeIndividualTab === tab.id ? 'on' : ''} onClick={() => c.setActiveIndividualTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <section className="mrp-filters-card">
        <div className="mrp-filters-head"><Filter size={15} /> التصفية</div>
        <MobileSelect
          label="الفترة الزمنية"
          icon={CalendarRange}
          value={c.presetDate}
          options={PERIODS}
          onChange={c.handlePresetDateChange}
          renderTrigger={open => (
            <button type="button" className={`mrp-filter wide ${c.presetDate ? 'active' : ''}`} onClick={open}>
              <CalendarRange size={16} />
              <span>
                <small>الفترة الزمنية</small>
                <strong>{period?.label || 'كل الفترات'}</strong>
              </span>
              {(c.fromDate || c.toDate) && <em dir="ltr">{c.fromDate || '…'} → {c.toDate || '…'}</em>}
              <ChevronDown size={16} />
            </button>
          )}
        />
        {c.presetDate === 'custom' && (
          <div className="mrp-dates">
            <label><small>من</small><input type="date" dir="ltr" value={c.fromDate} onChange={e => c.setFromDate(e.target.value)} /></label>
            <label><small>إلى</small><input type="date" dir="ltr" value={c.toDate} onChange={e => c.setToDate(e.target.value)} /></label>
          </div>
        )}

        <div className="mrp-grid">
          {(cat === 'individuals' || cat === 'contracts') && (
            <Pick label="العضو" icon={User} value={c.selectedMember} options={memberOptions} onChange={c.setSelectedMember} searchable />
          )}
          {cat === 'individuals' && (
            <Pick label="طبيعة الدفع" icon={Tag} value={c.individualPaymentTypeFilter} options={withAll(INDIVIDUAL_NATURES)} onChange={c.setIndividualPaymentTypeFilter} searchable />
          )}
          {cat === 'expenses' && (
            <>
              <Pick
                label="نوع العملية"
                icon={Layers}
                value={c.expenseTransactionTypeFilter}
                options={withAll(EXPENSE_TYPES)}
                onChange={v => { c.setExpenseTransactionTypeFilter(v); c.setExpenseTypeFilter(''); }}
              />
              <Pick label="طبيعة المصروف" icon={Tag} value={c.expenseTypeFilter} options={withAll(expenseNatures(c.expenseTransactionTypeFilter))} onChange={c.setExpenseTypeFilter} searchable />
            </>
          )}
          {cat === 'funds' && (
            <>
              <Pick label="الصندوق" icon={Wallet} value={c.fundFilter} options={[{ value: '', label: 'الكل' }, ...c.funds.map(f => ({ value: f.id, label: f.name }))]} onChange={c.setFundFilter} />
              <Pick label="نوع العملية" icon={ArrowRightLeft} value={c.fundTransactionTypeFilter} options={withAll(FUND_TX_TYPES)} onChange={c.setFundTransactionTypeFilter} />
            </>
          )}
        </div>
      </section>

      {c.isLoading ? (
        <MobileLoader text="جاري تحضير التقرير..." />
      ) : categories.length === 0 ? (
        <p className="mrp-none">لا تملك صلاحية عرض التقارير.</p>
      ) : (
        <>
          <ReportSummary c={c} />
          <ReportRecords key={`${cat}-${c.presetDate}-${c.selectedMember}`} c={c} canDeleteTransaction={canDeleteTransaction} />
        </>
      )}
    </div>
  );
};
