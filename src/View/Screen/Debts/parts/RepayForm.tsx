import React, { useState } from 'react';
import { HandCoins, Loader2, AlertCircle, Wallet, CreditCard, CalendarDays, Info } from 'lucide-react';
import { TaskPanel } from '../../Tasks/parts/TaskPanel';
import { AppSelect } from '../../Tasks/parts/FormBits';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import type { DebtsController } from '../useDebtsController';
import { PAYMENT_METHODS, todayIso, type Debt } from '../debtUtils';

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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const value = Number(amount.replace(',', '.')) || 0;
  const fund = c.funds.find(f => String(f.id) === fundId);
  const after = Math.max(0, Math.round((d.remaining - value) * 100) / 100);
  const quick = [
    { label: 'كل الباقي', v: d.remaining },
    { label: 'النصف', v: Math.round((d.remaining / 2) * 100) / 100 },
    { label: 'الربع', v: Math.round((d.remaining / 4) * 100) / 100 },
  ];

  const save = async () => {
    if (value <= 0) return setError('اكتب المبلغ المسدد');
    if (value > d.remaining + 0.005) return setError(`المبلغ أكبر من الباقي (${moneyText(d.remaining)})`);
    if (!fundId) return setError('اختر الصندوق الذي يُدفع منه، أو «خارج الصناديق»');
    if (!paidOn) return setError('حدد تاريخ التسديد');
    setError('');
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
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskPanel
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
            {d.kind === 'purchase' ? 'دفع' : 'تسديد'} {value > 0 ? moneyText(value) : ''}
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
          <span className="tk-label">{d.kind === 'purchase' ? 'المبلغ المدفوع (د.ج)' : 'المبلغ المسدد (د.ج)'}</span>
          <input className="tk-input db-money-input big" dir="ltr" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} autoFocus={!mobile} />
        </label>
        <div className="db-quick">
          {quick.map(q => (
            <button key={q.label} type="button" className={Math.abs(q.v - value) < 0.005 ? 'on' : ''} onClick={() => setAmount(String(q.v))}>
              <b>{q.label}</b><small>{moneyText(q.v)}</small>
            </button>
          ))}
        </div>
        {value > 0 && value <= d.remaining + 0.005 && (
          <small className="tk-hint"><Info size={12} />{after > 0 ? `يبقى بعد هذا التسديد ${moneyText(after)}` : 'يُصبح الدين مسدداً بالكامل'}</small>
        )}

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
            placeholder="اختر الصندوق"
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
        {fund && value > (Number(fund.initialBalance) || 0) && (
          <small className="tk-hint warn"><AlertCircle size={12} />رصيد «{fund.name}» ({moneyText(Number(fund.initialBalance) || 0)}) أقل من المبلغ</small>
        )}

        <label className="tk-field">
          <span className="tk-label"><CalendarDays size={14} />تاريخ التسديد</span>
          <input className="tk-input" type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} />
        </label>

        <label className="tk-field">
          <span className="tk-label">ملاحظات <em>اختياري</em></span>
          <input className="tk-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: الدفعة الأولى" />
        </label>

        <small className="tk-hint">
          <Info size={12} />
          {d.kind === 'loan'
            ? 'يُنقص المبلغ من رصيد الصندوق المختار مباشرة (لا يُسجل عملية في الصندوق ولا يُحسب مصروفاً).'
            : 'يُسجل المبلغ مصروفاً في جدول المصاريف والمدفوعات، ويُسحب من الصندوق المختار.'}
        </small>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </TaskPanel>
  );
};
