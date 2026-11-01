import React from 'react';
import { Landmark, ShoppingBag, CircleAlert, CircleCheck, AlarmClock, PieChart } from 'lucide-react';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import { initials } from '../../../shared/dates';
import { MobileRowMenu, type MobileRowMenuItem } from '../../../Mobile/widgets/MobileRowMenu';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { paidPercent, STATUS_META, toneOf, type Debt } from '../debtUtils';

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

/** Phones: the debt's status in place of the initials — late, not paid, partly paid (its share), paid */
export const StatusBadge: React.FC<{ debt: Debt }> = ({ debt: d }) => {
  const late = d.overdue && d.status !== 'paid';
  const tone = late ? 'red' : STATUS_META[d.status].tone;
  const Icon = late ? AlarmClock : d.status === 'paid' ? CircleCheck : d.status === 'partial' ? PieChart : CircleAlert;
  const label = late ? 'متأخر' : d.status === 'paid' ? 'مسدد' : d.status === 'partial' ? `جزئي ${paidPercent(d)}%` : 'غير مسدد';
  return (
    <span className={`db-status-badge tone-${tone}`} role="img" aria-label={late ? 'متأخر' : STATUS_META[d.status].label}>
      <Icon size={20} />
      <small>{label}</small>
    </span>
  );
};

/**
 * One debt: who we borrowed from, how much, and what is left. The rest (status, fund, dates, repayments)
 * is in its details window. Its actions, details first, are in the ⋮ menu (the phone's own on phones).
 */
export const DebtCard: React.FC<{ debt: Debt; onOpen: (d: Debt) => void; actions?: MobileRowMenuItem[]; compact?: boolean }> = ({ debt: d, onOpen, actions = [], compact }) => {
  const paid = d.status === 'paid';
  const open = () => onOpen(d);
  const key = (e: React.KeyboardEvent) => { if (e.key === 'Enter') open(); };

  return (
    <article className={`db-card db-card-simple tone-${toneOf(d)} ${paid ? 'done' : ''} ${compact ? 'stacked' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={key}>
      <header className="db-card-head">
        <CreditorAvatar debt={d} />
        <h3 className="db-card-name">{d.creditor}</h3>
        {actions.length > 0 && (
          <span className="db-card-menu" onClick={e => e.stopPropagation()}>
            {compact ? <MobileRowMenu items={actions} label="إجراءات الدين" /> : <ActionsMenu items={actions} label="إجراءات الدين" />}
          </span>
        )}
      </header>

      <div className="db-card-figs">
        <span><small>قيمة الاستلاف</small><b>{moneyText(d.amount)}</b></span>
        <span><small>المتبقي</small><b className={paid ? 'db-paid' : 'db-left'}>{moneyText(d.remaining)}</b></span>
      </div>
    </article>
  );
};
