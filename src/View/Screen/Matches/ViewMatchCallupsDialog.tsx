import React from 'react';
import { X } from 'lucide-react';
import type { Match } from './match_model';
import { FootballPitch } from './Lineup/FootballPitch';
import { useMatchLineup } from './useMatchLineup';

interface ViewMatchCallupsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const ViewMatchCallupsDialog: React.FC<ViewMatchCallupsDialogProps> = ({ isOpen, onClose, matchData }) => {
  const {
    calledUpPlayers, isLoading, initialPlacements, initialCustomPositions, pitchCallups, goals, saveLineup,
  } = useMatchLineup(isOpen, matchData);

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
              callups={pitchCallups}
              initialFormation={matchData?.formation || "4-3-3"}
              initialPlacements={initialPlacements}
              initialCustomPositions={initialCustomPositions}
              goals={goals}
              onSave={saveLineup}
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
