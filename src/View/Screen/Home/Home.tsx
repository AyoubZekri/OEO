import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHomeController } from './HomeController';
import { useNavigate } from 'react-router-dom';
import { Approutes } from '../../../core/constant/routes';
import { Wallet, History, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, HandCoins, Package } from 'lucide-react';
import { MobileHome } from '../../Mobile/MobileHome/MobileHome';
import type { FundFlow } from './HomeController';
import type { Operation, OperationDirection } from '../Operations/operation_model';
import { useCan } from '../../../core/functions/useCan';
import './Home.css';

// Payments and withdrawals are money going out; deposits and returns come in; transfers only move money between funds
const dirOf = (op: Operation) => op.direction;
const SIGN: Record<OperationDirection, string> = { out: '-', in: '+', transfer: '' };
const AMOUNT_CLASS: Record<OperationDirection, string> = { out: 'amount-negative', in: 'amount-positive', transfer: '' };

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const controller = useHomeController();
  const { metrics, recentOperations, formatCurrency } = controller;
  const navigate = useNavigate();
  // Each section of the page has its own permission (المالية)
  const can = useCan();
  const see = (section: string) => can('dashboard', section);
  // The income: the funds report, its deposits
  const openIncome = () => navigate(`${Approutes.Reports}?category=funds&type=${encodeURIComponent('إيداع')}`);
  // The outgoings: the expenses report
  const openOutgoings = () => navigate(`${Approutes.Reports}?category=expenses`);
  // The unpaid debts: the debts page, filtered on them
  // The season expenses: the payments and expenses page
  const openPayments = () => navigate(Approutes.Payments);
  const openUnpaidDebts = () => navigate(`${Approutes.Debts}?status=unpaid`);
  // The unpaid in-kind debts: the payments page, its purchases on credit not paid at all or partly paid
  const openUnpaidCredit = () => navigate(`${Approutes.Payments}?paid=unpaid`);

  const getBadgeClass = (type: string) => {
    if (type === 'إيداع' || type === 'دفعة عقد' || type === 'راتب') return 'badge badge-green';
    if (type === 'سحب' || type === 'تسديد دين') return 'badge badge-red';
    if (type === 'استلاف') return 'badge badge-blue';
    if (type === 'تحويل') return 'badge badge-blue';
    return 'badge badge-purple';
  };

  return (
    <div className="home-container">
      {/* Phone layout */}
      <div className="mobile-dashboard-wrapper">
        <MobileHome controller={controller} />
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="desktop-dashboard-wrapper">
      {/* Financial Metrics Grid */}
      {see('viewExpenses') && <div className="metrics-grid">
        <div className="metric-card highlight clickable" role="button" tabIndex={0} onClick={openPayments} onKeyDown={e => { if (e.key === 'Enter') openPayments(); }}>
          <div className="metric-icon"><Wallet size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.total_expenses')}</h3>
            <p className="amount">{formatCurrency(metrics.totalExpenses)}</p>
          </div>
        </div>
      </div>}

      {/* Income and outgoings: one block across the page */}
      {see('viewFlows') && <section className="home-block">
        <div className="section-header">
          <h2 className="section-title"><ArrowLeftRight size={24} />المداخيل والمخاريج</h2>
        </div>
        <div className="metrics-grid">
        {/* Each fund's income and outgoings */}
        {([
          { kind: 'in', title: 'المداخيل', tone: 'success', icon: ArrowDownLeft, value: (f: FundFlow) => f.income },
          { kind: 'out', title: 'المخاريج', tone: 'danger', icon: ArrowUpRight, value: (f: FundFlow) => f.outcome },
        ] as const).map(c => (
          <div
            key={c.kind}
            className={`metric-card ${c.tone} metric-flows clickable`}
            role="button"
            tabIndex={0}
            onClick={c.kind === 'in' ? openIncome : openOutgoings}
            onKeyDown={e => { if (e.key === 'Enter') (c.kind === 'in' ? openIncome : openOutgoings)(); }}
          >
            <div className="metric-head">
            <div className="metric-icon"><c.icon size={28} /></div>
            <div className="metric-info">
              <h3>{c.title}</h3>
              <p className="amount">{formatCurrency(controller.fundFlows.reduce((sum, f) => sum + c.value(f), 0) + (c.kind === 'out' ? controller.unfundedOutcome : 0))}</p>
            </div>
            </div>
              <ul className="metric-funds">
                {controller.fundFlows.map(f => (
                  <li key={f.fund.id}>
                    <span>{f.fund.name}</span>
                    <b>{formatCurrency(c.value(f))}</b>
                  </li>
                ))}
                {c.kind === 'out' && controller.unfundedOutcome > 0 && (
                  <li>
                    <span>صندوق خاص</span>
                    <b>{formatCurrency(controller.unfundedOutcome)}</b>
                  </li>
                )}
              </ul>
          </div>
        ))}
        </div>
      </section>}

      {/* Unpaid debts: one block across the page */}
      {see('viewDebts') && <section className="home-block">
        <div className="section-header">
          <h2 className="section-title"><HandCoins size={24} />الديون</h2>
        </div>
        <div className="metrics-grid">
        <div className="metric-card danger clickable" role="button" tabIndex={0} onClick={openUnpaidDebts} onKeyDown={e => { if (e.key === 'Enter') openUnpaidDebts(); }}>
          <div className="metric-icon"><HandCoins size={28} /></div>
          <div className="metric-info">
            <h3>غير مسددة</h3>
            <p className="amount">{formatCurrency(controller.unpaidLoans.reduce((sum, d) => sum + (Number(d.remaining) || 0), 0))}</p>
          </div>
        </div>

        <div className="metric-card warning clickable" role="button" tabIndex={0} onClick={openUnpaidCredit} onKeyDown={e => { if (e.key === 'Enter') openUnpaidCredit(); }}>
          <div className="metric-icon"><Package size={28} /></div>
          <div className="metric-info">
            <h3>عينية غير مسددة</h3>
            <p className="amount">{formatCurrency(controller.unpaidCredit.reduce((sum, d) => sum + (Number(d.remaining) || 0), 0))}</p>
          </div>
        </div>
        </div>
      </section>}

      {/* Operations Section */}
      {see('viewOperations') && <div className="operations-section">
        <div className="section-header">
          <h2 className="section-title">
            <History size={24} />
            {t('home.recent_operations')}
          </h2>
          <button 
            className="btn-cancel" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => controller.setIsOperationsDialogOpen(true)}
          >
            {t('home.view_all')} <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>{t('home.name')}</th>
                <th>{t('home.date')}</th>
                <th>{t('home.op_type')}</th>
                <th>{t('home.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map(op => (
                <tr key={op.id}>
                  <td data-label={t('home.name', 'الاسم')}>
                    <div className="op-name-cell">
                      <div className="op-icon-wrapper">
                        {dirOf(op) === 'out' ? <ArrowUpRight size={18} color="#ef4444" /> : dirOf(op) === 'in' ? <ArrowDownLeft size={18} color="#10b981" /> : <ArrowLeftRight size={18} color="#3b82f6" />}
                      </div>
                      <span>{op.name}</span>
                    </div>
                  </td>
                  <td className="date-cell" data-label={t('home.date', 'التاريخ')}>{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(op.date))}</td>
                  <td data-label={t('home.op_type', 'النوع')}>
                    <span className={getBadgeClass(op.type)}>
                      {op.type}
                    </span>
                  </td>
                  <td className={`amount-cell ${AMOUNT_CLASS[dirOf(op)]}`} data-label={t('home.amount', 'المبلغ')}>
                    {SIGN[dirOf(op)]}{formatCurrency(op.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
      </div>

      {/* All Operations Dialog */}
      {controller.isOperationsDialogOpen && (
        <div className="dialog-overlay" onClick={() => controller.setIsOperationsDialogOpen(false)}>
          <div className="dialog-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{t('home.all_operations', 'كل العمليات')}</h2>
              <button className="close-btn" onClick={() => controller.setIsOperationsDialogOpen(false)}>&times;</button>
            </div>
            <div className="dialog-body">
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>{t('home.name')}</th>
                      <th>{t('home.date')}</th>
                      <th>{t('home.op_type')}</th>
                      <th>{t('home.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controller.allOperations.map(op => (
                      <tr key={op.id}>
                        <td data-label={t('home.name', 'الاسم')}>
                          <div className="op-name-cell">
                            <div className="op-icon-wrapper">
                              {dirOf(op) === 'out' ? <ArrowUpRight size={18} color="#ef4444" /> : dirOf(op) === 'in' ? <ArrowDownLeft size={18} color="#10b981" /> : <ArrowLeftRight size={18} color="#3b82f6" />}
                            </div>
                            <span>{op.name}</span>
                          </div>
                        </td>
                        <td className="date-cell" data-label={t('home.date', 'التاريخ')}>{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(op.date))}</td>
                        <td data-label={t('home.op_type', 'النوع')}>
                          <span className={getBadgeClass(op.type)}>
                            {op.type}
                          </span>
                        </td>
                        <td className={`amount-cell ${AMOUNT_CLASS[dirOf(op)]}`} data-label={t('home.amount', 'المبلغ')}>
                          {SIGN[dirOf(op)]}{formatCurrency(op.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
