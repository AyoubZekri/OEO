import { useCallback, useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../../core/api/client';
import { DATA_CHANGED } from '../../../core/api/dataChanged';
import { useCan } from '../../../core/functions/useCan';
import { useAuth } from '../../../core/context/AuthContext';
import { errorText, type Task, type TaskMessage, type TaskStatus, type TaskTemplate, type TaskUser } from './taskUtils';

/** The lists check the server's «has anything changed?» number (a file) this often while looked at */
const LIST_CHECK_MS = 3000;

/**
 * A task list stays current without reloading the page: it reloads when a notification comes or something was saved
 * (DATA_CHANGED), and when the server's change number (/alerts/version: a file, no database) moved.
 */
const useLiveList = (load: () => Promise<void>) => {
  useEffect(() => {
    let version: string | null = null;
    const look = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const v = String((await client.get('/alerts/version')).data?.version ?? '');
        if (version !== null && v !== version) await load();
        version = v;
      } catch {
        /* looked at again on the next tick */
      }
    };
    look();
    const timer = window.setInterval(look, LIST_CHECK_MS);
    const now = () => { load(); };
    window.addEventListener(DATA_CHANGED, now);
    document.addEventListener('visibilitychange', look);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(DATA_CHANGED, now);
      document.removeEventListener('visibilitychange', look);
    };
  }, [load]);
};

const listOf = <T,>(data: unknown): T[] => {
  const d = (data as { data?: unknown })?.data ?? data;
  return Array.isArray(d) ? d as T[] : [];
};

/** ?task=ID (from an alert): that task's details open once the list is there */
const useOpenedTask = (tasks: Task[], ready: boolean) => {
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState<number | null>(null);
  const asked = Number(params.get('task')) || null;
  useEffect(() => {
    if (!asked || !ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address opens the task once
    setOpenId(asked);
    params.delete('task');
    setParams(params, { replace: true });
  }, [asked, ready, params, setParams]);
  const opened = openId ? tasks.find(t => t.id === openId) || null : null;
  return { opened, open: (t: Task) => setOpenId(t.id), close: () => setOpenId(null) };
};

/** The time now, renewed every minute: what depends on it (an appointment reaching its alert) shows by itself */
export const useNow = (every = 60000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), every);
    return () => window.clearInterval(id);
  }, [every]);
  return now;
};

/** What the task form sends */
export interface TaskPayload {
  id?: number;
  title: string;
  details: string | null;
  kind: Task['kind'];
  nature: Task['nature'];
  assignee_id: number;
  alert_at?: string | null;
  due_at?: string | null;
  schedule?: 'event' | 'periodic';
  event_type?: string | null;
  repeat?: string | null;
  repeat_day?: number | null;
  alert_offset?: number;
  due_offset?: number;
  /** A voice note's recording (sent with it as a file) */
  audio?: Blob | null;
}

/** With a recording: sent as a form (the file and the fields); otherwise as JSON */
const body = ({ audio, ...data }: TaskPayload) => {
  if (!audio) return data;
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) form.append(k, String(v)); });
  const ext = audio.type.includes('wav') ? 'wav' : audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm';
  form.append('audio', audio, `voice.${ext}`);
  return form;
};

/**
 * Management: the tasks (home page), the appointments (their own page), or the appointments' tasks still to come
 * (the appointments page's other side) — giving / editing them, their status,
 * stopping an appointment, deleting
 */
