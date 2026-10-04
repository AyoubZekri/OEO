import { useCallback, useEffect, useState } from 'react';
import client from '../../../core/api/client';
import type { AbsenceRecord } from '../Absence/AbsenceRequestsController';
import { countsOf, statusOf } from '../Absence/absenceUtils';

/**
 * What the member sends: a holiday request (dates, no event), or an absence / lateness announced in advance
 * for an event (travel, meeting, training, match, or another one named). The reason: a text, a document, or both.
 */
export interface MyAbsenceRequest {
  kind: 'leave' | 'absence' | 'late';
  event_date: string;
  end_date?: string;
  event_category?: string;
  event_other?: string;
  /** Lateness: the expected delay */
  duration?: string;
  reason?: string;
  document?: File | null;
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

  /** Sends the justification of the open record (a text, a document, or both); shows the server's message when refused */
  const justify = async (text: string, document?: File | null) => {
    if (justifyId === null) return;
    const form = new FormData();
    form.append('id', String(justifyId));
    if (text) form.append('text', text);
    if (document) form.append('document', document);
    try {
      // The api client sends JSON by default, which would turn the form (and drop the file): send it as a form
      await client.post('/absences/mine/justify', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } catch (e) {
      alert(errorText(e, 'تعذر إرسال التبرير'));
      return;
    }
    setJustifyId(null);
    await load();
  };

  /** Sends a request (as a form: it may carry a document); the form shows the server's message when refused */
  const request = async (data: MyAbsenceRequest) => {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) form.append(key, value);
      else if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
    });
    await client.post('/absences/mine/request', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
