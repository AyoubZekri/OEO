import React from 'react';
import type { Match } from '../../Screen/Matches/match_model';
import { CLUB_LOGO, CLUB_NAME } from './matchActions';
import { hasScore, matchDate, opponentLogo, opponentName, opponentShort, resultOf, RESULT_LABEL, timeText, dayText } from './matchUtils';
import { TeamBadge } from './TeamBadge';
import './MobileMatchPages.css';

/** Score board at the top of the match pages (report, events, result, ratings) */
export const MatchStrip: React.FC<{ match: Match; label: string; icon: React.ComponentType<{ size?: number }>; children?: React.ReactNode }> = ({
  match, label, icon: Icon, children,
}) => {
  const date = matchDate(match);
  const result = resultOf(match);
  return (
    <section className="mp-hero">
      <span className="mp-tag"><Icon size={13} /> {label}</span>
      <div className="mp-board">
        <span className="mp-team">
          <TeamBadge logo={CLUB_LOGO} short="OL" className="big" />
          <small>{CLUB_NAME}</small>
        </span>
        <span className="mp-center">
          {/* Our club is on the right: in this left-to-right score its goals come last */}
          {hasScore(match)
            ? <strong dir="ltr">{match.opponent_score} - {match.team_score}</strong>
            : <strong dir="ltr">{timeText(date)}</strong>}
          <small className={result ? `result-${result}` : ''}>{result ? RESULT_LABEL[result] : dayText(date)}</small>
        </span>
        <span className="mp-team">
          <TeamBadge logo={opponentLogo(match)} short={opponentShort(match)} className="big" />
          <small>{opponentName(match)}</small>
        </span>
      </div>
      {children}
    </section>
  );
};
