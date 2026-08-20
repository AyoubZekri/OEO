import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Printer, 
  Users, 
  CreditCard, 
  Briefcase, 
  Landmark,
  SearchX,
  AlertCircle,
  PieChart,
  List
} from 'lucide-react';
import { useReportsController } from './ReportsController';
import type { ReportCategory, IndividualReportType, ExpenseReportType, ContractReportType, FundReportType } from './ReportsController';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useAuth } from '../../../core/context/AuthContext';
import './Reports.css';

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const controller = useReportsController();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const categories = React.useMemo(() => [
    { id: 'individuals' as ReportCategory, label: 'reports.tab_individuals', icon: <Users size={18} />, show: hasAccess(permissions.reports.viewIndividuals) },
    { id: 'expenses' as ReportCategory, label: 'reports.tab_expenses', icon: <CreditCard size={18} />, show: hasAccess(permissions.reports.viewTeams) },
    { id: 'contracts' as ReportCategory, label: 'reports.tab_contracts', icon: <Briefcase size={18} />, show: hasAccess(permissions.reports.viewContracts) },
    { id: 'funds' as ReportCategory, label: 'reports.tab_funds', icon: <Landmark size={18} />, show: hasAccess(permissions.reports.viewFunds) },
  ].filter(c => c.show), [permissions, isFullAccess]);

  React.useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === controller.activeCategory)) {
      controller.setActiveCategory(categories[0].id);
    }
  }, [categories, controller.activeCategory, controller]);

  const renderFilters = () => {
    return (
      <div className="filters-row">
        <div className="filter-group">
          <label>الفترة الزمنية</label>
          <CustomDropdown
            options={[
              { value: '', label: 'كل الفترات' },
              { value: 'today', label: 'اليوم' },
              { value: 'yesterday', label: 'أمس' },
              { value: 'this_week', label: 'هذا الأسبوع' },
              { value: 'last_week', label: 'الأسبوع الماضي' },
              { value: 'this_month', label: 'هذا الشهر' },
              { value: 'last_month', label: 'الشهر الماضي' },
              { value: 'this_year', label: 'هذه السنة' },
              { value: 'last_year', label: 'السنة الماضية' },
              { value: 'custom', label: 'مخصص' }
            ]}
            value={controller.presetDate}
            onChange={(val) => controller.handlePresetDateChange(val)}
            placeholder="اختر الفترة"
          />
        </div>
        <div className="filter-group">
          <label>{t('reports.from_date')}</label>
          <input 
            type="date" 
            className="form-control" 
            value={controller.fromDate}
            onChange={(e) => controller.setFromDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>{t('reports.to_date')}</label>
          <input 
            type="date" 
            className="form-control" 
            value={controller.toDate}
            onChange={(e) => controller.setToDate(e.target.value)}
          />
        </div>
        {['individuals', 'contracts'].includes(controller.activeCategory) && (
          <div className="filter-group">
            <label>{t('reports.select_member')}</label>
            <CustomDropdown
              options={[
                { value: '', label: 'الكل' },
                ...controller.members
                  .filter(m => controller.activeCategory === 'individuals' ? m.type === controller.activeIndividualTab : true)
                  .map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))
              ]}
              value={controller.selectedMember}
              onChange={(val) => controller.setSelectedMember(val)}
              placeholder={t('reports.select_member')}
            />
          </div>
        )}
        {controller.activeCategory === 'individuals' && (
          <>
            <div className="filter-group">
              <label>طبيعة الدفع</label>
              <CustomDropdown
                options={[
                  { value: '', label: 'الكل' },
                  { value: 'راتب شهري', label: 'راتب شهري' },
                  { value: 'رقم دفعة', label: 'رقم دفعة' },
                  { value: 'تسجيل أهداف', label: 'تسجيل أهداف' },
                  { value: 'منحة فوز', label: 'منحة فوز' },
                  { value: 'نتيجة', label: 'نتيجة' },
                  { value: 'تحفيز', label: 'تحفيز' },
                  { value: 'جزء من المستحقات', label: 'جزء من المستحقات' },
                  { value: 'باقي المستحقات', label: 'باقي المستحقات' },
                  { value: 'تسوية جزئية', label: 'تسوية جزئية' },
                  { value: 'تسوية نهائية', label: 'تسوية نهائية' },
                  { value: 'سلفة', label: 'سلفة' },
                  { value: 'إرجاع سلفة', label: 'إرجاع سلفة' },
                  { value: 'استقطاع', label: 'استقطاع' },
                  { value: 'خصم', label: 'خصم' },
                  { value: 'اخرى', label: 'اخرى' }
                ]}
                value={controller.individualPaymentTypeFilter}
                onChange={(val) => controller.setIndividualPaymentTypeFilter(val)}
                placeholder="اختر طبيعة الدفع"
              />
            </div>
          </>
        )}
        {controller.activeCategory === 'expenses' && (
          <div className="filter-group">
            <label>طبيعة المصروف</label>
            <CustomDropdown
              options={[
                { value: '', label: 'الكل' },
                { value: 'تعويض مصاريف', label: 'تعويض مصاريف' },
                { value: 'تنقل', label: 'تنقل' },
                { value: 'اقامة', label: 'اقامة' },
                { value: 'إطعام', label: 'إطعام' },
                { value: 'تجهيزات', label: 'تجهيزات' },
                { value: 'صيانة', label: 'صيانة' },
                { value: 'فواتير', label: 'فواتير' },
                { value: 'كراء', label: 'كراء' },
                { value: 'اخرى', label: 'اخرى' }
              ]}
              value={controller.expenseTypeFilter}
              onChange={(val) => controller.setExpenseTypeFilter(val)}
              placeholder="اختر طبيعة المصروف"
            />
          </div>
        )}
        {controller.activeCategory === 'funds' && (
          <>
            <div className="filter-group">
              <label>الصندوق</label>
              <CustomDropdown
                options={[
                  { value: '', label: 'الكل' },
                  ...controller.funds.map(f => ({ value: f.id, label: f.name }))
                ]}
                value={controller.fundFilter}
                onChange={(val) => controller.setFundFilter(val)}
                placeholder="اختر الصندوق"
              />
            </div>
            <div className="filter-group">
              <label>نوع العملية</label>
              <CustomDropdown
                options={[
                  { value: '', label: 'الكل' },
                  { value: 'إيداع', label: 'إيداع' },
                  { value: 'سحب', label: 'سحب' },
                  { value: 'تحويل', label: 'تحويل' }
                ]}
                value={controller.fundTransactionTypeFilter}
                onChange={(val) => controller.setFundTransactionTypeFilter(val)}
                placeholder="اختر نوع العملية"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSubTabs = () => {
    if (controller.activeCategory === 'individuals') {
      const tabs: { id: IndividualReportType, label: string }[] = [
        { id: 'player', label: 'reports.player_statement' },
        { id: 'coach', label: 'reports.coach_statement' },
        { id: 'employee', label: 'reports.employee_statement' }
      ];
      return (
        <div className="sub-tabs-container">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`sub-tab-btn ${controller.activeIndividualTab === tab.id ? 'active' : ''}`}
              onClick={() => controller.setActiveIndividualTab(tab.id)}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      );
    }
    
    if (controller.activeCategory === 'expenses') {
      return null;
    }

    if (controller.activeCategory === 'contracts') {
      return null;
    }

    if (controller.activeCategory === 'funds') {
      return null;
    }
    
    return null;
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <SearchX size={48} />
      <p>{t('reports.no_data')}</p>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>{t('reports.title')}</h2>
        <div className="reports-actions">
          <button className="btn-primary" onClick={controller.handlePrint}>
            <Printer size={18} style={{ marginInlineEnd: '8px' }} />
            {t('reports.print_report')}
          </button>
        </div>
      </div>

      <div className="tabs-container">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`tab-btn ${controller.activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => controller.setActiveCategory(cat.id)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {cat.icon}
              {t(cat.label)}
            </span>
          </button>
        ))}
      </div>

      <div className="report-content">
        <div className="unified-filters-section">
          {renderSubTabs()}
          {renderFilters()}
        </div>

        <div className="report-metrics-container">
          {controller.activeCategory === 'individuals' ? (
            (() => {
              const summary = controller.getIndividualSummary();
              return (
                <div className="financial-cards-grid">
                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Briefcase size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">قيمة العقد</span>
                      <span className="fc-value">{controller.formatCurrency(summary.contractValue)}</span>
                    </div>
                  </div>

                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><FileText size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">المستحق حتى اليوم</span>
                      <span className="fc-value">{controller.formatCurrency(summary.remaining)}</span>
                    </div>
                  </div>

                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Landmark size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">المدفوع</span>
                      <span className="fc-value text-success">{controller.formatCurrency(summary.paid)}</span>
                    </div>
                  </div>



                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><CreditCard size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">السلف</span>
                      <span className="fc-value text-warning">{controller.formatCurrency(summary.advances)}</span>
                    </div>
                  </div>


                </div>
              );
            })()
          ) : controller.activeCategory === 'expenses' ? (
            (() => {
              const summary = controller.getExpenseSummary();
              return (
                <div className="report-metrics">
                  <div className="report-metric-card">
                    <div className="report-metric-icon">
                      <FileText size={24} />
                    </div>
                    <div className="report-metric-info">
                      <span className="report-metric-title">مجموع العمليات</span>
                      <span className="report-metric-value">{summary.payments.length}</span>
                    </div>
                  </div>
                  <div className="report-metric-card">
                    <div className="report-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <Landmark size={24} />
                    </div>
                    <div className="report-metric-info">
                      <span className="report-metric-title">إجمالي المصاريف</span>
                      <span className="report-metric-value text-danger">{controller.formatCurrency(summary.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : controller.activeCategory === 'contracts' ? (
            (() => {
              const summary = controller.getContractsSummary();
              return (
                <div className="financial-cards-grid">
                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Briefcase size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">إجمالي قيمة العقود</span>
                      <span className="fc-value">{controller.formatCurrency(summary.totalValue)}</span>
                    </div>
                  </div>
                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Landmark size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">إجمالي المدفوع</span>
                      <span className="fc-value text-success">{controller.formatCurrency(summary.totalPaid)}</span>
                    </div>
                  </div>
                  <div className="financial-card highlight-card">
                    <div className="fc-icon"><AlertCircle size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">المتبقي</span>
                      <span className="fc-value">{controller.formatCurrency(summary.totalRemaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : controller.activeCategory === 'funds' ? (
            (() => {
              const summary = controller.getFundsSummary();
              return (
                <div className="financial-cards-grid">
                  <div className="financial-card highlight-card">
                    <div className="fc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Landmark size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">إجمالي رصيد الصناديق</span>
                      <span className="fc-value">{controller.formatCurrency(summary.totalBalance)}</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            renderEmptyState()
          )}
        </div>

        <div className="report-table-wrapper" style={{ marginTop: '32px' }}>
          {controller.activeCategory === 'individuals' ? (
            <div className="individual-report">

              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل المدفوعات</h3>
                <div className="report-table-wrapper">
                  <table className="custom-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      {!controller.selectedMember && <th>الاسم</th>}
                      <th>البيان (الطبيعة)</th>
                      <th>طريقة الدفع</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const summary = controller.getIndividualSummary();
                      if (summary.payments.length === 0) {
                        return (
                          <tr>
                            <td colSpan={controller.selectedMember ? 4 : 5} className="text-center py-4 text-muted">
                              {t('reports.no_data', 'لا توجد بيانات')}
                            </td>
                          </tr>
                        );
                      }
                      return summary.payments.map(payment => {
                        const member = controller.members.find(m => m.id === payment.memberId);
                        return (
                          <tr key={payment.id}>
                            <td className="text-muted">{payment.paymentDate}</td>
                            {!controller.selectedMember && (
                              <td className="font-weight-bold">{member ? `${member.first_name} ${member.last_name}` : '-'}</td>
                            )}
                            <td>{payment.amountNature} {payment.installmentNumber ? `(${payment.installmentNumber})` : ''}</td>
                            <td>{payment.paymentMethod}</td>
                            <td className="amount-cell text-success">{controller.formatCurrency(payment.amount)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'expenses' ? (
            <div className="expense-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل المصاريف</h3>
                <div className="report-table-wrapper">
                  <table className="custom-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>طبيعة المصروف</th>
                      <th>طريقة الدفع</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const summary = controller.getExpenseSummary();
                      if (summary.payments.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              {t('reports.no_data', 'لا توجد بيانات')}
                            </td>
                          </tr>
                        );
                      }
                      return summary.payments.map(payment => (
                        <tr key={payment.id}>
                          <td className="text-muted">{payment.paymentDate}</td>
                          <td>{payment.amountNature} {payment.occasion ? `(${payment.occasion})` : ''}</td>
                          <td>{payment.paymentMethod}</td>
                          <td className="amount-cell text-danger">{controller.formatCurrency(payment.amount)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'contracts' ? (
            <div className="contract-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل العقود</h3>
                <div className="report-table-wrapper">
                  <table className="custom-table">
                  <thead>
                    <tr>
                      <th>رقم العقد</th>
                      <th>المستفيد</th>
                      <th>بداية العقد</th>
                      <th>نهاية العقد</th>
                      <th>قيمة العقد</th>
                      <th>المدفوع (صافي)</th>
                      <th>المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const summary = controller.getContractsSummary();
                      if (summary.contracts.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              {t('reports.no_data', 'لا توجد بيانات')}
                            </td>
                          </tr>
                        );
                      }
                      return summary.contracts.map(contract => (
                        <tr key={contract.id}>
                          <td>{contract.contractNumber}</td>
                          <td className="font-weight-bold">{contract.beneficiary}</td>
                          <td className="text-muted">{contract.startDate}</td>
                          <td className="text-muted">{contract.endDate}</td>
                          <td className="amount-cell">{controller.formatCurrency(contract.contractValue)}</td>
                          <td className="amount-cell text-success">{controller.formatCurrency(contract.netPaid)}</td>
                          <td className="amount-cell text-danger">{controller.formatCurrency(contract.remaining)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'funds' ? (
            <div className="funds-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> {t('reports.funds_records', 'سجلات الصناديق')}</h3>
                <div className="report-table-wrapper">
                  <table className="custom-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الصندوق</th>
                      <th>النوع</th>
                      <th>المبلغ</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                        {(() => {
                          const summary = controller.getFundsSummary();
                          if (summary.transactions.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="text-center py-4 text-muted">
                                  {t('reports.no_data', 'لا توجد بيانات')}
                                </td>
                              </tr>
                            );
                          }
                          return summary.transactions.map(tx => {
                            const fundId = tx.fundId || (tx as any).fund_id;
                            const toFundId = tx.toFundId || (tx as any).to_fund_id;
                            const fund = controller.funds.find(f => f.id === fundId);
                            const toFund = toFundId ? controller.funds.find(f => f.id === toFundId) : null;
                            let fundNameDisplay = fund ? fund.name : '-';
                            if (tx.type === 'تحويل' && toFund) {
                              fundNameDisplay = `${fundNameDisplay} ➔ ${toFund.name}`;
                            }
                            return (
                              <tr key={tx.id}>
                                <td className="text-muted">{tx.date}</td>
                                <td className="font-weight-bold">{fundNameDisplay}</td>
                                <td>
                                  <span className={`status-badge ${tx.type === 'إيداع' ? 'active' : tx.type === 'سحب' ? 'inactive' : 'pending'}`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className={`amount-cell ${tx.type === 'إيداع' ? 'text-success' : 'text-danger'}`}>
                                  {controller.formatCurrency(tx.amount)}
                                </td>
                                <td>{tx.description}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>
      </div>
    </div>
  );
};