export const useTasksAdmin = (list: 'tasks' | 'templates' | 'upcoming') => {
  const can = useCan();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The form: a new task, a task, or an appointment to edit; voice: the voice note's own form
  const [form, setForm] = useState<{ task?: Task; template?: TaskTemplate; voice?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await client.get(list === 'tasks' ? '/tasks' : list === 'upcoming' ? '/tasks/upcoming' : '/tasks/templates');
      if (list !== 'templates') setTasks(listOf<Task>(res.data));
      else setTemplates(listOf<TaskTemplate>(res.data));
      setError('');
    } catch (e) {
      setError(errorText(e, list === 'templates' ? 'تعذر تحميل المواعيد' : 'تعذر تحميل المهام'));
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the tasks
    load();
  }, [load]);
  // New messages, statuses, tasks: the list follows them
  useLiveList(load);

  const details = useOpenedTask(tasks, !loading);

  const openForm = (what: { task?: Task; template?: TaskTemplate; voice?: boolean } = {}) => {
    setForm(what.task?.kind === 'voice' ? { ...what, voice: true } : what);
    if (!users.length) client.get('/tasks/users').then(r => setUsers(listOf<TaskUser>(r.data))).catch(() => undefined);
  };

  /** Saved: the lists are reloaded (an appointment may have created its first task) */
  const save = async (data: TaskPayload) => {
    try {
      const sent = body(data);
      await client.post(data.id ? '/tasks/update' : '/tasks/create', sent, sent instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    } catch (e) {
      throw new Error(errorText(e, 'تعذر حفظ المهمة'), { cause: e });
    }
    setForm(null);
    await load();
  };

  const replace = (t: Task) => setTasks(list => list.map(x => (x.id === t.id ? t : x)));

  /** The status, and its reason (written in the conversation) */
  const setStatus = async (task: Task, status: TaskStatus, note: string): Promise<Task> => {
    try {
      const res = await client.post('/tasks/status', { id: task.id, status, note: note || null });
      const saved = res.data.data as Task;
      replace(saved);
      return saved;
    } catch (e) {
      throw new Error(errorText(e, 'تعذر تغيير الحالة'), { cause: e });
    }
  };

  const toggleTemplate = async (t: TaskTemplate) => {
    try {
      const res = await client.post('/tasks/templates/toggle', { id: t.id });
      const saved = res.data.data as TaskTemplate;
      setTemplates(list => list.map(x => (x.id === t.id ? saved : x)));
      if (saved.status === 'active') load();
    } catch (e) {
      window.alert(errorText(e, 'تعذر تغيير حالة الموعد'));
    }
  };

  const remove = async (id: number, isTemplate: boolean) => {
    try {
      await client.post('/tasks/delete', { id });
      if (isTemplate) setTemplates(list => list.filter(x => x.id !== id));
      else {
        setTasks(list => list.filter(x => x.id !== id));
        details.close();
      }
    } catch (e) {
      window.alert(errorText(e, 'تعذر الحذف'));
    }
  };

  /** Several tasks at once (the home page's selection) */
  const removeMany = async (ids: number[]) => {
    try {
      await client.post('/tasks/delete-many', { ids });
      setTasks(list => list.filter(x => !ids.includes(x.id)));
    } catch (e) {
      window.alert(errorText(e, 'تعذر الحذف'));
    }
  };

  return {
    tasks, templates, users, loading, error, reload: load,
    // The home page's actions (tasks.*), or the appointments page's (appointments.*)
    can: (action: string) => can(list === 'templates' ? 'appointments' : 'tasks', action),
    /** Adding an appointment (from the home page's form too) */
    canAppointments: (action: string) => can('appointments', action),
    form, openForm, closeForm: () => setForm(null), save,
    opened: details.opened, openTask: details.open, closeTask: details.close,
    replace, setStatus, toggleTemplate, remove, removeMany,
  };
};
export type TasksAdmin = ReturnType<typeof useTasksAdmin>;

