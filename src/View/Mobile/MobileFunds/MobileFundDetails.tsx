import React from 'react';
import { Pencil, History, ArrowRightLeft } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { Fund, FundTransaction, TransactionType } from '../../Screen/Funds/fund_model';
import { moneyText } from '../MobileContracts/contractUtils';
import { longDate } from '../MobileTrainingSessions/sessionUtils';
import { fundIcon, balanceOf, OPERATIONS, txFund, txTo, txAmount, txSign } from './fundUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileFundDetailsProps {
  fund: Fund;
  funds: Fund[];
  transactions: FundTransaction[];
  canEdit: boolean;
  canOperate: boolean;
  onOperation: (type: TransactionType) => void;
  onEdit: () => void;
  onClose: () => void;
}

// One fund (phone): balance card, quick operations and its operations history
export const MobileFundDetails: React.FC<MobileFundDetailsProps> = ({
  fund, funds, transactions, canEdit, canOperate, onOperation, onEdit, onClose,
}) => {
  const meta = fundIcon(fund.icon);
  const id = String(fund.id);
  const nameOf = (fid: string) => funds.find(f => String(f.id) === fid)?.name || 'صندوق آخر';
  const list = transactions.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const sumIn = list.filter(t => txSign(t, id) > 0).reduce((s, t) => s + txAmount(t), 0);
  const sumOut = list.filter(t => txSign(t, id) < 0).reduce((s, t) => s + txAmount(t), 0);

  const describe = (t: FundTransaction) => {
    if (t.type !== 'تحويل') return t.type;
    return txTo(t) === id && txFund(t) !== id ? `تحويل من ${nameOf(txFund(t))}` : `تحويل إلى ${nameOf(txTo(t))}`;
  };

  return (
    <MobileScreen
      title={fund.name}
      onBack={onClose}
      footer={canEdit ? <button type="button" className="me-btn" onClick={onEdit}><Pencil size={18} /> تعديل الصندوق</button> : undefined}
    >
      <section className={`mfd-bigcard ic-${meta.value}`}>
        <div className="mfd-bigcard-top">
          <span className="mfd-card-icon"><meta.icon size={22} /></span>
          <em>{meta.label}</em>
        </div>
        <small>الرصيد الحالي</small>
        <strong dir="ltr">{moneyText(balanceOf(fund))}</strong>
        <span className="mfd-bigcard-name">{fund.name}</span>
      </section>

      {canOperate && (
        <div className="mfd-ops">
          {OPERATIONS.map(op => (
            <button key={op.value} type="button" className={`tone-${op.tone}`} onClick={() => onOperation(op.value)}>
              <span><op.icon size={20} /></span>
              {op.label}
            </button>
          ))}
        </div>
      )}

      <section className="me-card">
        <h3 className="me-section-title"><span><History size={16} /></span>سجل العمليات</h3>
        {list.length === 0 ? (
          <p className="mfd-none"><ArrowRightLeft size={18} /> لا توجد عمليات مسجلة لهذا الصندوق</p>
        ) : (
          <>
            <div className="mfd-flow">
              <div className="in"><small>دخل</small><strong dir="ltr">{moneyText(sumIn)}</strong></div>
              <div className="out"><small>خرج</small><strong dir="ltr">{moneyText(sumOut)}</strong></div>
            </div>
            <ul className="mfd-tx">
              {list.map(t => {
                const sign = txSign(t, id);
                const op = OPERATIONS.find(o => o.value === t.type) || OPERATIONS[0];
                return (
                  <li key={t.id} className={sign > 0 ? 'in' : 'out'}>
                    <span className="mfd-tx-icon"><op.icon size={17} /></span>
                    <span className="mfd-tx-text">
                      <strong>{t.description || describe(t)}</strong>
                      <small>{t.description ? `${describe(t)} · ` : ''}{t.date ? longDate(t.date.slice(0, 10)) : ''}</small>
                    </span>
                    <b dir="ltr">{sign > 0 ? '+' : '−'} {moneyText(txAmount(t))}</b>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </MobileScreen>
  );
};
