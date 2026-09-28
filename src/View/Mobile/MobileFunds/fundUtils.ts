import { Landmark, Mail, Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import type { Fund, FundTransaction, TransactionType } from '../../Screen/Funds/fund_model';

/* eslint-disable @typescript-eslint/no-explicit-any -- transactions may come with snake_case keys */

export interface FundPermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  addTransaction: boolean;
}

export const FUND_ICONS: { value: Fund['icon']; label: string; icon: typeof Wallet }[] = [
  { value: 'wallet', label: 'صندوق', icon: Wallet },
  { value: 'bank', label: 'بنك', icon: Landmark },
  { value: 'mail', label: 'بريد', icon: Mail },
];

export const fundIcon = (icon?: string) => FUND_ICONS.find(i => i.value === icon) || FUND_ICONS[0];

export const OPERATIONS: { value: TransactionType; label: string; hint: string; icon: typeof Wallet; tone: string }[] = [
  { value: 'إيداع', label: 'إيداع', hint: 'إضافة مال', icon: ArrowDownLeft, tone: 'green' },
  { value: 'سحب', label: 'سحب', hint: 'مصروف', icon: ArrowUpRight, tone: 'red' },
  { value: 'تحويل', label: 'تحويل', hint: 'إلى صندوق آخر', icon: ArrowRightLeft, tone: 'blue' },
];

export const balanceOf = (f: Fund) => Number(f.initialBalance) || 0;

export const txFund = (t: FundTransaction) => String(t.fundId ?? (t as any).fund_id ?? '');
export const txTo = (t: FundTransaction) => String(t.toFundId ?? (t as any).to_fund_id ?? '');
export const txAmount = (t: FundTransaction) => Number(t.amount) || 0;

/** How a transaction moves this fund's money: +1 in, -1 out */
export const txSign = (t: FundTransaction, fundId: string) =>
  t.type === 'إيداع' || (t.type === 'تحويل' && txTo(t) === fundId && txFund(t) !== fundId) ? 1 : -1;
/* eslint-enable @typescript-eslint/no-explicit-any */
