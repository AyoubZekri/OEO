import { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { useDebtsController } from '../Debts/useDebtsController';
import type { DebtPrefill } from '../Debts/parts/DebtForm';

/**
 * Money put into a fund that is a loan: the deposit is not recorded on its own,
 * the debt form opens with its amount, fund, date and reason (saving the loan puts the money into the fund).
 */
export const useFundLoan = (onSaved: () => void) => {
  const canDo = useCan();
  const debts = useDebtsController({ kind: 'loan', onChange: onSaved, autoLoad: false, openAfterSave: false });
  const [prefill, setPrefill] = useState<DebtPrefill | null>(null);

  const start = (values: DebtPrefill) => {
    setPrefill(values);
    debts.reload(); // the funds the form chooses from
    debts.openForm();
  };

  return {
    /** Only who may add debts is asked whether the money is a loan */
    allowed: canDo('debts', 'add'),
    debts,
    prefill,
    start,
  };
};

export type FundLoan = ReturnType<typeof useFundLoan>;
