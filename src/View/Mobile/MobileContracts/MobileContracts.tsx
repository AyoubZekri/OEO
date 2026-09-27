import React, { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, FileSignature, Search, X, Wallet, Filter, ChevronDown } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useContractsController } from '../../Screen/Contracts/ContractsController';
import type { ContractModel } from '../../Screen/Contracts/contract_model';
import {
  type ContractPermissions, moneyText, contractNumber, seasonText, STATUS_LABEL, beneficiaryOf, photoOf, paymentsText,
} from './contractUtils';
import { MobileContractDetails } from './MobileContractDetails';
import { MobileContractForm } from './MobileContractForm';
import './MobileContracts.css';

// Short names of the contract types for the filter
const TYPE_CHIP: Record<string, string> = { 'موظف / إداري / طبيب': 'إداري وطاقم' };

interface MobileContractsProps {
  c: ReturnType<typeof useContractsController>;
  can: ContractPermissions;
}

// Phone version of the contracts page: summary, search, type chips, short cards, details and form on their own pages
export const MobileContracts: React.FC<MobileContractsProps> = ({ c, can }) => {
  const [type, setType] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('contract');

  // c.contracts is already filtered by the search box
  const types = [...new Set(c.contracts.map(x => x.contractType))];
  const list = type ? c.contracts.filter(x => x.contractType === type) : c.contracts;
  const details = detailsId ? c.contracts.find(x => String(x.id) === detailsId) : undefined;

  const total = c.contracts.reduce((s, x) => s + (x.contractValue || 0), 0);
  const active = c.contracts.filter(x => x.status === 'active').length;
  const players = c.contracts.filter(x => x.contractType === 'لاعب').length;

  const menuItems = (x: ContractModel): MobileRowMenuItem[] => [
    ...(can.view ? [{ key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(x.id) }] : []),
    ...(can.edit ? [{ key: 'edit', label: 'تعديل العقد', icon: Pencil, color: '#f97316', onClick: () => c.openEditModal(x) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.handleDeleteContract(x.id) }] : []),
  ];

  return (
    <div className="mct-page">
      <MobileAppBar title="العقود" />

      {/* Summary */}
      <section className="mct-hero">
        <div className="mct-hero-top">
          <span className="mct-hero-icon"><FileSignature size={26} /></span>
          <div>
            <small>عقود النادي</small>
            <strong>{c.contracts.length}</strong>
          </div>
        </div>
        <div className="mct-total">
          <small><Wallet size={13} /> إجمالي قيمة العقود</small>
          <strong dir="ltr">{moneyText(total)}</strong>
        </div>
        <div className="mct-stats">
          <div className="green"><strong>{active}</strong><small>نشطة</small></div>
          <div><strong>{players}</strong><small>لاعبين</small></div>
          <div><strong>{c.contracts.length - players}</strong><small>طاقم وإداريين</small></div>
        </div>
      </section>

      <label className="mct-search">
        <Search size={17} />
        <input
          type="search"
          value={c.searchQuery}
          onChange={e => c.setSearchQuery(e.target.value)}
          placeholder="ابحث بالاسم أو رقم العقد..."
        />
        {c.searchQuery && (
          <button type="button" onClick={() => c.setSearchQuery('')} aria-label="مسح البحث"><X size={15} /></button>
        )}
      </label>

      {/* Type filter: opens the bottom sheet */}
      {types.length > 1 && (
        <MobileSelect
          label="تصفية حسب النوع"
          icon={Filter}
          value={type}
          options={[
            { value: '', label: 'كل الأنواع', hint: String(c.contracts.length) },
            ...types.map(t => ({ value: t, label: TYPE_CHIP[t] || t, hint: String(c.contracts.filter(x => x.contractType === t).length) })),
          ]}
          onChange={setType}
          renderTrigger={openSheet => (
            <button type="button" className={`mct-filter ${type ? 'active' : ''}`} onClick={openSheet}>
              <Filter size={17} />
              <span><small>نوع العقد</small><strong>{type ? (TYPE_CHIP[type] || type) : 'كل الأنواع'}</strong></span>
              <ChevronDown size={18} />
            </button>
          )}
        />
      )}

      {c.isLoading && !c.contracts.length ? (
        <MobileLoader text="جاري تحميل العقود..." />
      ) : list.length === 0 ? (
        <div className="mct-empty">
          <span className="mct-empty-icon"><FileSignature size={36} /></span>
          <strong>{c.searchQuery || type ? 'لا توجد نتائج' : 'لا توجد عقود حالياً'}</strong>
          <p>{c.searchQuery || type ? 'جرّب اسماً آخر أو نوعاً آخر.' : can.add ? 'أضف عقداً جديداً بالزر +' : ''}</p>
        </div>
      ) : (
        <div className="mct-list">
          {list.map(x => {
            const person = beneficiaryOf(x, c.individuals);
            const items = menuItems(x);
            const open = () => { if (can.view) setDetailsId(x.id); };
            return (
              <article
                key={x.id}
                className={`mct-card ${x.status === 'active' ? '' : 'inactive'}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="mct-card-top">
                  <img src={photoOf(person)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                  <span className="mct-card-text">
                    <strong>{x.beneficiary}</strong>
                    <small><span dir="ltr">#{contractNumber(x)}</span> · موسم <span dir="ltr">{seasonText(x)}</span></small>
                  </span>
                  {items.length > 0 && <MobileRowMenu items={items} label="إجراءات العقد" />}
                </div>
                <div className="mct-card-foot">
                  <em className="mct-type">{x.contractType}</em>
                  <em className={`mct-status ${x.status}`}><i />{STATUS_LABEL[x.status] || x.status}</em>
                  <span className="mct-value">
                    <strong dir="ltr">{moneyText(x.contractValue)}</strong>
                    <small>{paymentsText(x.installments?.length || x.numberOfPayments)}</small>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="mct-fab" onClick={c.openAddModal} aria-label="إضافة عقد" title="إضافة عقد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileContractDetails
          contract={details}
          person={beneficiaryOf(details, c.individuals)}
          canEdit={can.edit}
          onEdit={() => c.openEditModal(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isAddEditModalOpen && <MobileContractForm c={c} />}
    </div>
  );
};
