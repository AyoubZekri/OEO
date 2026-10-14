import { useCallback, useEffect, useState } from 'react';
import client from '../../../core/api/client';
import { errorText, type Feedback, type FeedbackType } from './feedbackUtils';

const listOf = (data: unknown): Feedback[] => {
  const d = (data as { data?: unknown })?.data ?? data;
  return Array.isArray(d) ? d : [];
};

/** Personal space: my opinions, sending a new one, taking one back (no reply yet), and reading the replies */
export const useMyFeedback = () => {
  const [items, setItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/feedback/mine');
      setItems(listOf(res.data));
    } catch {
      /* the list stays as it was */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of my opinions
    load();
  }, [load]);

  /** New replies: shown as new once, then marked seen on the server */
  const unseen = items.filter(f => f.replied_at && !f.reply_seen).length;
  useEffect(() => {
    if (!unseen) return;
    client.post('/feedback/mine/seen').catch(() => undefined);
  }, [unseen]);

  /** Sends it; an error message, or null once sent */
  const send = async (data: { type: FeedbackType; subject: string; body: string }): Promise<string | null> => {
    try {
      const res = await client.post('/feedback/mine/create', data);
      const created = (res.data?.data ?? res.data) as Feedback;
      setItems(list => [created, ...list]);
      setFormOpen(false);
      return null;
    } catch (e) {
      return errorText(e, 'تعذر إرسال الرأي');
    }
  };

  const remove = async (f: Feedback) => {
    if (!window.confirm(`حذف «${f.subject}»؟`)) return;
    try {
      await client.post('/feedback/mine/delete', { id: f.id });
      setItems(list => list.filter(x => x.id !== f.id));
    } catch (e) {
      window.alert(errorText(e, 'تعذر الحذف'));
    }
  };

  return { items, isLoading, formOpen, openForm: () => setFormOpen(true), closeForm: () => setFormOpen(false), send, remove };
};

/** Management: every opinion, opening one (no longer new), replying (and rating a suggestion), deleting */
export const useFeedbackAdmin = () => {
  const [items, setItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [replying, setReplying] = useState<Feedback | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/feedback');
      setItems(listOf(res.data));
      setError('');
    } catch (e) {
      setError(errorText(e, 'تعذر تحميل الآراء'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the opinions
    load();
  }, [load]);

  /** Seen by the management: no longer "new" */
  const markRead = (f: Feedback) => {
    if (f.read) return;
    setItems(list => list.map(x => (x.id === f.id ? { ...x, read: true } : x)));
    client.post('/feedback/read', { id: f.id }).catch(() => undefined);
  };

  const openReply = (f: Feedback) => {
    markRead(f);
    setReplying(f);
  };

  /** The reply (and the rating of a suggestion); an error message, or null once saved */
  const reply = async (f: Feedback, text: string, rating: number | null): Promise<string | null> => {
    try {
      const res = await client.post('/feedback/reply', { id: f.id, reply: text, rating: f.type === 'suggestion' ? rating : null });
      const saved = (res.data?.data ?? res.data) as Feedback;
      setItems(list => list.map(x => (x.id === f.id ? saved : x)));
      setReplying(null);
      return null;
    } catch (e) {
      return errorText(e, 'تعذر حفظ الرد');
    }
  };

  const remove = async (f: Feedback) => {
    if (!window.confirm(`حذف «${f.subject}» نهائياً؟`)) return;
    try {
      await client.post('/feedback/delete', { id: f.id });
      setItems(list => list.filter(x => x.id !== f.id));
    } catch (e) {
      window.alert(errorText(e, 'تعذر الحذف'));
    }
  };

  return { items, isLoading, error, reload: load, markRead, replying, openReply, closeReply: () => setReplying(null), reply, remove };
};
