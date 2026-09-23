import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Search, Calendar, MapPin, Clock, User, Users, Shield, CheckCircle } from 'lucide-react';
import type { Match } from './match_model';
import { FootballPitch } from './Lineup/FootballPitch';
import { FORMATIONS } from './Lineup/FormationConfig';

interface ViewMatchCallupsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const ViewMatchCallupsDialog: React.FC<ViewMatchCallupsDialogProps> = ({ isOpen, onClose, matchData }) => {
  const [calledUpPlayers, setCalledUpPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && matchData) {
      fetchCalledUpPlayers();
    } else {
      setSearchQuery('');
      setCalledUpPlayers([]);
    }
  }, [isOpen, matchData]);

  const fetchCalledUpPlayers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      };
      
      let playersRes: any = null;
      let callupsRes: any = null;

      try {
        playersRes = await axios.get(Applink.individuals, { headers });
      } catch (err: any) {
        console.error('Error fetching individuals:', err);
      }

      try {
        callupsRes = await axios.get(Applink.matchCallups(matchData!.id), { headers });
      } catch (err: any) {
        console.error('Error fetching callups:', err);
      }

      const allInds = (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data))) 
          ? (Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data) 
          : [];

      if (callupsRes && callupsRes.data && callupsRes.data.status === 'success') {
        const callups = callupsRes.data.data;
        console.log('Debug JSON from Backend (callups):', callups);
        console.log('Debug all individuals:', allInds);
        
        // Map the callup data to the actual player details
        const playersList = callups.map((callup: any) => {
          if (callup.player_id && typeof callup.player_id === 'object') {
            return {
              ...callup,
              playerDetails: callup.player_id,
              player_id: callup.player_id.id
            };
          }

          const callupPlayerId = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id || callup.memberId;
          const playerDetails = allInds.find((ind: any) => String(ind.id) === String(callupPlayerId));
          return {
            ...callup,
            playerDetails: playerDetails || { first_name: 'لاعب', last_name: 'غير معروف', id: callupPlayerId }
          };
        });
        
        setCalledUpPlayers(playersList);


      } else {
        setCalledUpPlayers([]);
      }
      
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = calledUpPlayers.filter(p => 
    `${p.playerDetails.first_name} ${p.playerDetails.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { initialPlacements, initialCustomPositions } = useMemo(() => {
    const placements: Record<string, number> = {};
    const custom: Record<string, {x: number, y: number}> = {};
    const formation = matchData?.formation || "4-3-3";
    const config = FORMATIONS[formation];

    if (config && calledUpPlayers.length > 0) {
      const availableSpots = [...config.positions];
      
      calledUpPlayers.forEach(p => {
        if (p.is_starter && p.position_x != null && p.position_y != null) {
          const px = parseFloat(p.position_x);
          const py = parseFloat(p.position_y);
          
          let closestSpot: any = null;
          let minD = Infinity;
          
          availableSpots.forEach(spot => {
             const d = Math.sqrt(Math.pow(spot.x - px, 2) + Math.pow(spot.y - py, 2));
             if (d < minD) {
               minD = d;
               closestSpot = spot;
             }
          });
          
          if (closestSpot) {
             const playerId = p.player_id || p.individual_id || p.id;
             placements[closestSpot.id] = playerId;
             
             // If distance is > 0.1, it means user moved it from default position
             if (Math.abs(closestSpot.x - px) > 0.1 || Math.abs(closestSpot.y - py) > 0.1) {
               custom[closestSpot.id] = { x: px, y: py };
             }
             
             availableSpots.splice(availableSpots.indexOf(closestSpot), 1);
          }
        }
      });
    }
    
    return { initialPlacements: placements, initialCustomPositions: custom };
  }, [calledUpPlayers, matchData?.formation]);

  if (!isOpen) return null;

  return (
    <>
      <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
        <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '800px', width: '90%', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>التشكيلة</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', borderRight: '1px solid var(--border)', paddingRight: '8px', marginRight: '8px' }}>{matchData?.match_title}</span>
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)', 
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
             onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>


        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, background: 'var(--card-bg)' }}>
          


          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>جاري تحميل القائمة...</div>
          ) : calledUpPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: '20px', border: '2px dashed var(--border)', fontSize: '1.1rem', fontWeight: 600 }}>
              لم يتم استدعاء أي لاعبين لهذه المباراة بعد. الرجاء استدعاء اللاعبين أولاً.
            </div>
          ) : (
            <>
            <FootballPitch 
              callups={calledUpPlayers.map(p => {
                const pid = p.player_id || p.individual_id || p.id;
                // Find the player who replaced this player (subbed out)
                const replacedBy = p.replaced_by
                  ? p.replaced_by
                  : calledUpPlayers.find((q: any) => {
                      const qid = q.player_id || q.individual_id || q.id;
                      return qid === p.replaced_by_id;
                    })?.playerDetails;

                return {
                  player_id: pid,
                  name: `${p.playerDetails.first_name} ${p.playerDetails.last_name}`,
                  player: {
                    ...p.playerDetails,
                    shirt_number: p.playerDetails?.shirt_number || p.shirt_number,
                  },
                  notes: p.notes,
                  is_starter: p.is_starter == 1 || p.is_starter === true,
                  subbed_out_minute: p.subbed_out_minute || null,
                  subbed_in_minute: p.subbed_in_minute || null,
                  replaced_by_id: p.replaced_by_id || null,
                  shirt_number: p.playerDetails?.shirt_number || p.shirt_number,
                  // stats
                  rating: p.rating != null ? Number(p.rating) : null,
                  yellow_cards: p.yellow_cards || 0,
                  red_cards: p.red_cards || 0,
                  red_card_type: p.red_card_type || null,
                  // goals & assists — passed via goals prop
                };
              })}
              initialFormation={matchData?.formation || "4-3-3"}
              initialPlacements={initialPlacements}
              initialCustomPositions={initialCustomPositions}
              goals={calledUpPlayers.flatMap((p: any) =>
                (p.goals || []).map((g: any) => ({
                  ...g,
                  scorer_id: p.player_id || p.individual_id || p.id,
                }))
              )}
              onSave={async (formation, starters) => {
                setIsLoading(true);
                try {
                  const token = localStorage.getItem('token');
                  await axios.post(
                    Applink.server + '/matches/callups/lineup', 
                    {
                      match_id: matchData!.id,
                      formation: formation,
                      players: starters
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  if (matchData) {
                    matchData.formation = formation;
                  }
                  alert('تم حفظ التشكيلة بنجاح');
                  fetchCalledUpPlayers();
                } catch (err) {
                  console.error(err);
                  alert('حدث خطأ أثناء حفظ التشكيلة');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />

            </>
          )}

        </div>

        </div>

      </div>
    </>
  );
};
