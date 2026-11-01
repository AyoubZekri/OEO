import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useFundsController } from './FundsController';
import type { Fund, TransactionType } from './fund_model';
import { Wallet, Landmark, Mail, ArrowRightLeft, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { CurrencyInput } from '../../widget/CurrencyInput';
import { useAuth } from '../../../core/context/AuthContext';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileFunds } from '../../Mobile/MobileFunds/MobileFunds';
import { DebtForm } from '../Debts/parts/DebtForm';
import { useFundLoan } from './useFundLoan';
import '../Debts/Debts.css';
import './Funds.css';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { StateIcon } from '../../widget/StateIcon';

export const Funds: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useFundsController();
  // Money put in that is a loan: the debt form opens with the same amount
  const loan = useFundLoan(controller.reload);
  const {
    funds,
    isFundDialogOpen,
    isOperationDialogOpen,
    selectedFundId,
    editingFund,
    openFundDialog,
    closeFundDialog,
    addFund,
    editFund,
    deleteFund,
    openOperationDialog,
    closeOperationDialog,
    addTransaction,
    getBalance,
    formatCurrency
  } = controller;

  // Form State for Fund
  const [fundFormData, setFundFormData] = useState({
    name: '',
    icon: 'wallet' as Fund['icon'],
    initialBalance: ''
  });

  // Form State for Operation
  const [opFormData, setOpFormData] = useState({
    type: 'إيداع' as TransactionType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    toFundId: ''
  });
  // A deposit: is the money a loan (a debt to pay back)?
  const [isLoan, setIsLoan] = useState(false);
  // The fields to type left wrong: their message under them (the fund to transfer to, a choice: a snackbar)
  const [fundTried, setFundTried] = useState(false);
  const [opTried, setOpTried] = useState(false);

  // Effect to populate Fund Form when editing
  React.useEffect(() => {
    if (editingFund) {
      setFundFormData({
        name: editingFund.name,
        icon: editingFund.icon,
        initialBalance: editingFund.initialBalance.toString()
      });
    } else {
      setFundFormData({ name: '', icon: 'wallet', initialBalance: '' });
    }
  }, [editingFund, isFundDialogOpen]);

  // Effect to reset Operation Form when opened
  React.useEffect(() => {
    if (isOperationDialogOpen) {
      setOpFormData({
        type: 'إيداع',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        toFundId: ''
      });
      setIsLoan(false);
    }
  }, [isOperationDialogOpen]);

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileFunds
        c={controller}
        loan={loan}
        can={{
          add: hasAccess(permissions.funds.add),
          edit: hasAccess(permissions.funds.edit),
          delete: hasAccess(permissions.funds.delete),
          addTransaction: hasAccess(permissions.funds.addTransaction),
        }}
      />
    );
  }

  const fundErrors = { name: !fundFormData.name.trim(), balance: fundFormData.initialBalance === '' };
  const opErrors = { amount: !(parseFloat(opFormData.amount) >= 1), date: !opFormData.date, description: !opFormData.description.trim() };
  const closeFund = () => { setFundTried(false); closeFundDialog(); };
  const closeOp = () => { setOpTried(false); closeOperationDialog(); };

  const handleFundSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFundTried(true);
    if (fundErrors.name || fundErrors.balance) return;
    setFundTried(false);

    if (editingFund) {
      editFund(editingFund.id, {
        name: fundFormData.name,
        icon: fundFormData.icon,
        initialBalance: parseFloat(fundFormData.initialBalance) || 0
      });
    } else {
      addFund({
        name: fundFormData.name,
        icon: fundFormData.icon,
        initialBalance: parseFloat(fundFormData.initialBalance) || 0
      });
    }
  };

  const handleOpSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId) return;
    setOpTried(true);
    if (opFormData.type === 'تحويل' && !opFormData.toFundId) return showSnackbar('خطأ', 'اختر الصندوق المحول إليه', '#ef4444');
    if (Object.values(opErrors).some(Boolean)) return;
    setOpTried(false);

    // A loan: no deposit of its own, the debt form puts the money into the fund
    if (opFormData.type === 'إيداع' && isLoan && loan.allowed) {
      closeOperationDialog();
      loan.start({
        amount: parseFloat(opFormData.amount) || 0,
        fundId: String(selectedFundId),
        fundName: getFundName(selectedFundId),
        debtDate: opFormData.date,
        title: opFormData.description,
      });
      return;
    }

    addTransaction({
      fundId: selectedFundId,
      type: opFormData.type,
      amount: parseFloat(opFormData.amount) || 0,
      date: opFormData.date,
      description: opFormData.description,
      toFundId: opFormData.type === 'تحويل' ? opFormData.toFundId : undefined
    });
  };

  const getIconComponent = (iconName: string, size = 24) => {
    switch (iconName) {
      case 'bank': return <Landmark size={size} />;
      case 'mail': return <Mail size={size} />;
      case 'wallet': return <Wallet size={size} />;
      default: return <Wallet size={size} />;
    }
  };

  const getFundName = (id: string) => {
    return funds.find(f => f.id === id)?.name || 'غير معروف';
  };

  return (
    <div className="funds-container">
      <div className="funds-header">

        <div className="funds-actions">
          {hasAccess(permissions.funds.add) && (
            <button className="btn-primary" onClick={() => openFundDialog()}>
              <Plus size={18} />
              إضافة صندوق
            </button>
          )}
        </div>
      </div>

      {/* Funds Summary Cards */}
      <div className="funds-summary">
        {funds.length === 0 && <StateIcon />}
        {funds.map(fund => (
          <div className="fund-card" key={fund.id}>
            <div className="fund-card-header">
              <div className={`fund-card-icon ${fund.icon}`}>
                {getIconComponent(fund.icon)}
              </div>
              <h3 className="fund-card-title">{fund.name}</h3>
            </div>
            <div className="fund-card-balance">
              {formatCurrency(getBalance(fund.id))}
            </div>

            <div className="fund-card-actions">
              {hasAccess(permissions.funds.edit) && (
                <button className="btn-action edit-btn" onClick={() => openFundDialog(fund)} title="تعديل">
                  <Edit2 size={16} /> <span>تعديل</span>
                </button>
              )}
              {hasAccess(permissions.funds.delete) && (
                <button className="btn-action delete-btn" onClick={() => deleteFund(fund.id)} title="حذف">
                  <Trash2 size={16} /> <span>حذف</span>
                </button>
              )}
              {hasAccess(permissions.funds.addTransaction) && (
                <button className="btn-action view-btn" onClick={() => openOperationDialog(fund.id)} title="عملية جديدة">
                  <ArrowRightLeft size={16} /> <span>عملية جديدة</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>


      {/* Fund Dialog (Add/Edit Fund) */}
      {isFundDialogOpen && (
        <div className="dialog-overlay" onClick={closeFund}>
          <div className="dialog-content add-fund-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <Wallet size={24} />
                <h2>{editingFund ? 'تعديل الصندوق' : 'إضافة صندوق جديد'}</h2>
              </div>
              <button className="close-btn" onClick={closeFund}>
                <X size={24} />
              </button>
            </div>

            <div className="dialog-body">
              <form onSubmit={handleFundSave} noValidate>
                <div className="form-group">
                  <label>اسم الصندوق</label>
                  <input type="text" className={`form-control ${fundTried && fundErrors.name ? 'is-missing' : ''}`} value={fundFormData.name} onChange={e => setFundFormData({...fundFormData, name: e.target.value})} />
                  {fundTried && fundErrors.name && <span className="fund-field-error">اكتب اسم الصندوق</span>}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>الأيقونة</label>
                    <CustomDropdown<Fund['icon']>
                      value={fundFormData.icon}
                      onChange={(val) => setFundFormData({...fundFormData, icon: val})}
                      options={[
                        { value: 'bank', label: 'بنك', icon: <Landmark size={16} /> },
                        { value: 'mail', label: 'بريد', icon: <Mail size={16} /> },
                        { value: 'wallet', label: 'صندوق', icon: <Wallet size={16} /> }
                      ]}
                    />
                  </div>
                  <div className="form-group mt-3" style={{ flex: 1 }}>
                    <label>الرصيد الابتدائي</label>
                    <CurrencyInput
                      className={`form-control ${fundTried && fundErrors.balance ? 'is-missing' : ''}`}
                      value={fundFormData.initialBalance}
                      onChangeValue={(val) => setFundFormData({ ...fundFormData, initialBalance: val })}
                    />
                    {fundTried && fundErrors.balance && <span className="fund-field-error">اكتب الرصيد الابتدائي</span>}
                  </div>
                </div>

                <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent">
                  <button type="button" className="btn-cancel" onClick={closeFund}>{t('common.cancel', 'إلغاء')}</button>
                  <button type="submit" className="btn-primary">{editingFund ? 'حفظ التعديلات' : 'تأكيد'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loan.debts.form && (
        <DebtForm c={loan.debts} debt={null} initialKind="loan" mobile={false} prefill={loan.prefill} />
      )}

      {/* Operation Dialog (Add Money / Transfer) */}
      {isOperationDialogOpen && selectedFundId && (
        <div className="dialog-overlay" onClick={closeOp}>
          <div className="dialog-content add-fund-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <ArrowRightLeft size={24} />
                <h2>عملية جديدة - {getFundName(selectedFundId)}</h2>
              </div>
              <button className="close-btn" onClick={closeOp}>
                <X size={24} />
              </button>
            </div>

            <div className="dialog-body">
              <form onSubmit={handleOpSave} noValidate>
                <div className="form-group">
                  <label>نوع العملية</label>
                  <CustomDropdown<TransactionType>
                    value={opFormData.type}
                    onChange={(val) => setOpFormData({...opFormData, type: val})}
                    options={[
                      { value: 'إيداع', label: 'إيداع' },
                      { value: 'سحب', label: 'سحب' },
                      { value: 'تحويل', label: 'تحويل' }
                    ]}
                  />
                </div>

                {opFormData.type === 'إيداع' && loan.allowed && (
                  <div className="form-group">
                    <label>دين</label>
                    <div className="fund-loan-toggle" role="radiogroup">
                      <button type="button" role="radio" aria-checked={!isLoan} className={!isLoan ? 'on' : ''} onClick={() => setIsLoan(false)}>لا</button>
                      <button type="button" role="radio" aria-checked={isLoan} className={isLoan ? 'on loan' : ''} onClick={() => setIsLoan(true)}>نعم</button>
                    </div>
                  </div>
                )}

                {opFormData.type === 'تحويل' && (
                  <div className="form-group">
                    <label>تحويل إلى</label>
                    <CustomDropdown<string>
                      value={opFormData.toFundId}
                      onChange={(val) => setOpFormData({...opFormData, toFundId: val})}
                      options={funds.filter(f => f.id !== selectedFundId).map(f => ({ value: f.id, label: f.name }))}
                      placeholder=""
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('funds.form_amount', 'المبلغ (د.ج)')}</label>
                    <CurrencyInput className={`form-control ${opTried && opErrors.amount ? 'is-missing' : ''}`} value={opFormData.amount} onChangeValue={val => setOpFormData({...opFormData, amount: val})} min="1" />
                    {opTried && opErrors.amount && <span className="fund-field-error">اكتب المبلغ</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('funds.form_date', 'التاريخ')}</label>
                    <input type="date" className={`form-control ${opTried && opErrors.date ? 'is-missing' : ''}`} value={opFormData.date} onChange={e => setOpFormData({...opFormData, date: e.target.value})} />
                    {opTried && opErrors.date && <span className="fund-field-error">حدد التاريخ</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>البيان</label>
                  <input type="text" className={`form-control ${opTried && opErrors.description ? 'is-missing' : ''}`} value={opFormData.description} onChange={e => setOpFormData({...opFormData, description: e.target.value})} />
                  {opTried && opErrors.description && <span className="fund-field-error">اكتب البيان</span>}
                </div>

                <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent">
                  <button type="button" className="btn-cancel" onClick={closeOp}>{t('common.cancel', 'إلغاء')}</button>
                  <button type="submit" className="btn-primary">{opFormData.type === 'إيداع' && isLoan && loan.allowed ? 'متابعة لتسجيل الدين' : 'تأكيد'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
