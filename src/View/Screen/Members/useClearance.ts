import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { ClearanceState, DepartmentId } from './clearance';

const EMPTY: ClearanceState = {
  card: null,
  checks: { admin: [], sporting: [], medical: [], financial: [], equipment: [] },
  signers: {},
};

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, Accept: 'application/json' });

/** The server's message of a failed request, or a general one */
const messageOf = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;

/**
 * A member's clearance card: loading it (with what each department still has pending),
 * and its three steps — start the departure, sign each department, close the file. Shared by desktop and phone.
 */
export const useClearance = (playerId: number, { onChanged }: { onChanged?: () => void } = {}) => {
  const [state, setState] = useState<ClearanceState>(EMPTY);
  const [loading, setLoading] = useState(true);
  /** The action being saved: 'start', a department, 'close', 'delete' */
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const apply = (data: { data?: ClearanceState['card']; checks?: ClearanceState['checks']; signers?: ClearanceState['signers'] }) =>
    setState({ card: data.data ?? null, checks: { ...EMPTY.checks, ...(data.checks || {}) }, signers: data.signers || {} });

  const load = useCallback(async () => {
    try {
      const res = await axios.get(Applink.getPlayerClearance(playerId), { headers: headers() });
      apply(res.data);
    } catch (e) {
      setError(messageOf(e, 'تعذر تحميل بطاقة الإخلاء'));
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    // The card is fetched as soon as it opens; the state changes once the request resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /** Runs one action; true when it succeeded */
  const run = async (key: string, action: () => Promise<void>, fallback: string) => {
    setBusy(key);
    setError('');
    try {
      await action();
      onChanged?.();
      return true;
    } catch (e) {
      setError(messageOf(e, fallback));
      return false;
    } finally {
      setBusy(null);
    }
  };

  /** Step 1: start the departure, or change its date, reason and notes */
  const start = (values: { exit_date: string; exit_reason: string; general_notes: string }) =>
    run('start', async () => {
      await axios.post(Applink.savePlayerClearance, { player_id: playerId, ...values }, { headers: headers() });
      await load();
    }, 'تعذر حفظ بيانات المغادرة');

  /** Step 2: the signed-in user clears a department (a note is required when something is pending there) */
  const sign = (department: DepartmentId, note: string) =>
    run(department, async () => {
      const res = await axios.post(Applink.signPlayerClearance(playerId), { department, note }, { headers: headers() });
      apply(res.data);
    }, 'تعذر التوقيع');

  const unsign = (department: DepartmentId) =>
    run(department, async () => {
      const res = await axios.post(Applink.unsignPlayerClearance(playerId), { department }, { headers: headers() });
      apply(res.data);
    }, 'تعذر إلغاء التوقيع');

  /** Step 3: the player acknowledges, the file is closed and the member becomes inactive */
  const close = () =>
    run('close', async () => {
      const res = await axios.post(Applink.closePlayerClearance(playerId), {}, { headers: headers() });
      apply(res.data);
    }, 'تعذر إغلاق الملف');

  /** The card is deleted: the member is active again */
  const remove = () =>
    run('delete', async () => {
      await axios.delete(Applink.deletePlayerClearance(playerId), { headers: headers() });
      setState(EMPTY);
    }, 'تعذر حذف البطاقة');

  return { ...state, loading, busy, error, setError, start, sign, unsign, close, remove };
};

export type ClearanceController = ReturnType<typeof useClearance>;
