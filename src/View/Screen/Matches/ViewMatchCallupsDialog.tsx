import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Search, Calendar, MapPin, Clock, User, Users, Shield, CheckCircle } from 'lucide-react';
import type { Match } from './match_model';

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
          ) : filteredPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: '20px', border: '2px dashed var(--border)', fontSize: '1.1rem', fontWeight: 600 }}>
              لم يتم استدعاء أي لاعبين لهذه المباراة بعد.
            </div>
          ) : (
            <div className="callup-player-grid">
              {filteredPlayers.map((player, index) => {
                const playerNumber = player.playerDetails.shirt_number || player.playerDetails.Shirt_number || '-';
                return (
                  <div key={player.id || index} style={{ 
                    display: 'flex', flexDirection: 'column', padding: '16px', 
                    borderRadius: '16px', border: '1px solid var(--border)',
                    background: 'var(--card-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0, border: '1px solid var(--border)' }}>
                        {playerNumber}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 700 }}>{player.playerDetails.first_name} {player.playerDetails.last_name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px', fontWeight: 600 }}>
                          {player.playerDetails.position || 'لاعب'}
                        </span>
                      </div>
                    </div>
                    
                    {player.notes && (
                      <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border)', paddingTop: '12px', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-muted)' }}>ملاحظات:</span> {player.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        </div>

      </div>
    </>
  );
};
