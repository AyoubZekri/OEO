import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHomeController } from './HomeController';
import { Wallet, Users, UserCog, CreditCard, Landmark, CalendarClock, History, ArrowUpRight, ArrowDownLeft, TrendingDown } from 'lucide-react';
import './Home.css';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const controller = useHomeController();
  const { metrics, recentOperations, formatCurrency } = controller;

  const getBadgeClass = (type: string) => {
    if (type === 'إيداع' || type === 'دفعة عقد' || type === 'راتب') return 'badge badge-green';
    if (type === 'سحب') return 'badge badge-red';
    if (type === 'تحويل') return 'badge badge-blue';
    return 'badge badge-purple';
  };

  if (controller.isLoading) {
    return (
      <div className="home-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Financial Metrics Grid */}
      {/* Financial Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-info">
            <h3>{t('home.total_expenses')}</h3>
            <p className="amount">{formatCurrency(metrics.totalExpenses)}</p>
          </div>
          <div className="metric-icon"><Wallet size={32} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><Users size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.paid_players')}</h3>
            <p className="amount">{formatCurrency(metrics.paidToPlayers)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><UserCog size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.paid_staff')}</h3>
            <p className="amount">{formatCurrency(metrics.paidToStaff)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><CreditCard size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.other_expenses')}</h3>
            <p className="amount">{formatCurrency(metrics.otherExpenses)}</p>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon"><TrendingDown size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.total_debts')}</h3>
            <p className="amount">{formatCurrency(metrics.totalDebts)}</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon"><CalendarClock size={28} color="#333333" /></div>
          <div className="metric-info">
            <h3>{t('home.upcoming_entitlements', 'المستحقات القادمة')}</h3>
            <p className="amount">{formatCurrency(metrics.upcomingEntitlements)}</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon"><Landmark size={28} /></div>
          <div className="metric-info">
            <h3>{t('home.total_balance', 'إجمالي رصيد الصناديق')}</h3>
            <p className="amount">{formatCurrency(metrics.totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Operations Section */}
      <div className="operations-section">
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
                  <td>
                    <div className="op-name-cell">
                      <div className="op-icon-wrapper">
                        {op.type === 'سحب' ? <ArrowUpRight size={18} color="#ef4444" /> : <ArrowDownLeft size={18} color="#10b981" />}
                      </div>
                      <span>{op.name}</span>
                    </div>
                  </td>
                  <td className="date-cell">{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(op.date))}</td>
                  <td>
                    <span className={getBadgeClass(op.type)}>
                      {op.type}
                    </span>
                  </td>
                  <td className={`amount-cell ${op.type === 'سحب' ? 'amount-negative' : 'amount-positive'}`}>
                    {op.type === 'سحب' ? '-' : '+'}{formatCurrency(op.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                        <td>
                          <div className="op-name-cell">
                            <div className="op-icon-wrapper">
                              {op.type === 'سحب' ? <ArrowUpRight size={18} color="#ef4444" /> : <ArrowDownLeft size={18} color="#10b981" />}
                            </div>
                            <span>{op.name}</span>
                          </div>
                        </td>
                        <td className="date-cell">{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(op.date))}</td>
                        <td>
                          <span className={getBadgeClass(op.type)}>
                            {op.type}
                          </span>
                        </td>
                        <td className={`amount-cell ${op.type === 'سحب' ? 'amount-negative' : 'amount-positive'}`}>
                          {op.type === 'سحب' ? '-' : '+'}{formatCurrency(op.amount)}
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
