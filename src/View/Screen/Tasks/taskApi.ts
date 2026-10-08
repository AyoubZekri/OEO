import axios from 'axios';
import client from '../../../core/api/client';
import type { Task, TaskAction, TaskAttachment, TaskEvent, TaskStats, TaskTemplate, TaskUser } from './taskUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are plain JSON */

/** The server's message ("اختر سبب التعطيل", a validation error…) or a generic one */
export const apiError = (e: unknown, fallback = 'تعذر تنفيذ العملية، حاول مرة أخرى') => {
  if (axios.isAxiosError(e)) {
    const data: any = e.response?.data;
    const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
    if (typeof first === 'string') return first;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (!e.response) return 'تعذر الاتصال بالخادم';
  }
  return fallback;
};

/**
 * A failed task request, written in full to the console (F12 → Console) to find what went wrong:
 * the operation, the task, the request sent, the server's status and answer (message, exception, file and line).
 */
export const logTaskError = (operation: string, e: unknown, context: Record<string, unknown> = {}) => {
  const time = new Date().toLocaleTimeString('fr-DZ');
  console.groupCollapsed(`%c[المهام] فشل: ${operation} — ${time}`, 'color:#ef4444;font-weight:bold');
  console.log('التفاصيل:', context);
  if (axios.isAxiosError(e)) {
    const data: any = e.response?.data;
    let sent: unknown = e.config?.data;
    if (sent instanceof FormData) sent = Object.fromEntries([...sent.entries()].map(([k, v]) => [k, v instanceof File ? `ملف: ${v.name} (${Math.round(v.size / 1024)} ك.ب، ${v.type})` : v]));
    else if (typeof sent === 'string') { try { sent = JSON.parse(sent); } catch { /* as it was */ } }
    console.log('الطلب:', `${(e.config?.method || '').toUpperCase()} ${e.config?.baseURL || ''}${e.config?.url || ''}`);
    console.log('المرسَل:', sent);
    if (e.response) {
      console.log('رمز الرد:', e.response.status, e.response.statusText);
      console.log('رسالة الخادم:', data?.message ?? data);
      if (data?.errors) console.log('أخطاء التحقق:', data.errors);
      if (data?.exception) console.log('الاستثناء:', data.exception, '—', data.file, ':', data.line);
    } else {
      // No answer: no connection, timeout, or the server dropped the request
      console.log('لا رد من الخادم:', e.code, e.message);
    }
  } else {
    console.log('الخطأ:', e);
  }
  console.groupEnd();
};

/** auto: what the signed-in account deals with (managers: every task) */
export type TaskScope = 'auto' | 'my' | 'review' | 'created' | 'all';

export const taskApi = {
  list: async (scope: TaskScope): Promise<Task[]> => (await client.get('/tasks', { params: { scope } })).data.data,
  show: async (id: number): Promise<Task> => (await client.get(`/tasks/${id}`)).data.data,
  users: async (): Promise<TaskUser[]> => (await client.get('/tasks/users')).data.data,
  events: async (type: TaskEvent['type']): Promise<TaskEvent[]> => (await client.get('/tasks/events', { params: { type } })).data.data,
  stats: async (params: { from?: string; to?: string }): Promise<TaskStats> => (await client.get('/tasks/stats', { params })).data.data,

  create: async (data: Record<string, any>): Promise<Task> => (await client.post('/tasks/create', data)).data.data,
  update: async (data: Record<string, any>): Promise<Task> => (await client.post('/tasks/update', data)).data.data,
  remove: async (id: number) => client.post('/tasks/delete', { id }),
  action: async (id: number, action: TaskAction, extra: { reason?: string; note?: string; status?: string } = {}): Promise<Task> =>
    (await client.post('/tasks/action', { id, action, ...extra })).data.data,

  attach: async (id: number, proof: { type: TaskAttachment['type']; file?: File | null; url?: string; body?: string }): Promise<TaskAttachment> => {
    const form = new FormData();
    form.append('id', String(id));
    form.append('type', proof.type);
    if (proof.file) form.append('file', proof.file);
    if (proof.url) form.append('url', proof.url);
    if (proof.body) form.append('body', proof.body);
    return (await client.post('/tasks/attachments/create', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },
  removeAttachment: async (id: number) => client.post('/tasks/attachments/delete', { id }),

  templates: async (): Promise<TaskTemplate[]> => (await client.get('/tasks/templates')).data.data,
  saveTemplate: async (data: Record<string, any>): Promise<TaskTemplate> =>
    (await client.post(data.id ? '/tasks/templates/update' : '/tasks/templates/create', data)).data.data,
  /** Returns how many upcoming unstarted tasks were withdrawn */
  removeTemplate: async (id: number): Promise<number> => (await client.post('/tasks/templates/delete', { id })).data.withdrawn ?? 0,
  toggleTemplate: async (id: number, active: boolean): Promise<number> => (await client.post('/tasks/templates/toggle', { id, active })).data.withdrawn ?? 0,
};
/* eslint-enable @typescript-eslint/no-explicit-any */
