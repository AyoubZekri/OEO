import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, HandCoins, Landmark, Mail, Package, Wallet } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import type { Debt } from '../Debts/debtUtils';
import type { FundFlow } from './HomeController';
import './HomeFinance.css';

const FUND_ICONS: Record<string, React.ComponentType<{ size?: number }>> = { bank: Landmark, mail: Mail, wallet: Wallet };

/** One side of the funds' money: the total, then each fund's value */
const FlowCard: React.FC<{ kind: 'in' | 'out'; flows: FundFlow[]; unfunded?: number; money: (v: number) => string; onOpen: () => void }> = ({ kind, flows, unfunded = 0, money, onOpen }) => {
  const valueOf = (f: FundFlow) => (kind === 'in' ? f.income : f.outcome);
  const total = flows.reduce((s, f) => s + valueOf(f), 0) + unfunded;
  const Icon = kind === 'in' ? ArrowDownLeft : ArrowUpRight;
  return (
    <section className={`hf-card tone-${kind === 'in' ? 'green' : 'red'}`} onClick={onOpen}>
      <div className="hf-top">
        <span className="hf-icon"><Icon size={22} /></span>
        <div className="hf-info">
          <span className="hf-label">{kind === 'in' ? 'المداخيل' : 'المخاريج'}</span>
          <b className="hf-amount">{money(total)}</b>
        </div>
      </div>
      {flows.length > 0 && (
        <ul className="hf-funds">
          {flows.map(f => {
            const FundIcon = FUND_ICONS[f.fund.icon] || Wallet;
            return (
              <li key={f.fund.id}>
                <span className="hf-fund"><FundIcon size={14} /> {f.fund.name}</span>
                <b>{money(valueOf(f))}</b>
              </li>
            );
          })}
          {unfunded > 0 && (
            <li>
              <span className="hf-fund"><Wallet size={14} /> صندوق خاص</span>
              <b>{money(unfunded)}</b>
            </li>
          )}
        </ul>
      )}
    </section>
  );
};

/** An unpaid total: its value only */
const DebtTile: React.FC<{ title: string; icon: React.ComponentType<{ size?: number }>; tone: string; debts: Debt[]; money: (v: number) => string; onOpen: () => void }> = ({ title, icon: Icon, tone, debts, money, onOpen }) => (
  <button type="button" className={`hf-card hf-tile tone-${tone}`} onClick={onOpen}>
    <span className="hf-icon"><Icon size={20} /></span>
    <span className="hf-label">{title}</span>
    <b className="hf-amount">{money(debts.reduce((s, d) => s + (Number(d.remaining) || 0), 0))}</b>
  </button>
);

/**
 * Phone home, money: what the funds took in and paid out (each fund's value), and the totals of the unpaid
 * debts (loans) and of the unpaid in-kind debts (purchases on credit). Same cards as the desktop home.
 */
export const HomeFinance: React.FC<{
  flows: FundFlow[];
  loans: Debt[];
  credit: Debt[];
  /** Paid without a fund (exceptional expenses) */
  unfunded?: number;
  money: (v: number) => string;
  mobile?: boolean;
}> = ({ flows, unfunded = 0, loans, credit, money }) => {
  const navigate = useNavigate();
  return (
    <div className="hf" dir="rtl">
      <section className="hf-block">
        <h3 className="hf-block-title"><ArrowLeftRight size={17} /> المداخيل والمخاريج</h3>
      <FlowCard kind="in" flows={flows} money={money} onOpen={() => navigate(`${Approutes.Reports}?category=funds&type=${encodeURIComponent('إيداع')}`)} />
      <FlowCard kind="out" flows={flows} unfunded={unfunded} money={money} onOpen={() => navigate(`${Approutes.Reports}?category=expenses`)} />
      </section>
      <section className="hf-block">
        <h3 className="hf-block-title"><HandCoins size={17} /> الديون</h3>
      <div className="hf-duo">
        <DebtTile title="الديون غير المسددة" icon={HandCoins} tone="red" debts={loans} money={money} onOpen={() => navigate(`${Approutes.Debts}?status=unpaid`)} />
        <DebtTile title="الديون العينية غير المسددة" icon={Package} tone="amber" debts={credit} money={money} onOpen={() => navigate(`${Approutes.Payments}?paid=unpaid`)} />
      </div>
      </section>
    </div>
  );
};
