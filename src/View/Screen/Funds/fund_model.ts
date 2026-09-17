export interface Fund {
  id: string;
  name: string;
  icon: 'bank' | 'mail' | 'wallet' | 'default';
  initialBalance: number;
}

export type TransactionType = 'إيداع' | 'سحب' | 'تحويل';

export interface FundTransaction {
  id: string;
  fundId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  toFundId?: string; // Only used if type === 'تحويل'
}
