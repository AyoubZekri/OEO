import React from 'react';
import {
  Save, Loader2, User, UserRound, ChevronDown, CalendarRange, Wallet, Minus, Plus, Trash2, Banknote, Trophy, Goal, Bus,
  StickyNote, AlertCircle, AlertTriangle, CheckCircle2, Divide, CalendarClock,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileSheet } from '../widgets/MobileSheet';
import { CurrencyInput } from '../../widget/CurrencyInput';
import type { useContractsController } from '../../Screen/Contracts/ContractsController';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { fullName } from '../MobileTeams/teamRoster';
import { moneyText, seasonLabel, installmentsTotal, photoOf } from './contractUtils';
import '../MobileEvaluations/MobileEvaluations.css';

type Money = 'contractValue' | 'monthlySalary' | 'winBonus' | 'goalsBonus' | 'transportationExpenses';

const EXTRAS: { name: Money; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { name: 'monthlySalary', label: 'الراتب الشهري', icon: Banknote },
  { name: 'winBonus', label: 'منحة المقابلات', icon: Trophy },
  { name: 'goalsBonus', label: 'منحة الأهداف', icon: Goal },
  { name: 'transportationExpenses', label: 'مصاريف النقل', icon: Bus },
];

// Phone version of the add / edit contract dialog; works on the controller's form state, so the payload is the same
export const MobileContractForm: React.FC<{ c: ReturnType<typeof useContractsController> }> = ({ c }) => {
  const f = c.formData;
  const isEdit = Boolean(f.contractNumber);
  const chosen = c.individuals.find(m => String(m.id) === f.individuals_id);
  const count = Number(f.numberOfPayments) || 0;
  const value = Number(f.contractValue) || 0;
  const sum = installmentsTotal(f.installments);
  const diff = value - sum;

  const setCount = (n: number) =>
    c.handleFormChange({ target: { name: 'numberOfPayments', value: String(Math.max(0, n)) } } as React.ChangeEvent<HTMLInputElement>);

  // Split the contract value over the payments; the last one takes the remainder
  const splitEvenly = () => {
    const n = f.installments.length;
    if (!n) return;
    const part = Math.floor(value / n);
    f.installments.forEach((_, i) => c.handleUpdateInstallment(i, 'amount', i === n - 1 ? value - part * (n - 1) : part));
  };

  const err = (text?: string) => (text ? <p className="mct-form-error"><AlertCircle size={14} /> {text}</p> : null);

  return (
    <MobileScreen
      title={isEdit ? 'تعديل العقد' : 'عقد جديد'}
      onBack={c.closeAddEditModal}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={c.saveContract} disabled={c.isLoading}>
          {c.isLoading ? <Loader2 size={18} className="mct-spin" /> : <Save size={18} />}
          {c.isLoading ? 'جاري الحفظ...' : 'حفظ العقد'}
        </button>
      )}
    >
      {/* Beneficiary */}
      <section className="me-card">
        <h3 className="me-section-title"><span><User size={16} /></span>المستفيد</h3>
        <MobileSelect
          label="المستفيد"
          icon={User}
          value={f.individuals_id}
          options={c.individuals.map(m => ({
            value: String(m.id),
            label: fullName(m) || `عضو ${m.id}`,
            group: TYPE_LABELS[m.type] || 'أخرى',
          }))}
          onChange={v => c.setFormDataValue('individuals_id', v)}
          searchable
          renderTrigger={open => (
            <button type="button" className={`mct-pick ${chosen ? 'has-value' : ''} ${c.errors.individuals_id ? 'error' : ''}`} onClick={open}>
              {chosen
                ? <img src={photoOf(chosen)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                : <span className="mct-pick-icon"><UserRound size={20} /></span>}
              <span className="mct-pick-text">
                <small>{chosen ? TYPE_LABELS[chosen.type] || 'عضو' : 'اللاعب أو المؤطر'}</small>
                <strong>{chosen ? fullName(chosen) : 'اختر المستفيد'}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
          )}
        />
        {err(c.errors.individuals_id)}
      </section>

      {/* Season and status */}
      <section className="me-card">
        <h3 className="me-section-title"><span><CalendarRange size={16} /></span>الموسم والحالة</h3>
        <label className="me-field">
          <span className="me-label">الموسم *</span>
          <input className="me-input" type="text" dir="ltr" name="startDate" value={f.startDate} onChange={c.handleFormChange} placeholder="2026 - 2027" />
        </label>
        <div className="mct-quick">
          {[0, 1].map(o => (
            <button key={o} type="button" className={f.startDate === seasonLabel(o) ? 'active' : ''} onClick={() => c.setFormDataValue('startDate', seasonLabel(o))}>
              <span dir="ltr">{seasonLabel(o)}</span>
            </button>
          ))}
        </div>
        {err(c.errors.startDate)}
        <div className="me-field">
          <span className="me-label">حالة العقد</span>
          <div className="mct-segment">
            {[['active', 'نشط'], ['inactive', 'غير نشط']].map(([v, l]) => (
              <button key={v} type="button" className={`st-${v} ${f.status === v ? 'on' : ''}`} onClick={() => c.setFormDataValue('status', v)}>
                <i />{l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Value and payments */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Wallet size={16} /></span>القيمة والدفعات</h3>
        <label className="me-field">
          <span className="me-label">قيمة العقد (د.ج)</span>
          <CurrencyInput className="me-input mct-big-input" value={f.contractValue} onChangeValue={v => c.setFormDataValue('contractValue', v)} inputMode="numeric" />
        </label>
        {err(c.errors.contractValue)}

        <div className="mct-count">
          <span>
            <small>عدد الدفعات</small>
            <strong>{count}</strong>
          </span>
          <div className="mct-stepper">
            <button type="button" onClick={() => setCount(count - 1)} disabled={count <= 0} aria-label="إنقاص"><Minus size={17} /></button>
            <button type="button" onClick={() => setCount(count + 1)} aria-label="زيادة"><Plus size={17} /></button>
          </div>
        </div>
        {err(c.errors.numberOfPayments)}

        <div className="mct-inst-head">
          <strong><CalendarClock size={15} /> جدول الدفعات</strong>
          {f.installments.length > 1 && value > 0 && (
            <button type="button" onClick={splitEvenly}><Divide size={14} /> توزيع بالتساوي</button>
          )}
        </div>

        {f.installments.length === 0 ? (
          <p className="mct-none">لا توجد دفعات مخصصة.</p>
        ) : (
          <div className="mct-inst-list">
            {f.installments.map((inst, i) => (
              <div key={i} className="mct-inst">
                <span className="mct-schedule-num">{i + 1}</span>
                <div className="mct-inst-fields">
                  <input className="me-input" type="text" value={inst.installment_number} onChange={e => c.handleUpdateInstallment(i, 'installment_number', e.target.value)} placeholder="اسم الدفعة" aria-label="رقم / اسم الدفعة" />
                  <CurrencyInput className="me-input" value={inst.amount} onChangeValue={v => c.handleUpdateInstallment(i, 'amount', v)} inputMode="numeric" aria-label="القيمة (د.ج)" />
                </div>
                <button type="button" className="mct-inst-remove" onClick={() => c.handleRemoveInstallment(i)} aria-label="حذف الدفعة"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="mct-add" onClick={c.handleAddInstallment}><Plus size={16} /> إضافة دفعة</button>

        {f.installments.length > 0 && (
          <div className={`mct-sum ${Math.abs(diff) > 0.01 ? 'warn' : 'ok'}`}>
            {Math.abs(diff) > 0.01 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>
              <small>مجموع الدفعات</small>
              <strong dir="ltr">{moneyText(sum)}</strong>
            </span>
            <em>{Math.abs(diff) > 0.01 ? `${diff > 0 ? 'ينقص' : 'يزيد'} ${moneyText(Math.abs(diff))}` : 'يطابق قيمة العقد'}</em>
          </div>
        )}
      </section>

      {/* Salary and bonuses */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Banknote size={16} /></span>الراتب والمنح</h3>
        <div className="mct-extras-form">
          {EXTRAS.map(e => (
            <label key={e.name} className="me-field">
              <span className="me-label"><e.icon size={14} /> {e.label}</span>
              <CurrencyInput className="me-input" value={f[e.name]} onChangeValue={v => c.setFormDataValue(e.name, v)} inputMode="numeric" />
            </label>
          ))}
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><StickyNote size={16} /></span>ملاحظات</h3>
        <textarea className="me-textarea" name="notes" rows={3} value={f.notes} onChange={c.handleFormChange} placeholder="أي شروط أو تفاصيل إضافية..." />
      </section>

      {c.isMismatchWarningOpen && (
        <MobileSheet
          title="عدم تطابق القيم"
          onClose={() => c.setIsMismatchWarningOpen(false)}
          footer={(
            <div className="mct-sheet-actions">
              <button type="button" className="me-btn" onClick={() => c.setIsMismatchWarningOpen(false)}>تعديل القيم</button>
              <button type="button" className="me-btn primary" onClick={c.proceedSaveContract}>حفظ كما هي</button>
            </div>
          )}
        >
          <div className="mct-mismatch">
            <span className="mct-mismatch-icon"><AlertTriangle size={30} /></span>
            <p>مجموع قيم الدفعات لا يساوي القيمة الإجمالية للعقد.</p>
            <div className="mct-mismatch-grid">
              <div><small>قيمة العقد</small><strong dir="ltr">{moneyText(value)}</strong></div>
              <div><small>مجموع الدفعات</small><strong dir="ltr">{moneyText(sum)}</strong></div>
            </div>
            <em>هل تريد العودة للتعديل أم حفظ العقد كما هو؟</em>
          </div>
        </MobileSheet>
      )}
    </MobileScreen>
  );
};
