import React, { useState } from 'react';
import { HandCoins, Loader2, AlertCircle, Wallet, CreditCard, CalendarDays } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { CurrencyInput } from '../../../widget/CurrencyInput';
import { AppSelect } from '../../../shared/FormBits';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import type { DebtsController } from '../useDebtsController';
import { PAYMENT_METHODS, todayIso, type Debt } from '../debtUtils';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/** The message under a field left wrong */
const FieldError: React.FC<{ text?: string | null }> = ({ text }) => (text ? <small className="tk-field-error"><AlertCircle size={13} />{text}</small> : null);

/** "no fund" option of the fund picker */
const OUTSIDE = 'none';

/**
 * Pay all or any part of a debt, from a fund or from outside the funds.
 * Quick amounts: everything left, half, a quarter; or any amount up to what is left.
 */
export const RepayForm: React.FC<{ c: DebtsController; debt: Debt; mobile: boolean }> = ({ c, debt: d, mobile }) => {
  const [amount, setAmount] = useState(String(d.remaining));
  const [paidOn, setPaidOn] = useState(todayIso());
  const [fundId, setFundId] = useState(d.fund_id ? String(d.fund_id) : '');
  const [method, setMethod] = useState('نقدا');
  const [notes, setNotes] = useState('');
  // The fields to type left wrong: their message under them (the fund, a choice: a snackbar)
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const value = Number(amount.replace(',', '.')) || 0;
  const quick = [
    { label: 'كل الباقي', v: d.remaining },
    { label: 'النصف', v: Math.round((d.remaining / 2) * 100) / 100 },
    { label: 'الربع', v: Math.round((d.remaining / 4) * 100) / 100 },
  ];

  const amountError = value <= 0 ? 'اكتب المبلغ' : value > d.remaining + 0.005 ? `أكبر من الباقي (${moneyText(d.remaining)})` : null;
  const dateError = !paidOn ? 'حدد التاريخ' : null;

  const save = async () => {
    setTried(true);
    if (amountError || dateError) return;
    if (!fundId) return showSnackbar('خطأ', 'اختر الصندوق', '#ef4444');
    setSaving(true);
    try {
      await c.repay({
        debt_id: d.id,
        amount: value,
        paid_on: paidOn,
        fund_id: fundId === OUTSIDE ? null : Number(fundId),
        payment_method: method,
        notes: notes.trim() || null,
      });
    } catch (e) {
      showSnackbar('خطأ', (e as Error).message, '#ef4444');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      mobile={mobile}
      layer={3}
      size="md"
      icon={HandCoins}
      title={d.kind === 'purchase' ? 'دفع شراء بالدين' : 'تسديد دين'}
      subtitle={d.creditor}
      onClose={c.closeRepay}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeRepay}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <HandCoins size={17} />}
            {d.kind === 'purchase' ? 'دفع' : 'تسديد'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <div className="db-repay-head">
          <span><small>قيمة الدين</small><b>{moneyText(d.amount)}</b></span>
          <span><small>المسدد</small><b className="db-paid">{moneyText(d.repaid)}</b></span>
          <span><small>الباقي</small><b className="db-left">{moneyText(d.remaining)}</b></span>
        </div>

        <label className="tk-field">
          <span className="tk-label">{d.kind === 'purchase' ? 'المبلغ المدفوع' : 'المبلغ المسدد'}</span>
          <CurrencyInput className={`tk-input db-money-input big ${tried && amountError ? 'is-missing' : ''}`} inputMode="numeric" value={amount} onChangeValue={setAmount} autoFocus={!mobile} />
          <FieldError text={tried ? amountError : null} />
        </label>
        <div className="db-quick">
          {quick.map(q => (
            <button key={q.label} type="button" className={Math.abs(q.v - value) < 0.005 ? 'on' : ''} onClick={() => setAmount(String(q.v))}>
              <b>{q.label}</b><small>{moneyText(q.v)}</small>
            </button>
          ))}
        </div>

        <div className="tk-grid-2">
          <AppSelect
            mobile={mobile}
            label="يُدفع من"
            icon={Wallet}
            value={fundId}
            options={[
              ...c.funds.map(f => ({ value: String(f.id), label: f.name, hint: moneyText(Number(f.initialBalance) || 0) })),
              { value: OUTSIDE, label: 'خارج الصناديق' },
            ]}
            onChange={setFundId}
            placeholder=""
          />
          <AppSelect
            mobile={mobile}
            label="طريقة الدفع"
            icon={CreditCard}
            value={method}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
            onChange={setMethod}
          />
        </div>

        <label className="tk-field">
          <span className="tk-label"><CalendarDays size={14} />تاريخ التسديد</span>
          <input className={`tk-input ${tried && dateError ? 'is-missing' : ''}`} type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} />
          <FieldError text={tried ? dateError : null} />
        </label>

        <label className="tk-field">
          <span className="tk-label">ملاحظات</span>
          <input className="tk-input" value={notes} onChange={e => setNotes(e.target.value)} />
        </label>


      </div>
    </SidePanel>
  );
};
