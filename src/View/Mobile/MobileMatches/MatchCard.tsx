import React from 'react';
import { Eye, Trophy, Calendar } from 'lucide-react';
import { MobileRowMenu } from '../widgets/MobileRowMenu';
import type { Match } from '../../Screen/Matches/match_model';
import { type MatchActions, matchActionItems, CLUB_NAME, CLUB_LOGO } from './matchActions';
import {
  type MatchState, matchDate, hasScore, resultOf, RESULT_LABEL, STATE_LABEL, opponentName, opponentLogo, opponentShort, dayText,
} from './matchUtils';
import { MobileMatchDetails } from './MobileMatchDetails';
import { TeamBadge } from './TeamBadge';
import { MyMatchParticipation } from './MyMatchParticipation';
import './MobileMatches.css';

interface MatchCardProps {
  match: Match;
  state: MatchState;
  actions: MatchActions;
  /** May the user do this action on the match */
  allowed: (action: string) => boolean;
  /** Opens the match's details */
  onOpen: () => void;
  /** Phone: the whole card opens the details; desktop: only "عرض التفاصيل" in its ⋮ menu */
  tapToOpen?: boolean;
  /** Personal space: my call-up and attendance under the board */
  personal?: boolean;
  id?: string;
  className?: string;
}

/** One match: competition and category, the ⋮ menu, both teams with the score or "VS", the day */
export const MatchCard: React.FC<MatchCardProps> = ({ match: m, state, actions, allowed, onOpen, tapToOpen = true, personal = false, id, className = '' }) => {
  const result = resultOf(m);
  const tap = tapToOpen ? {
    role: 'button',
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') onOpen(); },
  } : {};

  return (
    <article id={id} className={`mmt-card state-${state} ${tapToOpen ? '' : 'no-tap'} ${className}`} {...tap}>
      <div className="mmt-card-top">
        <span className="mmt-comp">
          <Trophy size={13} /> {m.competition || 'الدوري المحلي'}
          {m.team?.name && <em>{m.team.name}</em>}
        </span>
        <MobileRowMenu items={[
          { key: 'details', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: onOpen },
          ...matchActionItems(m, state, actions, allowed),
        ]} label="إجراءات المباراة" />
      </div>

      <div className="mmt-board">
        <span className="mmt-team">
          <TeamBadge logo={CLUB_LOGO} short="OL" />
          <small>{CLUB_NAME}</small>
        </span>
        <span className="mmt-center">
          {/* The score, or "VS": the kick-off time and the stadium are in the details */}
          {hasScore(m)
            ? <strong className="mmt-score" dir="ltr">{m.opponent_score} - {m.team_score}</strong>
            : <strong className="mmt-vs">VS</strong>}
          <span className={`mmt-state ${result ? `result-${result}` : ''}`}>
            {state === 'live' && <i />}
            {result ? RESULT_LABEL[result] : STATE_LABEL[state]}
          </span>
        </span>
        <span className="mmt-team">
          <TeamBadge logo={opponentLogo(m)} short={opponentShort(m)} />
          <small>{opponentName(m)}</small>
        </span>
      </div>

      <div className="mmt-meta">
        <span><Calendar size={13} /> {dayText(matchDate(m))}</span>
      </div>
      {personal && <MyMatchParticipation match={m} state={state} />}
    </article>
  );
};

/**
 * Desktop: a match's details (the phone's details page) in a window in the middle of the screen,
 * under the dialogs it opens (call-ups, line-up, result…)
 */
export const MatchDetailsWindow: React.FC<{
  match: Match; state: MatchState; now: Date; actions: MatchActions; personal?: boolean; onClose: () => void;
}> = ({ match, state, now, actions, personal = false, onClose }) => (
  <div className="mmt-desk-modal" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <MobileMatchDetails match={match} state={state} now={now} actions={actions} personal={personal} onClose={onClose} />
  </div>
);
