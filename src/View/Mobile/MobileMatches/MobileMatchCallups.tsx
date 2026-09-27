import React, { useState } from 'react';
import { Check, Save, Loader2, Search, Stethoscope, HeartPulse, CheckCheck, X, Users, UserCheck } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { Applink } from '../../../LinkApi';
import type { Match } from '../../Screen/Matches/match_model';
import { useMatchCallups } from '../../Screen/Matches/useMatchCallups';
import { POSITION_LABELS } from '../MobileMembers/memberLabels';
import { LINES, playersText } from '../MobileTeams/teamRoster';
import { CLUB_LOGO } from './matchActions';
import { matchDate, opponentName, opponentLogo, opponentShort, timeText, dayText } from './matchUtils';
import { TeamBadge } from './TeamBadge';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileMatchCallups.css';

type Filter = 'all' | 'called' | 'free' | 'injured';

/* eslint-disable @typescript-eslint/no-explicit-any -- players come untyped from /individuals */
const photoOf = (p: any) => {
  const photo: string | undefined = p.photo;
  if (!photo || photo.includes('default') || photo.includes('ui-avatars')) return null;
  return photo.startsWith('http') ? photo : `${Applink.image}/${photo.replace(/^\//, '')}`;
};
const numberOf = (p: any) => p.shirt_number || p.Shirt_number || '';
const nameOf = (p: any) => `${p.first_name || ''} ${p.last_name || ''}`.trim();

// Phone call-up list of a match: players grouped by line, one tap to call up
export const MobileMatchCallups: React.FC<{ match: Match; onClose: () => void }> = ({ match, onClose }) => {
  const c = useMatchCallups(true, match, onClose);
  const [filter, setFilter] = useState<Filter>('all');

  const called = (p: any) => !!c.selectedPlayers[p.id];
  const calledCount = Object.keys(c.selectedPlayers).length;
  const available = c.players.filter(p => p.medicalState !== 'injured').length;
  const injured = c.players.length - available;

  const shown = c.filteredPlayers.filter(p =>
    filter === 'all' ? true
      : filter === 'called' ? called(p)
        : filter === 'free' ? !called(p) && p.medicalState !== 'injured'
          : p.medicalState === 'injured');

  // By line, like a team sheet; unknown positions last
  const allPositions = LINES.flatMap(l => l.positions);
  const groups = [
    ...LINES.map(l => ({ key: l.key, title: l.title, items: shown.filter(p => l.positions.includes(p.position)) })),
    { key: 'other', title: 'بدون مركز', items: shown.filter(p => !allPositions.includes(p.position)) },
  ].filter(g => g.items.length);

  const filters: [Filter, string, number][] = [
    ['all', 'الكل', c.players.length],
    ['called', 'المستدعون', calledCount],
    ['free', 'غير مستدعين', available - calledCount],
    ['injured', 'مصابون', injured],
  ];

  const date = matchDate(match);

  return (
    <MobileScreen
      title="الاستدعاء"
      layer={2}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={() => c.handleSubmit()} disabled={c.isSubmitting || c.isLoading}>
          {c.isSubmitting ? <Loader2 size={18} className="mmc-spin" /> : <Save size={18} />}
          {c.isSubmitting ? 'جاري الحفظ...' : `تأكيد الاستدعاء (${calledCount})`}
        </button>
      )}
    >
      {/* Match + count */}
      <section className="mmc-hero">
        <div className="mmc-hero-match">
          <TeamBadge logo={CLUB_LOGO} short="OL" />
          <span className="mmc-hero-text">
            <small>ضد</small>
            <strong>{opponentName(match)}</strong>
            <span>{dayText(date)} · <bdi dir="ltr">{timeText(date)}</bdi></span>
          </span>
          <TeamBadge logo={opponentLogo(match)} short={opponentShort(match)} />
        </div>

        <div className="mmc-count">
          <div className="mmc-count-num">
            <strong>{calledCount}</strong>
            <small>مستدعى من {available} متاح</small>
          </div>
          <div className="mmc-count-bar"><div style={{ width: `${available ? (calledCount / available) * 100 : 0}%` }} /></div>
          {injured > 0 && <p><Stethoscope size={13} /> {playersText(injured)} {injured === 1 ? 'مصاب غير متاح' : 'مصابين غير متاحين'}</p>}
        </div>
      </section>

      <div className="mmc-toolbar">
        <label className="mmc-search">
          <Search size={17} />
          <input type="search" placeholder="ابحث بالاسم أو رقم القميص..." value={c.searchQuery} onChange={e => c.setSearchQuery(e.target.value)} />
        </label>
        <button
          type="button"
          className="mmc-all"
          onClick={calledCount >= available ? c.clearAll : c.selectAllAvailable}
          disabled={c.isLoading || !c.players.length}
        >
          {calledCount >= available && available > 0 ? <><X size={16} /> إلغاء الكل</> : <><CheckCheck size={16} /> الكل</>}
        </button>
      </div>

      <div className="mmc-filters">
        {filters.map(([key, label, count]) => (
          <button key={key} type="button" className={`f-${key} ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {c.isLoading ? (
        <MobileLoader text="جاري تحميل قائمة اللاعبين..." />
      ) : groups.length === 0 ? (
        <div className="mmc-empty">
          <Users size={40} />
          <p>لم يتم العثور على لاعبين</p>
        </div>
      ) : groups.map(g => (
        <section key={g.key} className="mmc-group">
          <h3>
            {g.title}
            <span>{g.items.filter(called).length}/{g.items.length}</span>
          </h3>
          <div className="mmc-list">
            {g.items.map(p => {
              const isCalled = called(p);
              const injuredNow = p.medicalState === 'injured';
              const photo = photoOf(p);
              return (
                <div key={p.id} className={`mmc-player ${isCalled ? 'called' : ''} ${injuredNow ? 'injured' : ''} ${p.medicalState === 'treatment' ? 'treatment' : ''}`}>
                  <button
                    type="button"
                    className="mmc-player-main"
                    onClick={() => c.handleTogglePlayer(p)}
                    disabled={injuredNow}
                    aria-pressed={isCalled}
                  >
                    <span className="mmc-avatar">
                      {photo ? <img src={photo} alt="" /> : <span>{numberOf(p) || '—'}</span>}
                      {photo && numberOf(p) && <em>{numberOf(p)}</em>}
                    </span>
                    <span className="mmc-player-text">
                      <strong>{nameOf(p)}</strong>
                      <small>
                        {POSITION_LABELS[p.position] || p.position || 'لاعب'}
                        {injuredNow && <b className="tag red"><Stethoscope size={11} /> مصاب</b>}
                        {p.medicalState === 'treatment' && <b className="tag amber"><HeartPulse size={11} /> مرحلة علاج</b>}
                      </small>
                    </span>
                    <span className="mmc-check">{isCalled ? <Check size={16} strokeWidth={3} /> : injuredNow ? <X size={14} /> : null}</span>
                  </button>

                  {isCalled && (
                    p.medicalState === 'treatment' ? (
                      <p className="mmc-doctor"><b>توصية الطبيب:</b> {c.selectedPlayers[p.id].notes}</p>
                    ) : (
                      <input
                        className="mmc-note"
                        type="text"
                        placeholder="ملاحظة (اختياري)..."
                        value={c.selectedPlayers[p.id].notes}
                        onChange={e => c.handleNoteChange(p.id, e.target.value)}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!c.isLoading && calledCount > 0 && filter !== 'called' && (
        <button type="button" className="mmc-review" onClick={() => setFilter('called')}>
          <UserCheck size={16} /> مراجعة المستدعين ({calledCount})
        </button>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
