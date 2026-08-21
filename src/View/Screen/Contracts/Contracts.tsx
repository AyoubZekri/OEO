import React from 'react';
import { useTranslation } from 'react-i18next';
import { useContractsController } from './ContractsController';
import { Search, Plus, FileSignature, Edit2, CalendarClock, X, Calculator, Trash2, RefreshCw } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CurrencyInput } from '../../widget/CurrencyInput';
import { useAuth } from '../../../core/context/AuthContext';
import './Contracts.css';

export const Contracts: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useContractsController();
  const {
    contracts,
    individuals,
    isLoading,
    isAddEditModalOpen,
    isScheduleModalOpen,
    selectedContract,
    formData,
    errors,
    calculatedPaymentValue,
    openAddModal,
    openEditModal,
    closeAddEditModal,
    openScheduleModal,
    closeScheduleModal,
    handleFormChange,
    setFormDataValue,
    saveContract,
    handleDeleteContract,
    formatCurrency,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isRenewModalOpen,
    contractToRenew,
    renewEndDate,
    setRenewEndDate,
    openRenewModal,
    closeRenewModal,
    handleRenewContract
  } = controller;

  // For the automatically calculated payment value, we also want it to look like 1.000,00
  const formatCalculated = (val: number) => {
    const enStr = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return enStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
  };

  return (
    <div className="contracts-container">
      <div className="contracts-header">
        <h1 className="page-title">{t('contracts.title', 'العقود')}</h1>
        
        <div className="contracts-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={t('contracts.search_placeholder', 'ابحث برقم العقد أو اسم المستفيد...')} 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown 
            options={[
              { value: 'all', label: t('contracts.filter_all', 'الكل') },
              { value: 'مدرب', label: 'مدرب' },
              { value: 'لاعب', label: 'لاعب' },
              { value: 'اداري', label: 'إداري' },
              { value: 'اخرى', label: 'أخرى' }
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val)}
          />
          {hasAccess(permissions.contracts.add) && (
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              {t('contracts.add_contract', 'إضافة عقد')}
            </button>
          )}
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="contracts-table-wrapper">
        <table className="custom-table contracts-main-table">
          <thead>
            <tr>
              <th>{t('contracts.beneficiary', 'المستفيد')}</th>
              <th>{t('contracts.contract_number', 'رقم العقد')}</th>
              <th>{t('contracts.contract_type', 'نوع العقد')}</th>
              <th>{t('contracts.contract_value', 'قيمة العقد')}</th>
              <th>{t('contracts.start_date', 'تاريخ البداية')}</th>
              <th>{t('contracts.end_date', 'تاريخ النهاية')}</th>
              <th>{t('contracts.actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id}>
                <td className="contract-beneficiary-cell" data-label={t('contracts.beneficiary', 'المستفيد')}>
                  <div className="beneficiary-info">
                    <span className="b-name">{contract.beneficiary}</span>
                  </div>
                </td>
                <td className="contract-number-cell" data-label={t('contracts.contract_number', 'رقم العقد')}>{String(contract.id).padStart(4, '0')}</td>
                <td data-label={t('contracts.contract_type', 'نوع العقد')}><span className="badge badge-purple">{contract.contractType}</span></td>
                <td className="amount-cell" data-label={t('contracts.contract_value', 'قيمة العقد')}>{formatCurrency(contract.contractValue)}</td>
                <td style={{ color: 'var(--text-muted)' }} data-label={t('contracts.start_date', 'تاريخ البداية')}>
                  {contract.startDate ? new Intl.DateTimeFormat('ar-DZ').format(new Date(contract.startDate)) : '-'}
                </td>
                <td style={{ color: 'var(--text-muted)' }} data-label={t('contracts.end_date', 'تاريخ النهاية')}>
                  {contract.endDate ? new Intl.DateTimeFormat('ar-DZ').format(new Date(contract.endDate)) : '-'}
                </td>
                  <td data-label={t('contracts.actions', 'إجراءات')}>
                    <div className="action-buttons-wrapper">
                      {hasAccess(permissions.contracts.view) && (
                        <button className="btn-action view-btn" onClick={() => openScheduleModal(contract)} title="عرض الاستحقاقات">
                          <CalendarClock size={18} color="#333333" />
                        </button>
                      )}
                      {hasAccess(permissions.contracts.renew) && (
                        <button className="btn-action renew-btn" onClick={() => openRenewModal(contract)} title="تجديد العقد">
                          <RefreshCw size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.contracts.edit) && (
                        <button className="btn-action edit-btn" onClick={() => openEditModal(contract)} title="تعديل">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.contracts.delete) && (
                        <button className="btn-action delete-btn" onClick={() => handleDeleteContract(contract.id)} title="حذف">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  {isLoading ? 'جاري التحميل...' : 'لا توجد عقود'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Contract Modal */}
      {isAddEditModalOpen && (
        <div className="dialog-overlay" onClick={closeAddEditModal}>
          <div className="dialog-content add-contract-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <FileSignature size={24} />
                <h2>{formData.contractNumber ? t('contracts.edit_contract', 'تعديل العقد') : t('contracts.add_new_contract', 'إضافة عقد جديد')}</h2>
              </div>
              <button className="close-btn" onClick={closeAddEditModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form className="add-contract-form">
                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 3, flex: 1 }}>
                    <CustomDropdown<string>
                      label={t('contracts.beneficiary', 'المستفيد') + ' *'}
                      value={formData.individuals_id}
                      placeholder="-- اختر المستفيد --"
                      options={individuals.map(ind => ({ 
                        value: String(ind.id), 
                        label: `${ind.first_name} ${ind.last_name} (${ind.type === 'player' ? 'لاعب' : ind.type === 'coach' ? 'مدرب' : 'إداري'})` 
                      }))}
                      onChange={(val) => setFormDataValue('individuals_id', val)}
                    />
                    {errors.individuals_id && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.individuals_id}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 2 }}>
                    <CustomDropdown<string>
                      label={t('contracts.status', 'الحالة')}
                      value={formData.status}
                      options={[
                        { value: 'active', label: t('contracts.status_active', 'نشط') },
                        { value: 'inactive', label: t('contracts.status_inactive', 'غير نشط') }
                      ]}
                      onChange={(val) => setFormDataValue('status', val)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('contracts.start_date', 'تاريخ البداية')} *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} className="form-control" />
                    {errors.startDate && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.startDate}</span>}
                  </div>
                  <div className="form-group">
                    <label>{t('contracts.end_date', 'تاريخ النهاية')} *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} className="form-control" />
                    {errors.endDate && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.endDate}</span>}
                  </div>
                </div>

                <div className="form-row auto-calc-row">
                  <div className="form-group">
                    <label>{t('contracts.contract_value', 'قيمة العقد')}</label>
                    <CurrencyInput name="contractValue" value={formData.contractValue} onChangeValue={(val) => setFormDataValue('contractValue', val)} className="form-control value-input" />
                    {errors.contractValue && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.contractValue}</span>}
                  </div>
                  <div className="form-group">
                    <label>{t('contracts.num_payments', 'عدد الدفعات')} *</label>
                    <input type="number" name="numberOfPayments" value={formData.numberOfPayments} onChange={handleFormChange} className="form-control" min="1" />
                    {errors.numberOfPayments && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.numberOfPayments}</span>}
                  </div>
                  <div className="form-group auto-calc-result">
                    <label><Calculator size={14} /> {t('contracts.auto_payment_value', 'قيمة الدفعة (تلقائي)')}</label>
                    <div className="calculated-value" dir="ltr" style={{ textAlign: 'left' }}>{formatCalculated(calculatedPaymentValue)}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('contracts.monthly_salary', 'الراتب الشهري')}</label>
                    <CurrencyInput name="monthlySalary" value={formData.monthlySalary} onChangeValue={(val) => setFormDataValue('monthlySalary', val)} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('contracts.win_bonus', 'منحة الفوز')}</label>
                    <CurrencyInput name="winBonus" value={formData.winBonus} onChangeValue={(val) => setFormDataValue('winBonus', val)} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('contracts.goals_bonus', 'منحة الأهداف')}</label>
                    <CurrencyInput name="goalsBonus" value={formData.goalsBonus} onChangeValue={(val) => setFormDataValue('goalsBonus', val)} className="form-control" />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('contracts.notes', 'ملاحظات')}</label>
                  <textarea name="notes" value={formData.notes} onChange={handleFormChange} className="form-control" rows={3}></textarea>
                </div>
              </form>
            </div>
            <div className="dialog-footer">
              <button className="btn-cancel" onClick={closeAddEditModal}>{t('contracts.cancel', 'إلغاء')}</button>
              <button className="btn-primary" onClick={saveContract} disabled={isLoading}>
                {isLoading ? 'جاري الحفظ...' : t('contracts.save', 'حفظ العقد')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Entitlements Modal */}
      {isScheduleModalOpen && selectedContract && (
        <div className="dialog-overlay" onClick={closeScheduleModal}>
          <div className="dialog-content schedule-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <CalendarClock size={24} color="#333333" />
                <h2>{t('contracts.schedule_title', 'جدول الاستحقاقات')} - {selectedContract.beneficiary}</h2>
              </div>
              <button className="close-btn" onClick={closeScheduleModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <div className="schedule-summary">
                <div className="summary-item">
                  <span className="s-label">{t('contracts.contract_value', 'قيمة العقد')}</span>
                  <span className="s-value">{formatCurrency(selectedContract.contractValue)}</span>
                </div>
                <div className="summary-item">
                  <span className="s-label">{t('contracts.num_payments', 'عدد الدفعات')}</span>
                  <span className="s-value">{selectedContract.numberOfPayments}</span>
                </div>
                <div className="summary-item">
                  <span className="s-label">{t('contracts.payment_value', 'قيمة الدفعة')}</span>
                  <span className="s-value highlight">{formatCurrency(selectedContract.paymentValue)}</span>
                </div>
              </div>

              <div className="entitlements-list">
                {selectedContract.entitlements && selectedContract.entitlements.length > 0 ? (
                  selectedContract.entitlements.map((ent, idx) => (
                    <div className={`entitlement-card ${ent.status}`} key={ent.id}>
                      <div className="ent-header">
                        <span className="ent-index">#{idx + 1}</span>
                        <span className={`ent-status badge ${ent.status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                          {ent.status === 'paid' ? t('contracts.paid', 'مدفوع') : t('contracts.unpaid', 'غير مدفوع')}
                        </span>
                      </div>
                      <div className="ent-body">
                        <div className="ent-desc">{ent.description}</div>
                        <div className="ent-amount">{formatCurrency(ent.amount)}</div>
                      </div>
                      <div className="ent-footer">
                        <CalendarClock size={14} color="#333333" />
                        {new Intl.DateTimeFormat('ar-DZ').format(new Date(ent.dueDate))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">{t('contracts.no_schedule', 'لا يوجد جدول استحقاقات')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Renew Contract Modal */}
      {isRenewModalOpen && contractToRenew && (
        <div className="task-dialog-overlay" onClick={closeRenewModal} style={{ zIndex: 1100 }}>
          <div className="task-dialog" onClick={e => e.stopPropagation()}>
            <div className="task-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={24} color="#3b82f6" />
                <h2>{t('contracts.renew_contract', 'تجديد العقد')} - {contractToRenew.beneficiary}</h2>
              </div>
              <button className="close-btn" onClick={closeRenewModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="task-form">
              <div className="form-group">
                <label>تاريخ التجديد إلى غاية *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={renewEndDate} 
                  onChange={(e) => setRenewEndDate(e.target.value)} 
                />
              </div>
              
              <div className="form-actions">
                <button className="btn-cancel" onClick={closeRenewModal}>{t('contracts.cancel', 'إلغاء')}</button>
                <button className="btn-primary" onClick={handleRenewContract} disabled={isLoading || !renewEndDate} style={{ background: '#3b82f6', border: 'none' }}>
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التجديد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
