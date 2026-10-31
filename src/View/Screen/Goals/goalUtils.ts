import client from '../../../core/api/client';

export { apiError } from '../Travels/travelUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are plain JSON */

/** A user (account) who can be responsible for a goal */
export interface GoalUser { id: number; name: string }

export interface Goal {
  id: number;
  goal: string;
  user_id: number | null;
  /** The user responsible for it (null once that user was deleted) */
  user: GoalUser | null;
  /** "2026 - 2027" */
  season: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface GoalOptions { users: GoalUser[]; seasons: string[] }

export const goalApi = {
  list: async (): Promise<Goal[]> => (await client.get('/goals')).data.data,
  options: async (): Promise<GoalOptions> => (await client.get('/goals/options')).data.data,
  save: async (data: Record<string, any>): Promise<Goal> =>
    (await client.post(data.id ? '/goals/update' : '/goals/create', data)).data.data,
  remove: async (id: number) => client.post('/goals/delete', { id }),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The seasons that have goals (the phone's count) */
export const usedSeasons = (goals: Goal[]) => [...new Set(goals.map(g => g.season))].sort((a, b) => b.localeCompare(a));

/** The users who have goals (the phone's count) */
export const goalUsers = (goals: Goal[]) => {
  const byId = new Map<number, GoalUser>();
  goals.forEach(g => { if (g.user) byId.set(g.user.id, g.user); });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
};

/** Search in the goal, its user's name and its season */
export const filterGoals = (goals: Goal[], query: string) => {
  const q = query.trim().toLowerCase();
  return goals.filter(g =>
    !q || g.goal.toLowerCase().includes(q) || (g.user?.name || '').toLowerCase().includes(q) || g.season.includes(q));
};
