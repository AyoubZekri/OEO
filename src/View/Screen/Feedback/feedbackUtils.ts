import { Lightbulb, AlertTriangle, StickyNote } from 'lucide-react';

export type FeedbackType = 'suggestion' | 'complaint' | 'note';

/** A member's opinion and the management's reply (and rating, for a suggestion) */
export interface Feedback {
  id: number;
  type: FeedbackType;
  subject: string;
  body: string | null;
  reply: string | null;
  /** Suggestions only: 1 → 5 stars */
  rating: number | null;
  replied_by: string | null;
  replied_at: string | null;
  /** The member has seen the reply */
  reply_seen: boolean;
  /** The management has opened it */
  read: boolean;
  created_at: string | null;
  /** Management only */
  member_name?: string;
  member_role?: string | null;
}

export const FEEDBACK_TYPES: { value: FeedbackType; label: string; hint: string; icon: typeof Lightbulb; tone: string }[] = [
  { value: 'suggestion', label: 'اقتراح', hint: 'فكرة لتحسين النادي', icon: Lightbulb, tone: 'amber' },
  { value: 'complaint', label: 'شكوى', hint: 'مشكل تريد حله', icon: AlertTriangle, tone: 'red' },
  { value: 'note', label: 'ملاحظة', hint: 'ملاحظة للإدارة', icon: StickyNote, tone: 'blue' },
];

export const typeMeta = (type: FeedbackType) => FEEDBACK_TYPES.find(t => t.value === type) || FEEDBACK_TYPES[2];

export type FeedbackStatus = 'new' | 'waiting' | 'replied';

/** Management: new (never opened), waiting for a reply, replied */
export const statusOf = (f: Feedback): FeedbackStatus => (f.replied_at ? 'replied' : f.read ? 'waiting' : 'new');

export const STATUS_META: Record<FeedbackStatus, { label: string; tone: string }> = {
  new: { label: 'جديد', tone: 'orange' },
  waiting: { label: 'بانتظار الرد', tone: 'blue' },
  replied: { label: 'تم الرد', tone: 'green' },
};

/** "2026-10-13 14:05:00" → "13/10/2026 · 14:05" */
export const dateText = (value: string | null) => {
  if (!value) return '';
  const [d, t = ''] = value.split(' ');
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}${t ? ` · ${t.slice(0, 5)}` : ''}`;
};

/** The server's message of a refused request, else a general one */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
export const errorText = (e: any, fallback: string) => {
  const data = e?.response?.data;
  const first = data?.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
  return first || data?.message || fallback;
};
