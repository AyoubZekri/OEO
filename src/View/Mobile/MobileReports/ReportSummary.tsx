import React from 'react';
import { FileText, Landmark, CreditCard, AlertCircle, Wallet, ArrowDownLeft, ArrowUpRight, Bus } from 'lucide-react';
import type { useReportsController } from '../../Screen/Reports/ReportsController';
import { moneyText } from '../MobileContracts/contractUtils';
import { fundIcon } from '../MobileFunds/fundUtils';
import { CATEGORIES } from './reportUtils';

type Icon = React.ComponentType<{ size?: number }>;

const Stat: React.FC<{ icon: Icon; label: string; value: string; tone: string }> = ({ icon: I, label, value, tone }) => (
  <div className={`mrp-stat tone-${tone}`}>
    <span><I size={16} /></span>
    <small>{label}</small>
    <strong dir="ltr">{value}</strong>
  </div>
);

// The report's totals: the same numbers as the desktop metric cards
export const ReportSummary: React.FC<{ c: ReturnType<typeof useReportsController> }> = ({ c }) => {
  const meta = CATEGORIES.find(x => x.id === c.activeCategory) || CATEGORIES[0];

  let main: { label: string; value: number };
  let stats: React.ReactNode;
  let extra: React.ReactNode = null;

  if (c.activeCategory === 'individuals') {
    const s = c.getIndividualSummary();
    main = { label: 'قيمة العقد', value: s.contractValue };
    stats = (
      <>
        <Stat icon={FileText} label="المستحق حتى اليوم" value={moneyText(s.due)} tone="red" />
        <Stat icon={AlertCircle} label="المتبقي من العقد" value={moneyText(s.remaining)} tone="violet" />
        <Stat icon={Landmark} label="المدفوع" value={moneyText(s.paid)} tone="green" />
        <Stat icon={CreditCard} label="السلف" value={moneyText(s.advances)} tone="amber" />
      </>
    );
  } else if (c.activeCategory === 'expenses') {
    const s = c.getExpenseSummary();
    main = { label: 'الصافي (المصروف − إرجاع السلف)', value: s.net };
    stats = (
      <>
        <Stat icon={CreditCard} label="إجمالي المصروف" value={moneyText(s.spent)} tone="red" />
        <Stat icon={Landmark} label="إرجاع السلف" value={moneyText(s.returned)} tone="green" />
        <Stat icon={FileText} label="عدد العمليات" value={String(s.count)} tone="blue" />
      </>
    );
  } else if (c.activeCategory === 'contracts') {
    const s = c.getContractsSummary();
    const pct = s.totalValue > 0 ? Math.min(100, Math.round((s.totalPaid / s.totalValue) * 100)) : 0;
    main = { label: 'إجمالي قيمة العقود', value: s.totalValue };
    stats = (
      <>
        <Stat icon={Landmark} label="إجمالي المدفوع" value={moneyText(s.totalPaid)} tone="green" />
        <Stat icon={AlertCircle} label="المتبقي" value={moneyText(s.totalRemaining)} tone="red" />
      </>
    );
    extra = (
      <div className="mrp-progress">
        <div className="mrp-bar"><div style={{ width: `${pct}%` }} /></div>
        <span>تم دفع <b>{pct}%</b> من قيمة العقود</span>
      </div>
    );
  } else {
    const s = c.getFundsSummary();
    main = { label: c.toDate ? `الرصيد في ${c.toDate}` : 'الرصيد الحالي', value: s.totalBalance };
    // Deposits are shown per fund in the list below
    stats = <Stat icon={CreditCard} label="المدفوع من الصندوق" value={moneyText(s.totalPaid)} tone="red" />;
    extra = s.fundsWithBalance.length > 0 && (
      <ul className="mrp-funds">
        {s.fundsWithBalance.map(f => {
          const ic = fundIcon(f.icon);
          return (
            <li key={f.id} className={`ic-${ic.value}`}>
              <span className="mrp-fund-icon"><ic.icon size={16} /></span>
              <span className="mrp-fund-text">
                <strong>{f.name}</strong>
                <small>
                  <em className="in"><ArrowDownLeft size={11} /> إيداعات <span dir="ltr">{moneyText(f.totalDeposits)}</span></em>
                  <em className="out"><ArrowUpRight size={11} /> <span dir="ltr">{moneyText(f.totalWithdrawals)}</span></em>
                </small>
              </span>
              <b dir="ltr">{moneyText(f.balance)}</b>
            </li>
          );
        })}
      </ul>
    );
  }

  // What the active contracts commit the club to each month (owed, not paid)
  const k = c.activeCategory === 'expenses' || c.activeCategory === 'contracts' ? c.getContractCommitments() : null;

  return (
    <>
    <section className="mrp-hero">
      <div className="mrp-hero-top">
        <span className="mrp-hero-icon"><meta.icon size={24} /></span>
        <div>
          <small>{meta.label} · {main.label}</small>
          <strong dir="ltr">{moneyText(main.value)}</strong>
        </div>
      </div>
      {stats && <div className="mrp-stats">{stats}</div>}
      {extra}
      {c.activeCategory === 'funds' && <p className="mrp-hint"><Wallet size={12} /> رصيد كل صندوق في نهاية الفترة، مع ما دخله وما خرج منه خلالها</p>}
    </section>

    {k && (
      <section className="mrp-commit">
        <div className="mrp-commit-row tone-violet">
          <span className="mrp-commit-icon"><Wallet size={17} /></span>
          <span className="mrp-commit-text"><strong>مجموع الرواتب الشهرية</strong><small>{k.salaryCount} عضو يتقاضى راتباً شهرياً</small></span>
          <b dir="ltr">{moneyText(k.salaryTotal)}</b>
        </div>
        <div className="mrp-commit-row tone-blue">
          <span className="mrp-commit-icon"><Bus size={17} /></span>
          <span className="mrp-commit-text"><strong>مجموع مصاريف التنقل</strong><small>{k.transportCount} عضو لديه تنقل في العقد</small></span>
          <b dir="ltr">{moneyText(k.transportTotal)}</b>
        </div>
        <div className="mrp-commit-total">
          <span>المجموع الشهري</span>
          <b dir="ltr">{moneyText(Math.round((k.salaryTotal + k.transportTotal) * 100) / 100)}</b>
        </div>
      </section>
    )}
    </>
  );
};
