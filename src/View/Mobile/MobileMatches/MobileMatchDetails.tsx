import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Calendar, Clock, MapPin, Users, Trophy, Flag, CalendarClock, Ban, RotateCcw, Radio, Timer } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { Match } from '../../Screen/Matches/match_model';
import { type MatchActions, matchActionItems, MATCH_ACTION_PERMISSION, CLUB_NAME, CLUB_LOGO } from './matchActions';
import {
  type MatchState, matchDate, hasScore, resultOf, RESULT_LABEL, STATE_LABEL, opponentName, opponentLogo, opponentShort,
  timeText, longDateText, countdown,
} from './matchUtils';
import { TeamBadge } from './TeamBadge';
import { MyMatchParticipation } from './MyMatchParticipation';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileMatchDetails.css';

interface MobileMatchDetailsProps {
  match: Match;
  state: MatchState;
  now: Date;
  actions: MatchActions;
  onClose: () => void;
  /** Personal space: read only, with my participation instead of the category's attendance */
  personal?: boolean;
}

const gatheringTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return isNaN(date.getTime()) ? value : timeText(date);
};

// Full details of one match (phone): score board, facts, status changes and every action
export const MobileMatchDetails: React.FC<MobileMatchDetailsProps> = ({ match, state, now, actions, onClose, personal = false }) => {
  const allowedTo = useCan();
  const can: typeof allowedTo = (...args) => !personal && allowedTo(...args);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(match.match_date?.replace(' ', 'T').slice(0, 16) || '');
  const date = matchDate(match);
  const result = resultOf(match);
  const stats = match.attendance_stats;
  const rate = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
  const allowed = (action: string) => can('matches', action);
  const items = matchActionItems(match, state, actions, allowed).filter(i => i.key !== 'edit' && i.key !== 'delete');

  // Same status changes as the desktop status menus
  const statusButtons: { key: string; label: string; icon: React.ComponentType<{ size?: number }>; tone: string; onClick: () => void }[] = [
    ...(state === 'live' ? [{ key: 'end', label: 'انتهت (النتيجة)', icon: Flag, tone: 'green', onClick: () => actions.result(match) }] : []),
    ...(state === 'upcoming' || state === 'live' ? [
      { key: 'postpone', label: 'تأجيل', icon: CalendarClock, tone: 'amber', onClick: () => actions.setStatus(match, 'مؤجلة') },
      { key: 'cancel', label: 'إلغاء', icon: Ban, tone: 'red', onClick: () => actions.setStatus(match, 'ملغاة') },
    ] : []),
    ...(state === 'postponed' ? [
      { key: 'reschedule', label: 'تحديد موعد جديد', icon: CalendarClock, tone: 'green', onClick: () => setRescheduling(true) },
      { key: 'cancel', label: 'إلغاء', icon: Ban, tone: 'red', onClick: () => actions.setStatus(match, 'ملغاة') },
    ] : []),
    ...(state === 'cancelled' ? [
      { key: 'restore', label: 'إرجاع لمباراة قادمة', icon: RotateCcw, tone: 'green', onClick: () => actions.setStatus(match, 'upcoming') },
    ] : []),
  ].filter(b => allowed(MATCH_ACTION_PERMISSION[b.key] || 'view'));

  return (
    <MobileScreen
      title="تفاصيل المباراة"
      onBack={onClose}
    >
      {/* Score board */}
      <section className={`mmd-hero state-${state}`}>
        <span className="mmd-comp">
          <Trophy size={13} /> {match.competition || 'الدوري المحلي'}
          {match.team?.name && <em>{match.team.name}</em>}
        </span>
        <div className="mmd-board">
          <span className="mmd-team">
            <TeamBadge logo={CLUB_LOGO} short="OL" className="xl" />
            <strong>{CLUB_NAME}</strong>
          </span>
          <span className="mmd-center">
            {/* Our club is on the right: in this left-to-right score its goals come last */}
            {hasScore(match)
              ? <strong className="mmd-score" dir="ltr">{match.opponent_score} - {match.team_score}</strong>
              : <strong className="mmd-kickoff" dir="ltr">{timeText(date)}</strong>}
            <span className={`mmd-state ${result ? `result-${result}` : ''}`}>
              {state === 'live' && <Radio size={12} />}
              {result ? RESULT_LABEL[result] : STATE_LABEL[state]}
            </span>
          </span>
          <span className="mmd-team">
            <TeamBadge logo={opponentLogo(match)} short={opponentShort(match)} className="xl" />
            <strong>{opponentName(match)}</strong>
          </span>
        </div>
        {state === 'upcoming' && date && <p className="mmd-countdown"><Timer size={14} /> تنطلق {countdown(date, now)}</p>}
      </section>

      {/* Status */}
      {statusButtons.length > 0 && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Flag size={16} /></span>حالة المباراة</h3>
          {rescheduling ? (
            <div className="mmd-reschedule">
              <input className="me-input" type="datetime-local" dir="ltr" value={newDate} onChange={e => setNewDate(e.target.value)} />
              <div className="mmd-reschedule-btns">
                <button type="button" className="me-btn" onClick={() => setRescheduling(false)}>رجوع</button>
                <button type="button" className="me-btn primary" disabled={!newDate} onClick={() => actions.reschedule(match, newDate)}>تأكيد</button>
              </div>
            </div>
          ) : (
            <div className="mmd-status-btns">
              {statusButtons.map(b => (
                <button key={b.key} type="button" className={`tone-${b.tone}`} onClick={b.onClick}>
                  <b.icon size={17} /> {b.label}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Facts */}
      <div className="mmd-facts">
        <div className="mmd-fact wide">
          <span><Calendar size={16} /></span>
          <small>موعد اللقاء</small>
          <strong>{longDateText(date)} · <bdi dir="ltr">{timeText(date)}</bdi></strong>
        </div>
        <div className="mmd-fact wide">
          <span><MapPin size={16} /></span>
          <small>الملعب والموقع</small>
          <strong>{match.location || '—'}</strong>
        </div>
        <div className="mmd-fact">
          <span><Clock size={16} /></span>
          <small>موعد التجمع</small>
          <strong dir="ltr">{gatheringTime(match.gathering_time)}</strong>
        </div>
        <div className="mmd-fact">
          <span><Users size={16} /></span>
          <small>مكان التجمع</small>
          <strong>{match.gathering_location || '—'}</strong>
        </div>
      </div>

      {/* Attendance */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Users size={16} /></span>{personal ? 'مشاركتي' : 'الحضور'}</h3>
        {personal ? (
          <MyMatchParticipation match={match} state={state} />
        ) : stats && stats.total > 0 ? (
          <div className="mmd-att">
            <div className="mmd-att-bar"><div style={{ width: `${rate}%` }} /></div>
            <div className="mmd-att-nums">
              <span><strong>{stats.present}</strong>/{stats.total} حاضرون</span>
              <span>{rate}%</span>
              {stats.absent > 0 && <span className="absent">{stats.absent} غائب</span>}
            </div>
          </div>
        ) : <p className="me-text empty">لم يُسجل الحضور بعد</p>}
      </section>

      {/* Actions */}
      {items.length > 0 && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Trophy size={16} /></span>إدارة المباراة</h3>
          <div className="mmd-actions">
            {items.map(i => (
              <button key={i.key} type="button" onClick={i.onClick}>
                <span><i.icon size={20} /></span>
                {i.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </MobileScreen>
  );
};
