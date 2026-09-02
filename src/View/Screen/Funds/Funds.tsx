import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useFundsController, type Fund, type TransactionType } from './FundsController';
import { Wallet, Landmark, Mail, ArrowRightLeft, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { CurrencyInput } from '../../widget/CurrencyInput';
import { useAuth } from '../../../core/context/AuthContext';
import './Funds.css';

export const Funds: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useFundsController();
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
    }
  }, [isOperationDialogOpen]);

  const handleFundSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundFormData.name) return;

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
    if (!opFormData.amount || !selectedFundId) return;
    if (opFormData.type === 'تحويل' && !opFormData.toFundId) return;

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
        <h1 className="page-title">{t('funds.title', 'الصناديق المالية')}</h1>
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
        <div className="dialog-overlay" onClick={closeFundDialog}>
          <div className="dialog-content add-fund-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <Wallet size={24} />
                <h2>{editingFund ? 'تعديل الصندوق' : 'إضافة صندوق جديد'}</h2>
              </div>
              <button className="close-btn" onClick={closeFundDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form onSubmit={handleFundSave}>
                <div className="form-group">
                  <label>اسم الصندوق</label>
                  <input type="text" className="form-control" value={fundFormData.name} onChange={e => setFundFormData({...fundFormData, name: e.target.value})} required placeholder="مثال: البنك المركزي" />
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
                      className="form-control"
                      value={fundFormData.initialBalance}
                      onChangeValue={(val) => setFundFormData({ ...fundFormData, initialBalance: val })}
                      required
                    />
                  </div>
                </div>

                <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent">
                  <button type="button" className="btn-cancel" onClick={closeFundDialog}>{t('common.cancel', 'إلغاء')}</button>
                  <button type="submit" className="btn-primary">{t('common.save', 'حفظ')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Operation Dialog (Add Money / Transfer) */}
      {isOperationDialogOpen && selectedFundId && (
        <div className="dialog-overlay" onClick={closeOperationDialog}>
          <div className="dialog-content add-fund-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <ArrowRightLeft size={24} />
                <h2>عملية جديدة - {getFundName(selectedFundId)}</h2>
              </div>
              <button className="close-btn" onClick={closeOperationDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form onSubmit={handleOpSave}>
                <div className="form-group">
                  <label>نوع العملية</label>
                  <CustomDropdown<TransactionType>
                    value={opFormData.type}
                    onChange={(val) => setOpFormData({...opFormData, type: val})}
                    options={[
                      { value: 'إيداع', label: 'إضافة مال (إيداع)' },
                      { value: 'سحب', label: 'سحب مال (مصروف)' },
                      { value: 'تحويل', label: 'تحويل إلى صندوق آخر' }
                    ]}
                  />
                </div>

                {opFormData.type === 'تحويل' && (
                  <div className="form-group">
                    <label>تحويل إلى</label>
                    <CustomDropdown<string>
                      value={opFormData.toFundId}
                      onChange={(val) => setOpFormData({...opFormData, toFundId: val})}
                      options={funds.filter(f => f.id !== selectedFundId).map(f => ({ value: f.id, label: f.name }))}
                      placeholder="اختر الصندوق المحول إليه"
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('funds.form_amount', 'المبلغ (د.ج)')}</label>
                    <CurrencyInput className="form-control" value={opFormData.amount} onChangeValue={val => setOpFormData({...opFormData, amount: val})} required min="1" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('funds.form_date', 'التاريخ')}</label>
                    <input type="date" className="form-control" value={opFormData.date} onChange={e => setOpFormData({...opFormData, date: e.target.value})} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('funds.form_description', 'التفاصيل / البيان')}</label>
                  <input type="text" className="form-control" value={opFormData.description} onChange={e => setOpFormData({...opFormData, description: e.target.value})} required />
                </div>

                <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent">
                  <button type="button" className="btn-cancel" onClick={closeOperationDialog}>{t('common.cancel', 'إلغاء')}</button>
                  <button type="submit" className="btn-primary">{t('common.save', 'حفظ')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
