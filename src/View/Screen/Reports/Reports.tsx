import React from 'react';
import { groupOf, naturesFor } from './reportMath';
import { paymentOccasionText } from '../Payments/paymentText';
import { MEMBER_NATURES, EXPENSE_NATURES } from '../Payments/usePaymentForm';
import { useTranslation } from 'react-i18next';
import { useReportsController } from './ReportsController';
import type { ReportCategory, IndividualReportType } from './report_model';
import { FileText, Printer, Users, CreditCard, Briefcase, Landmark, SearchX, AlertCircle, List, Trash2, Wallet, Bus } from 'lucide-react';

import { CustomDropdown } from '../../widget/CustomDropdown';
import { useAuth } from '../../../core/context/AuthContext';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileReports } from '../../Mobile/MobileReports/MobileReports';
import './Reports.css';

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const controller = useReportsController();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [controller.activeCategory, controller.presetDate, controller.selectedMember]);

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

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileReports
        c={controller}
        allowed={categories.map(cat => cat.id)}
        canDeleteTransaction={hasAccess(permissions.funds.delete)}
      />
    );
  }

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
                  .filter(m => controller.activeCategory === 'individuals' ? groupOf(m.type) === groupOf(controller.activeIndividualTab) : true)
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
                  { value: 'منحة مقابلات', label: 'منحة مقابلات' },
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
          <>
            <div className="filter-group">
              <label>نوع العملية</label>
              <CustomDropdown
                options={[
                  { value: '', label: 'الكل' },
                  { value: 'دفع', label: 'دفع' },
                  { value: 'مصروف', label: 'مصروف' },
                  { value: 'مصاريف استثنائية', label: 'مصاريف استثنائية' }
                ]}
                value={controller.expenseTransactionTypeFilter}
                onChange={(val) => {
                  controller.setExpenseTransactionTypeFilter(val);
                  controller.setExpenseTypeFilter(''); // Reset sub-type when main type changes
                }}
                placeholder="اختر نوع العملية"
              />
            </div>
            <div className="filter-group">
              <label>طبيعة المصروف</label>
            <CustomDropdown
              options={[
                { value: '', label: 'الكل' },
                ...naturesFor(controller.expenseTransactionTypeFilter, MEMBER_NATURES, EXPENSE_NATURES).map(n => ({ value: n, label: n })),
              ]}
              value={controller.expenseTypeFilter}
              onChange={(val) => controller.setExpenseTypeFilter(val)}
              placeholder="اختر طبيعة المصروف"
            />
          </div>
          </>
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
                  { value: 'تحويل', label: 'تحويل' },
                  { value: 'إرجاع', label: 'إرجاع' },
                  { value: 'استلاف', label: 'استلاف (دين)' },
                  { value: 'تسديد دين', label: 'تسديد دين' }
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
        <>
          <div className="sub-tabs-container desktop-only">
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
          
          <div className="sub-tabs-mobile mobile-only filter-group" style={{ marginBottom: '16px' }}>
            <label>نوع الكشف</label>
            <CustomDropdown
              options={tabs.map(tab => ({ value: tab.id, label: t(tab.label) }))}
              value={controller.activeIndividualTab}
              onChange={(val) => controller.setActiveIndividualTab(val as IndividualReportType)}
              placeholder="اختر نوع الكشف"
            />
          </div>
        </>
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
                      <span className="fc-value text-danger">{controller.formatCurrency(summary.due)}</span>
                    </div>
                  </div>

                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}><Briefcase size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">المتبقي من العقد</span>
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
                <>
                  <div className="financial-cards-grid">
                    <div className="financial-card">
                      <div className="fc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><FileText size={28} /></div>
                      <div className="fc-content">
                        <span className="fc-title">عدد العمليات</span>
                        <span className="fc-value">{summary.count}</span>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="fc-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><CreditCard size={28} /></div>
                      <div className="fc-content">
                        <span className="fc-title">إجمالي المصروف</span>
                        <span className="fc-value text-danger">{controller.formatCurrency(summary.spent)}</span>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="fc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Landmark size={28} /></div>
                      <div className="fc-content">
                        <span className="fc-title">إرجاع السلف</span>
                        <span className="fc-value text-success">{controller.formatCurrency(summary.returned)}</span>
                      </div>
                    </div>
                    <div className="financial-card highlight-card">
                      <div className="fc-icon"><AlertCircle size={28} /></div>
                      <div className="fc-content">
                        <span className="fc-title">الصافي (المصروف − الإرجاع)</span>
                        <span className="fc-value">{controller.formatCurrency(summary.net)}</span>
                      </div>
                    </div>
                  </div>
                </>
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
              const fundName = controller.fundFilter ? summary.funds[0]?.name : '';
              return (
                <div className="financial-cards-grid">
                  <div className="financial-card highlight-card">
                    <div className="fc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Landmark size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">{controller.toDate ? `الرصيد في ${controller.toDate}` : 'الرصيد الحالي'}{fundName ? ` · ${fundName}` : ''}</span>
                      <span className="fc-value">{controller.formatCurrency(summary.totalBalance)}</span>
                    </div>
                  </div>
                  <div className="financial-card">
                    <div className="fc-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><CreditCard size={28} /></div>
                    <div className="fc-content">
                      <span className="fc-title">المدفوع من {fundName ? 'الصندوق' : 'الصناديق'}</span>
                      <span className="fc-value text-danger">{controller.formatCurrency(summary.totalPaid)}</span>
                    </div>
                  </div>
                  {/* Deposits: each fund on its own */}
                  {summary.funds.map(f => (
                    <div key={f.id} className="financial-card">
                      <div className="fc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Wallet size={28} /></div>
                      <div className="fc-content">
                        <span className="fc-title">إيداعات {f.name}</span>
                        <span className="fc-value text-success">{controller.formatCurrency(f.totalDeposits)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            renderEmptyState()
          )}

          {/* What the active contracts commit the club to each month (not what was paid) */}
          {(controller.activeCategory === 'expenses' || controller.activeCategory === 'contracts') && (() => {
            const k = controller.getContractCommitments();
            return (
              <div className="commitments">
                <div className="commitments-grid">
                  <div className="commitment">
                    <span className="commitment-icon salary"><Wallet size={22} /></span>
                    <span className="commitment-text">
                      <small>مجموع الرواتب الشهرية</small>
                      <b>{controller.formatCurrency(k.salaryTotal)}</b>
                      <em>{k.salaryCount} عضو يتقاضى راتباً شهرياً</em>
                    </span>
                  </div>
                  <div className="commitment">
                    <span className="commitment-icon transport"><Bus size={22} /></span>
                    <span className="commitment-text">
                      <small>مجموع مصاريف التنقل</small>
                      <b>{controller.formatCurrency(k.transportTotal)}</b>
                      <em>{k.transportCount} عضو لديه مصاريف تنقل في العقد</em>
                    </span>
                  </div>
                  <div className="commitment total">
                    <span className="commitment-icon"><Landmark size={22} /></span>
                    <span className="commitment-text">
                      <small>المجموع الشهري</small>
                      <b>{controller.formatCurrency(Math.round((k.salaryTotal + k.transportTotal) * 100) / 100)}</b>
                      <em>الرواتب + التنقل</em>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="report-table-wrapper" style={{ marginTop: '32px' }}>
          {controller.activeCategory === 'individuals' ? (
            <div className="individual-report">

              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل المدفوعات</h3>
                <div className="table-pagination-wrapper">
                  <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
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
                        const paginatedPayments = summary.payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                        return paginatedPayments.map(payment => {
                          const member = controller.members.find(m => m.id === payment.memberId);
                          return (
                            <tr key={payment.id}>
                              <td className="text-muted" data-label={t('reports.date', 'التاريخ')}>{payment.paymentDate}</td>
                              {!controller.selectedMember && (
                                <td className="font-weight-bold" data-label={t('reports.member', 'العضو')}>{member ? `${member.first_name} ${member.last_name}` : '-'}</td>
                              )}
                              <td data-label={t('reports.nature', 'طبيعة الدفع')}>{payment.amountNature} {payment.installmentNumber ? `(${payment.installmentNumber})` : ''}</td>
                              <td data-label={t('reports.method', 'طريقة الدفع')}>{payment.paymentMethod}</td>
                              <td className="amount-cell text-success" data-label={t('reports.amount', 'المبلغ')}>{controller.formatCurrency(payment.amount)}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    </table>
                  </div>
                  {controller.getIndividualSummary().payments.length > 0 && (
                    <Pagination totalItems={controller.getIndividualSummary().payments.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                  )}
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'expenses' ? (
            <div className="expense-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل المصاريف</h3>
                <div className="table-pagination-wrapper">
                  <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
                  <div className="report-table-wrapper">
                    <table className="custom-table">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>نوع العملية</th>
                        <th>المستفيد</th>
                        <th>طبيعة المصروف</th>
                        <th>السبب / المناسبة</th>
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
                              <td colSpan={7} className="text-center py-4 text-muted">
                                {t('reports.no_data', 'لا توجد بيانات')}
                              </td>
                            </tr>
                          );
                        }
                        const paginatedExpenses = summary.payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                        return paginatedExpenses.map(payment => {
                          const member = payment.memberId ? controller.members.find(m => String(m.id) === String(payment.memberId)) : undefined;
                          return (
                            <tr key={payment.id}>
                              <td className="text-muted" data-label={t('reports.date', 'التاريخ')}>{payment.day || payment.paymentDate || '—'}</td>
                              <td data-label="نوع العملية">{payment.kind}</td>
                              <td data-label="المستفيد">{member ? `${member.first_name} ${member.last_name}` : '—'}</td>
                              <td data-label={t('reports.expense_nature', 'طبيعة المصروف')}>{payment.amountNature}</td>
                              <td data-label="السبب / المناسبة">{paymentOccasionText(payment) || '—'}</td>
                              <td data-label={t('reports.method', 'طريقة الدفع')}>{payment.paymentMethod}</td>
                              <td className={`amount-cell ${payment.isReturn ? 'text-success' : 'text-danger'}`} data-label={t('reports.amount', 'المبلغ')}>
                                {payment.isReturn ? '+ ' : ''}{controller.formatCurrency(Number(payment.amount) || 0)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    </table>
                  </div>
                  {controller.getExpenseSummary().payments.length > 0 && (
                    <Pagination totalItems={controller.getExpenseSummary().payments.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                  )}
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'contracts' ? (
            <div className="contract-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> سجل العقود</h3>
                <div className="table-pagination-wrapper">
                  <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
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
                        const paginatedContracts = summary.contracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                        return paginatedContracts.map(contract => (
                          <tr key={contract.id}>
                            <td data-label={t('reports.contract_num', 'رقم العقد')}>{contract.contractNumber}</td>
                            <td className="font-weight-bold" data-label={t('reports.beneficiary', 'المستفيد')}>{contract.beneficiary}</td>
                            <td className="text-muted" data-label={t('reports.start_date', 'بداية العقد')}>{contract.startDate}</td>
                            <td className="text-muted" data-label={t('reports.end_date', 'نهاية العقد')}>{contract.endDate}</td>
                            <td className="amount-cell" data-label={t('reports.contract_value', 'قيمة العقد')}>{controller.formatCurrency(contract.contractValue)}</td>
                            <td className="amount-cell text-success" data-label={t('reports.paid', 'المدفوع')}>{controller.formatCurrency(contract.netPaid)}</td>
                            <td className="amount-cell text-danger" data-label={t('reports.remaining', 'المتبقي')}>{controller.formatCurrency(contract.remaining)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    </table>
                  </div>
                  {controller.getContractsSummary().contracts.length > 0 && (
                    <Pagination totalItems={controller.getContractsSummary().contracts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                  )}
                </div>
              </div>
            </div>
          ) : controller.activeCategory === 'funds' ? (
            <div className="funds-report">
              <div className="payments-list-section" style={{ marginTop: '32px' }}>
                <h3><List size={24} style={{ marginInlineEnd: '8px', color: 'var(--accent)' }} /> {t('reports.funds_records', 'سجلات الصناديق')}</h3>
                <div className="table-pagination-wrapper">
                  <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
                  <div className="report-table-wrapper">
                    <table className="custom-table">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الصندوق</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>البيان</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                          {(() => {
                            const summary = controller.getFundsSummary();
                            if (summary.transactions.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="text-center py-4 text-muted">
                                    {t('reports.no_data', 'لا توجد بيانات')}
                                  </td>
                                </tr>
                              );
                            }
                            const paginatedTx = summary.transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                            return paginatedTx.map(tx => {
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
                                  <td className="text-muted" data-label={t('reports.date', 'التاريخ')}>{tx.date}</td>
                                  <td className="font-weight-bold" data-label={t('reports.fund', 'الصندوق')}>{fundNameDisplay}</td>
                                  <td data-label={t('reports.type', 'النوع')}>
                                    <span className={`status-badge ${tx.type === 'إيداع' ? 'active' : tx.type === 'سحب' || tx.type === 'تسديد دين' ? 'inactive' : 'pending'}`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className={`amount-cell ${tx.type === 'إيداع' ? 'text-success' : 'text-danger'}`} data-label={t('reports.amount', 'المبلغ')}>
                                    {controller.formatCurrency(tx.amount)}
                                  </td>
                                  <td data-label={t('reports.description', 'البيان')}>{tx.description}</td>
                                  <td data-label={t('reports.actions', 'الإجراءات')}>
                                    {hasAccess(permissions.funds.delete) && (
                                      <button 
                                        className="btn-action delete-btn" 
                                        onClick={() => controller.deleteFundTransaction(tx.id)}
                                        title={t('reports.delete', 'حذف')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: '4px' }}
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                    </table>
                  </div>
                  {controller.getFundsSummary().transactions.length > 0 && (
                    <Pagination totalItems={controller.getFundsSummary().transactions.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                  )}
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
