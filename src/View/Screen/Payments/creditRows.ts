import type { PaymentRecord } from './payment_model';
import type { Debt } from '../Debts/debtUtils';

/**
 * A purchase on credit not fully paid yet, one row of the payments & expenses list: its amount is the full price,
 * what has been paid on it is in the "paid" column (paying it never adds a row). Paid in full, it is a normal row.
 */
export type CreditRow = PaymentRecord & { credit: Debt };

export const isCredit = (p: PaymentRecord): p is CreditRow => Boolean((p as Partial<CreditRow>).credit);

/** The purchases on credit not fully paid, newest first, with the page's search / nature / fund filters */
export const creditRows = (debts: Debt[], { search, nature, fund }: { search: string; nature: string; fund: string }): CreditRow[] => {
  const q = search.trim().toLowerCase();
  return debts
    .filter(d => d.kind === 'purchase' && d.status !== 'paid')
    // Its fund is the one of its payments
    .filter(d => !fund || fund === 'all' || String(d.fund_id ?? '') === fund)
    .filter(d => nature === 'all' || !nature || (d.expense_nature || 'اخرى') === nature)
    .filter(d => !q
      || d.creditor.toLowerCase().includes(q)
      || (d.title || '').toLowerCase().includes(q)
      || (d.expense_nature || '').toLowerCase().includes(q)
      || (d.debt_date || '').includes(q))
    .sort((a, b) => (b.debt_date || '').localeCompare(a.debt_date || '') || b.id - a.id)
    .map(d => ({
      id: `credit-${d.id}`,
      transactionType: 'مصروف',
      amount: d.amount,
      paymentMethod: '',
      paymentDate: d.debt_date || '',
      amountNature: d.expense_nature || 'اخرى',
      occasion: d.title || '',
      credit: d,
    }));
};
