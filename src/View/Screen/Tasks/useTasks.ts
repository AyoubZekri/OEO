import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../../core/api/client';
import { useCan } from '../../../core/functions/useCan';
import { errorText, type Task, type TaskMessage, type TaskStatus, type TaskTemplate, type TaskUser } from './taskUtils';

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

/** A task's conversation: loaded when opened (it marks it read), refreshed every 15 seconds, and a message sent */
export const useTaskChat = (taskId: number, onTask: (t: Task) => void) => {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/tasks/messages', { params: { id: taskId } });
      setMessages(listOf<TaskMessage>(res.data));
      if (res.data?.task) onTask(res.data.task as Task);
    } catch {
      /* the conversation stays as it was */
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTask changes on every render
  }, [taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the conversation of the opened task
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const send = async (body: string) => {
    try {
      const res = await client.post('/tasks/messages/send', { id: taskId, body });
      setMessages(list => [...list, res.data.data as TaskMessage]);
    } catch (e) {
      throw new Error(errorText(e, 'تعذر إرسال الرسالة'), { cause: e });
    }
  };

  return { messages, loading, send, reload: load };
};
