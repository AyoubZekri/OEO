import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Plus, Search, Clock, Radio, Trophy, Calendar } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { Match } from '../../Screen/Matches/match_model';
import { type MatchActions, CLUB_NAME, CLUB_LOGO } from './matchActions';
import {
  matchState, matchDate, resultOf, opponentName, opponentLogo,
  opponentShort, dayText, countdown,
} from './matchUtils';
import { MobileMatchDetails } from './MobileMatchDetails';
import { MatchCard } from './MatchCard';
import { useMatchNow } from './useMatchNow';
import { TeamBadge } from './TeamBadge';
import './MobileMatches.css';

interface MobileMatchesProps {
  matches: Match[];
  isLoading: boolean;
  actions: MatchActions;
  /** Personal space: the matches of my category, read only, with my participation */
  personal?: boolean;
}

type Tab = 'upcoming' | 'played';

// Phone version of the matches page
export const MobileMatches: React.FC<MobileMatchesProps> = ({ matches, isLoading, actions, personal = false }) => {
  const allowed = useCan();
  const can: typeof allowed = (...args) => !personal && allowed(...args);
  const now = useMatchNow();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [query, setQuery] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('match');

  const time = (m: Match) => matchDate(m)?.getTime() ?? 0;
  const withState = matches.map(m => ({ m, state: matchState(m, now) }));
  const upcoming = withState
    .filter(x => x.state === 'upcoming' || x.state === 'live' || x.state === 'postponed')
    .sort((a, b) => (a.state === 'live' ? -1 : 0) - (b.state === 'live' ? -1 : 0) || time(a.m) - time(b.m));
  const played = withState
    .filter(x => x.state === 'finished' || x.state === 'awaiting' || x.state === 'cancelled')
    .sort((a, b) => time(b.m) - time(a.m));

  const q = query.trim().toLowerCase();
  const list = (tab === 'upcoming' ? upcoming : played)
    .filter(({ m }) => !q || opponentName(m).toLowerCase().includes(q) || (m.competition || '').toLowerCase().includes(q));

  const featured = upcoming.find(x => x.state === 'live') || upcoming.find(x => x.state === 'upcoming');
  const results = matches.map(resultOf);
  const wins = results.filter(r => r === 'win').length;
  const draws = results.filter(r => r === 'draw').length;
  const losses = results.filter(r => r === 'loss').length;

  const details = detailsId !== null ? withState.find(x => String(x.m.id) === detailsId) : undefined;


  return (
    <div className="mmt-page">
      <MobileAppBar title={personal ? 'مباريات' : 'المباريات'} />

      {isLoading ? (
        <MobileLoader text="جاري تحميل المباريات..." />
      ) : (
        <>
          {/* Next / live match */}
          <section className={`mmt-hero ${featured?.state === 'live' ? 'live' : ''}`}>
            {featured ? (
              <button type="button" className="mmt-hero-main" onClick={() => setDetailsId(featured.m.id)}>
                <span className="mmt-hero-tag">
                  {featured.state === 'live'
                    ? <><Radio size={14} /> مباراة جارية</>
                    : <><Clock size={14} /> المباراة القادمة · {countdown(matchDate(featured.m), now)}</>}
                </span>
                <span className="mmt-hero-board">
                  <span className="mmt-hero-team">
                    <TeamBadge logo={CLUB_LOGO} short="OL" className="big" />
                    <small>{CLUB_NAME}</small>
                  </span>
                  <span className="mmt-hero-center">
                    <strong>VS</strong>
                    <small>{dayText(matchDate(featured.m))}</small>
                  </span>
                  <span className="mmt-hero-team">
                    <TeamBadge logo={opponentLogo(featured.m)} short={opponentShort(featured.m)} className="big" />
                    <small>{opponentName(featured.m)}</small>
                  </span>
                </span>
                <span className="mmt-hero-meta">
                  <span><Trophy size={13} /> {featured.m.competition || 'الدوري المحلي'}</span>
                </span>
              </button>
            ) : (
              <p className="mmt-hero-empty"><Calendar size={22} /> لا توجد مباراة قادمة مبرمجة</p>
            )}

            <div className="mmt-stats">
              <div><strong>{wins + draws + losses}</strong><small>لُعبت</small></div>
              <div className="win"><strong>{wins}</strong><small>فوز</small></div>
              <div className="draw"><strong>{draws}</strong><small>تعادل</small></div>
              <div className="loss"><strong>{losses}</strong><small>خسارة</small></div>
            </div>
          </section>

          <label className="mmt-search">
            <Search size={17} />
            <input type="search" placeholder="ابحث بالفريق المنافس أو المنافسة..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>

          <div className="mmt-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>
              القادمة <span>{upcoming.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'played'} className={tab === 'played' ? 'active' : ''} onClick={() => setTab('played')}>
              المنتهية <span>{played.length}</span>
            </button>
          </div>

          {list.length === 0 ? (
            <div className="mmt-empty">
              <span className="mmt-empty-icon"><Trophy size={36} /></span>
              <strong>{q ? 'لا توجد نتائج للبحث' : tab === 'upcoming' ? 'لا توجد مباريات قادمة' : 'لا توجد مباريات منتهية'}</strong>
              {!q && tab === 'upcoming' && <p>{personal ? 'ستظهر هنا مباريات فئتك عند برمجتها.' : 'أضف مباراة جديدة بالزر +'}</p>}
            </div>
          ) : (
            <div className="mmt-list">
              {list.map(({ m, state }) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  state={state}
                  actions={actions}
                  allowed={action => can('matches', action)}
                  onOpen={() => setDetailsId(m.id)}
                  personal={personal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {can('matches', 'add') && (
        <button type="button" className="mmt-fab" onClick={actions.add} aria-label="إضافة مباراة" title="إضافة مباراة">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileMatchDetails
          match={details.m}
          state={details.state}
          now={now}
          actions={actions}
          personal={personal}
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  );
};
