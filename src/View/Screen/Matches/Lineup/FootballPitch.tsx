import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FORMATIONS, type Position, type Formation } from './FormationConfig';
import { Applink } from '../../../../LinkApi';
import './FootballPitch.css';
import defaultAvatar from '../../../../assets/AVETER.png';
import { MessageCircle } from 'lucide-react';

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

export interface FootballPitchProps {
  callups: {
    player_id: number,
    name: string,
    photo?: string,
    notes?: string,
    player?: any,
    is_starter?: boolean,
    subbed_out_minute?: number,
    replaced_by_id?: number,
    subbed_in_minute?: number,
    shirt_number?: number,
    rating?: number | null,
    yellow_cards?: number,
    red_cards?: number,
    red_card_type?: string | null
  }[];
  initialPlacements?: Record<string, number>;
  initialCustomPositions?: Record<string, { x: number, y: number }>;
  initialFormation?: string;
  onSave?: (formation: string, starters: { player_id: number, position_x: number, position_y: number, is_starter: boolean }[]) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  goals?: any[];
  showSubstitutionsSection?: boolean;
}

export const FootballPitch: React.FC<FootballPitchProps> = ({
  callups,
  initialFormation = "4-3-3",
  initialPlacements = {},
  initialCustomPositions = {},
  onSave,
  isLoading,
  readOnly = false,
  goals = [],
  showSubstitutionsSection = false
}) => {
  const [formationName, setFormationName] = useState<string>(initialFormation || "4-3-3");
  const [placements, setPlacements] = useState<Record<string, number>>(initialPlacements);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

  // For the player picker popup (click to select)
  const [pickerPosition, setPickerPosition] = useState<{ id: string, x: number, y: number } | null>(null);

  // Drag and drop state
  const [draggedPlayerId, setDraggedPlayerId] = useState<number | null>(null);
  const [draggedPosId, setDraggedPosId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<string | null>(null);
  const [dragOverBench, setDragOverBench] = useState(false);

  const [customPositions, setCustomPositions] = useState<Record<string, { x: number, y: number }>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBtnRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number, width: number} | null>(null);

  // Close dropdown and picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Close picker if clicking outside of it
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerPosition(null);
      }
      setActiveNoteId(null);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update placements when initialPlacements change
  useEffect(() => {
    if (initialPlacements && Object.keys(initialPlacements).length > 0) {
      setPlacements(initialPlacements);
    }
  }, [initialPlacements]);

  // Update custom positions when initialCustomPositions change
  useEffect(() => {
    if (initialCustomPositions && Object.keys(initialCustomPositions).length > 0) {
      setCustomPositions(initialCustomPositions);
    }
  }, [initialCustomPositions]);

  // Update formation
  useEffect(() => {
    if (initialFormation) {
      setFormationName(initialFormation);
    }
  }, [initialFormation]);

  const handleFormationChange = (newFormationName: string) => {
    setIsDropdownOpen(false);

    const oldForm = FORMATIONS[formationName];
    const newForm = FORMATIONS[newFormationName];

    setFormationName(newFormationName);
    setCustomPositions({}); // Reset custom coordinates on formation change

    if (!oldForm || !newForm) return;

    const newPlacements: Record<string, number> = {};
    const unplacedPlayers: { playerId: number, oldRole: string }[] = [];

    // Helper to categorize roles
    const getCategory = (role: string) => {
      if (role === 'GK') return 'GK';
      if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(role)) return 'DEF';
      if (['CDM', 'CM', 'LM', 'RM', 'CAM'].includes(role)) return 'MID';
      return 'ATT';
    };

    const availableNewSpots = [...newForm.positions];

    // First pass: Exact role matches
    Object.entries(placements).forEach(([oldPosId, playerId]) => {
      const oldPos = oldForm.positions.find(p => p.id === oldPosId);
      if (!oldPos) return;

      const exactMatchIndex = availableNewSpots.findIndex(p => p.role === oldPos.role);
      if (exactMatchIndex !== -1) {
        newPlacements[availableNewSpots[exactMatchIndex].id] = playerId;
        availableNewSpots.splice(exactMatchIndex, 1);
      } else {
        unplacedPlayers.push({ playerId, oldRole: oldPos.role });
      }
    });

    // Second pass: Category matches (DEF to DEF, MID to MID)
    const stillUnplaced: number[] = [];
    unplacedPlayers.forEach(up => {
      const cat = getCategory(up.oldRole);
      const catMatchIndex = availableNewSpots.findIndex(p => getCategory(p.role) === cat);
      if (catMatchIndex !== -1) {
        newPlacements[availableNewSpots[catMatchIndex].id] = up.playerId;
        availableNewSpots.splice(catMatchIndex, 1);
      } else {
        stillUnplaced.push(up.playerId);
      }
    });

    // Third pass: Put remaining anywhere
    stillUnplaced.forEach(playerId => {
      if (availableNewSpots.length > 0) {
        newPlacements[availableNewSpots[0].id] = playerId;
        availableNewSpots.shift();
      }
    });

    setPlacements(newPlacements);
  };

  const formation = FORMATIONS[formationName] || FORMATIONS["4-3-3"];
  const placedPlayerIds = Object.values(placements);
  const availablePlayers = callups.filter(c => !placedPlayerIds.includes(c.player_id));
  const substitutePlayers = availablePlayers;

  const getPlayerDisplayInfo = (playerId: number) => {
    const callup = callups.find(c => c.player_id === playerId);
    if (!callup) return null;

    const name = callup.player ? callup.player.last_name : (callup.name.split(' ').pop() || callup.name);
    const photo = callup.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${callup.player.photo}` : undefined;
    const number = callup.player?.shirt_number || callup.shirt_number;
    const rating = callup.rating != null ? callup.rating : null;
    const yellow_cards = callup.yellow_cards || 0;
    const red_cards = callup.red_cards || 0;
    const red_card_type = callup.red_card_type || null;
    const notes = callup.notes || null;

    return { name, photo, number, rating, yellow_cards, red_cards, red_card_type, notes };
  };

  const handleSpotClick = (e: React.MouseEvent, posId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    setIsDropdownOpen(false); // Close formation dropdown if open
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setPickerPosition({ id: posId, x: clickX, y: clickY });
    }
  };

  const handleSelectPlayer = (playerId: number | null) => {
    if (!pickerPosition) return;

    setPlacements(prev => {
      const next = { ...prev };

      // If we are placing a player that is already on the pitch somewhere else, we should move them.
      if (playerId !== null) {
        let existingPosId: string | null = null;
        for (const [pId, pIdValue] of Object.entries(next)) {
          if (pIdValue === playerId) {
            existingPosId = pId;
            break;
          }
        }

        // If the target spot has a player, swap them
        const displacedPlayerId = next[pickerPosition.id];

        if (existingPosId) {
          if (displacedPlayerId) {
            next[existingPosId] = displacedPlayerId; // Swap
          } else {
            delete next[existingPosId]; // Just move
          }
        }
      }

      if (playerId === null) {
        delete next[pickerPosition.id];
      } else {
        next[pickerPosition.id] = playerId;
      }
      return next;
    });
    setPickerPosition(null);
  };

  const handleSave = () => {
    if (!onSave) return;
    const starters = Object.entries(placements).map(([posId, playerId]) => {
      const pos = formation.positions.find(p => p.id === posId);
      const customPos = customPositions[posId];
      return {
        player_id: playerId,
        position_x: customPos ? customPos.x : (pos ? pos.x : 0),
        position_y: customPos ? customPos.y : (pos ? pos.y : 0),
        is_starter: true
      };
    });

    onSave(formationName, starters);
  };

  // --- Drag and drop handlers ---
  const handleSpotDragStart = (e: React.DragEvent, posId: string, playerId: number | null) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    setDraggedPosId(posId);
    if (playerId) {
      setDraggedPlayerId(playerId);
    } else {
      setDraggedPlayerId(null);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBenchDragStart = (e: React.DragEvent, playerId: number) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    setDraggedPlayerId(playerId);
    setDraggedPosId(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPitch = (e: React.DragEvent, posId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent container from catching it
    setDragOverPos(posId);
  };

  const handleDropOnPitch = (e: React.DragEvent, targetPosId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent container from catching it
    setDragOverPos(null);

    if (draggedPlayerId) {
      setPlacements(prev => {
        const next = { ...prev };
        // Find if dragged player is already on the pitch
        let sourcePosId: string | null = null;
        for (const [pId, pIdValue] of Object.entries(next)) {
          if (pIdValue === draggedPlayerId) {
            sourcePosId = pId;
            break;
          }
        }

        const targetPlayerId = next[targetPosId];

        // Move dragged to target
        next[targetPosId] = draggedPlayerId;

        // Handle the displaced player (swap or move to bench)
        if (sourcePosId) {
          if (targetPlayerId) {
            next[sourcePosId] = targetPlayerId; // Swap

            // Swap custom positions if any
            setCustomPositions(prevCP => {
              const nextCP = { ...prevCP };
              const temp = nextCP[targetPosId];
              if (nextCP[sourcePosId!]) {
                nextCP[targetPosId] = nextCP[sourcePosId!];
              } else {
                delete nextCP[targetPosId];
              }
              if (temp) {
                nextCP[sourcePosId!] = temp;
              } else {
                delete nextCP[sourcePosId!];
              }
              return nextCP;
            });
          } else {
            delete next[sourcePosId]; // Move

            // Move custom position along with the player
            setCustomPositions(prevCP => {
              const nextCP = { ...prevCP };
              if (nextCP[sourcePosId!]) {
                nextCP[targetPosId] = nextCP[sourcePosId!];
                delete nextCP[sourcePosId!];
              }
              return nextCP;
            });
          }
        }

        return next;
      });
    } else if (draggedPosId) {
      // Dragged an empty spot, move it
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCustomPositions(prev => ({
          ...prev,
          [draggedPosId]: { x, y }
        }));
      }
    }

    setDraggedPlayerId(null);
    setDraggedPosId(null);
  };

  const handleDropOnPitchContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    let targetPosId = draggedPosId;
    if (!targetPosId && draggedPlayerId) {
      // Came from bench to empty grass - find source if it exists
      targetPosId = Object.keys(placements).find(key => placements[key] === draggedPlayerId) || null;
    }

    if (!targetPosId) {
      setDraggedPlayerId(null);
      setDraggedPosId(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Update custom coordinates for this position
    setCustomPositions(prev => ({
      ...prev,
      [targetPosId!]: { x, y }
    }));

    setDraggedPlayerId(null);
    setDraggedPosId(null);
  };

  const handleDragOverBench = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBench(true);
  };

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBench(false);
    if (!draggedPlayerId) return;

    setPlacements(prev => {
      const next = { ...prev };
      for (const [pId, pIdValue] of Object.entries(next)) {
        if (pIdValue === draggedPlayerId) {
          delete next[pId];
          break;
        }
      }
      return next;
    });
    setDraggedPlayerId(null);
    setDraggedPosId(null);
  };

  return (
    <div className="lineup-builder">
      <div className="formation-selector" style={{ position: 'relative', zIndex: 9999 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold', marginLeft: '12px', color: '#1e293b' }}>خطة اللعب:</label>
          {readOnly ? (
            <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px', color: '#334155', fontWeight: 600 }}>
              {formationName}
            </div>
          ) : (
            <div className="custom-dropdown-container" ref={dropdownRef}>
              <div
                className="custom-dropdown-btn"
                ref={dropdownBtnRef}
                onClick={() => {
                  if (!isDropdownOpen) {
                    const rect = dropdownBtnRef.current?.getBoundingClientRect();
                    if (rect) {
                      setDropdownPos({
                        top: rect.bottom + 4,
                        left: rect.left,
                        width: rect.width,
                      });
                    }
                  }
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                {formationName}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
              {/* Render dropdown menu via Portal so it escapes dialog overflow */}
              {isDropdownOpen && dropdownPos && ReactDOM.createPortal(
                <div
                  className="custom-dropdown-menu open"
                  style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                    zIndex: 999999,
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {Object.keys(FORMATIONS).map(f => (
                    <div
                      key={f}
                      className={`custom-dropdown-item ${f === formationName ? 'active' : ''}`}
                      onClick={() => handleFormationChange(f)}
                    >
                      {f}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {!readOnly && (
          <button
            className="mc-btn mc-btn-primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التشكيلة'}
          </button>
        )}
      </div>

      <div className="pitch-and-players-layout">
        <div
          className="football-pitch-container"
          ref={containerRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPitchContainer}
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
            const starterId = placements[pos.id];

            let displayPlayerId = starterId;
            let subbedOutCallup = null;

            if (readOnly && starterId) {
              const starterCallup = callups.find(c => c.player_id === starterId);
              if (starterCallup && starterCallup.replaced_by_id) {
                subbedOutCallup = starterCallup;
              }
            }

            const info = displayPlayerId ? getPlayerDisplayInfo(displayPlayerId) : null;

            const isDragOver = dragOverPos === pos.id;

            const customPos = customPositions[pos.id];
            const x = customPos ? customPos.x : pos.x;
            const y = customPos ? customPos.y : pos.y;

            const playerGoals = displayPlayerId ? goals.filter(g => String(g.scorer_id) === String(displayPlayerId)) : [];
            const playerAssists = displayPlayerId ? goals.filter(g => g.assist_id && String(g.assist_id) === String(displayPlayerId)) : [];

            return (
              <div
                key={pos.id}
                className={`player-spot ${displayPlayerId ? 'filled' : ''} ${isDragOver ? 'drag-over' : ''} ${readOnly ? 'read-only' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onDragOver={(e) => handleDragOverPitch(e, pos.id)}
                onDragLeave={() => setDragOverPos(null)}
                onDrop={(e) => handleDropOnPitch(e, pos.id)}
                draggable={!readOnly}
                onDragStart={(e) => handleSpotDragStart(e, pos.id, displayPlayerId || null)}
                onDragEnd={() => { setDraggedPlayerId(null); setDraggedPosId(null); }}
                onClick={(e) => handleSpotClick(e, pos.id)}
              >
                {info ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Shirt Number Badge (Using generic number or ID if shirt_number is missing) */}
                    <div className="pitch-number-badge">
                      {info.number || (displayPlayerId && String(displayPlayerId).substring(0, 2))}
                    </div>

                    <img src={info.photo || defaultAvatar} alt={info.name} className="spot-player-img" draggable="false" />

                    {/* Events Badges Overlay (Circular wrap around) */}
                    <>
                      {subbedOutCallup && (
                        <div className="pitch-badge sub-badge badge-pos-1" title="تم التبديل">
                          <span style={{ color: '#ef4444', marginRight: '-2px', fontSize: '9px' }}>↓</span>
                          <span style={{ color: '#10b981', fontSize: '9px' }}>↑</span>
                        </div>
                      )}

                      {playerGoals.length > 0 && (
                        <div className="pitch-badge goal-badge badge-pos-2" title={`سجل ${playerGoals.length} أهداف`}>
                          <span style={{ filter: 'grayscale(100%)' }}>⚽</span>
                          {playerGoals.length > 1 && <span className="badge-count">{playerGoals.length}</span>}
                        </div>
                      )}

                      {playerAssists.length > 0 && (
                        <div className="pitch-badge assist-badge badge-pos-3" title={`صنع ${playerAssists.length} أهداف`}>
                          <span style={{ filter: 'grayscale(100%)' }}>👟</span>
                          {playerAssists.length > 1 && <span className="badge-count">{playerAssists.length}</span>}
                        </div>
                      )}

                      {info.rating != null && (
                        <div
                          className="pitch-badge badge-pos-4"
                          title={`تقييم: ${info.rating}/10`}
                          style={{
                            background: info.rating >= 7 ? '#16a34a' : info.rating >= 5 ? '#ca8a04' : '#dc2626',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: '5px',
                            lineHeight: 1.4,
                            letterSpacing: '0.02em',
                            minWidth: '22px',
                            textAlign: 'center',
                          }}
                        >
                          {Number(info.rating).toFixed(1)}
                        </div>
                      )}

                      {/* Card badges - middle right (opposite goals) */}
                      {(info.yellow_cards > 0 || info.red_cards > 0) && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          right: '-14px',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          zIndex: 26,
                        }}>
                          {info.red_cards > 0 && info.red_card_type === 'second_yellow' ? (
                            <div style={{ position: 'relative', width: '12px', height: '17px' }}>
                              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '14px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '14px', background: '#ef4444', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                            </div>
                          ) : (
                            <>
                              {info.yellow_cards > 0 && (
                                <div style={{ width: '10px', height: '13px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
                              )}
                              {info.red_cards > 0 && (
                                <div style={{ width: '10px', height: '13px', background: '#ef4444', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Notes Badge - Top Right */}
                      {info.notes && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '4px',
                            cursor: 'pointer',
                            zIndex: 30,
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.5)',
                            border: '1.5px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNoteId(activeNoteId === displayPlayerId ? null : displayPlayerId);
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <MessageCircle size={12} color="white" fill="white" strokeWidth={1} />
                        </div>
                      )}
                      
                      {/* Note Popup */}
                      {activeNoteId === displayPlayerId && info.notes && (
                        <div 
                          style={{
                            position: 'absolute', top: '15px', right: '50%', transform: 'translateX(50%)', background: 'white', color: '#1e293b', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 9999, width: 'max-content', maxWidth: '200px', fontSize: '12px', border: '1px solid #e2e8f0', textAlign: 'right', lineHeight: '1.4', whiteSpace: 'normal'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {info.notes}
                          <div style={{ position: 'absolute', top: '-6px', right: '50%', width: '10px', height: '10px', background: 'white', transform: 'translateX(50%) rotate(45deg)', borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}></div>
                        </div>
                      )}
                    </>
                  </div>
                ) : (
                  <span className="spot-role">{pos.role}</span>
                )}

                {info && (
                  <div className="spot-player-name">
                    {info.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Player Picker Modal for Click Selection */}
          {pickerPosition && (
            <div
              ref={pickerRef}
              className="player-picker-modal"
              style={{
                left: `${Math.min(pickerPosition.x + 20, containerRef.current ? containerRef.current.offsetWidth - 200 : 0)}px`,
                top: `${Math.min(pickerPosition.y, containerRef.current ? containerRef.current.offsetHeight - 200 : 0)}px`,
                position: 'absolute',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 100,
                width: '200px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '4px', fontSize: '14px', textAlign: 'center' }}>
                اختر لاعب
              </div>

              {placements[pickerPosition.id] && (
                <div
                  onClick={() => handleSelectPlayer(null)}
                  style={{ color: '#ef4444', padding: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', background: '#fef2f2', borderRadius: '4px', marginBottom: '8px' }}
                >
                  إزالة من التشكيلة
                </div>
              )}

              {availablePlayers.length === 0 && !placements[pickerPosition.id] ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '8px' }}>لا يوجد لاعبين متاحين</div>
              ) : (
                availablePlayers.map(p => {
                  const name = p.player ? p.player.last_name : (p.name.split(' ').pop() || p.name);
                  const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;

                  return (
                    <div
                      key={p.player_id}
                      onClick={() => handleSelectPlayer(p.player_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={photo || defaultAvatar} alt={name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{name}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div
          className={`substitutes-container ${dragOverBench ? 'drag-over' : ''}`}
          onDragOver={handleDragOverBench}
          onDragLeave={() => setDragOverBench(false)}
          onDrop={handleDropOnBench}
          style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}
        >
          {/* ── Section: التبديلات  ── */}
          {showSubstitutionsSection ? (() => {
            const enteredPlayers = substitutePlayers.filter(p => p.subbed_in_minute);
            const notPlayedPlayers = substitutePlayers.filter(p => !p.subbed_in_minute);

            return (
              <>
                {/* ENTERED PLAYERS */}
                <div style={{ padding: '14px 14px 8px', borderBottom: enteredPlayers.length > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '3px', height: '16px', background: '#10b981', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em', textTransform: 'uppercase' }}>التبديلات </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({enteredPlayers.length})</span>
                  </div>

                  {enteredPlayers.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', paddingBottom: '4px' }}>لا أحد دخل كبديل</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {enteredPlayers.map(p => {
                        const name = p.player ? `${p.player.first_name || ''} ${p.player.last_name || ''}`.trim() : p.name;
                        const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;
                        const pRating = p.rating;
                        const pYellow = p.yellow_cards || 0;
                        const pRed = p.red_cards || 0;
                        const pRedType = p.red_card_type || null;
                        const pGoals = goals.filter(g => String(g.scorer_id) === String(p.player_id));
                        const pAssists = goals.filter(g => g.assist_id && String(g.assist_id) === String(p.player_id));

                        return (
                          <div
                            key={p.player_id}
                            draggable={!readOnly}
                            onDragStart={(e) => handleBenchDragStart(e, p.player_id)}
                            onDragEnd={() => { setDraggedPlayerId(null); setDraggedPosId(null); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '8px 10px', borderRadius: '12px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              cursor: readOnly ? 'default' : 'grab',
                              transition: 'all 0.15s',
                            }}
                            onMouseOver={e => { if (!readOnly) e.currentTarget.style.borderColor = '#10b981'; }}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            {/* Photo */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <img src={photo || defaultAvatar} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} draggable="false" />
                              {/* Sub minute badge */}
                              {p.subbed_in_minute && (
                                <div style={{
                                  position: 'absolute', bottom: -4, right: -4,
                                  background: '#10b981', color: '#fff',
                                  fontSize: '9px', fontWeight: 800,
                                  borderRadius: '4px', padding: '1px 3px',
                                  lineHeight: 1.3,
                                }}>
                                  {p.subbed_in_minute}'
                                </div>
                              )}
                            </div>

                            {/* Name + Goals/Assists row */}
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {name}
                                </div>
                                {p.notes && (
                                  <div style={{ position: 'relative' }}>
                                    <div 
                                      style={{ 
                                        cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveNoteId(activeNoteId === p.player_id ? null : p.player_id);
                                      }} 
                                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      <MessageCircle size={12} color="white" fill="white" strokeWidth={1} />
                                    </div>
                                    {activeNoteId === p.player_id && (
                                      <div style={{
                                        position: 'absolute', top: '22px', right: '50%', transform: 'translateX(50%)', background: 'white', color: '#1e293b', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 9999, width: 'max-content', maxWidth: '200px', fontSize: '12px', border: '1px solid #e2e8f0', textAlign: 'right', lineHeight: '1.4', whiteSpace: 'normal'
                                      }} onClick={e => e.stopPropagation()}>
                                        {p.notes}
                                        <div style={{ position: 'absolute', top: '-6px', right: '50%', width: '10px', height: '10px', background: 'white', transform: 'translateX(50%) rotate(45deg)', borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Goals & Assists inline */}
                              {(pGoals.length > 0 || pAssists.length > 0) && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                                  {pGoals.length > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.72rem', fontWeight: 700, color: '#15803d', background: 'rgba(21,128,61,0.1)', borderRadius: '4px', padding: '1px 5px' }}>
                                      ⚽ {pGoals.length > 1 ? pGoals.length : ''}
                                      {pGoals.map((g: any) => g.minute ? ` ${g.minute}'` : '').join('')}
                                    </span>
                                  )}
                                  {pAssists.length > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', background: 'rgba(29,78,216,0.1)', borderRadius: '4px', padding: '1px 5px' }}>
                                      👟 {pAssists.length > 1 ? pAssists.length : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Cards */}
                            {(pYellow > 0 || pRed > 0) && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                {pRed > 0 && pRedType === 'second_yellow' ? (
                                  <div style={{ position: 'relative', width: '12px', height: '17px' }}>
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '14px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '14px', background: '#ef4444', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                                  </div>
                                ) : (
                                  <>
                                    {pYellow > 0 && <div style={{ width: '10px', height: '13px', background: '#eab308', borderRadius: '2px' }} />}
                                    {pRed > 0 && <div style={{ width: '10px', height: '13px', background: '#ef4444', borderRadius: '2px' }} />}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Rating */}
                            {pRating != null && (
                              <div style={{
                                background: pRating >= 7 ? '#16a34a' : pRating >= 5 ? '#ca8a04' : '#dc2626',
                                color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                                borderRadius: '6px', padding: '2px 6px', flexShrink: 0,
                              }}>
                                {Number(pRating).toFixed(1)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* NOT PLAYED */}
                <div style={{ padding: '14px 14px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '3px', height: '16px', background: 'var(--text-muted)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>مقاعد البدلاء</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({notPlayedPlayers.length})</span>
                  </div>

                  {notPlayedPlayers.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>لا يوجد لاعبين في مقاعد البدلاء</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {notPlayedPlayers.map(p => {
                        const name = p.player ? `${p.player.first_name || ''} ${p.player.last_name || ''}`.trim() : p.name;
                        const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;

                        return (
                          <div
                            key={p.player_id}
                            draggable={!readOnly}
                            onDragStart={(e) => handleBenchDragStart(e, p.player_id)}
                            onDragEnd={() => { setDraggedPlayerId(null); setDraggedPosId(null); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '8px 10px', borderRadius: '12px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              cursor: readOnly ? 'default' : 'grab',
                              opacity: 0.75,
                              transition: 'all 0.15s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.opacity = '1'; }}
                            onMouseOut={e => { e.currentTarget.style.opacity = '0.75'; }}
                          >
                            <img src={photo || defaultAvatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} draggable="false" />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {name}
                              </div>
                              {p.notes && (
                                <div style={{ position: 'relative' }}>
                                  <div 
                                    style={{ 
                                      cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.4)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveNoteId(activeNoteId === p.player_id ? null : p.player_id);
                                    }} 
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    <MessageCircle size={12} color="white" fill="white" strokeWidth={1} />
                                  </div>
                                  {activeNoteId === p.player_id && (
                                    <div style={{
                                      position: 'absolute', top: '-10px', right: '24px', background: 'white', color: '#1e293b', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 9999, width: 'max-content', maxWidth: '200px', fontSize: '12px', border: '1px solid #e2e8f0', textAlign: 'right', lineHeight: '1.4', whiteSpace: 'normal'
                                    }} onClick={e => e.stopPropagation()}>
                                      {p.notes}
                                      <div style={{ position: 'absolute', top: '12px', right: '-6px', width: '10px', height: '10px', background: 'white', transform: 'rotate(45deg)', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })() : (
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '3px', height: '16px', background: 'var(--text-muted)', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>مقاعد البدلاء</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({substitutePlayers.length})</span>
              </div>

              {substitutePlayers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>لا يوجد لاعبين في مقاعد البدلاء</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {substitutePlayers.map(p => {
                    const name = p.player ? `${p.player.first_name || ''} ${p.player.last_name || ''}`.trim() : p.name;
                    const photo = p.player?.photo ? `${Applink.server.replace('/api', '')}/storage/${p.player.photo}` : undefined;

                    return (
                      <div
                        key={p.player_id}
                        draggable={!readOnly}
                        onDragStart={(e) => handleBenchDragStart(e, p.player_id)}
                        onDragEnd={() => { setDraggedPlayerId(null); setDraggedPosId(null); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '12px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          cursor: readOnly ? 'default' : 'grab',
                          opacity: 0.75,
                          transition: 'all 0.15s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.opacity = '1'; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = '0.75'; }}
                      >
                        <img src={photo || defaultAvatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} draggable="false" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name}
                          </div>
                          {p.notes && (
                            <div style={{ position: 'relative' }}>
                              <div 
                                style={{ 
                                  cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  borderRadius: '50%', padding: '3px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveNoteId(activeNoteId === p.player_id ? null : p.player_id);
                                }} 
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <MessageCircle size={12} color="white" fill="white" strokeWidth={1} />
                              </div>
                              {activeNoteId === p.player_id && (
                                <div style={{
                                  position: 'absolute', top: '-10px', right: '24px', background: 'white', color: '#1e293b', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 9999, width: 'max-content', maxWidth: '200px', fontSize: '12px', border: '1px solid #e2e8f0', textAlign: 'right', lineHeight: '1.4', whiteSpace: 'normal'
                                }} onClick={e => e.stopPropagation()}>
                                  {p.notes}
                                  <div style={{ position: 'absolute', top: '12px', right: '-6px', width: '10px', height: '10px', background: 'white', transform: 'rotate(45deg)', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
