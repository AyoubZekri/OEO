import React, { useState } from 'react';
import { Save, Loader2, Type, Wallet, AlertCircle, Palette } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { CurrencyInput } from '../../widget/CurrencyInput';
import type { Fund } from '../../Screen/Funds/fund_model';
import { moneyText } from '../MobileContracts/contractUtils';
import { FUND_ICONS, fundIcon } from './fundUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileFundFormProps {
  fund: Fund | null;
  onSave: (data: Omit<Fund, 'id'>, id: string | null) => Promise<void>;
  onClose: () => void;
}

// Phone version of the add / edit fund dialog (same fields and payload), with a live preview of the card
export const MobileFundForm: React.FC<MobileFundFormProps> = ({ fund, onSave, onClose }) => {
  const [name, setName] = useState(fund?.name || '');
  const [icon, setIcon] = useState<Fund['icon']>(fund?.icon || 'wallet');
  const [balance, setBalance] = useState(fund ? String(fund.initialBalance) : '');
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const meta = fundIcon(icon);

  const errors = {
    name: !name.trim() ? 'اكتب اسم الصندوق' : null,
    balance: balance === '' ? 'أدخل الرصيد الابتدائي' : null,
  };
  const show = (text: string | null) => (checked && text ? <p className="mfd-form-error"><AlertCircle size={14} /> {text}</p> : null);

  const save = async () => {
    setChecked(true);
    if (errors.name || errors.balance) return;
    setSaving(true);
    await onSave({ name, icon, initialBalance: parseFloat(balance) || 0 }, fund?.id ?? null);
    setSaving(false);
  };

  return (
    <MobileScreen
      title={fund ? 'تعديل الصندوق' : 'صندوق جديد'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mfd-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      )}
    >
      {/* Live preview */}
      <section className={`mfd-bigcard ic-${meta.value}`}>
        <div className="mfd-bigcard-top">
          <span className="mfd-card-icon"><meta.icon size={22} /></span>
          <em>{meta.label}</em>
        </div>
        <small>{fund ? 'الرصيد' : 'الرصيد الابتدائي'}</small>
        <strong dir="ltr">{moneyText(parseFloat(balance) || 0)}</strong>
        <span className="mfd-bigcard-name">{name || 'اسم الصندوق'}</span>
      </section>

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> اسم الصندوق</span>
          <input className="me-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: البنك المركزي" />
        </label>
        {show(errors.name)}

        <div className="me-field">
          <span className="me-label"><Palette size={14} /> نوع الصندوق</span>
          <div className="mfd-icons">
            {FUND_ICONS.map(i => (
              <button key={i.value} type="button" className={`ic-${i.value} ${icon === i.value ? 'on' : ''}`} onClick={() => setIcon(i.value)}>
                <span className="mfd-card-icon"><i.icon size={20} /></span>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <label className="me-field">
          <span className="me-label"><Wallet size={14} /> الرصيد الابتدائي (د.ج)</span>
          <CurrencyInput className="me-input mfd-big-input" value={balance} onChangeValue={setBalance} inputMode="numeric" />
        </label>
        {show(errors.balance)}
      </section>
    </MobileScreen>
  );
};
