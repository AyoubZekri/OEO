import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Save, Loader2, Star, Minus, Plus, AlertTriangle, Search } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { Applink } from '../../../LinkApi';
import type { Match } from '../../Screen/Matches/match_model';
import { authHeaders, errorMessage, loadCalledUp, nameOf, numberOf, playerIdOf } from './matchApi';
import { MatchStrip } from './MatchStrip';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- players come untyped from the API */

interface Stats {
  yellow_cards: number;
  yellow_card_minute: string;
  yellow_card_2_minute: string;
  red_cards: number;
  red_card_minute: string;
  red_card_type: string;
  rating: number | '';
}

const EMPTY: Stats = { yellow_cards: 0, yellow_card_minute: '', yellow_card_2_minute: '', red_cards: 0, red_card_minute: '', red_card_type: '', rating: '' };

const ratingTone = (r: number | '') => (r === '' ? '' : r >= 8 ? 'top' : r >= 6.5 ? 'good' : r >= 5 ? 'mid' : 'low');

// Phone "تقييم اللاعبين": rating and cards for each called-up player (same payload as MatchPlayerStatsDialog)
export const MobileMatchPlayerStats: React.FC<{ match: Match; onClose: () => void }> = ({ match, onClose }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<number, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    loadCalledUp(match.id)
      .then(list => {
        if (!active) return;
        setPlayers(list);
        const initial: Record<number, Stats> = {};
        list.forEach(p => {
          initial[playerIdOf(p)] = {
            yellow_cards: p.yellow_cards || 0,
            yellow_card_minute: p.yellow_card_minute || '',
            yellow_card_2_minute: p.yellow_card_2_minute || '',
            red_cards: p.red_cards || 0,
            red_card_minute: p.red_card_minute || '',
            red_card_type: p.red_card_type || '',
            rating: p.rating != null ? Number(p.rating) : '',
          };
        });
        setStats(initial);
      })
      .catch(err => console.error('Error:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const patch = (pid: number, changes: Partial<Stats>) =>
    setStats(prev => ({ ...prev, [pid]: { ...(prev[pid] || EMPTY), ...changes } }));

  const setRating = (pid: number, value: number | '') =>
    patch(pid, { rating: value === '' ? '' : Math.min(10, Math.max(0, Math.round(value * 10) / 10)) });

  // Same rules as the desktop dialog
  const setYellow = (pid: number, on: boolean) => {
    const cur = stats[pid] || EMPTY;
    patch(pid, { yellow_cards: on ? 1 : 0, yellow_card_minute: on ? cur.yellow_card_minute : '', yellow_card_2_minute: on ? cur.yellow_card_2_minute : '' });
  };
  const setRed = (pid: number, type: string) => {
    const cur = stats[pid] || EMPTY;
    patch(pid, {
      red_card_type: type,
      red_cards: type === '' ? 0 : 1,
      red_card_minute: type === '' ? '' : cur.red_card_minute,
      ...(type === 'second_yellow' ? { yellow_cards: 2 } : {}),
    });
  };
  const setRedMinute = (pid: number, value: string) => {
    const cur = stats[pid] || EMPTY;
    patch(pid, { red_card_minute: value, ...(cur.red_card_type === 'second_yellow' ? { yellow_card_2_minute: value } : {}) });
  };

  const save = async () => {
    setSaving(true);
    try {
      const playersData = Object.entries(stats).map(([id, s]) => ({
        player_id: parseInt(id),
        yellow_cards: s.yellow_cards,
        yellow_card_minute: s.yellow_card_minute || null,
        yellow_card_2_minute: s.yellow_card_2_minute || null,
        red_cards: s.red_cards,
        red_card_minute: s.red_card_minute || null,
        red_card_type: s.red_card_type || null,
        rating: s.rating === '' ? null : s.rating,
      }));
      const res = await axios.post(Applink.saveMatchCallupStats, { match_id: match.id, players: playersData }, { headers: authHeaders() });
      if (res.data.status === 'success') onClose();
    } catch (error) {
      alert(`حدث خطأ أثناء حفظ الإحصائيات\n${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const rated = Object.values(stats).map(s => s.rating).filter((r): r is number => r !== '');
  const avg = rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : '—';
  const best = players.reduce<any>((top, p) => {
    const r = stats[playerIdOf(p)]?.rating;
    return r !== '' && r != null && (!top || r > (stats[playerIdOf(top)]?.rating as number)) ? p : top;
  }, null);
  const yellows = Object.values(stats).filter(s => s.yellow_cards >= 1).length;
  const reds = Object.values(stats).filter(s => s.red_cards > 0).length;

  const q = query.trim().toLowerCase();
  const shown = players.filter(p => !q || nameOf(p.playerDetails).toLowerCase().includes(q) || String(numberOf(p.playerDetails)).includes(q));

  return (
    <MobileScreen
      title="تقييم اللاعبين"
      layer={2}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving || loading || players.length === 0}>
          {saving ? <Loader2 size={18} className="mp-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ التقييمات'}
        </button>
      )}
    >
      <MatchStrip match={match} label="إحصائيات وتقييم اللاعبين" icon={Activity}>
        <div className="mp-counts">
          <span><Star size={14} /> المعدل {avg}</span>
          <span><i className="mp-card-shape yellow" /> {yellows}</span>
          <span><i className="mp-card-shape red" /> {reds}</span>
        </div>
        {best && <span className="mp-sub"><Star size={13} /> الأفضل: {nameOf(best.playerDetails)} ({stats[playerIdOf(best)]?.rating})</span>}
      </MatchStrip>

      {loading ? (
        <MobileLoader text="جاري تحميل اللاعبين..." />
      ) : players.length === 0 ? (
        <div className="mp-empty"><AlertTriangle size={36} /><p>لم يتم العثور على لاعبين مستدعين لهذه المباراة.</p></div>
      ) : (
        <>
          <label className="mp-search">
            <Search size={17} />
            <input type="search" placeholder="ابحث بالاسم أو الرقم..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>

          {shown.map(p => {
            const pid = playerIdOf(p);
            const s = stats[pid] || EMPTY;
            return (
              <article key={pid} className={`mp-player ${s.red_cards > 0 ? 'sent-off' : ''}`}>
                <div className="mp-player-head">
                  <span className="mp-player-num">{numberOf(p.playerDetails) || '—'}</span>
                  <strong>{nameOf(p.playerDetails)}</strong>
                  <span className={`mp-rating ${ratingTone(s.rating)}`}>
                    <button type="button" onClick={() => setRating(pid, (s.rating === '' ? 6 : s.rating) + 0.5)} aria-label="رفع التقييم"><Plus size={14} /></button>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10}
                      step={0.1}
                      placeholder="-"
                      value={s.rating}
                      onChange={e => setRating(pid, e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <button type="button" onClick={() => setRating(pid, (s.rating === '' ? 6 : s.rating) - 0.5)} aria-label="خفض التقييم"><Minus size={14} /></button>
                  </span>
                </div>

                <div className="mp-cards-row">
                  <span className="mp-cards-label"><i className="mp-card-shape yellow" /> صفراء</span>
                  <div className="mp-seg small">
                    <button type="button" className={s.yellow_cards === 0 ? 'active' : ''} onClick={() => setYellow(pid, false)}>لا</button>
                    <button type="button" className={`yellow ${s.yellow_cards >= 1 ? 'active' : ''}`} onClick={() => setYellow(pid, true)}>نعم</button>
                  </div>
                </div>
                {s.yellow_cards >= 1 && (
                  <label className="mp-card-minute yellow">
                    <span>دقيقة البطاقة الصفراء</span>
                    <input className="mp-minute" type="number" inputMode="numeric" placeholder="د" value={s.yellow_card_minute}
                      onChange={e => patch(pid, { yellow_card_minute: e.target.value })} />
                  </label>
                )}

                <div className="mp-cards-row">
                  <span className="mp-cards-label"><i className="mp-card-shape red" /> حمراء</span>
                  <div className="mp-seg small">
                    <button type="button" className={s.red_card_type === '' ? 'active' : ''} onClick={() => setRed(pid, '')}>لا</button>
                    <button type="button" className={`red ${s.red_card_type === 'direct' ? 'active' : ''}`} onClick={() => setRed(pid, 'direct')}>مباشرة</button>
                    <button type="button" className={`red ${s.red_card_type === 'second_yellow' ? 'active' : ''}`} onClick={() => setRed(pid, 'second_yellow')}>إنذار 2</button>
                  </div>
                </div>
                {s.red_cards > 0 && (
                  <label className="mp-card-minute red">
                    <span>دقيقة البطاقة الحمراء</span>
                    <input className="mp-minute" type="number" inputMode="numeric" placeholder="د" value={s.red_card_minute}
                      onChange={e => setRedMinute(pid, e.target.value)} />
                  </label>
                )}
              </article>
            );
          })}
        </>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
