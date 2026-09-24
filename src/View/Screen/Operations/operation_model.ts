import type { MemberModel } from '../Members/member_model';
import type { PaymentRecord } from '../Payments/payment_model';
import type { Fund, FundTransaction } from '../Funds/fund_model';

export interface Operation {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
}

export type OperationDirection = 'in' | 'out' | 'transfer';

export const getOperationDirection = (type: string): OperationDirection => {
  if (type === 'تحويل') return 'transfer';
  if (type === 'إيداع' || type === 'إرجاع سلفة') return 'in';
  return 'out';
};

// Merges payments and fund transactions into one list, newest first
export const buildOperations = (
  payments: PaymentRecord[],
  members: MemberModel[],
  funds: Fund[],
  fundTransactions: FundTransaction[]
): Operation[] => {
  const ops: Operation[] = [];

  payments.forEach(p => {
    const member = members.find(m => m.id === p.memberId);
    ops.push({
      id: `p_${p.id}`,
      name: member ? `${member.first_name} ${member.last_name}` : (p.occasion || 'مصروف'),
      type: p.amountNature || 'دفع',
      amount: Number(p.amount) || 0,
      date: p.paymentDate,
    });
  });

  fundTransactions.forEach(t => {
    const raw = t as FundTransaction & { fund_id?: string; transaction_date?: string };
    const fund = funds.find(f => f.id === (t.fundId || raw.fund_id));
    ops.push({
      id: `f_${t.id}`,
      name: fund ? fund.name : 'صندوق',
      type: t.type,
      amount: Number(t.amount) || 0,
      date: t.date || raw.transaction_date || '',
    });
  });

  return ops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
