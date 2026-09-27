import type { Match } from '../../Screen/Matches/match_model';

export type MatchState = 'upcoming' | 'live' | 'awaiting' | 'finished' | 'postponed' | 'cancelled';

/** Match time read as Algeria time (UTC+1), the same rule as the desktop page */
export const matchDate = (m: Match) => {
  if (!m.match_date) return null;
  let value = m.match_date.includes('T') ? m.match_date : m.match_date.replace(' ', 'T');
  if (!value.includes('+') && !value.includes('Z')) value = `${value}+01:00`;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const hasScore = (m: Match) =>
  m.team_score !== undefined && m.team_score !== null && m.opponent_score !== undefined && m.opponent_score !== null;

/** Same states as the desktop cards: a match is live for 2.5 hours after kick-off */
export const matchState = (m: Match, now = new Date()): MatchState => {
  if (m.match_status === 'ملغاة') return 'cancelled';
  if (m.match_status === 'مؤجلة') return 'postponed';
  if (hasScore(m)) return 'finished';
  const date = matchDate(m);
  if (!date) return 'upcoming';
  const hours = (now.getTime() - date.getTime()) / 3600000;
  if (hours >= 0 && hours <= 2.5) return 'live';
  if (hours > 2.5) return 'awaiting';
  return 'upcoming';
};

export const STATE_LABEL: Record<MatchState, string> = {
  upcoming: 'قادمة',
  live: 'جارية الآن',
  awaiting: 'بانتظار النتيجة',
  finished: 'انتهت',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

export type Result = 'win' | 'draw' | 'loss';

export const resultOf = (m: Match): Result | null => {
  if (!hasScore(m)) return null;
  const a = Number(m.team_score);
  const b = Number(m.opponent_score);
  return a > b ? 'win' : a < b ? 'loss' : 'draw';
};

export const RESULT_LABEL: Record<Result, string> = { win: 'فوز', draw: 'تعادل', loss: 'خسارة' };

export const opponentName = (m: Match) => m.opponent || m.opponentClub?.name || m.opponent_club?.name || 'خصم غير محدد';
export const opponentLogo = (m: Match) => m.opponentClub?.logo || m.opponent_club?.logo || '';
/** Code shown when the opponent has no logo: its symbol, else the first letter of its name */
export const opponentShort = (m: Match) => {
  const code = m.opponentClub?.symbol || m.opponent_club?.symbol || m.match_title;
  return code ? code.slice(0, 4).toUpperCase() : opponentName(m).trim().charAt(0);
};

export const timeText = (date: Date | null) =>
  date ? new Intl.DateTimeFormat('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '--:--';

/** "اليوم" / "غداً" / "السبت 28 سبتمبر" */
export const dayText = (date: Date | null) => {
  if (!date) return 'بدون تاريخ';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'غداً';
  if (diff === -1) return 'أمس';
  return new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

export const longDateText = (date: Date | null) =>
  date ? new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date) : '—';

/** "بعد 3 أيام" / "بعد 5 سا 20 د" */
export const countdown = (date: Date | null, now: Date) => {
  if (!date) return '';
  const minutes = Math.max(1, Math.round((date.getTime() - now.getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  if (days >= 1) return `بعد ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : `${days} ${days <= 10 ? 'أيام' : 'يوماً'}`}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `بعد ${h ? `${h} سا ` : ''}${m} د`;
};
