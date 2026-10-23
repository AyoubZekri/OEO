import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, Landmark, UserRound, Wallet, Tag, CalendarDays, FileText, Info, Banknote, Lock } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { CurrencyInput } from '../../../widget/CurrencyInput';
import { AppSelect } from '../../../shared/FormBits';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import type { DebtsController } from '../useDebtsController';
import { DEBT_NATURES, todayIso, type Debt, type DebtKind } from '../debtUtils';

/** A numbered block of the form, same look as the travels form */
const Section: React.FC<{ step: number; icon: typeof Info; title: string; hint?: string; children: React.ReactNode }> = ({ step, icon: Icon, title, hint, children }) => (
  <section className="tk-sec tv-sec">
    <header>
      <span className="tv-step" aria-hidden="true">{step}</span>
      <div><h4><Icon size={15} />{title}</h4>{hint && <small>{hint}</small>}</div>
    </header>
    <div className="tk-sec-body">{children}</div>
  </section>
);

/**
 * Add or edit a debt of the page's kind: a loan put into a fund (debts page),
 * or a purchase not paid yet (payments & expenses page, mostly added from the payment form).
 */
/** A new debt's first values (a deposit in a fund that turned out to be a loan): its amount and fund are locked */
export interface DebtPrefill {
  amount: number;
  fundId: string;
  fundName?: string;
  debtDate?: string;
  title?: string;
}

export const DebtForm: React.FC<{ c: DebtsController; debt: Debt | null; initialKind: DebtKind; mobile: boolean; prefill?: DebtPrefill | null }> = ({ c, debt, initialKind, mobile, prefill }) => {
  const kind: DebtKind = debt?.kind || initialKind;
  const [creditor, setCreditor] = useState(debt?.creditor || '');
  const [phone, setPhone] = useState(debt?.creditor_phone || '');
  const [title, setTitle] = useState(debt?.title || prefill?.title || '');
  const [amount, setAmount] = useState(debt ? String(debt.amount) : prefill ? String(prefill.amount) : '');
  const [debtDate, setDebtDate] = useState(debt?.debt_date || prefill?.debtDate || todayIso());
  const [dueDate, setDueDate] = useState(debt?.due_date || '');
  const [fundId, setFundId] = useState(debt?.fund_id ? String(debt.fund_id) : prefill?.fundId || '');
  const [nature, setNature] = useState(debt?.expense_nature || '');
  const [notes, setNotes] = useState(debt?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isLoan = kind === 'loan';
  // Opened from a fund's deposit: the amount and the fund are the operation's, not changed here
  const locked = Boolean(prefill) && !debt;
  const lockedFund = locked ? prefill!.fundName || c.funds.find(f => String(f.id) === prefill!.fundId)?.name || '' : '';
  const value = Number(amount.replace(',', '.')) || 0;

  const save = async () => {
    if (!creditor.trim()) return setError(isLoan ? 'اكتب اسم الشخص الذي استلفنا منه' : 'اكتب اسم البائع أو المحل');
    if (value <= 0) return setError('اكتب مبلغ الدين');
    if (debt && value + 0.005 < debt.repaid) return setError(`المبلغ أقل مما تم تسديده (${moneyText(debt.repaid)})`);
    if (isLoan && !fundId) return setError('اختر الصندوق الذي وُضع فيه المال');
    if (!debtDate) return setError('حدد تاريخ الدين');
    if (dueDate && dueDate < debtDate) return setError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الدين');
    setError('');
    setSaving(true);
    try {
      await c.save({
        ...(debt ? { id: debt.id } : { kind }),
        creditor: creditor.trim(),
        creditor_phone: phone.trim() || null,
        title: title.trim() || null,
        amount: value,
        debt_date: debtDate,
        due_date: dueDate || null,
        fund_id: isLoan ? Number(fundId) : null,
        expense_nature: isLoan ? null : nature || 'اخرى',
        notes: notes.trim() || null,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      icon={Landmark}
      title={debt ? (isLoan ? 'تعديل الدين' : 'تعديل الشراء بالدين') : isLoan ? 'استلاف جديد' : 'شراء بالدين'}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {debt ? 'حفظ التعديلات' : 'تسجيل الدين'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <Section step={1} icon={UserRound} title={isLoan ? 'الدائن' : 'البائع'} hint={isLoan ? 'الشخص الذي استلفنا منه' : 'المحل أو الشخص الذي اشترينا منه'}>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">{isLoan ? 'اسم الدائن' : 'اسم البائع / المحل'}</span>
              <input className="tk-input" value={creditor} onChange={e => setCreditor(e.target.value)} placeholder={isLoan ? 'مثال: أحمد بن علي' : 'مثال: محل الرياضة'} />
            </label>
            <label className="tk-field">
              <span className="tk-label">الهاتف <em>اختياري</em></span>
              <input className="tk-input" dir="ltr" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0X XX XX XX XX" />
            </label>
          </div>
          <label className="tk-field">
            <span className="tk-label">{isLoan ? 'سبب الاستلاف' : 'البيان (تفاصيل المصروف)'} <em>اختياري</em></span>
            <input className="tk-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={isLoan ? 'مثال: تغطية مصاريف التنقل' : 'مثال: ملابس الفريق، كراء الملعب، فاتورة...'} />
          </label>
        </Section>

        <Section step={2} icon={Banknote} title="المبلغ والتواريخ">
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">مبلغ الدين (د.ج)</span>
              {locked
                ? <span className="tk-input db-locked"><Lock size={14} />{moneyText(value)}</span>
                : <CurrencyInput className="tk-input db-money-input" inputMode="numeric" value={amount} onChangeValue={setAmount} placeholder="0,00" />}
            </label>
            {isLoan && locked ? (
              <div className="tk-field">
                <span className="tk-label"><Wallet size={14} />الصندوق الذي وُضع فيه المال</span>
                <span className="tk-input db-locked"><Lock size={14} />{lockedFund || '—'}</span>
              </div>
            ) : isLoan ? (
              <AppSelect
                mobile={mobile}
                label="الصندوق الذي وُضع فيه المال"
                icon={Wallet}
                value={fundId}
                options={c.funds.map(f => ({ value: String(f.id), label: f.name, hint: moneyText(Number(f.initialBalance) || 0) }))}
                onChange={setFundId}
                placeholder={c.funds.length ? 'اختر الصندوق' : 'لا توجد صناديق'}
              />
            ) : (
              <AppSelect
                mobile={mobile}
                label="طبيعة المصروف"
                icon={Tag}
                value={nature}
                options={DEBT_NATURES.map(n => ({ value: n, label: n }))}
                onChange={setNature}
                placeholder="اختر طبيعة المصروف"
              />
            )}
          </div>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label"><CalendarDays size={14} />تاريخ الدين</span>
              <input className="tk-input" type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} />
            </label>
            <label className="tk-field">
              <span className="tk-label"><CalendarDays size={14} />تاريخ الاستحقاق <em>اختياري</em></span>
              <input className="tk-input" type="date" value={dueDate} min={debtDate} onChange={e => setDueDate(e.target.value)} />
            </label>
          </div>
          <small className="tk-hint">
            <Info size={12} />
            {isLoan
              ? 'يُضاف المبلغ إلى رصيد الصندوق المختار فور التسجيل.'
              : 'لا يتحرك أي مال الآن: يُسجل المصروف عند كل تسديد.'}
          </small>
        </Section>

        <Section step={3} icon={FileText} title="ملاحظات">
          <textarea className="tk-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="شروط التسديد، اتفاق مع الدائن..." />
        </Section>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </SidePanel>
  );
};
