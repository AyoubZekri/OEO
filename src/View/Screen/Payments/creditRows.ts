import type { PaymentRecord } from './payment_model';
import type { Debt } from '../Debts/debtUtils';

/**
 * A purchase on credit not fully paid yet, shown in the payments & expenses list next to the real payments.
 * Its amount is what is still owed; once it is paid in full, its repayments are the list's expenses.
 */
export type CreditRow = PaymentRecord & { credit: Debt };

export const isCredit = (p: PaymentRecord): p is CreditRow => Boolean((p as Partial<CreditRow>).credit);

/** The unpaid purchases on credit as list rows, newest first, with the page's search / nature / fund filters */
export const creditRows = (debts: Debt[], { search, nature, fund }: { search: string; nature: string; fund: string }): CreditRow[] => {
  // A purchase on credit has no fund until it is paid
  if (fund && fund !== 'all') return [];
  const q = search.trim().toLowerCase();
  return debts
    .filter(d => d.kind === 'purchase' && d.status !== 'paid')
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
      amount: d.remaining,
      paymentMethod: '',
      paymentDate: d.debt_date || '',
      amountNature: d.expense_nature || 'اخرى',
      occasion: d.title || '',
      credit: d,
    }));
};