/** Personal space: the tasks given to me */
export const useMyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await client.get('/tasks/mine');
      setTasks(listOf<Task>(res.data));
      setError('');
    } catch (e) {
      setError(errorText(e, 'تعذر تحميل مهامي'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of my tasks
    load();
  }, [load]);
  useLiveList(load);

  const details = useOpenedTask(tasks, !loading);
  const replace = (t: Task) => setTasks(list => list.map(x => (x.id === t.id ? t : x)));

  // Opened (from the list or an alert): no longer new; its conversation stays unread until it is opened
  const openedId = details.opened && !details.opened.seen ? details.opened.id : null;
  useEffect(() => {
    if (!openedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the opened task is marked seen once
    setTasks(list => list.map(x => (x.id === openedId ? { ...x, seen: true } : x)));
    client.post('/tasks/seen', { id: openedId }).catch(() => undefined);
  }, [openedId]);

  return { tasks, loading, error, reload: load, opened: details.opened, openTask: details.open, closeTask: details.close, replace };
};

/** An open chat checks its number this often (seconds: 2 while looked at, 15 in the background) */
const CHAT_TICK_MS = 2000;
const CHAT_IDLE_MS = 15000;
/** A server without /tasks/chat-version: the new messages fetched this often instead */
const CHAT_FALLBACK_MS = 5000;

/**
 * An open task's conversation, live like a messaging app without weighing on the server: every 2 seconds it asks
 * for the chat's number (a file, no login, no database — /tasks/chat-version) and fetches only the new messages
 * when it moved; on the phone a Firebase notification (DATA_CHANGED) makes it look at once. A message sent shows at
 * once (a clock), then ✓ once saved, ✓✓ once the other side read it (seenTs); one that failed can be sent again.
 */
export const useTaskChat = (taskId: number, onTask: (t: Task) => void) => {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loading, setLoading] = useState(true);
  // When the other side last read the conversation
  const [seenTs, setSeenTs] = useState<number | null>(null);
  const version = useRef<number | null>(null);
  const lastFetch = useRef(0);
  const lastId = useRef(0);
  const onTaskRef = useRef(onTask);
  useLayoutEffect(() => { onTaskRef.current = onTask; });
  const me = useAuth().user?.id || '';

  /** The messages after the last one here (all of them the first time) */
  const fetchNew = useCallback(async () => {
    try {
      const res = await client.get('/tasks/messages', { params: { id: taskId, ...(lastId.current ? { after: lastId.current } : {}) } });
      const fresh = listOf<TaskMessage>(res.data);
      if (fresh.length) {
        lastId.current = Math.max(lastId.current, ...fresh.map(m => m.id));
        setMessages(list => [...list.filter(m => m.id < 0 || !fresh.some(f => f.id === m.id)), ...fresh]
          // Mine still on their way stay at the end
          .sort((a, b) => Number(a.id < 0) - Number(b.id < 0) || a.id - b.id));
      }
      if (typeof res.data?.version === 'number') version.current = res.data.version;
      setSeenTs(res.data?.seen_ts ?? null);
      if (res.data?.task) onTaskRef.current(res.data.task as Task);
    } catch {
      /* the conversation stays as it was */
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  /** Has it moved? (one number) — then what is new */
  const check = useCallback(async () => {
    try {
      // me: I have it open (no notification for it meanwhile)
      const v = (await client.get('/tasks/chat-version', { params: { id: taskId, ...(me ? { me } : {}) } })).data?.version ?? null;
      if (v !== null && v !== version.current) await fetchNew();
    } catch (e) {
      // A server without the chat's number yet: the new messages themselves, every few seconds
      const old = (e as { response?: { status?: number } })?.response?.status === 404;
      if (old && Date.now() - lastFetch.current >= CHAT_FALLBACK_MS) {
        lastFetch.current = Date.now();
        await fetchNew();
      }
    }
  }, [taskId, fetchNew, me]);

  useEffect(() => {
    lastId.current = 0;
    version.current = null;
    fetchNew();
    let timer = 0;
    let stopped = false;
    const loop = () => {
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') await check();
        if (!stopped) loop();
      }, document.visibilityState === 'visible' ? CHAT_TICK_MS : CHAT_IDLE_MS);
    };
    loop();
    // Closed, or the app in the background: its messages are notified to me again at once
    const leave = () => {
      if (me) client.get('/tasks/chat-version', { params: { id: taskId, me, leave: 1 } }).catch(() => undefined);
    };
    // A notification came (the phone), the page came back: look now (gone to the background: leave)
    const now = () => { check(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); else leave(); };
    window.addEventListener(DATA_CHANGED, now);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.removeEventListener(DATA_CHANGED, now);
      document.removeEventListener('visibilitychange', onVisibility);
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- me and taskId are fixed while the chat is open
  }, [fetchNew, check]);

  const deliver = async (tempId: number, body: string) => {
    try {
      const res = await client.post('/tasks/messages/send', { id: taskId, body });
      const saved = res.data.data as TaskMessage;
      lastId.current = Math.max(lastId.current, saved.id);
      setMessages(list => [...list.filter(m => m.id !== tempId && m.id !== saved.id), saved].sort((a, b) => Number(a.id < 0) - Number(b.id < 0) || a.id - b.id));
    } catch {
      setMessages(list => list.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
    }
  };

  /** Shown at once, saved in the background */
  const send = (body: string) => {
    const tempId = -Date.now();
    setMessages(list => [...list, {
      id: tempId, body, status: null, by: null, mine: true, from_assignee: false, at: new Date().toISOString(), ts: Date.now(), pending: true,
    }]);
    deliver(tempId, body);
  };

  /** A message that did not go: again */
  const retry = (m: TaskMessage) => {
    setMessages(list => list.map(x => (x.id === m.id ? { ...x, pending: true, failed: false } : x)));
    deliver(m.id, m.body || '');
  };

  return { messages, loading, send, retry, seenTs, reload: fetchNew };
};
