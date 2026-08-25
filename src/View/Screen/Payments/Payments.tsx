import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaymentsController, type PaymentRecord } from './PaymentsController';
import { Plus, Search, Edit, Trash2, X, Wallet, Users, ShoppingBag, Eye, Printer, Paperclip, RefreshCw, BookOpen } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CurrencyInput } from '../../widget/CurrencyInput';
import { useAuth } from '../../../core/context/AuthContext';
import { PrintableReceipt } from './PrintableReceipt/PrintableReceipt';
import { InternalRegulationsDocument } from './PrintableReceipt/InternalRegulationsDocument';
import { UploadReceiptDialog } from './UploadReceiptDialog';
import { ViewReceiptDialog } from './ViewReceiptDialog';
import { Applink } from '../../../LinkApi';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import './Payments.css';

const PrintReceiptButton = ({ payment, member, contract, onPrint }: any) => {
  return (
    <button className="btn-icon" style={{color: '#ea580c'}} onClick={() => onPrint(payment, member, contract)} title="طباعة الوصل">
      <Printer size={18} />
    </button>
  );
};

const getInstallmentText = (num: any) => {
  const strNum = String(num).trim();
  const map: Record<string, string> = {
    '1': 'الأولى',
    '2': 'الثانية',
    '3': 'الثالثة',
    '4': 'الرابعة',
    '5': 'الخامسة',
    '6': 'السادسة',
    '7': 'السابعة',
    '8': 'الثامنة',
    '9': 'التاسعة',
    '10': 'العاشرة',
  };
  return map[strNum] || strNum;
};

