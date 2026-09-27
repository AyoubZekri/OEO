import { Users, ShoppingBag, AlertCircle } from 'lucide-react';
import type { PaymentRecord } from '../../Screen/Payments/payment_model';
import type { Fund } from '../../Screen/Funds/fund_model';
import type { TransactionKind } from '../../Screen/Payments/usePaymentForm';
import { getMonthName } from '../../Screen/Payments/paymentText';

/* eslint-disable @typescript-eslint/no-explicit-any -- payments come with mixed field names from the API */

export interface PaymentPermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export const KINDS: { value: TransactionKind; label: string; short: string; icon: typeof Users; tone: string }[] = [
  { value: 'دفع', label: 'دفع مستحقات', short: 'مستحقات', icon: Users, tone: 'orange' },
  { value: 'مصروف', label: 'مصروف', short: 'مصاريف', icon: ShoppingBag, tone: 'blue' },
  { value: 'مصاريف استثنائية', label: 'مصاريف استثنائية', short: 'استثنائية', icon: AlertCircle, tone: 'red' },
];

// Old records have no type: they are member payments (same rule as the receipt totals)
export const kindOf = (p: PaymentRecord): TransactionKind =>
  (p.transactionType || (p as any).transaction_type || (p as any).type || 'دفع') as TransactionKind;
export const kindMeta = (p: PaymentRecord) => KINDS.find(k => k.value === kindOf(p)) || KINDS[0];

export const amountOf = (p: PaymentRecord) => Number(p.amount ?? (p as any).Amount) || 0;
export const dateOf = (p: PaymentRecord): string => p.paymentDate || (p as any).Date || '';
export const methodOf = (p: PaymentRecord): string => p.paymentMethod || (p as any).Payment_method || '';
export const notesOf = (p: PaymentRecord): string => p.notes || (p as any).nots || '';
export const fundOf = (p: PaymentRecord, funds: Fund[]) =>
  funds.find(f => String(f.id) === String(p.fund_id ?? p.fundId));

/** "2026-09" of the payment date, used to group the list by month */
export const monthKey = (p: PaymentRecord) => dateOf(p).slice(0, 7);
export const monthTitle = (key: string) => {
  const [y, m] = key.split('-');
  return y && m ? `${getMonthName(m)} ${y}` : 'بدون تاريخ';
};

/** Short amount for tight places: 1,2 مليون / 450 ألف */
export const compactMoney = (n: number) => {
  const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',');
  if (n >= 1e6) return `${fmt(n / 1e6)} مليون`;
  if (n >= 1e3) return `${fmt(n / 1e3)} ألف`;
  return String(Math.round(n));
};

export const initials = (first?: string, last?: string) => `${(first || '').charAt(0)}${(last || '').charAt(0)}` || '؟';
/* eslint-enable @typescript-eslint/no-explicit-any */
