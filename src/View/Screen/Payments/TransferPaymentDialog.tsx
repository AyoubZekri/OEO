import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeftRight, Check, Loader2, Wallet, X } from 'lucide-react';
import type { Fund } from '../Funds/fund_model';
import './TransferableDialog.css';

/**
 * A transferable payment, paid from another fund: the fund is chosen, then confirmed.
 * The payment's amount goes back into its fund and leaves the chosen one.
 */
export const TransferPaymentDialog: React.FC<{
  amountText: string;
  memberName?: string;
  fromFund?: Fund;
  funds: Fund[];
  money: (value: number) => string;
  /** Resolves to an error message, or null when the payment was transferred */
  onConfirm: (fundId: string) => Promise<string | null>;
  onClose: () => void;
}> = ({ amountText, memberName, fromFund, funds, money, onConfirm, onClose }) => {
  const [fundId, setFundId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const choices = funds.filter(f => String(f.id) !== String(fromFund?.id));

  const confirm = async () => {
    setSaving(true);
    setError('');
    const failed = await onConfirm(fundId);
    setSaving(false);
    if (failed) setError(failed);
    else onClose();
  };

  return createPortal(
    <div className="trf-overlay" onClick={onClose}>
      <div className="trf-dialog trf-transfer" role="dialog" aria-modal="true" aria-labelledby="trf-move-title" onClick={e => e.stopPropagation()}>
        <button type="button" className="trf-close" onClick={onClose} aria-label="إلغاء"><X size={18} /></button>
        <span className="trf-icon"><ArrowLeftRight size={26} /></span>
        <h3 id="trf-move-title">تحويل الدفعة إلى صندوق آخر</h3>
        <p><b>{amountText}</b>{memberName && <> لفائدة <b>{memberName}</b></>}</p>

        <div className="trf-from">
          <small>من</small>
          <strong><Wallet size={15} /> {fromFund?.name || '—'}</strong>
        </div>
        <ArrowDown size={18} className="trf-arrow" />

        <div className="trf-funds" role="radiogroup" aria-label="الصندوق المحول إليه">
          {choices.length === 0 && <p className="trf-empty">لا يوجد صندوق آخر</p>}
          {choices.map(f => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={fundId === String(f.id)}
              className={fundId === String(f.id) ? 'on' : ''}
              onClick={() => setFundId(String(f.id))}
            >
              <span className="trf-radio">{fundId === String(f.id) && <Check size={13} strokeWidth={3} />}</span>
              <strong>{f.name}</strong>
              <small>{money(Number(f.initialBalance) || 0)}</small>
            </button>
          ))}
        </div>

        {error && <p className="trf-error">{error}</p>}

        <div className="trf-actions">
          <button type="button" className="trf-btn no" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="button" className="trf-btn yes" onClick={confirm} disabled={!fundId || saving}>
            {saving ? <Loader2 size={17} className="trf-spin" /> : <Check size={17} />} تأكيد التحويل
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
