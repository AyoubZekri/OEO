import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { MobileRowMenuItem } from '../../Mobile/widgets/MobileRowMenu';
import { useCan } from '../../../core/functions/useCan';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { apiError, goalApi, type Goal, type GoalUser } from './goalUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- form bodies are plain JSON */

/** The general goals page: the list, the users and seasons to pick from, the form and the delete prompt */
export const useGoals = () => {
  const canDo = useCan();
  const can = (action: string) => canDo('goals', action);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<GoalUser[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The form: null closed, { goal: null } a new goal
  const [form, setForm] = useState<{ goal: Goal | null } | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, options] = await Promise.all([goalApi.list(), goalApi.options()]);
      setGoals(list);
      setUsers(options.users);
      setSeasons(options.seasons);
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل الأهداف'));
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list from the server */
  useEffect(() => { load(); }, [load]);

  /** Throws the server's message so the form can show it */
  const save = async (data: Record<string, any>) => {
    let saved: Goal;
    try {
      saved = await goalApi.save(data);
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
    setGoals(list => (list.some(g => g.id === saved.id) ? list.map(g => (g.id === saved.id ? saved : g)) : [saved, ...list]));
    setSeasons(list => (list.includes(saved.season) ? list : [...list, saved.season]));
    setForm(null);
  };

  const remove = async (goal: Goal) => {
    try {
      await goalApi.remove(goal.id);
      setGoals(list => list.filter(g => g.id !== goal.id));
    } catch (e) {
      showSnackbar('خطأ', apiError(e), '#ef4444');
    }
  };

  /** A goal's ⋮ menu */
  const actionsFor = (g: Goal): MobileRowMenuItem[] => [
    ...(can('edit') ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => setForm({ goal: g }) }] : []),
    ...(can('delete') ? [{ key: 'delete', label: 'حذف', icon: Trash2, color: '#ef4444', danger: true, onClick: () => setDeleting(g) }] : []),
  ];

  return {
    can, goals, users, seasons, loading, error, reload: load, actionsFor,
    form, openForm: (goal: Goal | null = null) => setForm({ goal }), closeForm: () => setForm(null),
    deleting, closeDelete: () => setDeleting(null),
    save, remove,
  };
};

export type GoalsController = ReturnType<typeof useGoals>;
/* eslint-enable @typescript-eslint/no-explicit-any */
