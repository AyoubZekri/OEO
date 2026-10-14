import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Landmark, Layers, Loader2, Mail, Search, Wallet, X } from 'lucide-react';
import type { Fund } from '../Funds/fund_model';
import type { PaymentRecord } from './payment_model';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import './TransferableDialog.css';
import './BulkTransferDialog.css';

/** The transferable payments to members paid from a fund (the ones a bulk transfer moves) */
const movableFrom = (payments: PaymentRecord[], fundId: string) =>
  payments.filter(p => String(p.fund_id ?? p.fundId) === fundId && (p.isTransferable ?? p.is_transferable) && !p.isCredit);

/** Their net amount: an advance paid back (إرجاع سلفة) brought money in */
const netOf = (payments: PaymentRecord[]) =>
  payments.reduce((sum, p) => sum + (p.amountNature === 'إرجاع سلفة' ? -1 : 1) * (Number(p.amount) || 0), 0);

/** A fund's icon and colour, by its kind */
const FUND_LOOK: Record<string, { icon: React.ComponentType<{ size?: number }>; tone: string }> = {
  bank: { icon: Landmark, tone: 'blue' },
  mail: { icon: Mail, tone: 'violet' },
  wallet: { icon: Wallet, tone: 'orange' },
};
const lookOf = (f?: Fund) => FUND_LOOK[f?.icon || ''] || FUND_LOOK.wallet;

const FundAvatar: React.FC<{ fund?: Fund; size?: number }> = ({ fund, size = 18 }) => {
  const look = lookOf(fund);
  return <span className={`trb-avatar tone-${look.tone}`}><look.icon size={size} /></span>;
};

