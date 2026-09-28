import React, { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, ArrowRightLeft, Wallet } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useFundsController } from '../../Screen/Funds/FundsController';
import type { Fund, TransactionType } from '../../Screen/Funds/fund_model';
import { moneyText } from '../MobileContracts/contractUtils';
import { arCount } from '../MobileTeams/teamRoster';
import { type FundPermissions, fundIcon, balanceOf, txFund, txTo } from './fundUtils';
import { MobileFundDetails } from './MobileFundDetails';
import { MobileFundForm } from './MobileFundForm';
import { MobileFundOperation } from './MobileFundOperation';
import './MobileFunds.css';

interface MobileFundsProps {
  c: ReturnType<typeof useFundsController>;
  can: FundPermissions;
}

// Phone version of the funds page: total balance, one card per fund, details with its operations
export const MobileFunds: React.FC<MobileFundsProps> = ({ c, can }) => {
  const [detailsId, setDetailsId] = useUrlDetails('fund');
  const [opType, setOpType] = useState<TransactionType>('إيداع');

  const total = c.funds.reduce((s, f) => s + balanceOf(f), 0);
  const details = detailsId ? c.funds.find(f => String(f.id) === detailsId) : undefined;
  const operating = c.selectedFundId ? c.funds.find(f => String(f.id) === String(c.selectedFundId)) : undefined;
  const txOf = (id: string) => c.transactions.filter(t => txFund(t) === String(id) || txTo(t) === String(id));

  const startOperation = (fund: Fund, type: TransactionType = 'إيداع') => {
    setOpType(type);
    c.openOperationDialog(fund.id);
  };

  const menuItems = (f: Fund): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(f.id) },
    ...(can.addTransaction ? [{ key: 'op', label: 'عملية جديدة', icon: ArrowRightLeft, color: '#3b82f6', onClick: () => startOperation(f) }] : []),
    ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => c.openFundDialog(f) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.deleteFund(f.id) }] : []),
  ];

  return (
    <div className="mfd-page">
      <MobileAppBar title="الصناديق المالية" />

      <section className="mfd-hero">
        <div className="mfd-hero-top">
          <span className="mfd-hero-icon"><Wallet size={26} /></span>
          <div>
            <small>الرصيد الإجمالي · {arCount(c.funds.length, 'صندوق واحد', 'صندوقان', 'صناديق', 'صندوقاً')}</small>
            <strong dir="ltr">{moneyText(total)}</strong>
          </div>
        </div>
        {c.funds.length > 0 && total > 0 && (
          <>
            <div className="mfd-share" aria-hidden="true">
              {c.funds.map(f => balanceOf(f) > 0 && (
                <i key={f.id} className={`ic-${fundIcon(f.icon).value}`} style={{ flexGrow: balanceOf(f) }} />
              ))}
            </div>
            <div className="mfd-legend">
              {c.funds.map(f => (
                <span key={f.id}><i className={`ic-${fundIcon(f.icon).value}`} />{f.name}<b>{Math.round((balanceOf(f) / total) * 100)}%</b></span>
              ))}
            </div>
          </>
        )}
      </section>

      {c.isLoading && !c.funds.length ? (
        <MobileLoader text="جاري تحميل الصناديق..." />
      ) : c.funds.length === 0 ? (
        <div className="mfd-empty">
          <span className="mfd-empty-icon"><Wallet size={36} /></span>
          <strong>لا توجد صناديق حالياً</strong>
          {can.add && <p>أضف صندوقاً جديداً بالزر +</p>}
        </div>
      ) : (
        <div className="mfd-list">
          {c.funds.map(f => {
            const meta = fundIcon(f.icon);
            const count = txOf(f.id).length;
            const open = () => setDetailsId(f.id);
            return (
              <article
                key={f.id}
                className={`mfd-card ic-${meta.value}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="mfd-card-top">
                  <span className="mfd-card-icon"><meta.icon size={20} /></span>
                  <span className="mfd-card-text">
                    <strong>{f.name}</strong>
                    <small>{meta.label}{count ? ` · ${arCount(count, 'عملية واحدة', 'عمليتان', 'عمليات', 'عملية')}` : ''}</small>
                  </span>
                  <MobileRowMenu items={menuItems(f)} label="إجراءات الصندوق" />
                </div>
                <div className="mfd-card-balance">
                  <small>الرصيد الحالي</small>
                  <strong dir="ltr">{moneyText(balanceOf(f))}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="mfd-fab" onClick={() => c.openFundDialog()} aria-label="إضافة صندوق" title="إضافة صندوق">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileFundDetails
          fund={details}
          funds={c.funds}
          transactions={txOf(details.id)}
          canEdit={can.edit}
          canOperate={can.addTransaction}
          onOperation={type => startOperation(details, type)}
          onEdit={() => c.openFundDialog(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isFundDialogOpen && (
        <MobileFundForm
          key={c.editingFund?.id || 'new'}
          fund={c.editingFund}
          onSave={(data, id) => (id ? c.editFund(id, data) : c.addFund(data))}
          onClose={c.closeFundDialog}
        />
      )}

      {c.isOperationDialogOpen && operating && (
        <MobileFundOperation
          key={`${operating.id}-${opType}`}
          fund={operating}
          funds={c.funds}
          initialType={opType}
          onSave={c.addTransaction}
          onClose={c.closeOperationDialog}
        />
      )}
    </div>
  );
};
