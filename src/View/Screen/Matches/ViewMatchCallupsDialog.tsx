import React, { useState, useEffect } from 'react';
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
      const headers = { Authorization: `Bearer ${token}` };
      
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
              playerDetails: callup.player_id
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

  if (!isOpen) return null;

  return (
    <>
      <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
        <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '800px', width: '90%', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="dialog-app-bar" style={{ borderRadius: '16px 16px 0 0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="icon-container" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
                <CheckCircle size={24} color="#f97316" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>المستدعين</h2>
            </div>
            <p className="hide-on-mobile" style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>{matchData?.match_title} - {matchData?.opponent}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" onClick={onClose} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', 
              width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
               onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="dialog-toolbar">
          <div style={{ position: 'relative', flexGrow: 1, width: '100%' }}>
            <Search size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="بحث..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dialog-search-input"
            />
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, background: 'var(--card-bg)' }}>
          


          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>جاري تحميل القائمة...</div>
          ) : calledUpPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: '20px', border: '2px dashed var(--border)', fontSize: '1.1rem', fontWeight: 600 }}>
              لم يتم استدعاء أي لاعبين لهذه المباراة بعد. الرجاء استدعاء اللاعبين أولاً.
            </div>
          ) : (
            <FootballPitch 
              callups={calledUpPlayers.map(p => ({
                player_id: p.player_id || p.individual_id || p.id,
                name: `${p.playerDetails.first_name} ${p.playerDetails.last_name}`,
                player: p.playerDetails,
                notes: p.notes
              }))}
              initialFormation={matchData?.formation || "4-3-3"}
              initialPlacements={
                calledUpPlayers.reduce((acc, p) => {
                  if (p.is_starter && p.position_x !== null && p.position_y !== null) {
                    const formation = matchData?.formation || "4-3-3";
                    const config = FORMATIONS[formation];
                    if (config) {
                      const pos = config.positions.find((pos: any) => 
                        Math.abs(pos.x - parseFloat(p.position_x)) < 1 && 
                        Math.abs(pos.y - parseFloat(p.position_y)) < 1
                      );
                      if (pos) {
                        acc[pos.id] = p.player_id || p.individual_id || p.id;
                      }
                    }
                  }
                  return acc;
                }, {} as Record<string, number>)
              }
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
                  alert('تم حفظ التشكيلة بنجاح');
                  fetchCalledUpPlayers(); // Reload
                } catch (err) {
                  console.error(err);
                  alert('حدث خطأ أثناء حفظ التشكيلة');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
          )}

        </div>

        </div>

      </div>
    </>
  );
};
