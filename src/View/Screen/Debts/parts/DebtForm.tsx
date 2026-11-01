import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, Landmark, UserRound, Wallet, Tag, CalendarDays, FileText, Banknote, Lock } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { CurrencyInput } from '../../../widget/CurrencyInput';
import { AppSelect } from '../../../shared/FormBits';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import type { DebtsController } from '../useDebtsController';
import { DEBT_NATURES, todayIso, type Debt, type DebtKind } from '../debtUtils';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/** A block of the form, same look as the travels form: its title, then its fields */
const Section: React.FC<{ icon: typeof Tag; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="tk-sec tv-sec">
    <header>
      <div><h4><Icon size={15} />{title}</h4></div>
    </header>
    <div className="tk-sec-body">{children}</div>
  </section>
);

/** The message under a field left wrong */
const FieldError: React.FC<{ text?: string | null }> = ({ text }) => (text ? <small className="tk-field-error"><AlertCircle size={13} />{text}</small> : null);

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
  // The fields to type left wrong: their message under them (the fund, a choice: a snackbar)
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoan = kind === 'loan';
  // Opened from a fund's deposit: the amount and the fund are the operation's, not changed here
  const locked = Boolean(prefill) && !debt;
  const lockedFund = locked ? prefill!.fundName || c.funds.find(f => String(f.id) === prefill!.fundId)?.name || '' : '';
  const value = Number(amount.replace(',', '.')) || 0;

  const errors = {
    creditor: !creditor.trim() ? (isLoan ? 'اكتب اسم الدائن' : 'اكتب اسم البائع') : null,
    amount: value <= 0 ? 'اكتب المبلغ' : debt && value + 0.005 < debt.repaid ? `أقل مما سُدد (${moneyText(debt.repaid)})` : null,
    date: !debtDate ? 'حدد التاريخ' : null,
    due: dueDate && debtDate && dueDate < debtDate ? 'الاستحقاق يكون بعد تاريخ الدين' : null,
  };
  const err = (field: keyof typeof errors) => (tried ? errors[field] : null);
  const missing = (field: keyof typeof errors) => (err(field) ? 'is-missing' : '');

  const save = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    if (isLoan && !fundId) return showSnackbar('خطأ', 'اختر الصندوق', '#ef4444');
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
      showSnackbar('خطأ', (e as Error).message, '#ef4444');
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
            {debt ? 'حفظ التعديلات' : 'تأكيد'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <Section icon={UserRound} title={isLoan ? 'الدائن' : 'البائع'}>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">{isLoan ? 'اسم الدائن' : 'اسم البائع'}</span>
              <input className={`tk-input ${missing('creditor')}`} value={creditor} onChange={e => setCreditor(e.target.value)} />
              <FieldError text={err('creditor')} />
            </label>
            <label className="tk-field">
              <span className="tk-label">الهاتف</span>
              <input className="tk-input" dir="ltr" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </label>
          </div>
          <label className="tk-field">
            <span className="tk-label">{isLoan ? 'سبب الاستلاف' : 'البيان'}</span>
            <input className="tk-input" value={title} onChange={e => setTitle(e.target.value)} />
          </label>
        </Section>

        <Section icon={Banknote} title="المبلغ والتواريخ">
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">المبلغ</span>
              {locked
                ? <span className="tk-input db-locked"><Lock size={14} />{moneyText(value)}</span>
                : <CurrencyInput className={`tk-input db-money-input ${missing('amount')}`} inputMode="numeric" value={amount} onChangeValue={setAmount} />}
              <FieldError text={err('amount')} />
            </label>
            {isLoan && locked ? (
              <div className="tk-field">
                <span className="tk-label"><Wallet size={14} />الصندوق</span>
                <span className="tk-input db-locked"><Lock size={14} />{lockedFund || '—'}</span>
              </div>
            ) : isLoan ? (
              <AppSelect
                mobile={mobile}
                label="الصندوق"
                icon={Wallet}
                value={fundId}
                options={c.funds.map(f => ({ value: String(f.id), label: f.name, hint: moneyText(Number(f.initialBalance) || 0) }))}
                onChange={setFundId}
                placeholder=""
              />
            ) : (
              <AppSelect
                mobile={mobile}
                label="طبيعة المصروف"
                icon={Tag}
                value={nature}
                options={DEBT_NATURES.map(n => ({ value: n, label: n }))}
                onChange={setNature}
                placeholder=""
              />
            )}
          </div>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label"><CalendarDays size={14} />تاريخ الدين</span>
              <input className={`tk-input ${missing('date')}`} type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} />
              <FieldError text={err('date')} />
            </label>
            <label className="tk-field">
              <span className="tk-label"><CalendarDays size={14} />تاريخ الاستحقاق</span>
              <input className={`tk-input ${missing('due')}`} type="date" value={dueDate} min={debtDate} onChange={e => setDueDate(e.target.value)} />
              <FieldError text={err('due')} />
            </label>
          </div>
        </Section>

        <Section icon={FileText} title="ملاحظات">
          <textarea className="tk-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </Section>

      </div>
    </SidePanel>
  );
};