/** One side of the transfer: its funds in a list (the dialog's scrolls on its own), with a search when they are many */
const FundColumn: React.FC<{
  title: string;
  step: number;
  funds: Fund[];
  value: string;
  disabled?: string;
  hint: (f: Fund) => string;
  empty: string;
  onChange: (id: string) => void;
}> = ({ title, step, funds, value, disabled, hint, empty, onChange }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q ? funds.filter(f => f.name.toLowerCase().includes(q)) : funds;
  return (
    <section className={`trb-col ${value ? 'chosen' : ''}`}>
      <header>
        <span>{value ? <Check size={13} strokeWidth={3} /> : step}</span>
        <h4>{title}</h4>
      </header>
      {funds.length > 6 && (
        <label className="trb-search">
          <Search size={15} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن صندوق..." />
        </label>
      )}
      <div className="trb-list" role="radiogroup" aria-label={title}>
        {list.length === 0 && <p className="trb-empty">{funds.length ? 'لا توجد نتائج' : empty}</p>}
        {list.map(f => {
          const id = String(f.id);
          return (
            <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? 'on' : ''} disabled={id === disabled} onClick={() => onChange(id)}>
              <FundAvatar fund={f} />
              <span className="trb-text">
                <strong>{f.name}</strong>
                <small>{hint(f)}</small>
              </span>
              <span className="trb-radio">{value === id && <Check size={12} strokeWidth={3} />}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

/**
 * Bulk transfer: every transferable payment of one fund is paid from another one.
 * Only the two funds are chosen; the payments it moves and their total show before confirming.
 * `asPage`: on the phone, a full page (back closes it) instead of a dialog.
 */
export const BulkTransferDialog: React.FC<{
  funds: Fund[];
  payments: PaymentRecord[];
  money: (value: number) => string;
  /** Resolves to an error message, or null once done */
  onConfirm: (fromId: string, toId: string) => Promise<string | null>;
  onClose: () => void;
  asPage?: boolean;
}> = ({ funds, payments, money, onConfirm, onClose, asPage = false }) => {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Only the funds holding transferable payments can be transferred from
  const sources = funds.filter(f => movableFrom(payments, String(f.id)).length > 0);
  const moving = fromId ? movableFrom(payments, fromId) : [];
  const ready = Boolean(fromId && toId && fromId !== toId && moving.length);
  const fundOf = (id: string) => funds.find(f => String(f.id) === id);
  const nameOf = (id: string) => fundOf(id)?.name;

  const confirm = async () => {
    setSaving(true);
    setError('');
    const failed = await onConfirm(fromId, toId);
    setSaving(false);
    if (failed) setError(failed);
    else onClose();
  };

  const columns = (
    <>
      <FundColumn
        title="من صندوق"
        step={1}
        funds={sources}
        value={fromId}
        hint={f => { const list = movableFrom(payments, String(f.id)); return `${list.length} دفعة · ${money(Math.abs(netOf(list)))}`; }}
        empty="لا توجد دفعات قابلة للتحويل في أي صندوق"
        onChange={id => { setFromId(id); if (id === toId) setToId(''); }}
      />
      <span className="trb-arrow" aria-hidden="true"><ArrowLeft size={18} /></span>
      <FundColumn
        title="إلى صندوق"
        step={2}
        funds={funds}
        value={toId}
        disabled={fromId}
        hint={f => money(Number(f.initialBalance) || 0)}
        empty="لا توجد صناديق"
        onChange={setToId}
      />
    </>
  );

  const confirmButton = (
    <button type="button" className="trf-btn yes trb-confirm" onClick={confirm} disabled={!ready || saving}>
      {saving ? <Loader2 size={18} className="trf-spin" /> : <Check size={18} />} تأكيد التحويل
    </button>
  );

  if (asPage) {
    const from = fundOf(fromId);
    const to = fundOf(toId);
    return (
      <MobileScreen
        title="تحويل جماعي"
        onBack={onClose}
        footer={<div className="trb-page-foot">{error && <p className="trb-error">{error}</p>}{confirmButton}</div>}
      >
        <div className="trb-page">
          {/* The route: from → to, and what moves */}
          <section className={`trb-route ${ready ? 'ready' : ''}`}>
            <div className="trb-route-funds">
              <div className={`trb-slot ${from ? 'set' : ''}`}>
                <small>من</small>
                {from ? <FundAvatar fund={from} size={20} /> : <span className="trb-avatar empty"><Wallet size={20} /></span>}
                <strong>{from?.name || 'اختر الصندوق'}</strong>
              </div>
              <span className="trb-route-line" aria-hidden="true"><i /><ArrowLeft size={18} /><i /></span>
              <div className={`trb-slot ${to ? 'set' : ''}`}>
                <small>إلى</small>
                {to ? <FundAvatar fund={to} size={20} /> : <span className="trb-avatar empty"><Wallet size={20} /></span>}
                <strong>{to?.name || 'اختر الصندوق'}</strong>
              </div>
            </div>
            <div className="trb-route-total">
              <small>{from ? `${moving.length} دفعة قابلة للتحويل` : 'الدفعات القابلة للتحويل فقط'}</small>
              <b>{money(Math.abs(netOf(moving)))}</b>
            </div>
          </section>

          <div className="trb-body">{columns}</div>
        </div>
      </MobileScreen>
    );
  }

  return createPortal(
    <div className="trf-overlay" onClick={onClose}>
      <div className="trb" role="dialog" aria-modal="true" aria-labelledby="trb-title" onClick={e => e.stopPropagation()}>
        <header className="trb-head">
          <span className="trb-icon"><Layers size={20} /></span>
          <div>
            <h3 id="trb-title">تحويل جماعي</h3>
            <small>الدفعات القابلة للتحويل فقط</small>
          </div>
          <button type="button" className="trb-close" onClick={onClose} aria-label="إلغاء"><X size={18} /></button>
        </header>

        <div className="trb-body">{columns}</div>

        <footer className="trb-foot">
          <div className={`trb-summary ${ready ? 'ready' : ''}`}>
            <Wallet size={16} />
            {fromId && toId
              ? <span>تُحوَّل <b>{moving.length}</b> دفعة بمجموع <b>{money(Math.abs(netOf(moving)))}</b> من <b>{nameOf(fromId)}</b> إلى <b>{nameOf(toId)}</b></span>
              : <span>{fromId ? 'اختر الصندوق المحول إليه' : 'اختر الصندوق المحول منه'}</span>}
          </div>
          {error && <p className="trb-error">{error}</p>}
          <div className="trb-actions">
            <button type="button" className="trf-btn no" onClick={onClose} disabled={saving}>إلغاء</button>
            {confirmButton}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
