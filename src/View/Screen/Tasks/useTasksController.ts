import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { useCan } from '../../../core/functions/useCan';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import { apiError, taskApi } from './taskApi';
import type { Task, TaskAction, TaskAttachment, TaskStats, TaskTemplate, TaskUser } from './taskUtils';
import { ACTION_META, dateText, type TaskKind } from './taskUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- form bodies are plain JSON */

/** tasks: the list for the signed-in account; the others are extra views for managers */
export type TasksTab = 'tasks' | 'dashboard' | 'templates' | 'archive';

const ok = (text: string) => showSnackbar('تم', text, '#10b981');
const fail = (text: string) => showSnackbar('خطأ', text, '#ef4444');

/** Everything the tasks pages (desktop and phone) share: lists, details, forms and workflow actions */
export const useTasksController = () => {
  const { user } = useAuth();
  const canDo = useCan();
  const can = useCallback((action: string) => canDo('tasks', action), [canDo]);
  const userId = user?.id;

  const [params, setParams] = useSearchParams();
  // No section filter: the list follows the signed-in account (see TaskController::index, scope auto)
  const tabs: { value: TasksTab; label: string }[] = [
    { value: 'tasks', label: 'المهام' },
    ...(can('manage') ? [{ value: 'dashboard' as const, label: 'لوحة المتابعة' }] : []),
    ...(can('templates') ? [{ value: 'templates' as const, label: 'المهام التلقائية' }] : []),
    ...(can('manage') ? [{ value: 'archive' as const, label: 'الأرشيف' }] : []),
  ];
  const wanted = params.get('tab') as TasksTab | null;
  const tab: TasksTab = tabs.some(t => t.value === wanted) ? (wanted as TasksTab) : 'tasks';
  const setTab = (next: TasksTab) => setParams(prev => {
    const p = new URLSearchParams(prev);
    p.set('tab', next);
    p.delete('task');
    return p;
  }, { replace: true });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [period, setPeriod] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const [detailsId, setDetailsId] = useUrlDetails('task');
  const [details, setDetails] = useState<Task | null>(null);
  /** One form for everything: a one-time task, or an automatic one (periodic / linked to an event) */
  const [form, setForm] = useState<{ task: Task | null; template: TaskTemplate | null; kind: TaskKind; kinds: TaskKind[] } | null>(null);

  const isList = tab !== 'dashboard' && tab !== 'templates';

  const loadList = useCallback(async () => {
    if (!isList) return;
    setLoading(true);
    setError('');
    try {
      setTasks(await taskApi.list(tab === 'archive' ? 'archive' : 'auto'));
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل المهام'));
    } finally {
      setLoading(false);
    }
  }, [tab, isList]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await taskApi.stats({ from: period.from || undefined, to: period.to || undefined }));
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل لوحة المتابعة'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTemplates(await taskApi.templates());
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل المهام التلقائية'));
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    if (tab === 'dashboard') return loadStats();
    if (tab === 'templates') return loadTemplates();
    return loadList();
  }, [tab, loadList, loadStats, loadTemplates]);

  /* eslint-disable react-hooks/set-state-in-effect -- loading data from the server when the tab / open task changes */
  useEffect(() => { reload(); }, [reload]);

  /** People for the assignee / reviewer pickers, loaded the first time a form opens */
  const ensureUsers = useCallback(async () => {
    if (users.length) return;
    try {
      setUsers(await taskApi.users());
    } catch (e) {
      fail(apiError(e, 'تعذر تحميل المستخدمين'));
    }
  }, [users.length]);

  /* ── Details ── */

  const loadDetails = useCallback(async (id: string) => {
    try {
      setDetails(await taskApi.show(Number(id)));
    } catch (e) {
      fail(apiError(e, 'تعذر فتح المهمة'));
      setDetailsId(null);
    }
  }, [setDetailsId]);

  useEffect(() => {
    if (detailsId) loadDetails(detailsId);
    else setDetails(null);
  }, [detailsId, loadDetails]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openTask = (task: Task) => {
    setDetails(prev => (prev && prev.id === task.id ? prev : { ...task }));
    setDetailsId(task.id);
  };
  const closeTask = () => setDetailsId(null);

  /** After a change: refresh the open task, the list and the review badge */
  const refreshAfter = async (id?: number) => {
    await Promise.all([
      loadList(),
      id && detailsId && String(id) === detailsId ? loadDetails(detailsId) : Promise.resolve(),
    ]);
  };

  /* ── Workflow ── */

  /** Throws the server's message so the sheet that asked for a reason can show it */
  const runAction = async (task: Task, action: TaskAction, extra: { reason?: string; note?: string } = {}) => {
    try {
      await taskApi.action(task.id, action, extra);
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
    ok(`${ACTION_META[action].label}: ${task.title}`);
    await refreshAfter(task.id);
  };

  const addProof = async (task: Task, proof: { type: TaskAttachment['type']; file?: File | null; url?: string; body?: string }) => {
    try {
      await taskApi.attach(task.id, proof);
    } catch (e) {
      throw new Error(apiError(e, 'تعذر رفع الإثبات'), { cause: e });
    }
    ok('أضيف الإثبات');
    await refreshAfter(task.id);
  };

  const removeProof = async (task: Task, attachment: TaskAttachment) => {
    try {
      await taskApi.removeAttachment(attachment.id);
      await refreshAfter(task.id);
    } catch (e) {
      fail(apiError(e));
    }
  };

  /* ── Create / edit / delete ── */

  /** New task: one-time / event (tasks.add) or periodic (tasks.templates); editing a task changes its dates only */
  const openForm = (task: Task | null = null) => {
    ensureUsers();
    const kinds: TaskKind[] = task ? ['once'] : [
      ...(can('add') ? ['once' as const, 'event' as const] : []),
      ...(can('templates') ? ['periodic' as const] : []),
    ];
    setForm({ task, template: null, kind: kinds[0] || 'once', kinds });
  };
  const closeForm = () => setForm(null);

  const saveTask = async (data: Record<string, any>) => {
    let saved: Task;
    try {
      saved = data.id ? await taskApi.update(data) : await taskApi.create(data);
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
    ok(data.id ? 'عُدلت المهمة' : `أنشئت المهمة ${saved.reference || ''}`);
    setForm(null);
    await refreshAfter(saved.id);
  };

  const deleteTask = async (task: Task) => {
    try {
      await taskApi.remove(task.id);
      ok('نُقلت المهمة إلى الأرشيف');
      closeTask();
      await refreshAfter();
    } catch (e) {
      fail(apiError(e));
    }
  };

  const restoreTask = async (task: Task) => {
    try {
      await taskApi.restore(task.id);
      ok('استُرجعت المهمة');
      closeTask();
      await refreshAfter();
    } catch (e) {
      fail(apiError(e));
    }
  };

  /* ── Templates ── */

  /** Automatic tasks: periodic, or created with every new match / training session / meeting */
  const openTemplateForm = (template: TaskTemplate | null = null) => {
    ensureUsers();
    const kind: TaskKind = template?.kind === 'event' ? 'trigger' : 'periodic';
    setForm({ task: null, template, kind, kinds: template ? [kind] : ['periodic', 'trigger'] });
  };

  const saveTemplate = async (data: Record<string, any>) => {
    let saved: TaskTemplate;
    try {
      saved = await taskApi.saveTemplate(data);
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
    ok(data.id
      ? 'عُدلت المهمة التلقائية'
      : saved.kind === 'periodic'
        ? `ستُنشأ المهمة تلقائياً، أول مرة: ${dateText(saved.next_run_at)}`
        : 'ستُنشأ المهمة تلقائياً مع كل حدث');
    setForm(null);
    if (tab === 'templates') await loadTemplates();
  };

  const toggleTemplate = async (template: TaskTemplate) => {
    try {
      await taskApi.toggleTemplate(template.id, !template.active);
      await loadTemplates();
    } catch (e) {
      fail(apiError(e));
    }
  };

  const deleteTemplate = async (template: TaskTemplate) => {
    try {
      await taskApi.removeTemplate(template.id);
      ok('حُذفت المهمة التلقائية');
      await loadTemplates();
    } catch (e) {
      fail(apiError(e));
    }
  };

  /* ── The periodic series of an open task ── */

  const withdrawnText = (n: number) => (n > 0 ? ` وأُلغيت ${n} مهمة قادمة لم تبدأ بعد` : '');

  /** Stop (no more tasks are created) or restart the series a task comes from */
  const setSeriesActive = async (task: Task, active: boolean) => {
    if (!task.template) return;
    try {
      const withdrawn = await taskApi.toggleTemplate(task.template.id, active);
      ok(active ? 'استُؤنف التكرار' : `أوقف التكرار${withdrawnText(withdrawn)}`);
      await refreshAfter(task.id);
    } catch (e) {
      fail(apiError(e));
    }
  };

  const deleteSeries = async (task: Task) => {
    if (!task.template) return;
    try {
      const withdrawn = await taskApi.removeTemplate(task.template.id);
      ok(`حُذف التكرار${withdrawnText(withdrawn)}`);
      await refreshAfter(task.id);
    } catch (e) {
      fail(apiError(e));
    }
  };

  return {
    userId, can, tabs, tab, setTab, isList,
    setSeriesActive, deleteSeries,
    tasks, loading, error, reload,
    users, templates, stats, period, setPeriod,
    details, detailsId, openTask, closeTask,
    runAction, addProof, removeProof,
    form, openForm, closeForm, saveTask, deleteTask, restoreTask,
    openTemplateForm, saveTemplate, toggleTemplate, deleteTemplate,
  };
};

export type TasksController = ReturnType<typeof useTasksController>;
/* eslint-enable @typescript-eslint/no-explicit-any */
