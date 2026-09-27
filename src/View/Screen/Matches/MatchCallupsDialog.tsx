import React from 'react';
import { X, Search, CheckCircle, Stethoscope } from 'lucide-react';
import type { Match } from './match_model';
import { useMatchCallups } from './useMatchCallups';

interface MatchCallupsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const MatchCallupsDialog: React.FC<MatchCallupsDialogProps> = ({ isOpen, onClose, matchData }) => {
  const {
    filteredPlayers, searchQuery, setSearchQuery, selectedPlayers, isSubmitting, isLoading,
    handleTogglePlayer, handleNoteChange, handleSubmit,
  } = useMatchCallups(isOpen, matchData, onClose);

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div 
        className="task-dialog role-dialog" 
        style={{ 
          fontFamily: 'var(--sans)', 
          maxWidth: '900px', 
          width: '95%', 
          borderRadius: '24px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '90vh',
          background: 'var(--card-bg)',
          overflow: 'hidden'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="dialog-app-bar" style={{ borderRadius: '24px 24px 0 0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="icon-container" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
                <CheckCircle size={24} color="#f97316" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>الاستدعاء</h2>
            </div>
            <p className="hide-on-mobile" style={{ margin: '8px 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem' }}>
              {matchData?.match_title ? `مباراة: ${matchData?.match_title}` : 'تحديد اللاعبين للمباراة القادمة'}
            </p>
          </div>
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

        {/* Toolbar */}
        <div className="dialog-toolbar">
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px', width: '100%' }}>
            <Search size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="بحث..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dialog-search-input"
            />
          </div>
          
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <div style={{ background: 'var(--bg)', padding: '12px 20px', borderRadius: '12px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>المتاحين</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)' }}>{filteredPlayers.length}</div>
            </div>
            <div style={{ background: 'var(--accent-bg)', padding: '12px 20px', borderRadius: '12px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>المستدعين</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{Object.keys(selectedPlayers).length}</div>
            </div>
          </div>
        </div>

        {/* Grid Area */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          <div style={{ padding: '24px 32px', overflowY: 'auto', flexGrow: 1 }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>جاري تحميل قائمة اللاعبين...</div>
            ) : filteredPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>لم يتم العثور على لاعبين.</div>
            ) : (
              <div className="callup-player-grid">
                {filteredPlayers.map(player => {
                  const isSelected = !!selectedPlayers[player.id];
                  const playerNumber = player.shirt_number || player.Shirt_number || '-';
                  
                  return (
                    <div 
                      key={player.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        padding: '16px', 
                        borderRadius: '16px', 
                        border: isSelected ? '2px solid var(--accent)' : (player.medicalState === 'treatment' ? '1px solid #f59e0b' : '1px solid var(--border)'),
                        background: isSelected ? 'var(--accent-bg)' : (player.medicalState === 'injured' ? '#fef2f2' : (player.medicalState === 'treatment' ? '#fffbeb' : 'var(--card-bg)')),
                        boxShadow: isSelected ? '0 4px 12px var(--accent-bg)' : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: player.medicalState === 'injured' ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        opacity: player.medicalState === 'injured' ? 0.6 : 1
                      }}
                      onClick={() => handleTogglePlayer(player)}
                      onMouseOver={e => !isSelected && player.medicalState !== 'injured' && (e.currentTarget.style.borderColor = 'var(--text-muted)')}
                      onMouseOut={e => !isSelected && player.medicalState !== 'injured' && (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', 
                          border: isSelected ? 'none' : '2px solid var(--border)',
                          background: isSelected ? 'var(--accent)' : (player.medicalState === 'injured' ? 'var(--danger, #ef4444)' : 'var(--card-bg)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}>
                          {isSelected && <CheckCircle size={16} color="white" />}
                          {player.medicalState === 'injured' && !isSelected && <Stethoscope size={14} color="white" />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '50px', height: '50px', borderRadius: '14px',
                          background: 'var(--bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-h)', fontWeight: 900, fontSize: '1.4rem',
                          flexShrink: 0, border: '1px solid var(--border)'
                        }}>
                          {playerNumber}
                        </div>
                        <div style={{ flexGrow: 1, paddingLeft: '24px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 700 }}>{player.first_name} {player.last_name}</h4>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', fontWeight: 600 }}>
                              {player.position || 'لاعب'}
                            </span>
                            {player.medicalState === 'injured' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger, #ef4444)', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                مصاب
                              </span>
                            )}
                            {player.medicalState === 'treatment' && (
                              <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                مرحلة علاج
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }} onClick={e => e.stopPropagation()}>
                          {player.medicalState === 'treatment' ? (
                            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>
                              <span style={{ fontWeight: 800, marginRight: '4px' }}>توصية الطبيب:</span> {selectedPlayers[player.id].notes}
                            </div>
                          ) : (
                            <input 
                              type="text" 
                              placeholder="ملاحظات (اختياري)..."
                              value={selectedPlayers[player.id].notes}
                              onChange={(e) => handleNoteChange(player.id, e.target.value)}
                              style={{ 
                                width: '100%', padding: '10px 14px', borderRadius: '8px', 
                                border: '1px solid var(--border)', fontSize: '0.85rem',
                                background: 'var(--card-bg)', 
                                color: 'var(--text)', 
                                boxSizing: 'border-box',
                                outline: 'none', transition: 'border-color 0.2s'
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '16px 24px', background: 'var(--card-bg)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ 
              padding: '12px', borderRadius: '12px', border: 'none', 
              background: 'var(--bg)', color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', transition: 'all 0.2s', flex: 1
            }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}>
              إلغاء
            </button>
            
            <button type="submit" disabled={isSubmitting || isLoading} style={{ 
              padding: '12px', borderRadius: '12px', border: 'none', 
              background: '#f97316', color: 'white', fontWeight: 700, fontSize: '0.95rem',
              cursor: (isSubmitting || isLoading) ? 'not-allowed' : 'pointer', 
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
              opacity: (isSubmitting || isLoading) ? 0.7 : 1, flex: 2
            }} onMouseOver={e => {if(!isSubmitting) e.currentTarget.style.background = '#ea580c'}} onMouseOut={e => {if(!isSubmitting) e.currentTarget.style.background = '#f97316'}}>
              {isSubmitting ? 'حفظ...' : `تأكيد (${Object.keys(selectedPlayers).length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

