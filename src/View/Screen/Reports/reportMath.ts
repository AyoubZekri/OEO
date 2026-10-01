import type { PaymentRecord } from '../Payments/payment_model';

/**
 * Financial report maths, from the payments & expenses table only (payment_expenses).
 * One place for the dates, the transaction types and the totals, used by the desktop and the phone reports.
 */

export type TransactionKind = 'دفع' | 'مصروف' | 'مصاريف استثنائية';
export const TRANSACTION_KINDS: TransactionKind[] = ['دفع', 'مصروف', 'مصاريف استثنائية'];

/** Money coming back to the club (an advance paid back): it reduces the expenses instead of adding to them */
export const ADVANCE_RETURN = 'إرجاع سلفة';

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Any stored payment date → "YYYY-MM-DD" ("" when unreadable).
 * The column is free text: "2026-09-30", "2026-09-30 10:15:00", "2026-09-30T10:15", "30/09/2026", "30-09-2026", "2026/09/30".
 */
export const normDate = (value: unknown): string => {
  const s = String(value ?? '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : isoDay(d);
};

/** Inside [from, to] (both "YYYY-MM-DD", either may be empty). Undated records only show without a period. */
export const inRange = (date: string, from: string, to: string) => {
  if (!from && !to) return true;
  if (!date) return false;
  return (!from || date >= from) && (!to || date <= to);
};

/**
 * The transaction type of a payment. Older records were saved without one: a payment to a member is a "دفع",
 * anything else an "مصروف", so every record belongs to exactly one type and the types add up to the total.
 */
export const kindOf = (p: PaymentRecord): TransactionKind => {
  const t = String(p.transactionType ?? '').trim();
  if ((TRANSACTION_KINDS as string[]).includes(t)) return t as TransactionKind;
  return p.memberId && p.memberId !== '0' ? 'دفع' : 'مصروف';
};

export const amountOf = (p: PaymentRecord) => {
  const n = Number(p.amount);
  return Number.isFinite(n) ? n : 0;
};

/** Start / end ("YYYY-MM-DD") of a period preset, relative to `today` */
export const presetRange = (preset: string, today = new Date()): { from: string; to: string } => {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const day = (yy: number, mm: number, dd: number) => isoDay(new Date(yy, mm, dd)); // overflow-safe
  const weekStart = d - today.getDay(); // weeks start on Sunday
  switch (preset) {
    case 'today': return { from: isoDay(today), to: isoDay(today) };
    case 'yesterday': return { from: day(y, m, d - 1), to: day(y, m, d - 1) };
    case 'this_week': return { from: day(y, m, weekStart), to: isoDay(today) };
    case 'last_week': return { from: day(y, m, weekStart - 7), to: day(y, m, weekStart - 1) };
    case 'this_month': return { from: day(y, m, 1), to: isoDay(today) };
    case 'last_month': return { from: day(y, m - 1, 1), to: day(y, m, 0) };
    case 'this_year': return { from: day(y, 0, 1), to: isoDay(today) };
    case 'last_year': return { from: day(y - 1, 0, 1), to: day(y - 1, 11, 31) };
    default: return { from: '', to: '' };
  }
};

export interface ExpenseRow extends PaymentRecord {
  /** Normalised date, used for filtering and sorting */
  day: string;
  kind: TransactionKind;
  /** An advance paid back: counted against the expenses */
  isReturn: boolean;
}

export interface ExpenseSummary {
  rows: ExpenseRow[];
  count: number;
  /** Money paid out */
  spent: number;
  /** Advances paid back */
  returned: number;
  /** spent − returned */
  net: number;
  /** Net amount per transaction type (they add up to `net`) */
  byKind: Record<TransactionKind, number>;
}

/** Expenses report: filter by type, period and nature, then total — every number from the same filtered rows */
export const expenseSummary = (
  payments: PaymentRecord[],
  filters: { kind: string; nature: string; from: string; to: string },
): ExpenseSummary => {
  const rows: ExpenseRow[] = payments
    .filter(p => p != null)
    .map(p => ({ ...p, day: normDate(p.paymentDate), kind: kindOf(p), isReturn: String(p.amountNature ?? '').trim() === ADVANCE_RETURN }))
    .filter(r => (!filters.kind || r.kind === filters.kind)
      && (!filters.nature || String(r.amountNature ?? '').trim() === filters.nature)
      && inRange(r.day, filters.from, filters.to))
    .sort((a, b) => (b.day.localeCompare(a.day)) || (Number(b.id) - Number(a.id)));

  const byKind: Record<TransactionKind, number> = { 'دفع': 0, 'مصروف': 0, 'مصاريف استثنائية': 0 };
  let spent = 0;
  let returned = 0;
  rows.forEach(r => {
    const amount = amountOf(r);
    if (r.isReturn) returned += amount;
    else spent += amount;
    byKind[r.kind] += r.isReturn ? -amount : amount;
  });

  // Round to the cent so float sums never show 0.0000001
  const cents = (n: number) => Math.round(n * 100) / 100;
  return {
    rows,
    count: rows.length,
    spent: cents(spent),
    returned: cents(returned),
    net: cents(spent - returned),
    byKind: { 'دفع': cents(byKind['دفع']), 'مصروف': cents(byKind['مصروف']), 'مصاريف استثنائية': cents(byKind['مصاريف استثنائية']) },
  };
};

/** The natures to filter by, for a transaction type (all of them, without repeats, when no type is chosen) */
export const naturesFor = (kind: string, memberNatures: string[], expenseNatures: string[]) => {
  const list = kind === 'دفع' ? memberNatures : kind ? expenseNatures : [...memberNatures, ...expenseNatures];
  return Array.from(new Set(list));
};

/* ── What the contracts commit the club to (not what was paid) ── */

export interface ContractCommitments {
  /** Sum of the monthly salaries of the active contracts paid by monthly salary */
  salaryTotal: number;
  salaryCount: number;
  /** Sum of the transport expenses written in the active contracts */
  transportTotal: number;
  transportCount: number;
}

/** Monthly salaries and transport expenses from the active contracts (ended contracts no longer cost anything) */
export const contractCommitments = (
  contracts: { status?: string; monthlySalary?: number; transportationExpenses?: number }[],
): ContractCommitments => {
  let salaryTotal = 0;
  let salaryCount = 0;
  let transportTotal = 0;
  let transportCount = 0;
  contracts
    .filter(c => (c.status || 'active') === 'active')
    .forEach(c => {
      const salary = Number(c.monthlySalary) || 0;
      const transport = Number(c.transportationExpenses) || 0;
      if (salary > 0) { salaryTotal += salary; salaryCount++; }
      if (transport > 0) { transportTotal += transport; transportCount++; }
    });
  const cents = (n: number) => Math.round(n * 100) / 100;
  return { salaryTotal: cents(salaryTotal), salaryCount, transportTotal: cents(transportTotal), transportCount };
};

/* ── Funds: balance and what was paid from them, by period and fund ── */

export interface FundLike { id: string | number; name: string; icon?: string; initialBalance: number | string }
export interface FundTx { fundId?: string | number; fund_id?: string | number; toFundId?: string | number | null; to_fund_id?: string | number | null; type: string; amount: number | string; date: string }

export interface FundRow {
  id: string;
  name: string;
  icon?: string;
  /** Balance at the end of the period (the current balance when the period has no end) */
  balance: number;
  /** Deposits into the fund during the period: only the transactions of type "إيداع" */
  totalDeposits: number;
  /** Money out of the fund during the period (withdrawals, transfers out) */
  totalWithdrawals: number;
  /** Paid from this fund during the period, from the payments & expenses table (advance returns excluded) */
  paid: number;
}

export interface FundSummary {
  funds: FundRow[];
  totalBalance: number;
  totalPaid: number;
  totalDeposits: number;
}

const idOf = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** +amount / −amount a transaction makes on a fund ("إرجاع" puts a cancelled payment back into the fund) */
const effectOn = (t: FundTx, fundId: string) => {
  const amount = Number(t.amount) || 0;
  const from = idOf(t.fundId ?? t.fund_id);
  const to = idOf(t.toFundId ?? t.to_fund_id);
  const type = String(t.type || '').trim();
  if (type === 'تحويل') return (to === fundId ? amount : 0) - (from === fundId ? amount : 0);
  if (from !== fundId) return 0;
  // استلاف / تسديد دين: a loan received into the fund, and paid back from it (debts)
  if (type === 'إيداع' || type === 'إرجاع' || type === 'استلاف') return amount;
  if (type === 'سحب' || type === 'تسديد دين') return -amount;
  return 0;
};

/**
 * The funds report for a period and a fund ("" = all):
 * balance at the end of the period = current balance − everything the transactions changed after it;
 * paid = the payments taken from the fund during the period (payments & expenses table).
 */
export const fundSummary = (
  funds: FundLike[],
  transactions: FundTx[],
  payments: PaymentRecord[],
  filters: { fund: string; from: string; to: string },
): FundSummary => {
  const cents = (n: number) => Math.round(n * 100) / 100;
  const shown = funds.filter(f => !filters.fund || idOf(f.id) === filters.fund);

  const rows: FundRow[] = shown.map(f => {
    const id = idOf(f.id);
    let afterPeriod = 0;
    let deposits = 0;
    let withdrawals = 0;
    transactions.forEach(t => {
      const effect = effectOn(t, id);
      if (!effect) return;
      const day = normDate(t.date);
      if (filters.to && day > filters.to) afterPeriod += effect;
      if (inRange(day, filters.from, filters.to)) {
        if (effect < 0) withdrawals -= effect;
        // Deposits: the "إيداع" transactions only (not returns, not transfers in)
        if (String(t.type || '').trim() === 'إيداع' && idOf(t.fundId ?? t.fund_id) === id) deposits += Number(t.amount) || 0;
      }
    });
    const paid = payments
      .filter(p => p && idOf(p.fund_id ?? p.fundId) === id && String(p.amountNature ?? '').trim() !== ADVANCE_RETURN
        && inRange(normDate(p.paymentDate), filters.from, filters.to))
      .reduce((sum, p) => sum + amountOf(p), 0);
    return {
      id,
      name: f.name,
      icon: f.icon,
      balance: cents((Number(f.initialBalance) || 0) - afterPeriod),
      totalDeposits: cents(deposits),
      totalWithdrawals: cents(withdrawals),
      paid: cents(paid),
    };
  });

  return {
    funds: rows,
    totalBalance: cents(rows.reduce((s, r) => s + r.balance, 0)),
    totalPaid: cents(rows.reduce((s, r) => s + r.paid, 0)),
    totalDeposits: cents(rows.reduce((s, r) => s + r.totalDeposits, 0)),
  };
};

/* ── Home page: expenses since the season start, contract debts and upcoming dues ── */

/** Start of the football season (1 July) containing `today`, as "YYYY-MM-DD" */
export const seasonStartOf = (today = new Date()) =>
  `${today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1}-07-01`;

/**
 * A contract's period. Contracts store the season as text ("2026 - 2027") in their start date:
 * that season runs from 1 July 2026 to 30 June 2027. Real dates are used as they are.
 */
export const contractPeriod = (startText: string, endText: string): { start: Date; end: Date } | null => {
  const season = String(startText || '').match(/(\d{4})\s*[-/–]\s*(\d{4})/);
  if (season) return { start: new Date(Number(season[1]), 6, 1), end: new Date(Number(season[2]), 5, 30) };
  const s = normDate(startText);
  if (!s) return null;
  const e = normDate(endText);
  const start = new Date(`${s}T00:00:00`);
  const end = e ? new Date(`${e}T00:00:00`) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
  return end > start ? { start, end } : null;
};

export interface HomeExpenses { players: number; staff: number; other: number; total: number }

/** What was spent since `from` (advance returns subtracted): to players, to the other members, and the rest */
export const homeExpenses = (
  payments: PaymentRecord[],
  memberTypeOf: (memberId: string) => string | undefined,
  from: string,
): HomeExpenses => {
  let players = 0;
  let staff = 0;
  let other = 0;
  payments.forEach(p => {
    if (!p) return;
    const day = normDate(p.paymentDate);
    if (!day || day < from) return;
    const amount = amountOf(p) * (String(p.amountNature ?? '').trim() === ADVANCE_RETURN ? -1 : 1);
    const memberId = p.memberId && p.memberId !== '0' ? String(p.memberId) : '';
    if (!memberId) other += amount;
    else if (['player', 'لاعب'].includes(memberTypeOf(memberId) || '')) players += amount;
    else staff += amount;
  });
  const cents = (n: number) => Math.round(n * 100) / 100;
  return { players: cents(players), staff: cents(staff), other: cents(other), total: cents(players + staff + other) };
};

export interface ContractLike {
  id: string; individuals_id: string; status?: string; startDate: string; endDate: string;
  contractValue: number; numberOfPayments: number; installments?: { amount: number }[];
}

export interface ContractDues {
  debts: number;
  upcoming: number;
  /** Everything still unpaid on the instalments (debts + upcoming) */
  remaining: number;
  overdueContracts: number;
}

/**
 * Debts and upcoming dues of the active contracts. The instalments are spread evenly over the contract's period
 * (the season), instalment i falling due at the end of its share; the "رقم دفعة" payments of the contract pay them
 * in order. Unpaid instalments already due are debts, the others are upcoming dues.
 */
export const contractDues = (contracts: ContractLike[], payments: PaymentRecord[], today = new Date()): ContractDues => {
  let debts = 0;
  let upcoming = 0;
  let overdueContracts = 0;

  contracts.filter(c => (c.status || 'active') === 'active').forEach(c => {
    const custom = (c.installments || []).map(i => Number(i.amount) || 0).filter(a => a > 0);
    const count = custom.length || Math.max(1, Number(c.numberOfPayments) || 1);
    const amounts = custom.length ? custom : Array.from({ length: count }, () => (Number(c.contractValue) || 0) / count);
    if (amounts.every(a => a <= 0)) return;

    // Payments for this contract: those linked to it, or the member's unlinked instalment payments
    let paid = payments
      .filter(p => p && String(p.amountNature ?? '').trim() === 'رقم دفعة' && String(p.memberId) === String(c.individuals_id)
        && (!p.contract_id || String(p.contract_id) === String(c.id)))
      .reduce((sum, p) => sum + amountOf(p), 0);

    const period = contractPeriod(c.startDate, c.endDate);
    const span = period ? period.end.getTime() - period.start.getTime() : 0;
    let overdue = false;
    amounts.forEach((amount, i) => {
      const covered = Math.min(paid, amount);
      paid -= covered;
      const unpaid = amount - covered;
      if (unpaid <= 0.005) return;
      // Without a readable period, the instalments count as due
      const due = period ? new Date(period.start.getTime() + (span * (i + 1)) / count) : today;
      if (due.getTime() <= today.getTime()) { debts += unpaid; overdue = true; } else upcoming += unpaid;
    });
    if (overdue) overdueContracts++;
  });

  const cents = (n: number) => Math.round(n * 100) / 100;
  return { debts: cents(debts), upcoming: cents(upcoming), remaining: cents(debts + upcoming), overdueContracts };
};

/* ── Individuals report: a member's (or a group's) statement ── */

export type IndividualGroup = 'player' | 'coach' | 'employee';

/** Statement group of a member type: players, the technical staff, everyone else */
export const groupOf = (type: string | undefined | null): IndividualGroup => {
  const t = String(type ?? '').trim();
  if (['player', 'لاعب'].includes(t)) return 'player';
  if (['coach', 'assistant_coach', 'goalkeeper_coach', 'physical_trainer', 'مدرب', 'مساعد مدرب', 'مدرب حراس', 'محضر بدني'].includes(t)) return 'coach';
  return 'employee';
};

/** Natures that are not money paid to the member: the advance and its return, and deductions */
const NOT_PAID = ['سلفة', ADVANCE_RETURN, 'استقطاع', 'خصم'];

export interface IndividualSummary {
  /** Value of the active contracts */
  contractValue: number;
  /** Instalments already due and still unpaid, today */
  due: number;
  /** Everything still unpaid on the instalments of the active contracts */
  remaining: number;
  /** Paid to the member(s) in the period: every nature except advances, advance returns and deductions */
  paid: number;
  /** Advances in the period, minus the advances paid back */
  advances: number;
  deductions: number;
  rows: (PaymentRecord & { day: string })[];
}

/**
 * Statement of one member, or of a whole group when no member is chosen.
 * Contract figures (value, due, remaining) come from the active contracts and do not depend on the period;
 * the paid / advances figures and the list follow the period and the nature filter.
 */
export const individualSummary = (input: {
  members: { id: string | number; type?: string }[];
  contracts: ContractLike[];
  payments: PaymentRecord[];
  memberId: string;
  /** The statement tab: player, coach or employee */
  group: string;
  nature: string;
  from: string;
  to: string;
  today?: Date;
}): IndividualSummary => {
  const ids = new Set(
    input.memberId
      ? [String(input.memberId)]
      : input.members.filter(m => groupOf(m.type) === groupOf(input.group)).map(m => String(m.id)),
  );

  const contracts = input.contracts.filter(c => ids.has(String(c.individuals_id)) && (c.status || 'active') === 'active');
  const memberPayments = input.payments.filter(p => p && ids.has(String(p.memberId)));
  const dues = contractDues(contracts, memberPayments, input.today);

  const rows = memberPayments
    .map(p => ({ ...p, day: normDate(p.paymentDate) }))
    .filter(p => inRange(p.day, input.from, input.to) && (!input.nature || String(p.amountNature ?? '').trim() === input.nature))
    .sort((a, b) => b.day.localeCompare(a.day) || Number(b.id) - Number(a.id));

  let paid = 0;
  let advances = 0;
  let deductions = 0;
  rows.forEach(p => {
    const nature = String(p.amountNature ?? '').trim();
    const amount = amountOf(p);
    if (nature === 'سلفة') advances += amount;
    else if (nature === ADVANCE_RETURN) advances -= amount;
    else if (nature === 'استقطاع' || nature === 'خصم') deductions += amount;
    else if (!NOT_PAID.includes(nature)) paid += amount;
  });

  const cents = (n: number) => Math.round(n * 100) / 100;
  return {
    contractValue: cents(contracts.reduce((s, c) => s + (Number(c.contractValue) || 0), 0)),
    due: dues.debts,
    remaining: dues.remaining,
    paid: cents(paid),
    advances: cents(advances),
    deductions: cents(deductions),
    rows,
  };
};
