import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Search, X, ChevronLeft, Paperclip, Inbox, HandCoins, Landmark, Mail, Package, Wallet } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import type { Debt } from '../Debts/debtUtils';
import type { FundFlow } from './HomeController';
import type { FundTransaction } from '../Funds/fund_model';
import type { PaymentRecord } from '../Payments/payment_model';
import { paymentNatureText, paymentOccasionText, receiptUrl } from '../Payments/paymentText';
import client from '../../../core/api/client';
import { txFund } from '../../Mobile/MobileFunds/fundUtils';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import { MobileLoader } from '../../Mobile/widgets/MobileLoader';
import { txAmount } from '../../Mobile/MobileFunds/fundUtils';
import './HomeFinance.css';
import { openDocument } from '../../widget/openDocument';
import { CreditDebtsPage } from './CreditDebtsPage';

const FUND_ICONS: Record<string, React.ComponentType<{ size?: number }>> = { bank: Landmark, mail: Mail, wallet: Wallet };

/** One side of the funds' money: the total, then each fund's value */
const FlowCard: React.FC<{ kind: 'in' | 'out'; flows: FundFlow[]; unfunded?: number; money: (v: number) => string; onFund?: (f: FundFlow | null) => void }> = ({ kind, flows, unfunded = 0, money, onFund }) => {
  const valueOf = (f: FundFlow) => (kind === 'in' ? f.income : f.outcome);
  const total = flows.reduce((s, f) => s + valueOf(f), 0) + unfunded;
  const Icon = kind === 'in' ? ArrowDownLeft : ArrowUpRight;
  return (
    <section className={`hf-card static tone-${kind === 'in' ? 'green' : 'red'}`}>
      <div className="hf-top">
        <span className="hf-icon"><Icon size={22} /></span>
        <div className="hf-info">
          <b className="hf-amount">{money(total)}</b>
        </div>
      </div>
      {flows.length > 0 && (
        <ul className="hf-funds">
          {flows.map(f => {
            const FundIcon = FUND_ICONS[f.fund.icon] || Wallet;
            const content = (
              <>
                <span className="hf-fund"><FundIcon size={14} /> {f.fund.name}</span>
                <b>{money(valueOf(f))}</b>
              </>
            );
            return (
              <li key={f.fund.id}>
                {onFund ? (
                  <button type="button" className="hf-fund-row" onClick={() => onFund(f)}>
                    {content}
                  </button>
                ) : content}
              </li>
            );
          })}
          {unfunded > 0 && (
            <li>
              {onFund ? (
                <button type="button" className="hf-fund-row" onClick={() => onFund(null)}>
                  <span className="hf-fund"><Wallet size={14} /> صندوق خاص</span>
                  <b>{money(unfunded)}</b>
                </button>
              ) : (
                <>
                  <span className="hf-fund"><Wallet size={14} /> صندوق خاص</span>
                  <b>{money(unfunded)}</b>
                </>
              )}
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
  /** The sections this role sees (المالية: income and outgoings, debts) */
  showFlows?: boolean;
  showDebts?: boolean;
}> = ({ flows, unfunded = 0, loans, credit, money, showFlows = true, showDebts = true }) => {
  const navigate = useNavigate();
  // A fund's income or outgoings, on its own page (outgoings of no fund: the "special fund")
  const [opened, setOpened] = useState<{ kind: 'in' | 'out'; flow: FundFlow | null } | null>(null);
  // The in-kind debts, on their own page
  const [creditOpen, setCreditOpen] = useState(false);
  return (
    <div className="hf" dir="rtl">
      {/* Income, then outgoings under it: each with its own title */}
      {showFlows && <section className="hf-block">
        <h3 className="hf-block-title"><ArrowDownLeft size={17} /> المداخيل</h3>
        <FlowCard kind="in" flows={flows} money={money} onFund={f => f && setOpened({ kind: 'in', flow: f })} />
      </section>}
      {showFlows && <section className="hf-block">
        <h3 className="hf-block-title"><ArrowUpRight size={17} /> المخاريج</h3>
        <FlowCard kind="out" flows={flows} unfunded={unfunded} money={money} onFund={f => setOpened({ kind: 'out', flow: f })} />
      </section>}
      {showDebts && <section className="hf-block">
        <h3 className="hf-block-title"><HandCoins size={17} /> الديون</h3>
      <div className="hf-duo">
        <DebtTile title="غير مسددة" icon={HandCoins} tone="red" debts={loans} money={money} onOpen={() => navigate(`${Approutes.Debts}?status=unpaid`)} />
        <DebtTile title="عينية غير مسددة" icon={Package} tone="amber" debts={credit} money={money} onOpen={() => setCreditOpen(true)} />
      </div>
      </section>}

      {creditOpen && <CreditDebtsPage onBack={() => setCreditOpen(false)} />}
      {opened && <FundMoney kind={opened.kind} flow={opened.flow} money={money} onBack={() => setOpened(null)} />}
    </div>
  );
};

/** One line of a fund's page; an outgoing one also has its details (opened by a tap) */
interface MoneyLine {
  key: string;
  description: string;
  amount: number;
  date: string;
  /** The details page: its title, its rows, and the receipt when there is one */
  details?: { title: string; rows: { label: string; value: string }[]; receipt?: string | null };
}

/** Only the rows that have a value */
const rowsOf = (rows: [string, unknown][]) => rows
  .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
  .map(([label, v]) => ({ label, value: String(v) }));

const byDateDesc = (a: MoneyLine, b: MoneyLine) => b.date.localeCompare(a.date);
const listOf = <T,>(data: unknown): T[] => (Array.isArray(data) ? data : ((data as { data?: T[] })?.data || [])) as T[];

/** A fund's income: what was recorded as a deposit in it */
const loadIncome = async (fundId: string): Promise<MoneyLine[]> => {
  const list = listOf<FundTransaction>((await client.get('/transactions')).data);
  return list
    .filter(t => txFund(t) === fundId && t.type === 'إيداع')
    .map(t => ({ key: `t${t.id}`, description: t.description || 'إيداع', amount: txAmount(t), date: String(t.date || '').slice(0, 10) }))
    .sort(byDateDesc);
};

/**
 * A fund's outgoings (no fund: the "special fund"), as the home page counts them: the payments and expenses paid
 * from it (an advance paid back brings money in), and the payments made on purchases on credit from it
 */
const loadOutgoings = async (fundId: string, fundName: string, money: (v: number) => string): Promise<MoneyLine[]> => {
  const [paymentsRes, creditRes, membersRes] = await Promise.all([
    client.get('/payments'),
    client.get('/payments/credit').catch(() => null),
    client.get('/individuals').catch(() => null),
  ]);
  const names = new Map<string, string>();
  listOf<{ id: number | string; first_name?: string; last_name?: string }>(membersRes?.data)
    .forEach(m => names.set(String(m.id), `${m.first_name || ''} ${m.last_name || ''}`.trim()));
  const sameFund = (id: unknown) => (id ? String(id) : '') === fundId;

  const payments = listOf<PaymentRecord>(paymentsRes.data)
    .filter(p => !p.isCredit && p.amountNature !== 'إرجاع سلفة' && sameFund(p.fund_id ?? p.fundId))
    .map(p => {
      const who = names.get(String(p.memberId)) || p.creditor || '';
      const kind = p.transactionType === 'دفع' ? 'دفعة لعضو' : p.transactionType || 'مصروف';
      return {
        key: `p${p.id}`,
        description: [p.amountNature || p.transactionType || 'مصروف', who].filter(Boolean).join(' · '),
        amount: Number(p.amount) || 0,
        date: String(p.paymentDate || '').slice(0, 10),
        details: {
          title: p.transactionType === 'دفع' ? 'تفاصيل الدفعة' : 'تفاصيل المصروف',
          rows: rowsOf([
            ['نوع العملية', kind],
            ['طبيعة المبلغ', paymentNatureText(p)],
            [p.transactionType === 'دفع' ? 'المستفيد' : 'الجهة', who],
            ['المبلغ', money(Number(p.amount) || 0)],
            ['تاريخ الدفع', String(p.paymentDate || '').slice(0, 10)],
            ['الصندوق', fundName],
            ['طريقة الدفع', p.paymentMethod],
            ['المناسبة / السبب', paymentOccasionText(p)],
            ['رقم الصك البريدي', p.postal_check],
            ['قابل للتحويل', p.transactionType === 'مصاريف استثنائية' ? '' : (p.isTransferable ?? p.is_transferable) ? 'نعم' : 'لا'],
            ['ملاحظات', p.notes],
          ]),
          receipt: receiptUrl(p),
        },
      };
    });
  const credit = listOf<Debt>(creditRes?.data).flatMap(d => (d.repayments || [])
    .filter(r => sameFund(r.fund_id))
    .map(r => ({
      key: `c${r.id}`,
      description: `${d.expense_nature || 'شراء بالدين'} · ${d.creditor}${d.title ? ` (${d.title})` : ''}`,
      amount: Number(r.amount) || 0,
      date: String(r.paid_on || '').slice(0, 10),
      details: {
        title: 'تفاصيل التسديد',
        rows: rowsOf([
          ['نوع العملية', 'تسديد شراء بالدين'],
          ['المورّد', d.creditor],
          ['المشتريات', d.title],
          ['طبيعة المصروف', d.expense_nature],
          ['المبلغ المسدد', money(Number(r.amount) || 0)],
          ['تاريخ التسديد', String(r.paid_on || '').slice(0, 10)],
          ['الصندوق', r.fund_name || fundName],
          ['طريقة الدفع', r.payment_method],
          ['ثمن الشراء', money(Number(d.amount) || 0)],
          ['الباقي للتسديد', money(Number(d.remaining) || 0)],
          ['ملاحظات', r.notes],
        ]),
      },
    })));
  return [...payments, ...credit].sort(byDateDesc);
};

/** One fund's income or outgoings on its own page, newest first, with a search by description */
const FundMoney: React.FC<{ kind: 'in' | 'out'; flow: FundFlow | null; money: (v: number) => string; onBack: () => void }> = ({ kind, flow, money, onBack }) => {
  const [query, setQuery] = useState('');
  // Read from the server when the page opens (the loader of the other pages meanwhile)
  const [loaded, setLoaded] = useState<MoneyLine[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    const fundId = flow ? String(flow.fund.id) : '';
    (kind === 'in' ? loadIncome(fundId) : loadOutgoings(fundId, flow ? flow.fund.name : 'الصندوق الخاص', money))
      .then(list => { if (alive) setLoaded(list); })
      .catch(() => { if (alive) { setFailed(true); setLoaded([]); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- money is a formatter, the same on every render
  }, [kind, flow]);
  // An outgoing line opened: its details page
  const [opened, setOpened] = useState<MoneyLine | null>(null);

  const all = loaded || [];
  const q = query.trim().toLowerCase();
  const items = q ? all.filter(l => l.description.toLowerCase().includes(q)) : all;
  const fundName = flow ? flow.fund.name : 'الصندوق الخاص';
  const Arrow = kind === 'in' ? ArrowDownLeft : ArrowUpRight;
  const what = kind === 'in' ? 'المداخيل' : 'المخاريج';

  return (
    <MobileScreen title={`${kind === 'in' ? 'مداخيل' : 'مخاريج'} ${fundName}`} onBack={onBack}>
      <label className="hf-search">
        <Search size={17} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالبيان..." />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
      </label>

      {loaded === null ? (
        <MobileLoader text={`جاري تحميل ${what}...`} />
      ) : items.length === 0 ? (
        <div className="hf-empty">
          <Inbox size={30} />
          <p>{failed ? `تعذر تحميل ${what}` : all.length ? 'لا توجد نتائج لهذا البحث' : `لا توجد ${what} في هذا الصندوق`}</p>
        </div>
      ) : (
        <ul className={`hf-income-list ${kind === 'out' ? 'out' : ''}`}>
          {items.map(l => {
            const line = (
              <>
                <span className="hf-income-icon"><Arrow size={18} /></span>
                {/* The description, the amount under it, then the date */}
                <span className="hf-income-text">
                  <strong>{l.description}</strong>
                  <b>{money(l.amount)}</b>
                  <small><CalendarDays size={12} /> <span dir="ltr">{l.date || '—'}</span></small>
                </span>
              </>
            );
            return (
              <li key={l.key} className={l.details ? 'tappable' : ''}>
                {l.details ? (
                  <button type="button" className="hf-line-btn" onClick={() => setOpened(l)}>
                    {line}
                    <ChevronLeft size={18} className="hf-line-go" />
                  </button>
                ) : line}
              </li>
            );
          })}
        </ul>
      )}

      {opened?.details && (
        <MobileScreen title={opened.details.title} onBack={() => setOpened(null)} layer={2}>
          <section className="hf-detail-head">
            <span className="hf-income-icon out"><ArrowUpRight size={22} /></span>
            <b>{money(opened.amount)}</b>
            <strong>{opened.description}</strong>
          </section>
          <dl className="hf-detail-rows">
            {opened.details.rows.map(r => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          {opened.details.receipt && (
            <button type="button" className="hf-receipt" onClick={() => openDocument(opened.details?.receipt, 'وصل العملية')}><Paperclip size={17} /> عرض وصل العملية</button>
          )}
        </MobileScreen>
      )}
    </MobileScreen>
  );
};
