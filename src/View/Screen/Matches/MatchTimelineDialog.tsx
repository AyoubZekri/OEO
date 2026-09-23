import React, { useEffect, useState } from 'react';
import { X, Clock, Activity } from 'lucide-react';
import type { Match, MatchGoal, MatchEvent } from './match_model';
import { FootballPitch } from './Lineup/FootballPitch';
import { FORMATIONS } from './Lineup/FormationConfig';
import { Applink } from '../../../LinkApi';

interface MatchTimelineDialogProps {
  match: Match;
  onClose: () => void;
}

export const MatchTimelineDialog: React.FC<MatchTimelineDialogProps> = ({ match, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [callups, setCallups] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, [match.id]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(Applink.matchEvents(match.id), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedGoals = data.data.goals || [];
        const fetchedCallups = data.data.callups || [];

        setGoals(fetchedGoals);
        setCallups(fetchedCallups);

        // Build timeline events
        const timelineEvents: MatchEvent[] = [];

        // 1. Add Goals
        fetchedGoals.forEach((g: any) => {
          timelineEvents.push({
            id: `goal-${g.id}`,
            minute: g.minute,
            type: 'goal',
            description: `هدف من تسجيل ${g.scorer_first_name} ${g.scorer_last_name}` +
              (g.assist_id ? ` (صناعة ${g.assist_first_name} ${g.assist_last_name})` : ''),
            scorer: `${g.scorer_first_name} ${g.scorer_last_name}`,
            assist: g.assist_id ? `${g.assist_first_name} ${g.assist_last_name}` : undefined
          });
        });

        // 2. Add Substitutions
        fetchedCallups.forEach((c: any) => {
          const playerName = c.individual ? `${c.individual.first_name} ${c.individual.last_name}` : 'غير معروف';

          if (c.subbed_out_minute && c.replaced_by) {
            const playerIn = `${c.replaced_by.first_name} ${c.replaced_by.last_name}`;
            timelineEvents.push({
              id: `sub-${c.id}`,
              minute: c.subbed_out_minute,
              type: 'substitution',
              description: `تبديل: خروج ${playerName} ودخول ${playerIn}`,
              playerOut: playerName,
              playerIn,
              playerInPhoto: c.replaced_by.photo
            });
          }

          // 3. Yellow Card
          if (c.yellow_cards >= 1 && c.yellow_card_minute) {
            timelineEvents.push({
              id: `yellow-${c.id}`,
              minute: Number(c.yellow_card_minute),
              type: 'yellow_card',
              description: `بطاقة صفراء - ${playerName}`,
              playerName
            });
          }

          // 4. Red Card
          if (c.red_cards >= 1 && c.red_card_minute) {
            const isSecondYellow = c.red_card_type === 'second_yellow';
            timelineEvents.push({
              id: `red-${c.id}`,
              minute: Number(c.red_card_minute),
              type: isSecondYellow ? 'second_yellow' : 'red_card',
              description: isSecondYellow
                ? `إنذار ثاني (طرد) - ${playerName}`
                : `بطاقة حمراء مباشرة - ${playerName}`,
              playerName
            });
          }
        });

        // Sort by minute ascending
        timelineEvents.sort((a, b) => a.minute - b.minute);
        setEvents(timelineEvents);
      }
    } catch (error) {
      console.error("Error fetching match events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Card Icon Component ─────────────────────────────────────────────────────
  const CardIcon = ({ type }: { type: string }) => {
    if (type === 'yellow_card') {
      return (
        <div style={{ width: '14px', height: '18px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flexShrink: 0 }} />
      );
    }
    if (type === 'red_card') {
      return (
        <div style={{ width: '14px', height: '18px', background: 'var(--danger, #ef4444)', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flexShrink: 0 }} />
      );
    }
    if (type === 'second_yellow') {
      // Stacked: yellow underneath, red on top-right
      return (
        <div style={{ position: 'relative', width: '20px', height: '20px', flexShrink: 0 }}>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '13px', height: '17px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '13px', height: '17px', background: 'var(--danger, #ef4444)', borderRadius: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </div>
      );
    }
    return null;
  };

  const getDotColor = (type: string) => {
    if (type === 'goal') return '#10b981';
    if (type === 'substitution') return '#f97316';
    if (type === 'yellow_card') return '#eab308';
    if (type === 'red_card' || type === 'second_yellow') return 'var(--danger, #ef4444)';
    return 'var(--text-muted)';
  };

  // Convert callups to the format expected by FootballPitch
  const formattedCallups = callups.map(c => ({
    player_id: c.player_id,
    name: c.individual ? `${c.individual.first_name} ${c.individual.last_name}` : 'غير معروف',
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

  // Reconstruct placements using saved position_x / position_y (same as ViewMatchCallupsDialog)
  const initialPlacements: Record<string, number> = {};
  const initialCustomPositions: Record<string, { x: number, y: number }> = {};

  const formationKey = match.formation || "4-3-3";
  const formationDef = FORMATIONS[formationKey] || FORMATIONS["4-3-3"];

  if (formationDef && callups.length > 0) {
    const availableSpots = [...formationDef.positions];

    callups
      .filter(c => (c.is_starter == 1 || c.is_starter === true) && c.position_x != null && c.position_y != null)
      .forEach((c: any) => {
        const px = parseFloat(c.position_x);
        const py = parseFloat(c.position_y);

        let closestSpot: any = null;
        let minD = Infinity;

        availableSpots.forEach(spot => {
          const d = Math.sqrt(Math.pow(spot.x - px, 2) + Math.pow(spot.y - py, 2));
          if (d < minD) { minD = d; closestSpot = spot; }
        });

        if (closestSpot) {
          const pid = c.player_id;
          initialPlacements[closestSpot.id] = pid;

          // If player was manually moved from the default spot, record custom coords
          if (Math.abs(closestSpot.x - px) > 0.1 || Math.abs(closestSpot.y - py) > 0.1) {
            initialCustomPositions[closestSpot.id] = { x: px, y: py };
          }

          availableSpots.splice(availableSpots.indexOf(closestSpot), 1);
        }
      });
  }

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, padding: '20px' }}>
      <div className="task-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '1200px', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', background: 'var(--bg)' }} onClick={(e) => e.stopPropagation()}>

        <div className="task-dialog-header" style={{ flexShrink: 0, padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={24} color="var(--primary)" /> أحداث المباراة
            </h2>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {match.team?.name || 'فريقنا'} {match.team_score !== null ? match.team_score : '-'} : {match.opponent_score !== null ? match.opponent_score : '-'} {match.opponent || 'الخصم'}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="mc-dialog-split" style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

          {/* Timeline Section */}
          <div className="mc-dialog-sidebar" style={{ width: '400px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', color: 'var(--text)' }}>

            <div style={{ padding: '20px', overflowY: 'auto', flexGrow: 1 }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>جاري التحميل...</div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  لا توجد أحداث مسجلة لهذه المباراة
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
                  {events.map((ev, index) => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'stretch', gap: '12px', minHeight: '50px' }}>

                      {/* Minute */}
                      <div style={{ width: '35px', flexShrink: 0, textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', paddingTop: '10px' }}>
                        {ev.minute}'
                      </div>

                      {/* Node Column */}
                      <div style={{ position: 'relative', width: '20px', flexShrink: 0 }}>
                        <div style={{
                          position: 'absolute',
                          display: events.length === 1 ? 'none' : 'block',
                          top: index === 0 ? '28px' : 0,
                          bottom: index === events.length - 1 ? 'auto' : 0,
                          height: (index === events.length - 1 && events.length > 1) ? '28px' : 'auto',
                          left: '50%', transform: 'translateX(-50%)',
                          width: '2px', background: 'var(--border)', zIndex: 1
                        }} />
                        <div style={{
                          position: 'absolute', top: '20px', left: '50%',
                          transform: 'translateX(-50%)',
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: getDotColor(ev.type),
                          border: '2px solid var(--card-bg)',
                          boxSizing: 'content-box', zIndex: 2
                        }} />
                      </div>

                      {/* Content */}
                      <div style={{ flexGrow: 1, padding: '8px 0', borderBottom: index === events.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>

                        {/* Icon */}
                        {ev.type === 'goal' && <span style={{ fontSize: '14px' }}>⚽</span>}
                        {ev.type === 'substitution' && <span style={{ fontSize: '14px' }}>🔄</span>}
                        {(ev.type === 'yellow_card' || ev.type === 'red_card' || ev.type === 'second_yellow') && (
                          <CardIcon type={ev.type} />
                        )}

                        {/* Text */}
                        <div style={{ textAlign: 'right' }}>
                          {ev.type === 'goal' && (
                            <div style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                              <strong>{ev.scorer}</strong>
                              {ev.assist && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> ({ev.assist})</span>}
                            </div>
                          )}
                          {ev.type === 'substitution' && (
                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>{ev.playerIn}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 4px' }}>↓↑</span>
                              <span style={{ color: 'var(--danger, #ef4444)' }}>{ev.playerOut}</span>
                            </div>
                          )}
                          {ev.type === 'yellow_card' && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                              <strong style={{ color: '#ca8a04' }}>{ev.playerName}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: '4px' }}> — بطاقة صفراء</span>
                            </div>
                          )}
                          {ev.type === 'red_card' && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                              <strong style={{ color: '#dc2626' }}>{ev.playerName}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: '4px' }}> — حمراء مباشرة</span>
                            </div>
                          )}
                          {ev.type === 'second_yellow' && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                              <strong style={{ color: '#dc2626' }}>{ev.playerName}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: '4px' }}> — إنذار ثاني (طرد)</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pitch Section */}
          <div className="mc-dialog-main" style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', background: 'var(--bg)' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>جاري تحميل التشكيلة...</div>
            ) : (
              <FootballPitch
                callups={formattedCallups}
                initialFormation={match.formation || "4-3-3"}
                initialPlacements={initialPlacements}
                initialCustomPositions={initialCustomPositions}
                readOnly={true}
                goals={goals}
                showSubstitutionsSection={true}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
