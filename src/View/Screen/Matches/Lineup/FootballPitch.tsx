import React, { useState, useRef, useEffect } from 'react';
import { FORMATIONS, Position } from './FormationConfig';
import { Applink } from '../../../../LinkApi';
import './FootballPitch.css';

interface Player {
  player_id: number;
  name: string;
  photo?: string;
  notes?: string;
  // added properties that might be on the object depending on the API
  player?: {
    first_name: string;
    last_name: string;
    photo?: string;
  };
}

interface FootballPitchProps {
  callups: Player[];
  initialFormation?: string;
  initialPlacements?: Record<string, number>; // positionId -> playerId
  onSave: (formation: string, starters: {player_id: number, position_x: number, position_y: number}[]) => void;
  isLoading: boolean;
}

export const FootballPitch: React.FC<FootballPitchProps> = ({ 
  callups, 
  initialFormation = "4-3-3", 
  initialPlacements = {},
  onSave,
  isLoading
}) => {
  const [formationName, setFormationName] = useState<string>(initialFormation || "4-3-3");
  const [placements, setPlacements] = useState<Record<string, number>>(initialPlacements);
  
  // For the player picker popup
  const [pickerPosition, setPickerPosition] = useState<{id: string, x: number, y: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update placements when initialPlacements change
  useEffect(() => {
    if (Object.keys(initialPlacements).length > 0) {
      setPlacements(initialPlacements);
    }
  }, [initialPlacements]);

  // Update formation
  useEffect(() => {
    if (initialFormation) {
      setFormationName(initialFormation);
    }
  }, [initialFormation]);

  const formation = FORMATIONS[formationName] || FORMATIONS["4-3-3"];
  const placedPlayerIds = Object.values(placements);
  const availablePlayers = callups.filter(c => !placedPlayerIds.includes(c.player_id));
  const substitutePlayers = availablePlayers;

  const handleSpotClick = (e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    
    // If there's a player here, clicking it could either open the picker to replace, 
    // or we can allow removing them. Let's open the picker to replace/remove.
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      setPickerPosition({ id: pos.id, x: clickX, y: clickY });
    }
  };

  const handleSelectPlayer = (playerId: number | null) => {
    if (!pickerPosition) return;
    
    setPlacements(prev => {
      const next = { ...prev };
      if (playerId === null) {
        delete next[pickerPosition.id]; // Remove player from spot
      } else {
        next[pickerPosition.id] = playerId;
      }
      return next;
    });
    
    setPickerPosition(null);
  };

  const getPlayerDisplayInfo = (playerId: number) => {
    const callup = callups.find(c => c.player_id === playerId);
    if (!callup) return null;
    
    const name = callup.player ? `${callup.player.first_name} ${callup.player.last_name}` : callup.name;
    const photo = callup.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${callup.player.photo}` : undefined;
    
    return { name, photo };
  };

  const handleSave = () => {
    const starters = Object.entries(placements).map(([posId, playerId]) => {
      const pos = formation.positions.find(p => p.id === posId);
      return {
        player_id: playerId,
        position_x: pos ? pos.x : 0,
        position_y: pos ? pos.y : 0,
        is_starter: true
      };
    });
    
    onSave(formationName, starters);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setPickerPosition(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="lineup-builder">
      <div className="formation-selector">
        <div>
          <label style={{fontWeight: 'bold', marginLeft: '8px'}}>خطة اللعب:</label>
          <select 
            value={formationName} 
            onChange={e => {
              setFormationName(e.target.value);
              setPlacements({}); // Clear placements when formation changes (or try to map them)
            }}
            style={{padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc'}}
          >
            {Object.keys(FORMATIONS).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="mc-btn mc-btn-primary" 
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'جاري الحفظ...' : 'حفظ التشكيلة'}
        </button>
      </div>

      <div 
        className="football-pitch-container" 
        ref={containerRef}
        onClick={(e) => { e.stopPropagation(); setPickerPosition(null); }}
      >
        <div className="pitch-lines">
          <div className="pitch-line center-line"></div>
          <div className="pitch-line center-circle"></div>
          
          <div className="pitch-line penalty-box-top"></div>
          <div className="pitch-line goal-box-top"></div>
          
          <div className="pitch-line penalty-box-bottom"></div>
          <div className="pitch-line goal-box-bottom"></div>
        </div>

        {formation.positions.map(pos => {
          const playerId = placements[pos.id];
          const info = playerId ? getPlayerDisplayInfo(playerId) : null;
          
          return (
            <div 
              key={pos.id}
              className={`player-spot ${playerId ? 'filled' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={(e) => handleSpotClick(e, pos)}
            >
              {info && info.photo ? (
                <img src={info.photo} alt={info.name} className="spot-player-img" />
              ) : (
                <span className="spot-role">{pos.role}</span>
              )}
              
              {info && (
                <div className="spot-player-name">{info.name}</div>
              )}
            </div>
          );
        })}

        {/* Player Picker Modal */}
        {pickerPosition && (
          <div 
            className="player-picker-modal"
            style={{
              left: `${Math.min(pickerPosition.x + 20, containerRef.current ? containerRef.current.offsetWidth - 200 : 0)}px`,
              top: `${Math.min(pickerPosition.y, containerRef.current ? containerRef.current.offsetHeight - 200 : 0)}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '4px', fontSize: '14px', textAlign: 'center'}}>
              اختر لاعب
            </div>
            
            {placements[pickerPosition.id] && (
              <div 
                className="player-picker-item" 
                onClick={() => handleSelectPlayer(null)}
                style={{color: '#ef4444'}}
              >
                إزالة من التشكيلة
              </div>
            )}
            
            {availablePlayers.length === 0 && !placements[pickerPosition.id] ? (
              <div className="player-picker-empty">لا يوجد لاعبين متاحين</div>
            ) : (
              availablePlayers.map(p => {
                const name = p.player ? `${p.player.first_name} ${p.player.last_name}` : p.name;
                const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;
                
                return (
                  <div key={p.player_id} className="player-picker-item" onClick={() => handleSelectPlayer(p.player_id)}>
                    {photo ? (
                      <img src={photo} alt={name} style={{width: 20, height: 20, borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                      <div style={{width: 20, height: 20, borderRadius: '50%', background: '#ccc'}}></div>
                    )}
                    <span style={{fontSize: '13px'}}>{name}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="substitutes-container">
        <h4 style={{margin: 0, color: '#334155'}}>قائمة البدلاء ({substitutePlayers.length})</h4>
        <div className="substitutes-list">
          {substitutePlayers.map(p => {
            const name = p.player ? `${p.player.first_name} ${p.player.last_name}` : p.name;
            const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;
            
            return (
              <div key={p.player_id} className="substitute-card">
                {photo ? (
                  <img src={photo} alt={name} className="substitute-img" />
                ) : (
                  <div className="substitute-img" style={{background: '#cbd5e1'}}></div>
                )}
                {name}
              </div>
            );
          })}
          
          {substitutePlayers.length === 0 && (
            <div style={{color: '#94a3b8', fontStyle: 'italic', fontSize: '14px', padding: '8px 0'}}>
              لا يوجد بدلاء (كل اللاعبين في التشكيلة الأساسية)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
