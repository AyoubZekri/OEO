const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-09-29 14:30" → Date (local time) */
export const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

/** <input type="datetime-local"> value ↔ the API's "Y-m-d H:i" */
export const toApiDate = (local: string) => (local ? local.replace('T', ' ') : null);
export const toInputDate = (s: string | null | undefined) => (s ? s.replace(' ', 'T').slice(0, 16) : '');

/** "2026/09/29 14:30" */
export const dateText = (s: string | null | undefined) => {
  const d = parseDate(s);
  if (!d) return '—';
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** A name's two first letters */
export const initials = (name: string | null | undefined) =>
  (name || '؟').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
