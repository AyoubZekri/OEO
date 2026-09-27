import React, { useEffect, useState } from 'react';
import { Activity, ArrowLeftRight, ListOrdered, LayoutGrid } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import type { Match } from '../../Screen/Matches/match_model';
import { FootballPitch } from '../../Screen/Matches/Lineup/FootballPitch';
import { FORMATIONS } from '../../Screen/Matches/Lineup/FormationConfig';
import { loadMatchEvents, nameOf } from './matchApi';
import { MatchStrip } from './MatchStrip';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileMatchLineup.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- events come untyped from the API */

type EventType = 'goal' | 'substitution' | 'yellow_card' | 'red_card' | 'second_yellow';

interface TimelineEvent {
  id: string;
  minute: number;
  type: EventType;
  main: string;
  sub?: string;
}

// Same events as the desktop MatchTimelineDialog: goals, substitutions and cards, by minute
const buildEvents = (goals: any[], callups: any[]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  goals.forEach(g => events.push({
    id: `goal-${g.id}`,
    minute: Number(g.minute),
    type: 'goal',
    main: `${g.scorer_first_name || ''} ${g.scorer_last_name || ''}`.trim(),
    sub: g.assist_id ? `صناعة ${g.assist_first_name || ''} ${g.assist_last_name || ''}`.trim() : undefined,
  }));
  callups.forEach(c => {
    const player = c.individual ? nameOf(c.individual) : 'غير معروف';
    if (c.subbed_out_minute && c.replaced_by) {
      events.push({ id: `sub-${c.id}`, minute: Number(c.subbed_out_minute), type: 'substitution', main: nameOf(c.replaced_by), sub: player });
    }
    if (c.yellow_cards >= 1 && c.yellow_card_minute) {
      events.push({ id: `yellow-${c.id}`, minute: Number(c.yellow_card_minute), type: 'yellow_card', main: player, sub: 'بطاقة صفراء' });
    }
    if (c.red_cards >= 1 && c.red_card_minute) {
      const second = c.red_card_type === 'second_yellow';
      events.push({
        id: `red-${c.id}`, minute: Number(c.red_card_minute), type: second ? 'second_yellow' : 'red_card',
        main: player, sub: second ? 'إنذار ثاني (طرد)' : 'بطاقة حمراء مباشرة',
      });
    }
  });
  return events.sort((a, b) => a.minute - b.minute);
};

const EventIcon: React.FC<{ type: EventType }> = ({ type }) => {
  if (type === 'goal') return <span className="mp-ev-ball">⚽</span>;
  if (type === 'substitution') return <ArrowLeftRight size={16} />;
  if (type === 'second_yellow') return <span className="mp-card-pair"><i className="yellow" /><i className="red" /></span>;
  return <i className={`mp-card-shape ${type === 'yellow_card' ? 'yellow' : 'red'}`} />;
};

