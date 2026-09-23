import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Star, AlertTriangle, Activity, ChevronDown, Check } from 'lucide-react';
import type { Match } from './match_model';

interface MatchPlayerStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

// ─── Custom Dropdown Component ───────────────────────────────────────────────
interface DropdownOption { value: string | number; label: string }
interface CustomDropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (val: string | number) => void;
  placeholder?: string;
  accentColor?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, accentColor = 'var(--border)' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 12px', borderRadius: '8px',
          border: `1px solid ${open ? accentColor : 'var(--border)'}`,
          background: 'var(--card-bg)',
          color: 'var(--text-h)',
          fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
          outline: 'none', whiteSpace: 'nowrap',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? `0 0 0 3px ${accentColor}22` : 'none',
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
          minWidth: '150px',
          overflow: 'hidden',
          animation: 'dropIn 0.15s ease',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px',
                background: String(opt.value) === String(value) ? 'var(--bg)' : 'transparent',
                color: 'var(--text-h)',
                border: 'none', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: String(opt.value) === String(value) ? 700 : 500,
                textAlign: 'right',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseOut={e => e.currentTarget.style.background = String(opt.value) === String(value) ? 'var(--bg)' : 'transparent'}
            >
              {opt.label}
              {String(opt.value) === String(value) && <Check size={14} color="#f97316" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export const MatchPlayerStatsDialog: React.FC<MatchPlayerStatsDialogProps> = ({ isOpen, onClose, matchData }) => {
  const [calledUpPlayers, setCalledUpPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [playerStats, setPlayerStats] = useState<Record<number, {
    yellow_cards: number;
    yellow_card_minute: string;
    yellow_card_2_minute: string;
    red_cards: number;
    red_card_minute: string;
    red_card_type: string;
    rating: number | '';
  }>>({});

  useEffect(() => {
    if (isOpen && matchData) fetchCalledUpPlayers();
    else setCalledUpPlayers([]);
  }, [isOpen, matchData]);

  const fetchCalledUpPlayers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

      let playersRes: any = null;
      let callupsRes: any = null;

      try { playersRes = await axios.get(Applink.individuals, { headers }); } catch {}
      try { callupsRes = await axios.get(Applink.matchCallups(matchData!.id), { headers }); } catch {}

      const allInds = (playersRes && (playersRes.data?.status === 'success' || Array.isArray(playersRes.data)))
        ? (Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data)
        : [];

      if (callupsRes?.data?.status === 'success') {
        const callups = callupsRes.data.data;
        const playersList = callups.map((callup: any) => {
          if (callup.player_id && typeof callup.player_id === 'object') {
            return { ...callup, playerDetails: callup.player_id, player_id: callup.player_id.id };
          }
          const cid = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id;
          const playerDetails = allInds.find((ind: any) => String(ind.id) === String(cid));
          return { ...callup, playerDetails: playerDetails || { first_name: 'لاعب', last_name: 'غير معروف', id: cid } };
        });

        setCalledUpPlayers(playersList);

        const initialStats: Record<number, any> = {};
        playersList.forEach((p: any) => {
          const pid = p.player_id || p.individual_id || p.id;
          initialStats[pid] = {
            yellow_cards: p.yellow_cards || 0,
            yellow_card_minute: p.yellow_card_minute || '',
            yellow_card_2_minute: p.yellow_card_2_minute || '',
            red_cards: p.red_cards || 0,
            red_card_minute: p.red_card_minute || '',
            red_card_type: p.red_card_type || '',
            rating: p.rating != null ? p.rating : ''
          };
        });
        setPlayerStats(initialStats);
      } else {
        setCalledUpPlayers([]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData) return;
    setIsSavingStats(true);
    try {
      const token = localStorage.getItem('token');
      const playersData = Object.entries(playerStats).map(([playerId, stats]) => ({
        player_id: parseInt(playerId),
        yellow_cards: stats.yellow_cards,
        yellow_card_minute: stats.yellow_card_minute || null,
        yellow_card_2_minute: stats.yellow_card_2_minute || null,
        red_cards: stats.red_cards,
        red_card_minute: stats.red_card_minute || null,
        red_card_type: stats.red_card_type || null,
        rating: stats.rating === '' ? null : stats.rating
      }));

      const res = await axios.post(
        Applink.saveMatchCallupStats,
        { match_id: matchData.id, players: playersData },
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (res.data.status === 'success') onClose();
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || '';
      alert(`حدث خطأ أثناء حفظ الإحصائيات\n${serverMsg}`);
    } finally {
      setIsSavingStats(false);
    }
  };

  const upd = (pid: number, field: string, value: any) =>
    setPlayerStats(prev => ({ ...prev, [pid]: { ...prev[pid], [field]: value } }));

  // Yellow: simple yes/no
  const yellowOptions = [
    { value: 0, label: 'لا توجد' },
    { value: 1, label: 'صفراء' },
  ];
  // Red: choose type directly (none / direct / second_yellow)
  const redTypeOptions = [
    { value: '', label: 'لا توجد' },
    { value: 'direct', label: 'مباشرة' },
    { value: 'second_yellow', label: 'إنذار ثاني' },
  ];

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose}
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,23,42,0.6)' }}>
      <div className="task-dialog role-dialog" style={{
        fontFamily: 'var(--sans)', maxWidth: '1000px', width: '95%',
        borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        background: 'var(--card-bg)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="dialog-app-bar" style={{ borderRadius: '24px 24px 0 0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="icon-container" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
                <Activity size={24} color="#f97316" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                إحصائيات وتقييم اللاعبين
              </h2>
            </div>
            <p className="hide-on-mobile" style={{ margin: '8px 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem' }}>
              {matchData?.match_title ? `مباراة: ${matchData.match_title}` : 'تسجيل التقييمات والبطاقات'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', overflowY: 'auto', flexGrow: 1, background: 'var(--bg)' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>
                جاري تحميل الإحصائيات...
              </div>
            ) : calledUpPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={36} opacity={0.4} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>لم يتم العثور على لاعبين.</span>
              </div>
            ) : (
              <div className="callup-player-grid">
                {calledUpPlayers.map(player => {
                  const pid = player.player_id || player.individual_id || player.id;
                  const stats = playerStats[pid] || { yellow_cards: 0, yellow_card_minute: '', yellow_card_2_minute: '', red_cards: 0, red_card_minute: '', red_card_type: '', rating: '' };
                  const playerNumber = player.playerDetails?.shirt_number || player.playerDetails?.Shirt_number || '-';

                  return (
                    <div key={pid} style={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg)',
                      overflow: 'visible',
                    }}>

                      {/* Card Header: Number + Name + Rating */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px',
                        background: 'var(--bg)',
                        borderBottom: '1px solid var(--border)',
                        borderRadius: '16px 16px 0 0',
                      }}>
                        {/* Jersey Number */}
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                          background: 'var(--card-bg)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-h)',
                        }}>
                          {playerNumber}
                        </div>

                        {/* Name */}
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: '1rem', color: 'var(--text-h)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {player.playerDetails.first_name} {player.playerDetails.last_name}
                          </div>
                        </div>

                        {/* Rating */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                          background: 'var(--card-bg)', border: '1px solid var(--border)',
                          borderRadius: '10px', padding: '6px 12px',
                        }}>
                          <Star size={14} color="#f97316" fill="#f97316" />
                          <input
                            type="number" min="0" max="10" step="0.1"
                            value={stats.rating}
                            onChange={e => upd(pid, 'rating', e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                              width: '48px', border: 'none', background: 'transparent',
                              textAlign: 'center', fontWeight: 800, color: 'var(--text-h)',
                              outline: 'none', fontSize: '0.85rem', padding: 0,
                            }}
                            placeholder="-"
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/10</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--card-bg)', borderRadius: '0 0 16px 16px' }}>

                        {/* ── Yellow Card Row: yes/no + 1 minute ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px', flexShrink: 0 }}>
                            <div style={{ width: '10px', height: '14px', background: '#eab308', borderRadius: '2px', boxShadow: '0 1px 4px rgba(234,179,8,0.4)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-h)' }}>صفراء</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                            <CustomDropdown
                              value={stats.yellow_cards >= 1 ? 1 : 0}
                              options={yellowOptions}
                              onChange={val => {
                                const v = Number(val);
                                setPlayerStats(prev => ({
                                  ...prev,
                                  [pid]: {
                                    ...prev[pid],
                                    yellow_cards: v,
                                    yellow_card_minute: v === 0 ? '' : prev[pid]?.yellow_card_minute || '',
                                    // clear 2nd yellow if removing yellow card
                                    yellow_card_2_minute: v === 0 ? '' : prev[pid]?.yellow_card_2_minute || '',
                                  }
                                }));
                              }}
                            />
                            {stats.yellow_cards >= 1 && (
                              <input
                                type="number" placeholder="الدقيقة"
                                value={stats.yellow_card_minute}
                                onChange={e => upd(pid, 'yellow_card_minute', e.target.value)}
                                style={{
                                  width: '80px', padding: '7px 10px', borderRadius: '8px',
                                  border: '1px solid #eab308', background: 'var(--card-bg)',
                                  color: 'var(--text-h)', fontSize: '0.85rem', textAlign: 'center',
                                  outline: 'none', fontWeight: 600,
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'var(--border)' }} />

                        {/* ── Red Card Row: none / direct / second_yellow ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px', flexShrink: 0 }}>
                            <div style={{ width: '10px', height: '14px', background: 'var(--danger, #ef4444)', borderRadius: '2px', boxShadow: '0 1px 4px rgba(239,68,68,0.4)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-h)' }}>حمراء</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                            <CustomDropdown
                              value={stats.red_card_type || ''}
                              options={redTypeOptions}
                              onChange={val => {
                                const type = String(val);
                                setPlayerStats(prev => ({
                                  ...prev,
                                  [pid]: {
                                    ...prev[pid],
                                    red_card_type: type,
                                    red_cards: type === '' ? 0 : 1,
                                    red_card_minute: type === '' ? '' : prev[pid]?.red_card_minute || '',
                                    // إنذار ثاني = تلقائياً بطاقة صفراء ثانية
                                    ...(type === 'second_yellow' ? { yellow_cards: 2 } : {}),
                                  }
                                }));
                              }}
                              accentColor="var(--danger, #ef4444)"
                            />
                            {stats.red_cards > 0 && (
                              <input
                                type="number" placeholder="الدقيقة"
                                value={stats.red_card_minute}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPlayerStats(prev => ({
                                    ...prev,
                                    [pid]: {
                                      ...prev[pid],
                                      red_card_minute: val,
                                      // إذا كانت إنذار ثاني، نسجّل نفس الوقت كدقيقة ثانية للصفراء
                                      ...(prev[pid]?.red_card_type === 'second_yellow' ? { yellow_card_2_minute: val } : {}),
                                    }
                                  }));
                                }}
                                style={{
                                  width: '80px', padding: '7px 10px', borderRadius: '8px',
                                  border: '1px solid var(--danger, #ef4444)', background: 'var(--card-bg)',
                                  color: 'var(--text-h)', fontSize: '0.85rem', textAlign: 'center',
                                  outline: 'none', fontWeight: 600,
                                }}
                              />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '16px 24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '12px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text-h)', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', transition: 'all 0.2s', flex: 1
            }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}
            >
              إلغاء
            </button>
            <button type="submit" disabled={isSavingStats || calledUpPlayers.length === 0} style={{
              padding: '12px', borderRadius: '12px', border: 'none',
              background: '#f97316', color: 'white', fontWeight: 700, fontSize: '0.95rem',
              cursor: (isSavingStats || calledUpPlayers.length === 0) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: (isSavingStats || calledUpPlayers.length === 0) ? 0.7 : 1, flex: 2, transition: 'all 0.2s'
            }}
              onMouseOver={e => { if (!isSavingStats) e.currentTarget.style.background = '#ea580c'; }}
              onMouseOut={e => { if (!isSavingStats) e.currentTarget.style.background = '#f97316'; }}
            >
              {isSavingStats ? 'جاري الحفظ...' : 'حفظ الإحصائيات'}
            </button>
          </div>
        </form>

      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
