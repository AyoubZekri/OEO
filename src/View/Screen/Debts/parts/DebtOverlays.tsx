import React from 'react';
import type { DebtsController } from '../useDebtsController';
import { DebtDetails } from './DebtDetails';
import { DebtForm } from './DebtForm';
import { RepayForm } from './RepayForm';

/** Details, debt form and repayment form over the page (both layouts) */
export const DebtOverlays: React.FC<{ c: DebtsController; mobile: boolean }> = ({ c, mobile }) => (
  <>
    {c.details && <DebtDetails key={`details-${c.details.id}`} c={c} debt={c.details} mobile={mobile} />}
    {c.form && <DebtForm c={c} debt={c.form.debt} initialKind={c.form.kind} mobile={mobile} />}
    {c.repaying && <RepayForm key={`repay-${c.repaying.id}`} c={c} debt={c.repaying} mobile={mobile} />}
  </>
);
