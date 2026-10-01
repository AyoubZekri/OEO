import client from '../../../core/api/client';
import { EXPENSE_NATURES } from '../Payments/usePaymentForm';
import { parseDate } from '../Tasks/taskUtils';

export { apiError } from '../Travels/travelUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are plain JSON */

/** loan: money borrowed and put into a fund; purchase: something bought and not paid yet */
export type DebtKind = 'loan' | 'purchase';
export type DebtStatus = 'open' | 'partial' | 'paid';

export interface DebtRepayment {
  id: number;
  amount: number;
  paid_on: string | null;
  fund_id: number | null;
  fund_name: string | null;
  payment_method: string | null;
  notes: string | null;
}

export interface Debt {
  id: number;
  kind: DebtKind;
  creditor: string;
  creditor_phone: string | null;
  title: string | null;
  amount: number;
  /** What has been paid (the debt's paid_amount column) */
  paid_amount: number;
  debt_date: string | null;
  due_date: string | null;
  fund_id: number | null;
  fund_name: string | null;
  expense_nature: string | null;
  notes: string | null;
  repaid: number;
  remaining: number;
  status: DebtStatus;
  overdue: boolean;
  created_at: string | null;
  repayments: DebtRepayment[];
}

export interface DebtFund { id: string; name: string; icon?: string; initialBalance: number }

export const KIND_META: Record<DebtKind, { label: string; short: string; hint: string; tone: string }> = {
  loan: { label: 'استلاف (دين في صندوق)', short: 'استلاف', hint: 'مال استلفناه من شخص ووضعناه في صندوق', tone: 'blue' },
  purchase: { label: 'دين مصاريف (شراء بالدين)', short: 'مصاريف', hint: 'شيء اشتريناه ولم ندفع ثمنه بعد', tone: 'violet' },
};

export const STATUS_META: Record<DebtStatus, { label: string; tone: string }> = {
  open: { label: 'غير مسدد', tone: 'red' },
  partial: { label: 'مسدد جزئياً', tone: 'amber' },
  paid: { label: 'مسدد', tone: 'green' },
};

export const KIND_FILTERS = [
  { value: '', label: 'كل الديون' },
  { value: 'loan', label: 'الاستلاف (الصناديق)' },
  { value: 'purchase', label: 'ديون المصاريف' },
];

export const STATUS_FILTERS = [
  { value: '', label: 'كل الحالات' },
  { value: 'unpaid', label: 'غير مسددة بالكامل' },
  { value: 'overdue', label: 'متأخرة' },
  { value: 'paid', label: 'مسددة' },
];

export const DEBT_NATURES = EXPENSE_NATURES;
export const PAYMENT_METHODS = ['نقدا', 'تحويل بنكي', 'صك', 'حوالة', 'دفع إلكتروني', 'أخرى'];

/** Share of the debt already paid, 0 → 100 */
export const paidPercent = (d: Debt) => (d.amount > 0 ? Math.min(100, Math.round((d.repaid / d.amount) * 100)) : 0);

/** The tone a debt is drawn with: overdue red, paid green, otherwise its kind */
export const toneOf = (d: Debt) => (d.status === 'paid' ? 'green' : d.overdue ? 'red' : KIND_META[d.kind].tone);

const MONTHS_AR = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** "04 أكتوبر 2026" */
export const dayText = (s: string | null | undefined) => {
  const d = parseDate(s);
  return d ? `${String(d.getDate()).padStart(2, '0')} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}` : '—';
};

/** "متأخر بـ 3 أيام", "يستحق اليوم", "بعد 12 يوماً" */
export const dueText = (d: Debt) => {
  const due = parseDate(d.due_date);
  if (!due || d.status === 'paid') return '';
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(due) - day(new Date())) / 86400000);
  if (days < 0) return `متأخر بـ ${-days} ${-days === 1 ? 'يوم' : -days <= 10 ? 'أيام' : 'يوماً'}`;
  if (days === 0) return 'يستحق اليوم';
  if (days === 1) return 'يستحق غداً';
  return `يستحق بعد ${days} ${days <= 10 ? 'أيام' : 'يوماً'}`;
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const filterDebts = (list: Debt[], kind: string, status: string, query: string) => {
  const q = query.trim().toLowerCase();
  return list.filter(d => (!kind || d.kind === kind)
    && (!status
      || (status === 'unpaid' && d.status !== 'paid')
      || (status === 'overdue' && d.overdue)
      || (status === 'paid' && d.status === 'paid'))
    && (!q
      || d.creditor.toLowerCase().includes(q)
      || (d.title || '').toLowerCase().includes(q)
      || (d.fund_name || '').toLowerCase().includes(q)
      || (d.expense_nature || '').toLowerCase().includes(q)));
};

/** Unpaid first (overdue, then the nearest due date), paid ones last */
export const sortDebts = (list: Debt[]) => {
  const rank = (d: Debt) => (d.status === 'paid' ? 2 : d.overdue ? 0 : 1);
  const due = (d: Debt) => parseDate(d.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const made = (d: Debt) => parseDate(d.debt_date)?.getTime() ?? 0;
  return [...list].sort((a, b) => rank(a) - rank(b) || (rank(a) === 2 ? made(b) - made(a) : due(a) - due(b) || made(b) - made(a)));
};

/** Totals of the summary cards: what is still owed, by kind, and what was paid */
export const debtTotals = (list: Debt[]) => {
  const sum = (xs: Debt[], f: (d: Debt) => number) => Math.round(xs.reduce((s, d) => s + f(d), 0) * 100) / 100;
  const loans = list.filter(d => d.kind === 'loan');
  const purchases = list.filter(d => d.kind === 'purchase');
  return {
    remaining: sum(list, d => d.remaining),
    loans: sum(loans, d => d.remaining),
    purchases: sum(purchases, d => d.remaining),
    repaid: sum(list, d => d.repaid),
    open: list.filter(d => d.status !== 'paid').length,
    overdue: list.filter(d => d.overdue).length,
    paid: list.filter(d => d.status === 'paid').length,
  };
};

const fundsApi = async (): Promise<DebtFund[]> => {
  const data = (await client.get('/funds')).data;
  return Array.isArray(data) ? data : data?.data || [];
};

/** API of one kind of debt: loans (/debts), purchases on credit (in the payments & expenses table: /payments/credit) */
export const debtApiFor = (kind: DebtKind) => {
  const base = kind === 'purchase' ? '/payments/credit' : '/debts';
  return {
    list: async (): Promise<Debt[]> => (await client.get(base)).data.data,
    funds: fundsApi,
    save: async (data: Record<string, any>): Promise<Debt> =>
      (await client.post(data.id ? `${base}/update` : `${base}/create`, data)).data.data,
    remove: async (id: number) => client.post(`${base}/delete`, { id }),
    repay: async (data: Record<string, any>): Promise<Debt> =>
      (await client.post(kind === 'purchase' ? `${base}/pay` : `${base}/repay`, data)).data.data,
    removeRepayment: async (id: number): Promise<Debt> =>
      (await client.post(kind === 'purchase' ? `${base}/payments/delete` : `${base}/repayments/delete`, { id })).data.data,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
