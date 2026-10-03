import { useCallback, useEffect, useState } from 'react';
import client from '../../../core/api/client';
import type { AbsenceRecord } from '../Absence/AbsenceRequestsController';
import { countsOf, statusOf } from '../Absence/absenceUtils';

/** What the member sends: a holiday request, or an absence announced in advance */
export interface MyAbsenceRequest {
  kind: 'leave' | 'absence';
  event_date: string;
  end_date?: string;
  event_category?: string;
  reason: string;
}

/** The server's message of a refused request (validation or rule), else a general one */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
export const errorText = (e: any, fallback: string) => {
  const data = e?.response?.data;
  const first = data?.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
  return first || data?.message || fallback;
};

/** Personal space: my absence records, my justifications and my requests */
export const useMyAbsences = () => {
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [justifyId, setJustifyId] = useState<number | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/absences/mine');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* the list stays as it was */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of my records
    load();
  }, [load]);

  /** Sends the justification of the open record; throws the server's message when refused */
  const justify = async (text: string) => {
    if (justifyId === null) return;
    try {
      await client.post('/absences/mine/justify', { id: justifyId, text });
    } catch (e) {
      alert(errorText(e, 'تعذر إرسال التبرير'));
      return;
    }
    setJustifyId(null);
    await load();
  };

  /** Sends a request; the form shows the server's message when refused */
  const request = async (data: MyAbsenceRequest) => {
    await client.post('/absences/mine/request', data);
    setRequestOpen(false);
    await load();
  };

  const stats = { ...countsOf(records), justified: records.filter(a => statusOf(a) === 'accepted').length };

  return {
    records,
    isLoading,
    stats,
    justifyId,
    justifying: records.find(r => r.id === justifyId) ?? null,
    openJustify: setJustifyId,
    closeJustify: () => setJustifyId(null),
    justify,
    requestOpen,
    openRequest: () => setRequestOpen(true),
    closeRequest: () => setRequestOpen(false),
    request,
  };
};