export const Payments: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = usePaymentsController();
  
  const [printData, setPrintData] = useState<any>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedPayments = controller.payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [printOptionsDialog, setPrintOptionsDialog] = useState<{
    isOpen: boolean;
    payment: any;
    member: any;
    contract: any;
  } | null>(null);

  const handleNativePrint = (payment: any, member: any, contract: any) => {
    // Open the print options dialog instead of printing immediately
    setPrintOptionsDialog({ isOpen: true, payment, member, contract });
  };

  const confirmPrint = (includeRegulations: boolean) => {
    if (!printOptionsDialog) return;
    
    const { payment, member, contract } = printOptionsDialog;
    
    // Calculate totals for this member based on all their payments of type 'دفع' AND nature 'رقم دفعة'
    const memberPayments = controller.payments.filter((p: any) => {
      const isMemberMatch = String(p.memberId) === String(payment.memberId) || String(p.member_id) === String(payment.memberId) || String(p.individuals_id) === String(payment.memberId);
      const tType = (p.transactionType || p.transaction_type || '').trim();
      const isTypeMatch = tType === 'دفع' || tType === ''; // Handle legacy data with NULL transactionType
      const aNature = String(p.amountNature || p.amount_nature || '').trim();
      const instNumVal = p.installmentNumber || (p as any).Occasion_Reason_numper || (p as any).occasion_reason_numper || (p as any).Occasion_reason_numper;
      const isNatureMatch = aNature === 'رقم دفعة' || !!instNumVal;
      
      return isMemberMatch && isTypeMatch && isNatureMatch;
    });
    // Ensure we sum up only installment payments
    const totalPaid = memberPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const contractValue = Number(contract?.contractValue) || Number(contract?.Contract_value) || Number(contract?.contract_value) || 0;
    const deductions = 0; // Not specified yet, defaulting to 0
    const remaining = contractValue - totalPaid;

    setPrintData({ payment, member, contract, totalPaid, deductions, remaining, includeRegulations });
    setPrintOptionsDialog(null);
    
    setTimeout(() => {
      // Setup listener for when the print dialog closes
      if (includeRegulations && payment.memberId) {
        const handleAfterPrint = () => {
          // Add a small timeout so it doesn't block the UI immediately after print dialog closes
          setTimeout(() => {
            if (window.confirm("هل اكتملت عملية طباعة النظام الداخلي بنجاح؟ (سيتم تعليمه كمطبوع)")) {
              controller.handlePrintMemberSystem(payment.memberId);
            }
          }, 500);
          window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
      }
      
      window.print();
    }, 200); // Wait for the component to render before printing
  };
  const {
    payments,
    members,
    funds,
    contracts,
    isDialogOpen,
    editingPayment,
    openDialog,
    closeDialog,
    deletePayment,
    savePayment,
    formatCurrency,
    getMemberDetails,
    searchQuery,
    setSearchQuery,
    filterNature,
    setFilterNature,
  } = controller;

  // Form State
  const [transactionType, setTransactionType] = useState<'دفع' | 'مصروف'>('دفع');
  const [memberId, setMemberId] = useState('');
  const [fundId, setFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [postalCheck, setPostalCheck] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدا');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountNature, setAmountNature] = useState('راتب شهري');
  const [installmentNumber, setInstallmentNumber] = useState('');
  const getDefaultSeasonYear = () => {
    const d = new Date();
    const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `${startYear} - ${startYear + 1}`;
  };

  const [dateFrom, setDateFrom] = useState(getDefaultSeasonYear());
  const [dateTo, setDateTo] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [occasion, setOccasion] = useState('');
  const [numberOfGoals, setNumberOfGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Auto-calculate amount based on contract and amountNature
  useEffect(() => {
    if (transactionType === 'دفع' && memberId && amountNature && contracts.length > 0 && !editingPayment) {
      const memberContracts = contracts.filter(c => String(c.individuals_id) === String(memberId));
      let contract = memberContracts.find(c => String(c.id) === String(selectedContractId));
      if (!contract && memberContracts.length > 0) {
        contract = memberContracts[0];
        setSelectedContractId(contract.id);
        setDateFrom(contract.startDate || getDefaultSeasonYear());
        setDateTo(contract.endDate || '');
      }

      if (contract) {
        if (amountNature === 'راتب شهري') {
          setAmount(contract.monthlySalary?.toString() || '0');
        } else if (amountNature === 'تسجيل أهداف') {
          const goals = parseInt(numberOfGoals) || 0;
          setAmount(((contract.goalsBonus || 0) * goals).toString());
        } else if (amountNature === 'منحة فوز') {
          setAmount(contract.winBonus?.toString() || '0');
        } else if (amountNature === 'رقم دفعة') {
          if (installmentNumber && contract.installments && Array.isArray(contract.installments)) {
            const installment = contract.installments.find((inst: any) => String(inst.installment_number) === String(installmentNumber));
            if (installment) {
              setAmount(installment.amount.toString());
              return;
            }
          }
          setAmount(contract.paymentValue ? contract.paymentValue.toString() : '0');
        }
      }
    }
  }, [memberId, amountNature, numberOfGoals, installmentNumber, contracts, editingPayment, selectedContractId]);

  // Handle open modal for Edit or Add
  const handleOpenDialog = (payment?: PaymentRecord) => {
    if (payment) {
      setTransactionType(payment.transactionType || 'دفع');
      setMemberId(payment.memberId || '');
      setFundId(payment.fundId || '');
      setAmount(payment.amount.toString());
      setPaymentMethod(payment.paymentMethod);
      setPaymentDate(payment.paymentDate);
      setPostalCheck(payment.postal_check || '');
      setAmountNature(payment.amountNature);
      setInstallmentNumber(payment.installmentNumber || (payment as any).Occasion_Reason_numper || '');
      setDateFrom(payment.dateFrom || '');
      setDateTo(payment.dateTo || '');
      setMonth(payment.month || '');
      setYear(payment.year || '');
      setOccasion(payment.occasion || (!payment.installmentNumber && payment.amountNature !== 'رقم دفعة' ? payment.checkNumber : '') || '');
      setNumberOfGoals(payment.numberOfGoals?.toString() || '');
      setNotes(payment.notes || '');
    } else {
      setTransactionType('دفع');
      setMemberId('');
      setFundId('');
      setAmount('');
      setPaymentMethod('نقدا');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPostalCheck('');
      setAmountNature('راتب شهري');
      setInstallmentNumber('');
      setDateFrom(getDefaultSeasonYear());
      setDateTo('');
      setMonth('');
      setYear('');
      setOccasion('');
      setNumberOfGoals('');
      setNotes('');
      setSelectedContractId('');
    }
    setFormSubmitted(false);
    openDialog(payment);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (transactionType === 'دفع' && !memberId) return;
    if (!fundId) return;

    savePayment({
      transactionType,
      memberId: transactionType === 'دفع' ? memberId : undefined,
      fundId: fundId || undefined,
      amount: parseFloat(amount) || 0,
      paymentMethod,
      paymentDate,
      postal_check: postalCheck,
      amountNature,
      installmentNumber: amountNature === 'رقم دفعة' ? installmentNumber : undefined,
      dateFrom: amountNature === 'رقم دفعة' ? dateFrom : undefined,
      dateTo: amountNature === 'رقم دفعة' ? dateTo : undefined,
      month: amountNature === 'راتب شهري' ? month : undefined,
      year: amountNature === 'راتب شهري' ? year : undefined,
      occasion: !['رقم دفعة', 'راتب شهري', 'تسجيل أهداف', 'منحة فوز'].includes(amountNature) ? occasion : undefined,
      numberOfGoals: amountNature === 'تسجيل أهداف' ? (parseInt(numberOfGoals) || 0) : undefined,
      notes,
      contract_id: amountNature === 'رقم دفعة' ? selectedContractId : undefined
    });
  };

  const selectedMemberDetails = memberId ? getMemberDetails(memberId) : null;

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h1 className="page-title">{t('payments.title', 'المدفوعات والمصاريف')}</h1>
        
        <div className="payments-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={t('payments.search_placeholder', 'ابحث...')} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown
            options={[
              { value: 'all', label: 'كل الصناديق' },
              ...controller.funds.map(f => ({ value: String(f.id), label: f.name }))
            ]}
            value={controller.selectedFundFilter}
            onChange={(val) => controller.setSelectedFundFilter(val)}
          />
          <CustomDropdown
            options={[
              { value: 'all', label: t('payments.filter_all', 'الكل') },
              { value: 'راتب شهري', label: 'راتب شهري' },
              { value: 'رقم دفعة', label: 'رقم دفعة' },
              { value: 'منحة فوز', label: 'منحة فوز' },
              { value: 'تسجيل أهداف', label: 'تسجيل أهداف' },
              { value: 'نتيجة', label: 'نتيجة' },
              { value: 'تحفيز', label: 'تحفيز' },
              { value: 'جزء من المستحقات', label: 'جزء من المستحقات' },
              { value: 'باقي المستحقات', label: 'باقي المستحقات' },
              { value: 'تسوية جزئية', label: 'تسوية جزئية' },
              { value: 'تسوية نهائية', label: 'تسوية نهائية' },
              { value: 'سلفة', label: 'سلفة' },
              { value: 'إرجاع سلفة', label: 'إرجاع سلفة' },
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
            value={filterNature}
            onChange={(val) => setFilterNature(val)}
          />
          {hasAccess(permissions.payments.add) && (
            <button className="btn-primary" onClick={() => handleOpenDialog()}>
              <Plus size={18} />
              {t('payments.add_payment', 'إضافة دفعة/مصروف')}
            </button>
          )}
        </div>
      </div>

      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="members-table-wrapper">
          <table className="custom-table">
          <thead>
            <tr>
              <th>{t('payments.col_date', 'التاريخ')}</th>
              <th>{t('payments.col_member', 'المستفيد')}</th>
              <th>{t('payments.col_nature', 'طبيعة المبلغ')}</th>
              <th>{t('payments.col_amount', 'المبلغ')}</th>
              <th>{t('payments.col_method', 'طريقة الدفع')}</th>
              <th>{t('payments.col_actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  {t('payments.no_data', 'لا توجد بيانات')}
                </td>
              </tr>
            ) : (
              paginatedPayments.map(payment => {
                const member = getMemberDetails(payment.memberId);
                return (
                  <tr key={payment.id}>
                    <td className="text-muted" data-label={t('payments.col_date', 'التاريخ')}>{payment.paymentDate}</td>
                    <td className="font-weight-bold" data-label={t('payments.col_member', 'المستفيد')}>{member ? `${member.firstName} ${member.lastName}` : '-'}</td>
                    <td data-label={t('payments.col_nature', 'طبيعة المبلغ')}>
                      {(() => {
                        const amountNatureVal = String(payment.amountNature || (payment as any).amount_nature || '').trim();
                        let instNumVal = payment.installmentNumber || (payment as any).Occasion_Reason_numper || (payment as any).occasion_reason_numper || (payment as any).Occasion_reason_numper;
                        if (!instNumVal && amountNatureVal === 'رقم دفعة') {
                          instNumVal = payment.checkNumber;
                        }
                        
                        const isInstallment = amountNatureVal === 'رقم دفعة' || !!(payment.installmentNumber || (payment as any).Occasion_Reason_numper || (payment as any).occasion_reason_numper);
                        
                        if (isInstallment && instNumVal) {
                          return `الدفعة ${getInstallmentText(instNumVal)}`;
                        }
                        
                        const occasionVal = payment.occasion || payment.checkNumber;
                        return occasionVal ? `${amountNatureVal} - ${occasionVal}` : amountNatureVal;
                      })()}
                    </td>
                    <td className="amount-cell text-success" data-label={t('payments.col_amount', 'المبلغ')}>{formatCurrency(payment.amount)}</td>
                    <td data-label={t('payments.col_method', 'طريقة الدفع')}>{payment.paymentMethod}</td>
                    <td data-label={t('payments.col_actions', 'إجراءات')} className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <PrintReceiptButton 
                          payment={payment} 
                          member={member} 
                          contract={contracts.find(c => 
                            String(c.individuals_id) === String(payment.memberId) || 
                            String((c as any).memberId) === String(payment.memberId) || 
                            String((c as any).member_id) === String(payment.memberId)
                          )} 
                          onPrint={handleNativePrint}
                        />
                        {hasAccess(permissions.payments.edit) && (
                          <button className="btn-icon edit" onClick={() => handleOpenDialog(payment)}>
                            <Edit size={18} />
                          </button>
                        )}
                        {hasAccess(permissions.payments.delete) && (
                          <>
                            <button className="btn-icon return-btn" onClick={() => controller.returnPayment(payment.id)} title="إرجاع الدفعة للصندوق" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                              <RefreshCw size={18} />
                            </button>
                            <button className="btn-icon delete" onClick={() => deletePayment(payment.id)}>
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button className="btn-icon view" onClick={() => controller.openUploadDialog(payment)} title={t('payments.upload_receipt', 'إرفاق وصل العملية')} style={{color: '#3b82f6'}}>
                          <Paperclip size={18} />
                        </button>
                        {payment.receipt_file && (
                          <button 
                            className="btn-icon view"
                            title={t('payments.view_receipt', 'عرض الوصل')}
                            style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                            onClick={() => {
                              const file = payment.receipt_file;
                              let url = null;
                              if (typeof file === 'string') {
                                url = file.startsWith('http') ? file : `${Applink.image}/${file.replace(/^[\/\\]/, '')}`;
                              }
                              setViewingReceiptUrl(url);
                            }}
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        <Pagination 
          totalItems={controller.payments.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
      </div>

      {/* Add/Edit Modal */}
      {isDialogOpen && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-content payment-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <Wallet size={24} />
                <h2>{editingPayment ? t('payments.edit_title', 'تعديل دفعة') : t('payments.add_title', 'إضافة دفعة/مصروف جديد')}</h2>
              </div>
              <button className="close-btn" onClick={closeDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form onSubmit={handleSave}>
                {/* Transaction Type Selection */}
                <div className="form-group mb-4">
                  <label>{t('payments.form_transaction_type', 'نوع العملية')}</label>
                  <div className="transaction-type-selector">
                    <label className="transaction-type-option">
                      <input 
                        type="radio" 
                        name="transactionType" 
                        value="دفع" 
                        checked={transactionType === 'دفع'} 
                        onChange={() => { setTransactionType('دفع'); setAmountNature('راتب شهري'); }} 
                      />
                      <div className="transaction-type-card">
                        <div className="transaction-type-icon">
                          <Users size={24} />
                        </div>
                        <span>دفع مستحقات (مرتبط بعضو)</span>
                      </div>
                    </label>

                    <label className="transaction-type-option">
                      <input 
                        type="radio" 
                        name="transactionType" 
                        value="مصروف" 
                        checked={transactionType === 'مصروف'} 
                        onChange={() => { setTransactionType('مصروف'); setAmountNature('تعويض مصاريف'); }} 
                      />
                      <div className="transaction-type-card">
                        <div className="transaction-type-icon">
                          <ShoppingBag size={24} />
                        </div>
                        <span>مصروف عام</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Member Selection */}
                {transactionType === 'دفع' && (
                  <div className="form-group mb-3">
                    <label>{t('payments.form_select_member', 'تحديد العضو / المستفيد')}</label>
                  <CustomDropdown
                    value={memberId}
                    onChange={setMemberId}
                    options={[
                      { value: '', label: t('payments.form_select_member_placeholder', '-- اختر العضو --') },
                      ...members.map(m => ({
                        value: m.id,
                        label: `${m.firstName} ${m.lastName} (${m.memberRole})`
                      }))
                    ]}
                  />
                  </div>
                )}

                {/* Fund Selection */}
                <div className="form-group mb-3">
                  <label>
                    {t('payments.form_select_fund', 'تحديد صندوق الدفع')}
                    <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                  </label>
                  <CustomDropdown
                    value={fundId}
                    onChange={setFundId}
                    options={[
                      { value: '', label: t('payments.form_select_fund_placeholder', '-- اختر الصندوق --') },
                      ...funds.map(f => ({
                        value: f.id,
                        label: f.name
                      }))
                    ]}
                  />
                  {formSubmitted && !fundId && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{t('payments.fund_required', 'اختيار الصندوق إجباري')}</span>}
                </div>

                {/* Auto Populated Member Details */}
                {transactionType === 'دفع' && selectedMemberDetails && (
                  <div className="member-details-card">
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_name', 'الاسم واللقب')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.firstName} {selectedMemberDetails.lastName}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_role', 'صفة العضو')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.memberRole}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_contract_type', 'نوع العقد')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.contractType}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_contract_number', 'رقم العقد')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.contractNumber}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_id', 'رقم الهوية')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.nationalId}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_birth', 'تاريخ ومكان الميلاد')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.dateOfBirth} - {selectedMemberDetails.placeOfBirth}</span>
                    </div>
                    <div className="member-detail-item">
                      <span className="member-detail-label">{t('payments.detail_phone', 'رقم الهاتف')}</span>
                      <span className="member-detail-value">{selectedMemberDetails.phoneNumber}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>{t('payments.form_payment_date', 'تاريخ الدفع')}</label>
                  <input type="date" className="form-control" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('payments.form_method', 'طريقة الدفع')}</label>
                    <CustomDropdown
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={[
                        { value: 'نقدا', label: 'نقدا' },
                        { value: 'تحويل بنكي', label: 'تحويل بنكي' },
                        { value: 'صك', label: 'صك' },
                        { value: 'حوالة', label: 'حوالة' },
                        { value: 'دفع إلكتروني', label: 'دفع إلكتروني' },
                        { value: 'أخرى', label: 'أخرى' }
                      ]}
                    />
                  </div>
                  {paymentMethod === 'صك' && (
                    <div className="form-group">
                      <label>{t('payments.form_check_number', 'رقم الصك')}</label>
                      <input type="text" className="form-control" value={postalCheck} onChange={e => setPostalCheck(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label>{t('payments.form_amount_nature', 'طبيعة المبلغ')}</label>
                    <CustomDropdown
                      value={amountNature}
                      onChange={setAmountNature}
                      options={transactionType === 'دفع' ? [
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
                        { value: 'اخرى', label: 'اخرى' }
                      ] : [
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
                    />
                  </div>
                </div>

                {amountNature === 'رقم دفعة' && (
                  <>
                    {contracts.filter(c => String(c.individuals_id) === String(memberId)).length > 1 && (
                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label>تحديد العقد (الموسم)</label>
                          <CustomDropdown
                            value={selectedContractId}
                            onChange={(val) => {
                              setSelectedContractId(val);
                              const selectedContract = contracts.find(c => String(c.id) === String(val));
                              if (selectedContract) {
                                setDateFrom(selectedContract.startDate || getDefaultSeasonYear());
                                setDateTo(selectedContract.endDate || '');
                              }
                            }}
                            options={contracts
                              .filter(c => String(c.individuals_id) === String(memberId))
                              .map(c => ({
                                value: String(c.id),
                                label: `عقد موسم ${c.startDate || 'غير محدد'} - ${c.contractValue} د.ج`
                              }))}
                          />
                        </div>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group" style={{ width: '100%' }}>
                        <label>{t('payments.form_installment_number', 'رقم الدفعة')}</label>
                        <input type="text" className="form-control" value={installmentNumber} onChange={e => setInstallmentNumber(e.target.value)} required />
                      </div>
                    </div>
                  </>
                )}

                {amountNature === 'راتب شهري' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('payments.form_month', 'الشهر')}</label>
                      <CustomDropdown
                        value={month}
                        onChange={setMonth}
                        options={[
                          { value: '01', label: 'جانفي' },
                          { value: '02', label: 'فيفري' },
                          { value: '03', label: 'مارس' },
                          { value: '04', label: 'أفريل' },
                          { value: '05', label: 'ماي' },
                          { value: '06', label: 'جوان' },
                          { value: '07', label: 'جويلية' },
                          { value: '08', label: 'أوت' },
                          { value: '09', label: 'سبتمبر' },
                          { value: '10', label: 'أكتوبر' },
                          { value: '11', label: 'نوفمبر' },
                          { value: '12', label: 'ديسمبر' }
                        ]}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('payments.form_year', 'السنة')}</label>
                      <CustomDropdown
                        value={year}
                        onChange={setYear}
                        options={Array.from({ length: 10 }, (_, i) => {
                          const y = (new Date().getFullYear() - 5 + i).toString();
                          return { value: y, label: y };
                        })}
                      />
                    </div>
                  </div>
                )}

                {amountNature === 'تسجيل أهداف' && (
                  <div className="form-group">
                    <label>{t('payments.form_number_of_goals', 'عدد الأهداف')}</label>
                    <input type="number" className="form-control" value={numberOfGoals} onChange={e => setNumberOfGoals(e.target.value)} required min="1" />
                  </div>
                )}

                {!['رقم دفعة', 'راتب شهري', 'تسجيل أهداف', 'منحة فوز'].includes(amountNature) && (
                  <div className="form-group">
                    <label>{t('payments.form_occasion', 'المناسبة / السبب')}</label>
                    <input type="text" className="form-control" value={occasion} onChange={e => setOccasion(e.target.value)} required={amountNature === 'اخرى'} />
                  </div>
                )}

                <div className="form-group">
                  <label>{t('payments.form_amount', 'المبلغ (د.ج)')}</label>
                  <CurrencyInput 
                    className="form-control amount-cell" 
                    value={amount} 
                    onChangeValue={setAmount} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('payments.form_notes', 'ملاحظات')}</label>
                  <input type="text" className="form-control" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>


                <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent">
                  <button type="button" className="btn-cancel" onClick={closeDialog}>{t('payments.cancel', 'إلغاء')}</button>
                  <button type="submit" className="btn-primary">{t('payments.save', 'حفظ الدفعة')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {printData && (
        <div className="global-print-container">
          <PrintableReceipt 
            payment={printData.payment} 
            member={printData.member} 
            contract={printData.contract} 
            totalPaid={printData.totalPaid}
            deductions={printData.deductions}
            remaining={printData.remaining}
          />
          {printData.includeRegulations && <InternalRegulationsDocument />}
        </div>
      )}

      {printOptionsDialog && printOptionsDialog.isOpen && (
        <div className="dialog-overlay" style={{ zIndex: 50 }}>
          <div className="dialog-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '20px' }}>
            <div className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#ea580c', fontWeight: 'bold' }}>خيارات الطباعة</h3>
              <button className="close-btn" onClick={() => setPrintOptionsDialog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <Printer size={48} style={{ margin: '0 auto 15px auto', color: '#ea580c' }} />
              <p style={{ marginBottom: '25px', fontWeight: 'bold', fontSize: '1.1rem' }}>ماذا تريد أن تطبع مع هذا الوصل؟</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', fontSize: '1rem' }}
                  onClick={() => confirmPrint(true)}
                >
                  <BookOpen size={20} style={{ marginLeft: '8px' }} />
                  طباعة الوصل + النظام الداخلي
                </button>
                
                <button 
                  className="btn-cancel"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', fontSize: '1rem' }}
                  onClick={() => confirmPrint(false)}
                >
                  <Printer size={20} style={{ marginLeft: '8px' }} />
                  طباعة الوصل فقط
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UploadReceiptDialog 
        isOpen={controller.isUploadDialogOpen}
        onClose={controller.closeUploadDialog}
        payment={controller.paymentForUpload}
        onUpload={controller.uploadReceipt}
      />

      <ViewReceiptDialog 
        isOpen={!!viewingReceiptUrl}
        onClose={() => setViewingReceiptUrl(null)}
        imageUrl={viewingReceiptUrl || ''}
      />
    </div>
  );
};
