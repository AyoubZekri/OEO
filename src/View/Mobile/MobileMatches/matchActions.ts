import { Pencil, Trash2, Users, List, ClipboardList, CheckCircle, FileText, Activity, Timer } from 'lucide-react';
import type { MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { Match } from '../../Screen/Matches/match_model';
import { type MatchState, matchDate, hasScore } from './matchUtils';

export interface MatchActions {
  add: () => void;
  edit: (m: Match) => void;
  remove: (m: Match) => void;
  callups: (m: Match) => void;
  lineup: (m: Match) => void;
  attendance: (m: Match) => void;
  result: (m: Match) => void;
  report: (m: Match) => void;
  viewReport: (m: Match) => void;
  playerStats: (m: Match) => void;
  timeline: (m: Match) => void;
  setStatus: (m: Match, status: string) => void;
  reschedule: (m: Match, date: string) => void;
}

export const CLUB_NAME = 'أولمبيك ليو'; // as on the desktop cards
export const CLUB_LOGO = '/LOGO.webp';

/** Role permission (matches section) needed for each match action */
export const MATCH_ACTION_PERMISSION: Record<string, string> = {
  viewReport: 'view',
  timeline: 'report',
  result: 'report',
  end: 'report',
  report: 'report',
  stats: 'report',
  callups: 'callups',
  lineup: 'lineup',
  attendance: 'attendance',
  postpone: 'changeStatus',
  cancel: 'changeStatus',
  reschedule: 'changeStatus',
  restore: 'changeStatus',
  edit: 'edit',
  delete: 'delete',
};

// Actions of one match, with the same conditions as the desktop card buttons, limited to what the role `can` do
export const matchActionItems = (m: Match, state: MatchState, a: MatchActions, can: (action: string) => boolean = () => true): MobileRowMenuItem[] => {
  const scored = hasScore(m);
  const date = matchDate(m);
  const started = !date || date <= new Date();
  const orange = '#f97316';
  return [
    ...(scored ? [{ key: 'viewReport', label: 'عرض تقرير المباراة', icon: FileText, color: orange, onClick: () => a.viewReport(m) }] : []),
    ...(scored || state === 'live' ? [{ key: 'timeline', label: 'أحداث المباراة', icon: Timer, color: orange, onClick: () => a.timeline(m) }] : []),
    ...(!scored && state !== 'live' ? [
      { key: 'callups', label: 'الاستدعاء', icon: Users, color: orange, onClick: () => a.callups(m) },
      { key: 'lineup', label: 'التشكيلة', icon: List, color: orange, onClick: () => a.lineup(m) },
    ] : []),
    ...(started ? [
      { key: 'attendance', label: 'الحضور', icon: ClipboardList, color: orange, onClick: () => a.attendance(m) },
      { key: 'result', label: 'النتيجة', icon: CheckCircle, color: orange, onClick: () => a.result(m) },
      ...(scored ? [
        { key: 'report', label: 'التقرير', icon: FileText, color: orange, onClick: () => a.report(m) },
        { key: 'stats', label: 'تقييم اللاعبين', icon: Activity, color: orange, onClick: () => a.playerStats(m) },
      ] : []),
    ] : []),
    { key: 'edit', label: 'تعديل', icon: Pencil, color: orange, onClick: () => a.edit(m) },
    { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => a.remove(m) },
  ].filter(item => can(MATCH_ACTION_PERMISSION[item.key] || 'view'));
};

