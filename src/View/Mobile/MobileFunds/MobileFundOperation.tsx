import React, { useState } from 'react';
import { Save, Loader2, Calendar, FileText, AlertCircle, ChevronDown, ArrowDown, Tag, Wallet } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { CurrencyInput } from '../../widget/CurrencyInput';
import type { Fund, FundTransaction, TransactionType } from '../../Screen/Funds/fund_model';
import { moneyText } from '../MobileContracts/contractUtils';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { OPERATIONS, fundIcon, balanceOf } from './fundUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileFundOperationProps {
  fund: Fund;
  funds: Fund[];
  initialType: TransactionType;
  onSave: (transaction: Omit<FundTransaction, 'id'>) => Promise<void>;
  onClose: () => void;
}

// Phone version of the "new operation" dialog: deposit, withdrawal or transfer (same payload)
export const MobileFundOperation: React.FC<MobileFundOperationProps> = ({ fund, funds, initialType, onSave, onClose }) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [toFundId, setToFundId] = useState('');
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const meta = fundIcon(fund.icon);
  const others = funds.filter(f => f.id !== fund.id);
  const target = others.find(f => String(f.id) === toFundId);
  const value = parseFloat(amount) || 0;
  const after = balanceOf(fund) + (type === 'إيداع' ? value : -value);

  const errors = {
    to: type === 'تحويل' && !toFundId ? 'اختر الصندوق المحول إليه' : null,
    amount: !(value >= 1) ? 'أدخل المبلغ' : null,
    date: !date ? 'حدد التاريخ' : null,
    description: !description.trim() ? 'اكتب التفاصيل / البيان' : null,
  };
  const show = (text: string | null) => (checked && text ? <p className="mfd-form-error"><AlertCircle size={14} /> {text}</p> : null);

  const save = async () => {
    setChecked(true);
    if (Object.values(errors).some(Boolean)) return;
    setSaving(true);
    await onSave({
      fundId: fund.id,
      type,
      amount: value,
      date,
      description,
      toFundId: type === 'تحويل' ? toFundId : undefined,
    });
    setSaving(false);
  };

  return (
    <MobileScreen
      title="عملية جديدة"
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mfd-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ العملية'}
        </button>
      )}
    >
      {/* The fund and its balance after the operation */}
      <section className={`mfd-mini ic-${meta.value}`}>
        <span className="mfd-card-icon"><meta.icon size={19} /></span>
        <span className="mfd-mini-text">
          <strong>{fund.name}</strong>
          <small>الرصيد الحالي <b dir="ltr">{moneyText(balanceOf(fund))}</b></small>
        </span>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><Tag size={16} /></span>نوع العملية</h3>
        <div className="mfd-types">
          {OPERATIONS.map(op => (
            <button
              key={op.value}
              type="button"
              className={`tone-${op.tone} ${type === op.value ? 'on' : ''}`}
              onClick={() => setType(op.value)}
              disabled={op.value === 'تحويل' && others.length === 0}
            >
              <span><op.icon size={19} /></span>
              <strong>{op.label}</strong>
              <small>{op.hint}</small>
            </button>
          ))}
        </div>

        {type === 'تحويل' && (
          <>
            <div className="mfd-transfer">
              <div><small>من</small><strong>{fund.name}</strong></div>
              <ArrowDown size={18} />
              <MobileSelect
                label="تحويل إلى"
                icon={Wallet}
                value={toFundId}
                options={others.map(f => ({ value: String(f.id), label: f.name }))}
                onChange={setToFundId}
                renderTrigger={open => (
                  <button type="button" className={`mfd-to ${target ? '' : 'empty'}`} onClick={open}>
                    <span><small>إلى</small><strong>{target?.name || 'اختر الصندوق المحول إليه'}</strong></span>
                    <ChevronDown size={17} />
                  </button>
                )}
              />
            </div>
            {show(errors.to)}
          </>
        )}
      </section>

      <section className="me-card">
        <label className="me-field">
          <span className="me-label">المبلغ (د.ج)</span>
          <CurrencyInput className="me-input mfd-big-input" value={amount} onChangeValue={setAmount} inputMode="numeric" />
        </label>
        {show(errors.amount)}
        {value > 0 && (
          <p className={`mfd-after ${after < 0 ? 'neg' : ''}`}>
            الرصيد بعد العملية <b dir="ltr">{moneyText(after)}</b>
          </p>
        )}

        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> التاريخ</span>
          <input className="me-input" type="date" dir="ltr" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div className="mfd-quick">
          {([['اليوم', 0], ['أمس', -1]] as const).map(([l, d]) => (
            <button key={l} type="button" className={date === isoDay(d) ? 'active' : ''} onClick={() => setDate(isoDay(d))}>{l}</button>
          ))}
        </div>
        {show(errors.date)}

        <label className="me-field">
          <span className="me-label"><FileText size={14} /> التفاصيل / البيان</span>
          <input className="me-input" type="text" value={description} onChange={e => setDescription(e.target.value)} />
        </label>
        {show(errors.description)}
      </section>
    </MobileScreen>
  );
};
