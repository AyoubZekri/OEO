import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Copy, Check, RefreshCw, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import client from '../../../../core/api/client';
import './PasswordReveal.css';

const errorText = (e: unknown, fallback: string) =>
  (axios.isAxiosError(e) && typeof e.response?.data?.message === 'string' && e.response.data.message) || fallback;

/**
 * The account's current password, to hand it to its owner: hidden until the eye is pressed, with copy and
 * "new password". Passwords set before copies were kept are unknown: a new one has to be generated.
 */
export const PasswordReveal: React.FC<{ userId: string }> = ({ userId }) => {
  const [password, setPassword] = useState<string | null | undefined>(undefined); // undefined: not loaded yet
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const reveal = async () => {
    if (shown) return setShown(false);
    if (password !== undefined) return setShown(true);
    setBusy(true);
    setError('');
    try {
      const res = await client.post('/users/password', { id: userId });
      setPassword(res.data.password ?? null);
      setShown(true);
    } catch (e) {
      setError(errorText(e, 'تعذر عرض كلمة المرور'));
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!window.confirm('توليد كلمة مرور جديدة؟ كلمة المرور الحالية لن تعمل بعد الآن.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await client.post('/users/password/generate', { id: userId });
      setPassword(res.data.password);
      setShown(true);
    } catch (e) {
      setError(errorText(e, 'تعذر توليد كلمة مرور جديدة'));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('تعذر النسخ، انسخها يدوياً');
    }
  };

  const unknown = shown && password === null;

  return (
    <div className="pw-reveal">
      <span className="pw-label"><KeyRound size={14} />كلمة المرور الحالية</span>
      <div className="pw-box">
        <span className={`pw-value ${unknown ? 'unknown' : ''}`} dir={unknown ? 'rtl' : 'ltr'}>
          {unknown ? 'غير معروفة (حُددت قبل حفظ كلمات المرور)' : shown && password ? password : '••••••••'}
        </span>
        {!unknown && (
          <button type="button" onClick={reveal} disabled={busy} title={shown ? 'إخفاء' : 'إظهار'} aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
            {busy && !shown ? <Loader2 size={16} className="pw-spin" /> : shown ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {shown && password && (
          <button type="button" onClick={copy} title="نسخ" aria-label="نسخ كلمة المرور">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
        <button type="button" className="pw-new" onClick={generate} disabled={busy} title="توليد كلمة مرور جديدة">
          {busy && shown ? <Loader2 size={15} className="pw-spin" /> : <RefreshCw size={15} />}
          <span>جديدة</span>
        </button>
      </div>
      {error && <p className="pw-error"><AlertCircle size={13} />{error}</p>}
    </div>
  );
};
