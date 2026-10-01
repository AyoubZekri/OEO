import axios from 'axios';
import client from '../../../core/api/client';
import { parseDate } from '../Tasks/taskUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are plain JSON */

export interface TravelMatch {
  id: number;
  title: string;
  at: string | null;
  place: string | null;
  team_id: number | null;
  team: string | null;
  competition: string | null;
}

export interface TravelPerson { id: number; name: string; type: string | null }

export interface Travel {
  id: number;
  match_id: number | null;
  match: TravelMatch | null;
  team_id: number | null;
  team_name: string | null;
  staff_ids: number[];
  staff: TravelPerson[];
  player_ids: number[];
  players: TravelPerson[];
  destination: string;
  travel_reason: string | null;
  departure_location: string | null;
  departure_time: string | null;
  transport_method: string | null;
  accommodation_place: string | null;
  return_time: string | null;
  head_of_delegation_id: number | null;
  head_of_delegation_name: string | null;
  staff_details: string | null;
  players_count: number | null;
  schedule_departure: string | null;
  schedule_arrival: string | null;
  schedule_meal: string | null;
  schedule_tech_meeting: string | null;
  schedule_match: string | null;
  schedule_return: string | null;
  special_notes: string | null;
  created_at: string | null;
}

export interface TravelOptions {
  members: (TravelPerson & { team_id: number | null })[];
  teams: { id: number; name: string }[];
  matches: TravelMatch[];
}

export const SCHEDULE: { key: keyof Travel; label: string }[] = [
  { key: 'schedule_departure', label: 'الانطلاق' },
  { key: 'schedule_arrival', label: 'الوصول' },
  { key: 'schedule_meal', label: 'الوجبة' },
  { key: 'schedule_tech_meeting', label: 'الاجتماع التقني' },
  { key: 'schedule_match', label: 'المباراة' },
  { key: 'schedule_return', label: 'العودة' },
];

/* ── Status from the dates ── */

export type TravelStatus = 'upcoming' | 'ongoing' | 'done';

export const STATUS_META: Record<TravelStatus, { label: string; tone: string }> = {
  upcoming: { label: 'قادم', tone: 'blue' },
  ongoing: { label: 'جاري الآن', tone: 'orange' },
  done: { label: 'منتهي', tone: 'slate' },
};

export const statusOf = (t: Travel): TravelStatus => {
  const now = Date.now();
  const dep = parseDate(t.departure_time)?.getTime();
  const ret = parseDate(t.return_time)?.getTime();
  if (dep && dep > now) return 'upcoming';
  if (ret && ret >= now) return 'ongoing';
  // Without a return time a trip counts as ongoing on its departure day
  if (dep && !ret && new Date(dep).toDateString() === new Date().toDateString()) return 'ongoing';
  return 'done';
};

export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'كل التنقلات' },
  { value: 'upcoming', label: 'القادمة' },
  { value: 'ongoing', label: 'الجارية' },
  { value: 'done', label: 'المنتهية' },
];

/** "بعد 3 أيام", "غداً", "اليوم" */
export const countdownText = (t: Travel) => {
  const d = parseDate(t.departure_time);
  if (!d) return '';
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(d) - day(new Date())) / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'غداً';
  if (days === 2) return 'بعد يومين';
  return days <= 10 ? `بعد ${days} أيام` : `بعد ${days} يوماً`;
};

/** Trip length: "يوم واحد", "3 أيام" */
export const durationText = (t: Travel) => {
  const a = parseDate(t.departure_time);
  const b = parseDate(t.return_time);
  if (!a || !b) return '';
  const days = Math.max(1, Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86400000) + 1);
  return days === 1 ? 'يوم واحد' : days === 2 ? 'يومان' : `${days} أيام`;
};

/* ── Dates as shown on the cards ── */

const MONTHS_AR = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Calendar tile: "04" / "أكتوبر" / "السبت" */
export const dateTile = (s: string | null) => {
  const d = parseDate(s);
  return d ? { day: pad2(d.getDate()), month: MONTHS_AR[d.getMonth()], weekday: DAYS_AR[d.getDay()] } : null;
};

/** "السبت 04 أكتوبر" */
export const shortDate = (s: string | null) => {
  const d = parseDate(s);
  return d ? `${DAYS_AR[d.getDay()]} ${pad2(d.getDate())} ${MONTHS_AR[d.getMonth()]}` : '—';
};

/** "08:00" */
export const timeOf = (s: string | null) => {
  const d = parseDate(s);
  return d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '';
};

export const filterTravels = (list: Travel[], status: string, query: string) => {
  const q = query.trim().toLowerCase();
  return list.filter(t => (!status || statusOf(t) === status) && (!q
    || t.destination.toLowerCase().includes(q)
    || (t.travel_reason || '').toLowerCase().includes(q)
    || (t.match?.title || '').toLowerCase().includes(q)
    || (t.head_of_delegation_name || '').toLowerCase().includes(q)));
};

/** Upcoming first (soonest first), then ongoing, then past trips (latest first) */
export const sortTravels = (list: Travel[]) => {
  const rank: Record<TravelStatus, number> = { ongoing: 0, upcoming: 1, done: 2 };
  const time = (t: Travel) => parseDate(t.departure_time)?.getTime() || 0;
  return [...list].sort((a, b) => {
    const ra = rank[statusOf(a)];
    const rb = rank[statusOf(b)];
    if (ra !== rb) return ra - rb;
    return ra === 2 ? time(b) - time(a) : time(a) - time(b);
  });
};

/* ── API ── */

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

export const travelApi = {
  list: async (): Promise<Travel[]> => (await client.get('/travels')).data.data,
  options: async (): Promise<TravelOptions> => (await client.get('/travels/options')).data.data,
  save: async (data: Record<string, any>): Promise<Travel> =>
    (await client.post(data.id ? '/travels/update' : '/travels/create', data)).data.data,
  remove: async (id: number) => client.post('/travels/delete', { id }),
};
/* eslint-enable @typescript-eslint/no-explicit-any */
