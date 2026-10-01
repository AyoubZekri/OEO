export interface Fund {
  id: string;
  name: string;
  icon: 'bank' | 'mail' | 'wallet' | 'default';
  initialBalance: number;
}

export type TransactionType = 'إيداع' | 'سحب' | 'تحويل';

/** Types the server also writes: a cancelled payment's refund, and the debts (a loan received / paid back) */
export type FundTransactionType = TransactionType | 'إرجاع' | 'استلاف' | 'تسديد دين';

export interface FundTransaction {
  id: string;
  fundId: string;
  type: FundTransactionType;
  amount: number;
  date: string;
  description: string;
  toFundId?: string; // Only used if type === 'تحويل'
}
