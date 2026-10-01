import type { MemberModel } from '../Members/member_model';
import type { PaymentRecord } from '../Payments/payment_model';
import type { Fund, FundTransaction } from '../Funds/fund_model';

export type OperationDirection = 'in' | 'out' | 'transfer';

export interface Operation {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
  direction: OperationDirection;
  /** Money given back to a fund (cancelled or reduced payment): lowers the expenses, it is not income */
  refund?: boolean;
}

// Fund transaction types: deposits and refunds come in, transfers move money between funds, the rest goes out
export const getOperationDirection = (type: string): OperationDirection => {
  if (type === 'تحويل') return 'transfer';
  if (type === 'إيداع' || type === 'إرجاع' || type === 'إرجاع سلفة' || type === 'استلاف') return 'in';
  return 'out';
};

// Descriptions the server writes on the fund transactions it creates for payments (PaymentController)
const PAYMENT_TX = /^دفع\/مصروف \((.*)\) - (.*)$/;
const ADVANCE_TX = /^إرجاع سلفة - (.*)$/;

type RawTransaction = FundTransaction & { fund_id?: string; transaction_date?: string; description?: string };
type RawPayment = PaymentRecord & { fund_id?: string | number | null };

/**
 * All money movements, newest first, each counted once.
 * The fund transactions are the complete record for fund money: the server adds one for every payment made
 * from a fund (and for its edits and cancellations). Payments without a fund (exceptional expenses) are not in
 * it, so they are added from the payments list.
 */
export const buildOperations = (
  payments: PaymentRecord[],
  members: MemberModel[],
  funds: Fund[],
  fundTransactions: FundTransaction[]
): Operation[] => {
  const ops: Operation[] = [];

  fundTransactions.forEach(t => {
    const raw = t as RawTransaction;
    const fund = funds.find(f => String(f.id) === String(t.fundId || raw.fund_id));
    const description = (raw.description || '').trim();
    const payment = description.match(PAYMENT_TX);
    const advance = description.match(ADVANCE_TX);
    // The server also writes "إرجاع" (refund), which the fund model's type does not list
    const type = String(t.type);

    ops.push({
      id: `f_${t.id}`,
      // A payment's transaction shows who was paid and for what, like the payments page
      name: payment ? payment[2] : advance ? advance[1] : fund ? fund.name : 'صندوق',
      type: payment ? payment[1] : advance ? 'إرجاع سلفة' : type,
      amount: Number(t.amount) || 0,
      date: t.date || raw.transaction_date || '',
      direction: getOperationDirection(type),
      refund: type === 'إرجاع',
    });
  });

  payments
    .filter(p => {
      // The API sends "" when a payment has no fund
      const fundId = String(p.fundId ?? (p as RawPayment).fund_id ?? '').trim();
      return fundId === '' || fundId === '0' || fundId === 'null';
    })
    .forEach(p => {
      const member = members.find(m => String(m.id) === String(p.memberId));
      ops.push({
        id: `p_${p.id}`,
        name: member ? `${member.first_name} ${member.last_name}` : (p.occasion || 'مصروف'),
        type: p.amountNature || 'مصروف',
        amount: Number(p.amount) || 0,
        date: p.paymentDate,
        direction: p.amountNature === 'إرجاع سلفة' ? 'in' : 'out',
      });
    });

  return ops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * The totals shown above the list.
 * Expenses are every recorded payment / expense minus the advances paid back, exactly like "الصافي" in the
 * expenses report.
 * Money in is every deposit made to the funds (refunds of cancelled payments are not income).
 */
export const operationTotals = (ops: Operation[], payments: PaymentRecord[]) => ({
  // A loan received (استلاف) puts money in a fund but is not income: it is a debt
  in: ops.filter(op => op.direction === 'in' && !op.refund && op.type !== 'استلاف' && op.id.startsWith('f_')).reduce((sum, op) => sum + op.amount, 0),
  // Money paid out, an advance paid back reduces it (same rule as the home page and the expenses report)
  out: payments.reduce((sum, p) => sum + (Number(p.amount) || 0) * (String(p.amountNature ?? '').trim() === 'إرجاع سلفة' ? -1 : 1), 0),
});
