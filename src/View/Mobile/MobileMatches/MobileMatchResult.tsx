import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle, Loader2, Minus, Plus, Trash2, ArrowLeftRight, Timer, CalendarClock, Flag, ChevronDown, UserRound,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect, type MobileSelectOption } from '../widgets/MobileSelect';
import { Applink } from '../../../LinkApi';
import type { Match } from '../../Screen/Matches/match_model';
import { CLUB_NAME } from './matchActions';
import { authHeaders, errorMessage, loadCalledUp, loadMatchEvents, nameOf } from './matchApi';
import { opponentName } from './matchUtils';
import { MatchStrip } from './MatchStrip';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- players and events come untyped from the API */

interface GoalRow { id: number; scorer_id: string; assist_id: string; minute: string }
interface SubRow { id: number; player_out_id: string; player_in_id: string; minute: string }

interface MobileMatchResultProps {
  match: Match;
  onSave: () => void;
  onClose: () => void;
}

const blankGoal = (i: number): GoalRow => ({ id: Date.now() + i, scorer_id: '', assist_id: '', minute: '' });

// Phone "النتيجة والأحداث" (same payload as the desktop SetMatchResultDialog)
export const MobileMatchResult: React.FC<MobileMatchResultProps> = ({ match, onSave, onClose }) => {
  const initialScore = match.team_score != null ? String(match.team_score) : '';
  const [status, setStatus] = useState(match.match_status === 'مؤجلة' ? 'مؤجلة' : '');
  const [newDate, setNewDate] = useState(match.match_status === 'مؤجلة' && match.match_date ? match.match_date.replace(' ', 'T').substring(0, 16) : '');
  const [duration, setDuration] = useState(match.match_duration ? String(match.match_duration) : '90');
  const [teamScore, setTeamScore] = useState(initialScore);
  const [oppScore, setOppScore] = useState(match.opponent_score != null ? String(match.opponent_score) : '');
  const [goals, setGoals] = useState<GoalRow[]>(() => Array.from({ length: Number(initialScore) || 0 }, (_, i) => blankGoal(i)));
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadCalledUp(match.id, true).then(list => { if (active) setPlayers(list); }).catch(() => {});
    loadMatchEvents(match.id).then(({ goals: g, callups }) => {
      if (!active) return;
      const mappedGoals = g.map((x: any) => ({
        id: x.id, scorer_id: x.scorer_id?.toString() || '', assist_id: x.assist_id?.toString() || '', minute: x.minute?.toString() || '',
      }));
      if (mappedGoals.length) setGoals(mappedGoals);
      const mappedSubs = callups.filter((c: any) => c.subbed_out_minute && c.replaced_by_id).map((c: any) => ({
        id: c.id,
        player_out_id: c.player_id?.toString() || c.individual_id?.toString() || '',
        player_in_id: c.replaced_by_id?.toString() || '',
        minute: c.subbed_out_minute?.toString() || '',
      }));
      if (mappedSubs.length) setSubs(mappedSubs);
    }).catch(err => console.error('Error fetching match events:', err));
    return () => { active = false; };
  }, [match.id]);

  // One goal row per goal of our team, added or removed with the score
  const changeTeamScore = (value: string) => {
    setTeamScore(value);
    const n = Math.max(0, parseInt(value) || 0);
    setGoals(prev => (prev.length < n
      ? [...prev, ...Array.from({ length: n - prev.length }, (_, i) => blankGoal(prev.length + i))]
      : prev.slice(0, n)));
  };
  const step = (value: string, delta: number) => String(Math.max(0, (parseInt(value) || 0) + delta));

  const optionOf = (p: any): MobileSelectOption => ({ value: p.playerDetails?.id?.toString() || '', label: nameOf(p.playerDetails) });
  const isStarter = (p: any) => p.is_starter == 1 || p.is_starter === true;
  const hasStarters = players.some(isStarter);
  const onPitch = () => {
    if (!hasStarters) return players;
    const subbedIn = subs.map(s => s.player_in_id).filter(Boolean);
    return players.filter(p => isStarter(p) || subbedIn.includes(p.playerDetails?.id?.toString()));
  };
  const onPitchOptions = onPitch().map(optionOf);
  const benchOptions = (hasStarters ? players.filter(p => !isStarter(p)) : players).map(optionOf);
  const labelOf = (id: string) => players.map(optionOf).find(o => o.value === id)?.label;

  const playerPick = (label: string, value: string, options: MobileSelectOption[], onChange: (v: string) => void, empty: string, tone = '') => (
    <MobileSelect
      label={label}
      icon={UserRound}
      value={value}
      options={options}
      onChange={onChange}
      searchable
      renderTrigger={open => (
        <button type="button" className={`mp-pick ${tone} ${value ? 'has-value' : ''}`} onClick={open}>
          <span className="mp-pick-text">
            <small>{label}</small>
            <strong>{labelOf(value) || empty}</strong>
          </span>
          <ChevronDown size={16} />
        </button>
      )}
    />
  );

  const save = async () => {
    setSaving(true);
    try {
      const postponed = status === 'مؤجلة';
      const payload = {
        ...match,
        coach_id: match.coach_id?.id ? match.coach_id.id : match.coach_id,
        admin_id: match.admin_id?.id ? match.admin_id.id : match.admin_id,
        team_id: match.team_id || match.team?.id,
        team_score: postponed ? null : (teamScore === '' ? null : teamScore),
        opponent_score: postponed ? null : (oppScore === '' ? null : oppScore),
        match_status: postponed ? 'مؤجلة' : (teamScore !== '' ? 'ملعوبة' : ''),
        match_date: postponed && newDate ? newDate : match.match_date,
        match_duration: duration,
        substitutions: subs,
        goals,
      };
      const res = await axios.post(Applink.updateMatch, payload, { headers: authHeaders() });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error) {
      alert(`حدث خطأ أثناء الحفظ\n${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const scoreBox = (label: string, value: string, onChange: (v: string) => void) => (
    <div className="mp-score">
      <small>{label}</small>
      <div className="mp-score-ctrl">
        <button type="button" onClick={() => onChange(step(value, 1))} aria-label="زيادة"><Plus size={18} /></button>
        <input type="number" inputMode="numeric" min={0} value={value} placeholder="0" onChange={e => onChange(e.target.value)} />
        <button type="button" onClick={() => onChange(step(value, -1))} aria-label="إنقاص"><Minus size={18} /></button>
      </div>
    </div>
  );

  return (
    <MobileScreen
      title="النتيجة والأحداث"
      layer={2}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mp-spin" /> : <CheckCircle size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ النتيجة والأحداث'}
        </button>
      )}
    >
      <MatchStrip match={match} label="تقرير المباراة" icon={Flag} />

      {/* Status */}
      <section className="mp-section">
        <h3 className="mp-section-title orange"><span><Flag size={16} /></span> حالة المباراة</h3>
        <div className="mp-seg">
          <button type="button" className={`ok ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>ملعوبة / انتهت</button>
          <button type="button" className={`warn ${status === 'مؤجلة' ? 'active' : ''}`} onClick={() => setStatus('مؤجلة')}>مؤجلة</button>
        </div>
        {status === 'مؤجلة' ? (
          <label className="me-field">
            <span className="me-label"><CalendarClock size={14} /> التاريخ الجديد (اختياري)</span>
            <input className="me-input" type="datetime-local" dir="ltr" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </label>
        ) : (
          <div className="me-field">
            <span className="me-label"><Timer size={14} /> دقائق اللعب</span>
            <div className="mp-seg">
              <button type="button" className={duration === '90' ? 'active' : ''} onClick={() => setDuration('90')}>90 د (وقت أصلي)</button>
              <button type="button" className={duration === '120' ? 'active' : ''} onClick={() => setDuration('120')}>120 د (إضافي)</button>
            </div>
          </div>
        )}
      </section>

      {status !== 'مؤجلة' && (
        <>
          {/* Score + goals */}
          <section className="mp-section">
            <h3 className="mp-section-title green"><span><CheckCircle size={16} /></span> النتيجة</h3>
            <div className="mp-scores">
              {scoreBox(CLUB_NAME, teamScore, changeTeamScore)}
              <span className="mp-scores-sep">:</span>
              {scoreBox(opponentName(match), oppScore, setOppScore)}
            </div>

            {goals.length > 0 && (
              <div className="mp-goals">
                <span className="mp-goals-title">أهداف {CLUB_NAME}</span>
                {goals.map((g, i) => (
                  <div key={g.id} className="mp-goal">
                    <div className="mp-goal-head">
                      <span className="mp-goal-num"><span className="mp-ev-ball">⚽</span> الهدف {i + 1}</span>
                      <input
                        className="mp-minute"
                        type="number"
                        inputMode="numeric"
                        placeholder="الدقيقة"
                        value={g.minute}
                        onChange={e => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, minute: e.target.value } : x))}
                      />
                    </div>
                    {playerPick('المسجل', g.scorer_id, onPitchOptions,
                      v => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, scorer_id: v } : x)), 'اختر المسجل')}
                    {playerPick('صانع الهدف (اختياري)', g.assist_id, [{ value: '', label: 'بدون تمريرة حاسمة' }, ...onPitchOptions],
                      v => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, assist_id: v } : x)), 'بدون تمريرة حاسمة')}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Substitutions */}
          <section className="mp-section">
            <div className="mp-section-head">
              <h3 className="mp-section-title orange"><span><ArrowLeftRight size={16} /></span> التبديلات</h3>
              <button
                type="button"
                className="mp-add"
                onClick={() => setSubs(prev => [...prev, { id: Date.now(), player_out_id: '', player_in_id: '', minute: '' }])}
              >
                <Plus size={16} /> تبديل
              </button>
            </div>
            {subs.length === 0 ? (
              <p className="mp-muted">لم يتم تسجيل أي تبديل</p>
            ) : subs.map(s => (
              <div key={s.id} className="mp-sub-row">
                <div className="mp-goal-head">
                  <input
                    className="mp-minute"
                    type="number"
                    inputMode="numeric"
                    placeholder="الدقيقة"
                    value={s.minute}
                    onChange={e => setSubs(prev => prev.map(x => x.id === s.id ? { ...x, minute: e.target.value } : x))}
                  />
                  <button type="button" className="mp-remove" onClick={() => setSubs(prev => prev.filter(x => x.id !== s.id))} aria-label="حذف التبديل">
                    <Trash2 size={16} />
                  </button>
                </div>
                {playerPick('خروج', s.player_out_id, onPitchOptions,
                  v => setSubs(prev => prev.map(x => x.id === s.id ? { ...x, player_out_id: v } : x)), 'اللاعب الخارج', 'out')}
                {playerPick('دخول', s.player_in_id, benchOptions,
                  v => setSubs(prev => prev.map(x => x.id === s.id ? { ...x, player_in_id: v } : x)), 'اللاعب الداخل', 'in')}
              </div>
            ))}
          </section>
        </>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
