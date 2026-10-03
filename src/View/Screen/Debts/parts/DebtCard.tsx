import React from 'react';
import { Landmark, ShoppingBag, CalendarClock, ChevronLeft, Wallet, Tag } from 'lucide-react';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import { initials } from '../../Tasks/taskUtils';
import { MobileRowMenu, type MobileRowMenuItem } from '../../../Mobile/widgets/MobileRowMenu';
import { dayText, dueText, KIND_META, paidPercent, STATUS_META, toneOf, type Debt } from '../debtUtils';

export const KindIcon: React.FC<{ debt: Debt; size?: number }> = ({ debt, size = 20 }) =>
  debt.kind === 'loan' ? <Landmark size={size} /> : <ShoppingBag size={size} />;

/** The creditor's initials, with the kind of debt as a small badge */
export const CreditorAvatar: React.FC<{ debt: Debt; big?: boolean }> = ({ debt: d, big }) => (
  <span className={`db-avatar ${big ? 'big' : ''}`} aria-hidden="true">
    {initials(d.creditor)}
    <i><KindIcon debt={d} size={big ? 13 : 11} /></i>
  </span>
);

/** Share paid as a ring */
export const PaidRing: React.FC<{ debt: Debt; size?: number }> = ({ debt: d, size = 58 }) => {
  const pct = paidPercent(d);
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="db-ring" style={{ width: size, height: size }} role="img" aria-label={`مسدد ${pct}%`}>
      <svg viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} className="track" />
        <circle cx="18" cy="18" r={r} className="value" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <b>{pct}%</b>
    </span>
  );
};

/** Paid / left bar */
export const DebtBar: React.FC<{ debt: Debt }> = ({ debt: d }) => (
  <div className="db-bar" role="progressbar" aria-valuenow={paidPercent(d)} aria-valuemin={0} aria-valuemax={100}>
    <i style={{ width: `${paidPercent(d)}%` }} />
  </div>
);

/** Status pill: overdue first, then paid / partly paid / not paid */
export const StatusPill: React.FC<{ debt: Debt }> = ({ debt: d }) => {
  const s = STATUS_META[d.status];
  return d.overdue
    ? <span className="db-pill tone-red"><i />متأخر</span>
    : <span className={`db-pill tone-${s.tone}`}><i />{s.label}</span>;
};

/**
 * One debt: the creditor, what is left (with the paid ring and bar), then the fund or nature and the due date.
 * `compact` (phones): creditor, what is left and the status.
 */
export const DebtCard: React.FC<{ debt: Debt; onOpen: (d: Debt) => void; actions?: MobileRowMenuItem[]; compact?: boolean }> = ({ debt: d, onOpen, actions = [], compact }) => {
  const tone = toneOf(d);
  const due = dueText(d);
  const paid = d.status === 'paid';
  const open = () => onOpen(d);
  const key = (e: React.KeyboardEvent) => { if (e.key === 'Enter') open(); };

  if (compact) {
    return (
      <article className={`db-card compact tone-${tone} ${paid ? 'done' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={key}>
        <CreditorAvatar debt={d} />
        <div className="db-card-title">
          <div className="db-card-name"><h3>{d.creditor}</h3><StatusPill debt={d} /></div>
          <span className="db-sub">{d.title || KIND_META[d.kind].short}</span>
          <div className="db-compact-money">
            <b className={paid ? 'db-paid' : 'db-left'}>{moneyText(paid ? d.amount : d.remaining)}</b>
            <small>{paid ? 'مسدد بالكامل' : `باقي من ${moneyText(d.amount)}`}</small>
          </div>
          <DebtBar debt={d} />
        </div>
        {actions.length
          ? <span className="db-card-menu" onClick={e => e.stopPropagation()}><MobileRowMenu items={actions} label="إجراءات الدين" /></span>
          : <ChevronLeft size={18} className="db-compact-go" aria-hidden="true" />}
      </article>
    );
  }

  return (
    <article className={`db-card tone-${tone} ${paid ? 'done' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={key}>
      <header className="db-card-head">
        <CreditorAvatar debt={d} />
        <div className="db-card-title">
          <h3>{d.creditor}</h3>
          <span className="db-sub">{KIND_META[d.kind].short}{d.title ? ` · ${d.title}` : ''}</span>
        </div>
        <StatusPill debt={d} />
      </header>

      <div className="db-card-money">
        <div className="db-money-main">
          <small>{paid ? 'مسدد بالكامل' : 'الباقي'}</small>
          <strong className={paid ? 'db-paid' : ''}>{moneyText(paid ? d.amount : d.remaining)}</strong>
          <em>{paid ? `${d.repayments.length} تسديد` : `من أصل ${moneyText(d.amount)}`}</em>
        </div>
        <PaidRing debt={d} />
      </div>
      <DebtBar debt={d} />

      <footer className="db-card-foot">
        <span className="db-meta">
          {d.kind === 'loan' ? <Wallet size={14} /> : <Tag size={14} />}
          {d.kind === 'loan' ? d.fund_name || 'بدون صندوق' : d.expense_nature || 'اخرى'}
        </span>
        <span className={`db-meta ${d.overdue ? 'late' : ''}`}>
          <CalendarClock size={14} />{due || (d.due_date ? dayText(d.due_date) : 'بدون أجل')}
        </span>
        {actions.length > 0 && (
          <span className="db-actions" onClick={e => e.stopPropagation()}>
            {actions.filter(x => x.key !== 'view').map(x => (
              <button
                key={x.key}
                type="button"
                className={`db-act ${x.danger ? 'danger' : ''}`}
                style={{ '--act': x.color } as React.CSSProperties}
                title={x.label}
                aria-label={x.label}
                onClick={x.onClick}
              >
                <x.icon size={17} />
              </button>
            ))}
          </span>
        )}
      </footer>
    </article>
  );
};
