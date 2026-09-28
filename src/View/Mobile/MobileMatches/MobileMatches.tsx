import React, { useEffect, useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Plus, Search, Eye, Clock, MapPin, Radio, Trophy, Calendar } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { Match } from '../../Screen/Matches/match_model';
import { type MatchActions, matchActionItems, CLUB_NAME, CLUB_LOGO } from './matchActions';
import {
  type MatchState, matchState, matchDate, hasScore, resultOf, RESULT_LABEL, STATE_LABEL, opponentName, opponentLogo,
  opponentShort, timeText, dayText, countdown,
} from './matchUtils';
import { MobileMatchDetails } from './MobileMatchDetails';
import { TeamBadge } from './TeamBadge';
import './MobileMatches.css';

interface MobileMatchesProps {
  matches: Match[];
  isLoading: boolean;
  actions: MatchActions;
}

type Tab = 'upcoming' | 'played';

// Refreshes "now" every minute so live and countdown states stay right
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

// Phone version of the matches page
export const MobileMatches: React.FC<MobileMatchesProps> = ({ matches, isLoading, actions }) => {
  const can = useCan();
  const now = useNow();
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

  const scoreOrTime = (m: Match, state: MatchState) => {
    if (hasScore(m)) return <strong className="mmt-score" dir="ltr">{m.opponent_score} - {m.team_score}</strong>;
    if (state === 'cancelled' || state === 'postponed') return <strong className="mmt-vs">VS</strong>;
    return <strong className="mmt-time" dir="ltr">{timeText(matchDate(m))}</strong>;
  };

  return (
    <div className="mmt-page">
      <MobileAppBar title="المباريات" />

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
                    <strong dir="ltr">{timeText(matchDate(featured.m))}</strong>
                    <small>{dayText(matchDate(featured.m))}</small>
                  </span>
                  <span className="mmt-hero-team">
                    <TeamBadge logo={opponentLogo(featured.m)} short={opponentShort(featured.m)} className="big" />
                    <small>{opponentName(featured.m)}</small>
                  </span>
                </span>
                <span className="mmt-hero-meta">
                  <span><Trophy size={13} /> {featured.m.competition || 'الدوري المحلي'}</span>
                  {featured.m.location && <span><MapPin size={13} /> {featured.m.location}</span>}
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
              {!q && tab === 'upcoming' && <p>أضف مباراة جديدة بالزر +</p>}
            </div>
          ) : (
            <div className="mmt-list">
              {list.map(({ m, state }) => {
                const date = matchDate(m);
                const result = resultOf(m);
                const open = () => setDetailsId(m.id);
                return (
                  <article
                    key={m.id}
                    className={`mmt-card state-${state}`}
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={e => { if (e.key === 'Enter') open(); }}
                  >
                    <div className="mmt-card-top">
                      <span className="mmt-comp">
                        <Trophy size={13} /> {m.competition || 'الدوري المحلي'}
                        {m.team?.name && <em>{m.team.name}</em>}
                      </span>
                      <MobileRowMenu items={[
                        { key: 'details', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: open },
                        ...matchActionItems(m, state, actions, action => can('matches', action)),
                      ]} label="إجراءات المباراة" />
                    </div>

                    <div className="mmt-board">
                      <span className="mmt-team">
                        <TeamBadge logo={CLUB_LOGO} short="OL" />
                        <small>{CLUB_NAME}</small>
                      </span>
                      <span className="mmt-center">
                        {scoreOrTime(m, state)}
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
                      <span><Calendar size={13} /> {dayText(date)}</span>
                      {m.location && <span><MapPin size={13} /> {m.location}</span>}
                    </div>
                  </article>
                );
              })}
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
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  );
};
