import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Search, CheckCircle } from 'lucide-react';
import type { Match } from './match_model';

interface MatchCallupsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const MatchCallupsDialog: React.FC<MatchCallupsDialogProps> = ({ isOpen, onClose, matchData }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<number, { notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && matchData) {
      fetchPlayersAndCallups();
    } else {
      setSearchQuery('');
      setSelectedPlayers({});
    }
  }, [isOpen, matchData]);

  const fetchPlayersAndCallups = async () => {
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
        if (err.response) {
          console.error('Individuals Backend error details:', err.response.data);
        }
      }

      try {
        callupsRes = await axios.get(Applink.matchCallups(matchData!.id), { headers });
      } catch (err: any) {
        console.error('Error fetching callups (maybe first time or endpoint missing):', err);
        if (err.response) {
          console.error('Callups Backend error details:', err.response.data);
        }
      }

      if (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data))) {
        const allInds = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data;
        // Filter to show ONLY players (اللاعبين) and belong to the match team
        const onlyPlayers = allInds.filter((ind: any) => {
          if (!ind) return false;
          const roleName = ind.role?.name ? ind.role.name.trim() : '';
          const isPlayer = roleName === 'لاعب' || ind.type === 'لاعب' || ind.type === 'player';
          
          // Filter by match team_id if the match has one assigned
          const matchTeamId = matchData?.team_id;
          const playerTeamId = ind.team_id || ind.team?.id;
          
          if (matchTeamId) {
            return isPlayer && playerTeamId === matchTeamId;
          }
          return isPlayer;
        });
        setPlayers(onlyPlayers || []);
      }

      const currentSelected: Record<number, { notes: string }> = {};
      if (callupsRes && callupsRes.data && callupsRes.data.status === 'success') {
        callupsRes.data.data.forEach((callup: any) => {
          const callupPlayerId = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id || callup.memberId;
          if (callupPlayerId) {
            currentSelected[callupPlayerId] = { notes: callup.notes || '' };
          }
        });
      }
      setSelectedPlayers(currentSelected);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => {
      const newSelected = { ...prev };
      if (newSelected[playerId]) {
        delete newSelected[playerId];
      } else {
        newSelected[playerId] = { notes: '' };
      }
      return newSelected;
    });
  };

  const handleNoteChange = (playerId: number, notes: string) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], notes }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const playersArray = Object.entries(selectedPlayers)
        .filter(([_, data]) => data !== undefined)
        .map(([id, data]) => ({
          player_id: parseInt(id),
          individual_id: parseInt(id),
          member_id: parseInt(id),
          notes: data.notes || ''
        }));
      
      const res = await axios.post(Applink.createMatchCallup, {
        match_id: matchData.id,
        players: playersArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving callups:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء حفظ الاستدعاءات\n${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '700px', width: '90%', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="task-dialog-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.25rem' }}>استدعاء اللاعبين للمباراة</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-p)', fontSize: '0.9rem' }}>{matchData?.match_title} - {matchData?.opponent}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="البحث عن لاعب..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-p)', fontWeight: 600 }}>
            <span>إجمالي اللاعبين: {filteredPlayers.length}</span>
            <span style={{ color: 'var(--accent)' }}>اللاعبين المحددين: {Object.keys(selectedPlayers).length}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          <div style={{ padding: '16px 24px', overflowY: 'auto', flexGrow: 1 }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-p)' }}>جاري التحميل...</div>
            ) : filteredPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-p)' }}>لا يوجد لاعبين متاحين</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredPlayers.map(player => {
                  const isSelected = !!selectedPlayers[player.id];
                  return (
                    <div 
                      key={player.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        padding: '12px', 
                        borderRadius: '10px', 
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'white',
                        transition: 'all 0.2s',
                        gap: '12px'
                      }}
                    >
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => handleTogglePlayer(player.id)}
                      >
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '6px', 
                          border: isSelected ? 'none' : '2px solid #cbd5e1',
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <CheckCircle size={16} color="white" />}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-h)' }}>{player.first_name} {player.last_name}</h4>
                          {player.position && <span style={{ fontSize: '0.8rem', color: 'var(--text-p)' }}>{player.position}</span>}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div style={{ paddingRight: '36px' }}>
                          <input 
                            type="text" 
                            placeholder="ملاحظات (اختياري) مثال: عائد من إصابة، تسديد ركلات الجزاء..."
                            value={selectedPlayers[player.id].notes}
                            onChange={(e) => handleNoteChange(player.id, e.target.value)}
                            style={{ 
                              width: '100%', padding: '8px 12px', borderRadius: '6px', 
                              border: '1px dashed #cbd5e1', fontSize: '0.85rem',
                              background: 'rgba(255,255,255,0.8)', boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dialog-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0, margin: 0 }}>
            <button type="button" onClick={onClose} className="cancel-btn">إلغاء</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الاستدعاءات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

