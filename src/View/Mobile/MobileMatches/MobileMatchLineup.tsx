import React from 'react';
import { Shirt, Users, LayoutGrid, Hand, UserPlus } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import type { Match } from '../../Screen/Matches/match_model';
import { FootballPitch } from '../../Screen/Matches/Lineup/FootballPitch';
import { useMatchLineup } from '../../Screen/Matches/useMatchLineup';
import { CLUB_LOGO } from './matchActions';
import { matchDate, opponentName, opponentLogo, opponentShort, timeText, dayText } from './matchUtils';
import { TeamBadge } from './TeamBadge';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileMatchLineup.css';

interface MobileMatchLineupProps {
  match: Match;
  /** Opens the call-up page, offered when nobody is called up yet */
  onOpenCallups?: () => void;
  onClose: () => void;
}

// Phone line-up page: match summary, saved counts, then the shared football pitch
export const MobileMatchLineup: React.FC<MobileMatchLineupProps> = ({ match, onOpenCallups, onClose }) => {
  const l = useMatchLineup(true, match);
  const starters = l.pitchCallups.filter(p => p.is_starter).length;
  const bench = l.pitchCallups.length - starters;
  const date = matchDate(match);
  const loaded = !l.isLoading || l.calledUpPlayers.length > 0;

  return (
    <MobileScreen title="التشكيلة" layer={2} onBack={onClose}>
      <section className="mml-hero">
        <div className="mml-hero-match">
          <TeamBadge logo={CLUB_LOGO} short="OL" />
          <span className="mml-hero-text">
            <small>ضد</small>
            <strong>{opponentName(match)}</strong>
            <span>{dayText(date)} · <bdi dir="ltr">{timeText(date)}</bdi></span>
          </span>
          <TeamBadge logo={opponentLogo(match)} short={opponentShort(match)} />
        </div>

        <div className="mml-stats">
          <div>
            <span><LayoutGrid size={15} /></span>
            <strong dir="ltr">{match.formation || '4-3-3'}</strong>
            <small>الخطة</small>
          </div>
          <div className={starters === 11 ? 'full' : ''}>
            <span><Shirt size={15} /></span>
            <strong><bdi dir="ltr">{starters}/11</bdi></strong>
            <small>الأساسيون</small>
          </div>
          <div>
            <span><Users size={15} /></span>
            <strong>{bench}</strong>
            <small>البدلاء</small>
          </div>
        </div>
      </section>

      {!loaded ? (
        <MobileLoader text="جاري تحميل التشكيلة..." />
      ) : l.calledUpPlayers.length === 0 ? (
        <div className="mml-empty">
          <span className="mml-empty-icon"><Users size={34} /></span>
          <strong>لم يُستدعَ أي لاعب بعد</strong>
          <p>استدعِ اللاعبين أولاً ثم رتّب التشكيلة على الملعب.</p>
          {onOpenCallups && (
            <button type="button" className="me-btn primary" onClick={onOpenCallups}>
              <UserPlus size={18} /> الذهاب إلى الاستدعاء
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mml-tip">
            <Hand size={16} /> اضغط على مركز في الملعب لاختيار لاعب، أو اسحب اللاعب من البدلاء إلى مركزه، ثم احفظ.
          </p>
          <div className="mml-pitch">
            <FootballPitch
              callups={l.pitchCallups}
              initialFormation={match.formation || '4-3-3'}
              initialPlacements={l.initialPlacements}
              initialCustomPositions={l.initialCustomPositions}
              goals={l.goals}
              onSave={l.saveLineup}
              isLoading={l.isLoading}
            />
          </div>
        </>
      )}
    </MobileScreen>
  );
};
