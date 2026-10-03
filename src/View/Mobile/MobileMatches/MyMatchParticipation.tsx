import React from 'react';
import { UserCheck, UserMinus, Star, Goal, Square, Clock, UserX } from 'lucide-react';
import type { Match } from '../../Screen/Matches/match_model';
import type { MatchState } from './matchUtils';
import './MyMatchParticipation.css';

/** Personal space: am I called up (starter / substitute), my goals, cards and rating, and my absence record */
export const MyMatchParticipation: React.FC<{ match: Match; state: MatchState }> = ({ match, state }) => {
  const c = match.my_callup;
  const absence = (match.my_absence || '').trim();
  if (!c && !absence && state === 'cancelled') return null;
  const played = state === 'finished' || state === 'awaiting';

  return (
    <div className="mmp">
      <div className="mmp-chips">
        {c ? (
          <span className={`mmp-chip ${c.is_starter ? 'starter' : 'bench'}`}>
            <UserCheck size={13} /> {c.is_starter ? 'مستدعى · أساسي' : 'مستدعى · احتياط'}
          </span>
        ) : (
          <span className="mmp-chip muted">
            <UserMinus size={13} /> {played ? 'لم تُستدعَ لهذه المباراة' : 'لم تُستدعَ بعد'}
          </span>
        )}
        {absence && (
          <span className={`mmp-chip ${absence === 'متأخر' ? 'late' : 'absent'}`}>
            {absence === 'متأخر' ? <Clock size={13} /> : <UserX size={13} />} {absence}
          </span>
        )}
        {c && c.goals > 0 && <span className="mmp-chip goal"><Goal size={13} /> {c.goals === 1 ? 'هدف' : `${c.goals} أهداف`}</span>}
        {c && c.yellow_cards > 0 && <span className="mmp-chip yellow"><Square size={12} /> {c.yellow_cards > 1 ? `${c.yellow_cards} إنذارات` : 'إنذار'}</span>}
        {c && c.red_cards > 0 && <span className="mmp-chip red"><Square size={12} /> طرد</span>}
        {c && c.rating !== null && c.rating !== undefined && Number(c.rating) > 0 && (
          <span className="mmp-chip rating"><Star size={13} /> {Number(c.rating).toFixed(1)}</span>
        )}
      </div>
      {match.my_absence_note && <p className="mmp-note">{match.my_absence_note}</p>}
    </div>
  );
};
