import { useCallback, useEffect, useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import { apiError, debtApiFor, type Debt, type DebtFund, type DebtKind } from './debtUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- form bodies are plain JSON */

const fail = (text: string) => showSnackbar('خطأ', text, '#ef4444');

/**
 * Debts of one kind, with their details, debt form and repayment form:
 * the loans on the debts page, the purchases on credit on the payments & expenses page.
 * `onChange`: called after anything that may add or remove payments (the payments page reloads its list).
 */
export const useDebtsController = ({ kind, onChange }: { kind: DebtKind; onChange?: () => void }) => {
  const canDo = useCan();
  // Loans: the debts section. Purchases on credit belong to the payments & expenses page and follow its permissions
  // (paying one adds an expense).
  const can = (action: string) => (kind === 'purchase'
    ? canDo('payments', action === 'repay' ? 'add' : action)
    : canDo('debts', action));

  const debtApi = debtApiFor(kind);
  const [allDebts, setDebts] = useState<Debt[]>([]);
  const [funds, setFunds] = useState<DebtFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailsId, setDetailsId] = useUrlDetails('debt');
  const details = detailsId ? allDebts.find(d => d.kind === kind && String(d.id) === detailsId) || null : null;
  const [form, setForm] = useState<{ debt: Debt | null; kind: DebtKind } | null>(null);
  const [repaying, setRepaying] = useState<Debt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = debtApiFor(kind);
      const [list, fundList] = await Promise.all([api.list(), api.funds().catch(() => [])]);
      setDebts(list);
      setFunds(fundList);
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل الديون'));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  /* eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list from the server */
  useEffect(() => { load(); }, [load]);

  /** Replace one debt in the list with the server's version */
  const put = (debt: Debt) => setDebts(list => (list.some(d => d.id === debt.id) ? list.map(d => (d.id === debt.id ? debt : d)) : [debt, ...list]));

  /** Funds balances change with every debt operation */
  const refreshFunds = () => {
    debtApi.funds().then(setFunds).catch(() => undefined);
    onChange?.();
  };

  /** Throws the server's message so the forms can show it */
  const run = async <T,>(call: () => Promise<T>): Promise<T> => {
    try {
      return await call();
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
  };

  const save = async (data: Record<string, any>) => {
    const saved = await run(() => debtApi.save(data));
    put(saved);
    setForm(null);
    setDetailsId(saved.id);
    refreshFunds();
  };

  const repay = async (data: Record<string, any>) => {
    const saved = await run(() => debtApi.repay(data));
    put(saved);
    setRepaying(null);
    refreshFunds();
  };

  const removeRepayment = async (id: number) => {
    try {
      put(await debtApi.removeRepayment(id));
      refreshFunds();
    } catch (e) {
      fail(apiError(e));
    }
  };

  const remove = async (debt: Debt) => {
    try {
      await debtApi.remove(debt.id);
      setDetailsId(null);
      setDebts(list => list.filter(d => d.id !== debt.id));
      refreshFunds();
    } catch (e) {
      fail(apiError(e));
    }
  };

  const debts = allDebts.filter(d => d.kind === kind);

  return {
    can, debts, funds, loading, error, reload: load,
    details, openDebt: (d: Debt) => setDetailsId(d.id), closeDebt: () => setDetailsId(null),
    kind,
    form, openForm: (debt: Debt | null = null) => setForm({ debt, kind: debt?.kind || kind }), closeForm: () => setForm(null),
    repaying, openRepay: (d: Debt) => setRepaying(d), closeRepay: () => setRepaying(null),
    save, repay, remove, removeRepayment,
  };
};

export type DebtsController = ReturnType<typeof useDebtsController>;
/* eslint-enable @typescript-eslint/no-explicit-any */
