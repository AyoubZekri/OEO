import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Save, Loader2, Camera, X, AlertCircle, Type, Hash, ImageUp } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { validInput } from '../../../core/functions/valiedinput';
import type { Club } from '../../Screen/Clubs/club_model';
import { clubInitial } from './clubUtils';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileClubForm.css';

interface ClubFormData {
  name: string;
  symbol: string;
  logo: string;
  file: File | null;
}

interface MobileClubFormProps {
  /** Club being edited; null when adding a new one */
  club: Club | null;
  /** The other clubs, to catch a repeated name or symbol */
  otherClubs: Club[];
  onSave: (data: ClubFormData) => Promise<void>;
  onClose: () => void;
}

const LOGO_MAX_MB = 2; // as stated on the desktop dialog
const SYMBOL_MAX = 10;

const tidy = (value: string) => value.trim().replace(/\s+/g, ' ');
const sameKey = (value: string) => tidy(value).replace(/[أإآ]/g, 'ا').toLowerCase();

// Phone add / edit page of another club: logo, name and symbol
export const MobileClubForm: React.FC<MobileClubFormProps> = ({ club, otherClubs, onSave, onClose }) => {
  const [name, setName] = useState(club?.name || '');
  const [symbol, setSymbol] = useState(club?.symbol || '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview of the picked logo, released when it changes
  const picked = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked); }, [picked]);
  const logo = picked || club?.logo || '';

  const nameValue = tidy(name);
  const symbolValue = symbol.trim();
  const errors = {
    name: validInput(nameValue, 2, 50, 'text')
      || (otherClubs.some(c => sameKey(c.name) === sameKey(nameValue)) ? 'يوجد نادٍ آخر بهذا الاسم' : null),
    symbol: validInput(symbolValue, 2, SYMBOL_MAX, 'text')
      || (otherClubs.some(c => c.symbol && sameKey(c.symbol) === sameKey(symbolValue)) ? 'هذا الرمز مستعمل لنادٍ آخر' : null),
  };

  const pickLogo = (picked?: File) => {
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setFileError('اختر صورة (PNG أو JPG أو SVG)');
      return;
    }
    if (picked.size > LOGO_MAX_MB * 1024 * 1024) {
      setFileError(`حجم الشعار يتجاوز ${LOGO_MAX_MB}MB`);
      return;
    }
    setFileError('');
    setFile(picked);
  };

  const submit = async () => {
    if (errors.name || errors.symbol) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: nameValue, symbol: symbolValue, logo: club?.logo || '', file });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileScreen
      title={club ? 'تعديل النادي' : 'نادٍ جديد'}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={submit} disabled={saving}>
          {saving ? <Loader2 size={18} className="mcf-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : club ? 'حفظ التعديلات' : 'إضافة النادي'}
        </button>
      )}
    >
      {/* Logo + live preview */}
      <section className="mcf-hero">
        <label className={`mcf-logo ${logo ? '' : 'empty'}`} title="اختيار الشعار">
          <input type="file" accept="image/*" onChange={e => { pickLogo(e.target.files?.[0]); e.target.value = ''; }} />
          {logo
            ? <img src={logo} alt="" />
            : nameValue || symbolValue
              ? <span className="mcf-initial">{clubInitial({ name: nameValue, symbol: symbolValue })}</span>
              : <ImageUp size={34} strokeWidth={1.6} />}
          <span className="mcf-camera"><Camera size={16} /></span>
        </label>
        {file && (
          <button type="button" className="mcf-undo" onClick={() => setFile(null)}>
            <X size={14} /> {club?.logo ? 'الرجوع للشعار السابق' : 'إزالة الشعار'}
          </button>
        )}
        <strong className={nameValue ? '' : 'placeholder'}>{nameValue || 'اسم النادي'}</strong>
        <span className="mcf-symbol"><Shield size={13} /> {symbolValue || 'الرمز'}</span>
        <small>اضغط على الشعار لاختيار صورة · PNG, JPG أو SVG حتى {LOGO_MAX_MB}MB</small>
        {fileError && <p className="mcf-error light"><AlertCircle size={14} /> {fileError}</p>}
      </section>

      <section className="mcf-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> اسم النادي</span>
          <span className={`mcf-input ${showErrors && errors.name ? 'invalid' : ''}`}>
            <input type="text" value={name} maxLength={50} placeholder="مثال: اتحاد العاصمة" onChange={e => setName(e.target.value)} />
          </span>
        </label>
        {showErrors && errors.name && <p className="mcf-error"><AlertCircle size={14} /> {errors.name}</p>}

        <label className="me-field">
          <span className="me-label"><Hash size={14} /> رمز النادي</span>
          <span className={`mcf-input ${showErrors && errors.symbol ? 'invalid' : ''}`}>
            <input
              type="text"
              dir="ltr"
              value={symbol}
              maxLength={SYMBOL_MAX}
              placeholder="USMA"
              autoCapitalize="characters"
              onChange={e => setSymbol(e.target.value.toUpperCase())}
            />
            <span className="mcf-count">{symbol.length}/{SYMBOL_MAX}</span>
          </span>
        </label>
        {showErrors && errors.symbol
          ? <p className="mcf-error"><AlertCircle size={14} /> {errors.symbol}</p>
          : <p className="mcf-help">اختصار قصير يظهر مكان الشعار عند غيابه.</p>}
      </section>
    </MobileScreen>
  );
};
