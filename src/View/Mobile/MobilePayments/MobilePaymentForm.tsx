import React, { useState } from 'react';
import {
  Save, Loader2, UserRound, User, ChevronDown, Wallet, Tag, Calendar, CreditCard, Hash, StickyNote, AlertCircle, Minus, Plus,
  FileSignature, Sparkles, Phone, CalendarDays, CheckCircle2, Clock, Store,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { CurrencyInput } from '../../widget/CurrencyInput';
import type { usePaymentsController } from '../../Screen/Payments/PaymentsController';
import { type usePaymentForm, naturesOf, PAYMENT_METHODS, NO_OCCASION_NATURES } from '../../Screen/Payments/usePaymentForm';
import { MONTHS, getInstallmentText } from '../../Screen/Payments/paymentText';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { moneyText } from '../MobileContracts/contractUtils';
import { KINDS, initials } from './paymentUtils';
import '../MobileEvaluations/MobileEvaluations.css';

// Natures whose amount the form fills from the member's contract
const AUTO_AMOUNT = ['راتب شهري', 'رقم دفعة', 'تسجيل أهداف', 'منحة مقابلات', 'مصاريف التنقل'];

interface MobilePaymentFormProps {
  c: ReturnType<typeof usePaymentsController>;
  form: ReturnType<typeof usePaymentForm>;
}

// Phone version of the add / edit payment dialog; same form state and payload (usePaymentForm)
export const MobilePaymentForm: React.FC<MobilePaymentFormProps> = ({ c, form: f }) => {
  // The desktop form relies on the browser's `required` checks; the phone page checks the same fields here
  const [checked, setChecked] = useState(false);

  const memberContracts = c.contracts.filter(x => String(x.individuals_id) === String(f.memberId));
  const contract = memberContracts.find(x => String(x.id) === String(f.selectedContractId));
  const person = f.selectedMemberDetails;
  const fund = c.funds.find(x => String(x.id) === String(f.fundId));
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 5 + i));
  const hasOccasion = !NO_OCCASION_NATURES.includes(f.amountNature);
  const autoAmount = f.transactionType === 'دفع' && !!contract && AUTO_AMOUNT.includes(f.amountNature) && !c.editingPayment;

  const errors = {
    member: f.transactionType === 'دفع' && !f.memberId ? 'اختر العضو المستفيد' : null,
    fund: f.transactionType !== 'مصاريف استثنائية' && !f.creditMode && !f.fundId ? 'اختيار الصندوق إجباري' : null,
    creditor: f.creditMode && !f.creditor.trim() ? 'اكتب اسم البائع أو المحل' : null,
    date: !f.paymentDate ? 'حدد تاريخ الدفع' : null,
    installment: f.amountNature === 'رقم دفعة' && !f.installmentNumber.trim() ? 'حدد رقم الدفعة' : null,
    goals: f.amountNature === 'تسجيل أهداف' && !(parseInt(f.numberOfGoals) >= 1) ? 'حدد عدد الأهداف' : null,
    occasion: f.amountNature === 'اخرى' && !f.occasion.trim() ? 'اكتب المناسبة أو السبب' : null,
    amount: f.amount === '' ? 'أدخل المبلغ' : null,
  };
  const show = (text: string | null) => ((checked || f.formSubmitted) && text ? <p className="mpy-form-error"><AlertCircle size={14} /> {text}</p> : null);

  const save = () => {
    setChecked(true);
    if (Object.values(errors).some(Boolean)) return;
    f.handleSave();
  };

  const setKind = (value: typeof f.transactionType) => {
    f.setTransactionType(value);
    f.setAmountNature(value === 'دفع' ? 'راتب شهري' : value === 'مصروف' ? 'تعويض مصاريف' : 'اخرى');
  };

  const stepper = (value: number, set: (n: number) => void, min: number) => (
    <div className="mpy-stepper">
      <button type="button" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص"><Minus size={16} /></button>
      <strong>{value}</strong>
      <button type="button" onClick={() => set(value + 1)} aria-label="زيادة"><Plus size={16} /></button>
    </div>
  );

  return (
    <MobileScreen
      title={c.editingPayment ? 'تعديل العملية' : 'عملية جديدة'}
      onBack={c.closeDialog}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={c.isLoading || f.creditSaving}>
          {c.isLoading || f.creditSaving ? <Loader2 size={18} className="mpy-spin" /> : <Save size={18} />}
          {c.isLoading || f.creditSaving ? 'جاري الحفظ...' : f.creditMode ? 'تسجيل الشراء بالدين' : 'حفظ العملية'}
        </button>
      )}
    >
      {/* Operation type */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Tag size={16} /></span>نوع العملية</h3>
        <div className="mpy-kinds">
          {KINDS.map(k => (
            <button key={k.value} type="button" className={`tone-${k.tone} ${f.transactionType === k.value ? 'on' : ''}`} onClick={() => setKind(k.value)}>
              <span className="mpy-kind-icon"><k.icon size={19} /></span>
              {k.label}
            </button>
          ))}
        </div>
      </section>

      {/* Expense paid now, or bought on credit (paid later from "مشتريات بالدين") */}
      {f.transactionType === 'مصروف' && !c.editingPayment && f.canCredit && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Clock size={16} /></span>حالة الدفع</h3>
          <div className="mpy-kinds two">
            <button type="button" className={`tone-green ${!f.onCredit ? 'on' : ''}`} onClick={() => f.setOnCredit(false)}>
              <span className="mpy-kind-icon"><CheckCircle2 size={19} /></span>
              مدفوع الآن
            </button>
            <button type="button" className={`tone-amber ${f.onCredit ? 'on' : ''}`} onClick={() => f.setOnCredit(true)}>
              <span className="mpy-kind-icon"><Clock size={19} /></span>
              بالدين
            </button>
          </div>
        </section>
      )}

      {f.creditMode ? (
        <section className="me-card">
          <h3 className="me-section-title"><span><Store size={16} /></span>البائع</h3>
          <label className="me-field">
            <span className="me-label"><Store size={14} /> البائع / المحل *</span>
            <input className="me-input" type="text" value={f.creditor} onChange={e => f.setCreditor(e.target.value)} placeholder="مثال: محل الرياضة" />
          </label>
          {show(errors.creditor)}
          <label className="me-field">
            <span className="me-label"><Phone size={14} /> الهاتف (اختياري)</span>
            <input className="me-input" type="tel" dir="ltr" value={f.creditorPhone} onChange={e => f.setCreditorPhone(e.target.value)} />
          </label>
        </section>
      ) : (
      <section className="me-card">
        <h3 className="me-section-title"><span><Wallet size={16} /></span>{f.transactionType === 'دفع' ? 'المستفيد والصندوق' : 'الصندوق'}</h3>

        {f.transactionType === 'دفع' && (
          <>
            <MobileSelect
              label="العضو المستفيد"
              icon={User}
              value={f.memberId}
              options={c.members.map(m => ({
                value: String(m.id),
                label: `${m.firstName} ${m.lastName}`.trim() || `عضو ${m.id}`,
                group: TYPE_LABELS[m.memberRole] || 'أخرى',
              }))}
              onChange={f.setMemberId}
              searchable
              renderTrigger={open => (
                <button type="button" className={`mpy-pick ${person ? 'has-value' : ''}`} onClick={open}>
                  {person
                    ? <span className="mpy-avatar">{initials(person.firstName, person.lastName)}</span>
                    : <span className="mpy-pick-icon"><UserRound size={20} /></span>}
                  <span className="mpy-pick-text">
                    <small>{person ? TYPE_LABELS[person.memberRole] || person.memberRole : 'العضو المستفيد'}</small>
                    <strong>{person ? `${person.firstName} ${person.lastName}` : 'اختر العضو'}</strong>
                  </span>
                  <ChevronDown size={18} />
                </button>
              )}
            />
            {show(errors.member)}
            {person && (person.phoneNumber || person.nationalId) && (
              <div className="mpy-person-facts">
                {person.phoneNumber && <span><Phone size={12} /> <b dir="ltr">{person.phoneNumber}</b></span>}
                {person.nationalId && <span><Hash size={12} /> <b dir="ltr">{person.nationalId}</b></span>}
              </div>
            )}

            {memberContracts.length > 1 && (
              <MobileSelect
                label="تحديد العقد (الموسم)"
                icon={FileSignature}
                value={f.selectedContractId}
                options={memberContracts.map(x => ({ value: String(x.id), label: `عقد موسم ${x.startDate || 'غير محدد'}`, hint: moneyText(x.contractValue) }))}
                onChange={f.selectContract}
                renderTrigger={open => (
                  <button type="button" className="mpy-select" onClick={open}>
                    <FileSignature size={17} />
                    <span><small>العقد (الموسم)</small><strong dir="auto">{contract ? contract.startDate || 'غير محدد' : 'اختر العقد'}</strong></span>
                    <ChevronDown size={17} />
                  </button>
                )}
              />
            )}
          </>
        )}

        {f.transactionType !== 'مصاريف استثنائية' ? (
          <>
            <MobileSelect
              label="صندوق الدفع"
              icon={Wallet}
              value={f.fundId}
              options={c.funds.map(x => ({ value: String(x.id), label: x.name }))}
              onChange={f.setFundId}
              renderTrigger={open => (
                <button type="button" className={`mpy-select ${fund ? '' : 'empty'}`} onClick={open}>
                  <Wallet size={17} />
                  <span><small>صندوق الدفع *</small><strong>{fund?.name || 'اختر الصندوق'}</strong></span>
                  <ChevronDown size={17} />
                </button>
              )}
            />
            {show(errors.fund)}
          </>
        ) : (
          <p className="mpy-note">لا تحتاج المصاريف الاستثنائية إلى تحديد صندوق.</p>
        )}
      </section>
      )}

      {/* Nature of the amount and its details */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Tag size={16} /></span>طبيعة المبلغ</h3>
        <MobileSelect
          label="طبيعة المبلغ"
          icon={Tag}
          value={f.amountNature}
          options={naturesOf(f.transactionType).map(n => ({ value: n, label: n }))}
          onChange={f.setAmountNature}
          renderTrigger={open => (
            <button type="button" className="mpy-select" onClick={open}>
              <Tag size={17} />
              <span><small>طبيعة المبلغ</small><strong>{f.amountNature}</strong></span>
              <ChevronDown size={17} />
            </button>
          )}
        />

        {f.amountNature === 'رقم دفعة' && (
          <>
            <label className="me-field">
              <span className="me-label"><Hash size={14} /> رقم الدفعة</span>
              <input className="me-input" type="text" value={f.installmentNumber} onChange={e => f.setInstallmentNumber(e.target.value)} />
            </label>
            {!!contract?.installments?.length && (
              <div className="mpy-quick">
                {contract.installments.map(inst => (
                  <button
                    key={inst.installment_number}
                    type="button"
                    className={String(f.installmentNumber) === String(inst.installment_number) ? 'active' : ''}
                    onClick={() => f.setInstallmentNumber(String(inst.installment_number))}
                  >
                    {getInstallmentText(inst.installment_number)}
                    <small dir="ltr">{moneyText(inst.amount)}</small>
                  </button>
                ))}
              </div>
            )}
            {show(errors.installment)}
          </>
        )}

        {f.amountNature === 'راتب شهري' && (
          <>
            <div className="mpy-two">
              <MobileSelect
                label="الشهر"
                icon={CalendarDays}
                value={f.month}
                options={MONTHS}
                onChange={f.setMonth}
                renderTrigger={open => (
                  <button type="button" className="mpy-select" onClick={open}>
                    <span><small>الشهر</small><strong>{MONTHS.find(m => m.value === f.month)?.label || 'اختر'}</strong></span>
                    <ChevronDown size={17} />
                  </button>
                )}
              />
              <MobileSelect
                label="السنة"
                icon={Calendar}
                value={f.year}
                options={years.map(y => ({ value: y, label: y }))}
                onChange={f.setYear}
                renderTrigger={open => (
                  <button type="button" className="mpy-select" onClick={open}>
                    <span><small>السنة</small><strong>{f.year || 'اختر'}</strong></span>
                    <ChevronDown size={17} />
                  </button>
                )}
              />
            </div>
            <div className="mpy-count">
              <span><small>عدد الأشهر</small></span>
              {stepper(f.numberOfMonths, f.setNumberOfMonths, 1)}
            </div>
          </>
        )}

        {f.amountNature === 'تسجيل أهداف' && (
          <>
            <div className="mpy-count">
              <span><small>عدد الأهداف</small></span>
              {stepper(parseInt(f.numberOfGoals) || 0, n => f.setNumberOfGoals(String(n)), 0)}
            </div>
            {show(errors.goals)}
          </>
        )}

        {hasOccasion && (
          <>
            <label className="me-field">
              <span className="me-label"><StickyNote size={14} /> {f.creditMode ? 'البيان (تفاصيل المصروف)' : 'المناسبة / السبب'}{f.amountNature === 'اخرى' ? ' *' : ''}</span>
              <input className="me-input" type="text" value={f.occasion} onChange={e => f.setOccasion(e.target.value)} />
            </label>
            {show(errors.occasion)}
          </>
        )}
      </section>

      {/* Amount, date and method */}
      <section className="me-card">
        <h3 className="me-section-title"><span><CreditCard size={16} /></span>{f.creditMode ? 'المبلغ والتاريخ' : 'المبلغ والدفع'}</h3>
        <label className="me-field">
          <span className="me-label">المبلغ (د.ج)</span>
          <CurrencyInput className="me-input mpy-big-input" value={f.amount} onChangeValue={f.setAmount} inputMode="numeric" />
        </label>
        {autoAmount && <p className="mpy-auto"><Sparkles size={13} /> محسوب تلقائياً من عقد العضو، ويمكنك تعديله</p>}
        {show(errors.amount)}

        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> {f.creditMode ? 'تاريخ الشراء' : 'تاريخ الدفع'}</span>
          <input className="me-input" type="date" dir="ltr" value={f.paymentDate} onChange={e => f.setPaymentDate(e.target.value)} />
        </label>
        <div className="mpy-quick">
          {([['اليوم', 0], ['أمس', -1]] as const).map(([l, d]) => (
            <button key={l} type="button" className={f.paymentDate === isoDay(d) ? 'active' : ''} onClick={() => f.setPaymentDate(isoDay(d))}>{l}</button>
          ))}
        </div>
        {show(errors.date)}

        {f.creditMode && (
          <label className="me-field">
            <span className="me-label"><CalendarDays size={14} /> آخر أجل للدفع (اختياري)</span>
            <input className="me-input" type="date" dir="ltr" value={f.dueDate} min={f.paymentDate} onChange={e => f.setDueDate(e.target.value)} />
          </label>
        )}

        {!f.creditMode && (
        <div className="me-field">
          <span className="me-label"><CreditCard size={14} /> طريقة الدفع</span>
          <div className="mpy-methods">
            {PAYMENT_METHODS.map(m => (
              <button key={m} type="button" className={f.paymentMethod === m ? 'active' : ''} onClick={() => f.setPaymentMethod(m)}>{m}</button>
            ))}
          </div>
        </div>
        )}
        {!f.creditMode && f.paymentMethod === 'صك' && (
          <label className="me-field">
            <span className="me-label"><Hash size={14} /> رقم الصك</span>
            <input className="me-input" type="text" dir="ltr" value={f.postalCheck} onChange={e => f.setPostalCheck(e.target.value)} />
          </label>
        )}
        {f.creditMode && f.creditError && <p className="mpy-form-error"><AlertCircle size={14} /> {f.creditError}</p>}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><StickyNote size={16} /></span>ملاحظات</h3>
        <input className="me-input" type="text" value={f.notes} onChange={e => f.setNotes(e.target.value)} placeholder="اختياري" />
      </section>
    </MobileScreen>
  );
};
