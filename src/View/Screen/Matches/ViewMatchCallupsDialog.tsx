import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Search, Printer, Calendar, MapPin, Clock, User, Users, Shield } from 'lucide-react';
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

  const handlePrint = () => {
    window.print();
  };

  const filteredPlayers = calledUpPlayers.filter(p => 
    `${p.playerDetails.first_name} ${p.playerDetails.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="task-dialog-overlay no-print" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
        <div className="task-dialog role-dialog print-container" style={{ fontFamily: 'var(--sans)', maxWidth: '800px', width: '90%', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="task-dialog-header no-print" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.25rem' }}>قائمة اللاعبين المستدعين</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-p)', fontSize: '0.9rem' }}>{matchData?.match_title} - {matchData?.opponent}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Printer size={18} /> طباعة القائمة
            </button>
            <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="no-print" style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="البحث في القائمة المستدعاة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Printable Area */}
        <div className="print-area" style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, background: 'white' }}>
          
          <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>قائمة استدعاء اللاعبين</h1>
            <h2 style={{ fontSize: '18px', color: '#333' }}>ألمبيك ليو</h2>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: '#334155' }}>المباراة:</span>
                <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{matchData?.match_title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: '#334155' }}>الخصم:</span>
                <span style={{ color: '#0f172a' }}>{matchData?.opponent}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: '#334155' }}>التاريخ:</span>
                <span style={{ color: '#0f172a' }}>{matchData?.match_date ? new Date(matchData.match_date).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: '#334155' }}>المكان:</span>
                <span style={{ color: '#0f172a' }}>{matchData?.location}</span>
              </div>
            </div>
            
            {(matchData?.gathering_time || matchData?.gathering_location) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '4px' }}>
                {matchData?.gathering_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#ef4444" />
                    <span style={{ fontWeight: 600, color: '#334155' }}>موعد التجمع:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{new Date(matchData.gathering_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {matchData?.gathering_location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#ef4444" />
                    <span style={{ fontWeight: 600, color: '#334155' }}>مكان التجمع:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{matchData.gathering_location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '2px solid var(--accent)', paddingBottom: '8px', display: 'inline-block' }}>
            اللاعبون المستدعون ({filteredPlayers.length})
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-p)' }}>جاري تحميل القائمة...</div>
          ) : filteredPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-p)', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              لم يتم استدعاء أي لاعبين لهذه المباراة بعد.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', fontFamily: 'var(--sans)' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#334155', width: '60px' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>الاسم واللقب</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>المركز</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>رقم القميص</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#334155', width: '30%' }}>ملاحظات الاستدعاء</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr key={player.id || index} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {player.playerDetails.first_name} {player.playerDetails.last_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {player.playerDetails.position || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', direction: 'ltr', textAlign: 'right' }}>
                      {player.playerDetails.Shirt_number || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontStyle: player.notes ? 'normal' : 'italic' }}>
                      {player.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>

        <div className="print-footer" style={{ display: 'none', marginTop: '40px', justifyContent: 'space-between', padding: '20px 40px' }}>
            <div style={{ textAlign: 'center' }}>
              <strong>توقيع المدرب</strong>
              <br /><br />
              ........................
            </div>
            <div style={{ textAlign: 'center' }}>
              <strong>توقيع الإدارة</strong>
              <br /><br />
              ........................
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .task-dialog-overlay {
            background: none !important;
            backdrop-filter: none !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .task-dialog {
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header, .print-footer {
            display: flex !important;
          }
          .print-header { display: block !important; }
        }
      `}} />
    </>
  );
};