// Phone "أحداث المباراة": summary counts, timeline by minute, and the read-only line-up
export const MobileMatchTimeline: React.FC<{ match: Match; onClose: () => void }> = ({ match, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [callups, setCallups] = useState<any[]>([]);
  const [tab, setTab] = useState<'events' | 'pitch'>('events');

  useEffect(() => {
    let active = true;
    loadMatchEvents(match.id)
      .then(data => { if (active) { setGoals(data.goals); setCallups(data.callups); } })
      .catch(err => console.error('Error fetching match events:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const events = buildEvents(goals, callups);
  const count = (t: EventType[]) => events.filter(e => t.includes(e.type)).length;

  // Line-up placements from saved positions (same as the desktop dialog)
  const placements: Record<string, number> = {};
  const custom: Record<string, { x: number; y: number }> = {};
  const formation = FORMATIONS[match.formation || '4-3-3'] || FORMATIONS['4-3-3'];
  if (formation) {
    const spots = [...formation.positions];
    callups.filter(c => (c.is_starter == 1 || c.is_starter === true) && c.position_x != null && c.position_y != null)
      .forEach(c => {
        const px = parseFloat(c.position_x);
        const py = parseFloat(c.position_y);
        let best: any = null;
        let min = Infinity;
        spots.forEach(s => {
          const d = Math.hypot(s.x - px, s.y - py);
          if (d < min) { min = d; best = s; }
        });
        if (best) {
          placements[best.id] = c.player_id;
          if (Math.abs(best.x - px) > 0.1 || Math.abs(best.y - py) > 0.1) custom[best.id] = { x: px, y: py };
          spots.splice(spots.indexOf(best), 1);
        }
      });
  }

  const pitchCallups = callups.map(c => ({
    player_id: c.player_id,
    name: c.individual ? nameOf(c.individual) : 'غير معروف',
    photo: c.individual?.photo,
    is_starter: c.is_starter == 1 || c.is_starter === true,
    subbed_out_minute: c.subbed_out_minute,
    replaced_by_id: c.replaced_by_id,
    subbed_in_minute: c.subbed_in_minute,
    player: c.individual,
    rating: c.rating != null ? Number(c.rating) : null,
    yellow_cards: c.yellow_cards || 0,
    red_cards: c.red_cards || 0,
    red_card_type: c.red_card_type || null,
  }));

  // A half-time divider before the first event after minute 45
  const firstSecondHalf = events.findIndex(e => e.minute > 45);

  return (
    <MobileScreen title="أحداث المباراة" layer={2} onBack={onClose}>
      <MatchStrip match={match} label="أحداث المباراة" icon={Activity}>
        <div className="mp-counts">
          <span><b className="mp-ev-ball">⚽</b> {count(['goal'])}</span>
          <span><ArrowLeftRight size={14} /> {count(['substitution'])}</span>
          <span><i className="mp-card-shape yellow" /> {count(['yellow_card'])}</span>
          <span><i className="mp-card-shape red" /> {count(['red_card', 'second_yellow'])}</span>
        </div>
      </MatchStrip>

      <div className="mp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'events'} className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>
          <ListOrdered size={16} /> المجريات
        </button>
        <button type="button" role="tab" aria-selected={tab === 'pitch'} className={tab === 'pitch' ? 'active' : ''} onClick={() => setTab('pitch')}>
          <LayoutGrid size={16} /> التشكيلة
        </button>
      </div>

      {loading ? (
        <MobileLoader text="جاري تحميل الأحداث..." />
      ) : tab === 'events' ? (
        events.length === 0 ? (
          <div className="mp-empty"><Activity size={36} /><p>لا توجد أحداث مسجلة لهذه المباراة</p></div>
        ) : (
          <ol className="mp-timeline">
            <li className="mp-divider"><span>انطلاق المباراة</span></li>
            {events.map((ev, i) => (
              <React.Fragment key={ev.id}>
                {i === firstSecondHalf && <li className="mp-divider"><span>الشوط الثاني</span></li>}
                <li className={`mp-ev ev-${ev.type}`}>
                  <span className="mp-ev-minute" dir="ltr">{ev.minute}'</span>
                  <span className="mp-ev-dot"><EventIcon type={ev.type} /></span>
                  <span className="mp-ev-text">
                    {ev.type === 'substitution' ? (
                      <>
                        <strong className="in">↑ {ev.main}</strong>
                        <small className="out">↓ {ev.sub}</small>
                      </>
                    ) : (
                      <>
                        <strong>{ev.main}</strong>
                        {ev.sub && <small>{ev.sub}</small>}
                      </>
                    )}
                  </span>
                </li>
              </React.Fragment>
            ))}
            <li className="mp-divider"><span>نهاية المباراة</span></li>
          </ol>
        )
      ) : callups.length === 0 ? (
        <div className="mp-empty"><LayoutGrid size={36} /><p>لا توجد تشكيلة مسجلة</p></div>
      ) : (
        <div className="mml-pitch">
          <FootballPitch
            callups={pitchCallups}
            initialFormation={match.formation || '4-3-3'}
            initialPlacements={placements}
            initialCustomPositions={custom}
            readOnly
            goals={goals}
            showSubstitutionsSection
          />
        </div>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
