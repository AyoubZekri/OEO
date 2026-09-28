import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import axios from 'axios';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, User, Shield, Users, List, FileText, CheckCircle, ClipboardList, ChevronDown, Activity, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Applink } from '../../../LinkApi';
import { AddMatchDialog } from './AddMatchDialog';
import { MatchCallupsDialog } from './MatchCallupsDialog';
import { ViewMatchCallupsDialog } from './ViewMatchCallupsDialog';
import { AdministrativeReportDialog } from './AdministrativeReportDialog';
import { ViewAdministrativeReportDialog } from './ViewAdministrativeReportDialog';
import { SetMatchResultDialog } from './SetMatchResultDialog';
import { MatchTimelineDialog } from './MatchTimelineDialog';
import { MatchPlayerStatsDialog } from './MatchPlayerStatsDialog';
import { useMatchesController } from './MatchesController';
import {type Match } from './match_model';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileMatches } from '../../Mobile/MobileMatches/MobileMatches';
import { MobileMatchCallups } from '../../Mobile/MobileMatches/MobileMatchCallups';
import { MobileMatchLineup } from '../../Mobile/MobileMatches/MobileMatchLineup';
import { MobileMatchForm } from '../../Mobile/MobileMatches/MobileMatchForm';
import { MobileMatchReport, MobileMatchReportForm } from '../../Mobile/MobileMatches/MobileMatchReport';
import { MobileMatchResult } from '../../Mobile/MobileMatches/MobileMatchResult';
import { MobileMatchTimeline } from '../../Mobile/MobileMatches/MobileMatchTimeline';
import { MobileMatchPlayerStats } from '../../Mobile/MobileMatches/MobileMatchPlayerStats';
import '../Members/Members.css';
import './Matches.css';

const isMatchLive = (matchDate?: string) => {
  if (!matchDate) return false;
  
  // Format the date string to be ISO compliant and explicitly append +01:00 (Algeria Time / UTC+1)
  // This ensures the match time is always interpreted as Algeria time regardless of the user's device timezone
  let formattedDate = matchDate;
  if (!formattedDate.includes('T')) {
    formattedDate = formattedDate.replace(' ', 'T');
  }
  if (!formattedDate.includes('+') && !formattedDate.includes('Z')) {
    formattedDate = `${formattedDate}+01:00`;
  }

  const date = new Date(formattedDate);
  const now = new Date();
  
  // diffHours represents the absolute time passed since the match start time
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 2.5;
};

const isMatchEnded = (matchDate?: string) => {
  if (!matchDate) return false;
  let formattedDate = matchDate;
  if (!formattedDate.includes('T')) {
    formattedDate = formattedDate.replace(' ', 'T');
  }
  if (!formattedDate.includes('+') && !formattedDate.includes('Z')) {
    formattedDate = `${formattedDate}+01:00`;
  }
  const date = new Date(formattedDate);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHours > 2.5;
};

export const Matches = () => {
  const navigate = useNavigate();
  const {
    matches,
    isLoading,
    isDialogOpen,
    editingMatch,
    isCallupsDialogOpen,
    selectedMatchForCallup,
    fetchMatches,
    handleDelete,
    openAddDialog,
    openEditDialog,
    closeDialog,
    openCallupsDialog,
    closeCallupsDialog,
    isViewCallupsDialogOpen,
    closeViewCallupsDialog,
    selectedMatchForViewCallups,
    openViewCallupsDialog,
    isAdministrativeReportDialogOpen,
    selectedMatchForAdministrativeReport,
    openAdministrativeReportDialog,
    closeAdministrativeReportDialog,
    isViewAdministrativeReportDialogOpen,
    selectedMatchForViewAdministrativeReport,
    openViewAdministrativeReportDialog,
    closeViewAdministrativeReportDialog,
    isResultDialogOpen,
    selectedMatchForResult,
    openResultDialog,
    closeResultDialog,
    isTimelineDialogOpen,
    selectedMatchForTimeline,
    openTimelineDialog,
    closeTimelineDialog,
    isPlayerStatsDialogOpen,
    selectedMatchForPlayerStats,
    openPlayerStatsDialog,
    closePlayerStatsDialog
  } = useMatchesController();

  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [rescheduleMatchId, setRescheduleMatchId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const can = useCan();
  // Bumped when the phone report form closes, so the report page shown under it reloads
  const [reportVersion, setReportVersion] = useState(0);

  const filteredMatches = matches.filter(match => {
    const searchLower = searchQuery.toLowerCase();
    const opponent = match.opponent?.toLowerCase() || '';
    const opponentClubName1 = match.opponentClub?.name?.toLowerCase() || '';
    const opponentClubName2 = match.opponent_club?.name?.toLowerCase() || '';
    
    return opponent.includes(searchLower) || 
           opponentClubName1.includes(searchLower) || 
           opponentClubName2.includes(searchLower);
  });

  const handleUpdateStatus = async (match: Match, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...match,
        coach_id: match.coach_id?.id ? match.coach_id.id : match.coach_id,
        admin_id: match.admin_id?.id ? match.admin_id.id : match.admin_id,
        team_id: match.team_id || match.team?.id,
        match_status: newStatus
      };
      
      const res = await axios.post(Applink.updateMatch, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        fetchMatches();
        setStatusDropdownOpen(null);
      }
    } catch (error) {
      console.error('Error updating match status:', error);
      alert('حدث خطأ أثناء تحديث حالة المباراة');
    }
  };

  const handleReschedule = async (match: Match, date: string = rescheduleDate) => {
    if (!date) return;
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...match,
        coach_id: match.coach_id?.id ? match.coach_id.id : match.coach_id,
        admin_id: match.admin_id?.id ? match.admin_id.id : match.admin_id,
        team_id: match.team_id || match.team?.id,
        match_status: 'upcoming',
        match_date: date,
      };
      const res = await axios.post(Applink.updateMatch, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        fetchMatches();
        setRescheduleMatchId(null);
        setRescheduleDate('');
        setStatusDropdownOpen(null);
      }
    } catch (error) {
      console.error('Error rescheduling match:', error);
      alert('حدث خطأ أثناء إعادة جدولة المباراة');
    }
  };

  // Shared by the desktop page and the phone page
  const dialogs = (
    <>
        {isMobile ? (
          isDialogOpen && (
            <MobileMatchForm key={editingMatch?.id ?? 'new'} match={editingMatch} onSave={fetchMatches} onClose={closeDialog} />
          )
        ) : (
          <AddMatchDialog
            isOpen={isDialogOpen}
            onClose={closeDialog}
            onSave={fetchMatches}
            matchData={editingMatch}
          />
        )}

        {isMobile ? (
          isCallupsDialogOpen && selectedMatchForCallup && (
            <MobileMatchCallups match={selectedMatchForCallup} onClose={closeCallupsDialog} />
          )
        ) : (
          <MatchCallupsDialog
            isOpen={isCallupsDialogOpen}
            onClose={closeCallupsDialog}
            matchData={selectedMatchForCallup}
          />
        )}

        {isMobile ? (
          isViewCallupsDialogOpen && selectedMatchForViewCallups && (
            <MobileMatchLineup
              match={selectedMatchForViewCallups}
              onOpenCallups={() => {
                const match = selectedMatchForViewCallups;
                closeViewCallupsDialog();
                openCallupsDialog(match);
              }}
              onClose={closeViewCallupsDialog}
            />
          )
        ) : (
          <ViewMatchCallupsDialog
            isOpen={isViewCallupsDialogOpen}
            onClose={closeViewCallupsDialog}
            matchData={selectedMatchForViewCallups}
          />
        )}

        {isMobile ? (
          <>
            {isAdministrativeReportDialogOpen && selectedMatchForAdministrativeReport && (
              <MobileMatchReportForm
                match={selectedMatchForAdministrativeReport}
                onClose={() => {
                  closeAdministrativeReportDialog();
                  setReportVersion(v => v + 1); // the report page underneath reloads the saved report
                }}
              />
            )}
            {isViewAdministrativeReportDialogOpen && selectedMatchForViewAdministrativeReport && (
              <MobileMatchReport
                key={reportVersion}
                match={selectedMatchForViewAdministrativeReport}
                onEdit={() => openAdministrativeReportDialog(selectedMatchForViewAdministrativeReport)}
                onClose={closeViewAdministrativeReportDialog}
              />
            )}
            {isResultDialogOpen && selectedMatchForResult && (
              <MobileMatchResult
                match={selectedMatchForResult}
                onSave={() => {
                  fetchMatches();
                  openPlayerStatsDialog(selectedMatchForResult);
                }}
                onClose={closeResultDialog}
              />
            )}
            {selectedMatchForTimeline && (
              <MobileMatchTimeline match={selectedMatchForTimeline} onClose={closeTimelineDialog} />
            )}
            {isPlayerStatsDialogOpen && selectedMatchForPlayerStats && (
              <MobileMatchPlayerStats match={selectedMatchForPlayerStats} onClose={closePlayerStatsDialog} />
            )}
          </>
        ) : (
          <>
            <AdministrativeReportDialog
              isOpen={isAdministrativeReportDialogOpen}
              onClose={closeAdministrativeReportDialog}
              matchData={selectedMatchForAdministrativeReport}
            />

            <ViewAdministrativeReportDialog
              isOpen={isViewAdministrativeReportDialogOpen}
              onClose={closeViewAdministrativeReportDialog}
              matchData={selectedMatchForViewAdministrativeReport}
            />

            <SetMatchResultDialog
              isOpen={isResultDialogOpen}
              onClose={closeResultDialog}
              onSave={() => {
                fetchMatches();
                if (selectedMatchForResult) {
                  openPlayerStatsDialog(selectedMatchForResult);
                }
              }}
              matchData={selectedMatchForResult}
            />

            {selectedMatchForTimeline && (
              <MatchTimelineDialog 
                match={selectedMatchForTimeline} 
                onClose={closeTimelineDialog} 
              />
            )}

            <MatchPlayerStatsDialog
              isOpen={isPlayerStatsDialogOpen}
              onClose={closePlayerStatsDialog}
              matchData={selectedMatchForPlayerStats}
            />
          </>
        )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <MobileMatches
          matches={matches}
          isLoading={isLoading}
          actions={{
            add: openAddDialog,
            edit: openEditDialog,
            remove: m => handleDelete(m.id),
            callups: openCallupsDialog,
            lineup: openViewCallupsDialog,
            attendance: m => navigate(`/matches/${m.id}/attendance`),
            result: openResultDialog,
            report: openAdministrativeReportDialog,
            viewReport: openViewAdministrativeReportDialog,
            playerStats: openPlayerStatsDialog,
            timeline: openTimelineDialog,
            setStatus: handleUpdateStatus,
            reschedule: handleReschedule,
          }}
        />
        {dialogs}
      </>
    );
  }

  return (
    <div className="members-container" style={{ margin: '0' }}>
      <div className="members-header">

        <div className="members-actions">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالفريق المنافس..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {can('matches', 'add') && (
            <button className="btn-primary" onClick={openAddDialog}>
              <Plus size={20} /> إضافة مباراة
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="premium-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-dot"></div>
          </div>
          <p>جاري تحميل المباريات...</p>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map((match) => (
          <div key={match.id} className="match-card-new">

            {/* Top Bar */}
            <div className="mc-top-bar">
              <div className="mc-badges">
                <span className="mc-badge mc-badge-orange">
                  <span className="mc-dot"></span>
                  {match.competition || 'الدوري المحلي'}
                </span>
                <span className="mc-badge mc-badge-blue">{match.team?.name || 'الفريق الأول'}</span>
              </div>
              <div className="mc-actions">
                {can('matches', 'delete') && (
                  <button className="mc-icon-btn" onClick={() => handleDelete(match.id)} title="حذف">
                    <Trash2 size={18} />
                  </button>
                )}
                {can('matches', 'edit') && (
                  <button className="mc-icon-btn" onClick={() => openEditDialog(match)} title="تعديل">
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Banner */}
            <div className="mc-banner">
              <div className="mc-team">
                <div className="mc-logo mc-logo-orange" style={{ border: 'none', padding: '0', overflow: 'hidden', background: 'transparent' }}>
                  <img src="/LOGO.webp" alt="أولمبيك ليو" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="mc-team-name">أولمبيك ليو</div>
                {/* <div className="mc-team-sub">النادي</div> */}
              </div>

              <div className="mc-vs-center">
                {match.match_status === 'مؤجلة' ? (
                  <div style={{ position: 'relative' }}>
                    <div
                      className="mc-vs-circle"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', width: 'auto', padding: '4px 16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => {
                        setStatusDropdownOpen(statusDropdownOpen === match.id ? null : match.id);
                        setRescheduleMatchId(null);
                        setRescheduleDate('');
                      }}
                    >
                      مؤجلة
                    </div>
                    {can('matches', 'changeStatus') && statusDropdownOpen === match.id && (
                      <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', border: '1px solid var(--border)', zIndex: 99, minWidth: '200px', overflow: 'hidden' }}>
                        {rescheduleMatchId === match.id ? (
                          /* Date picker inline */
                          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>اختر التاريخ الجديد</div>
                            <input
                              type="datetime-local"
                              value={rescheduleDate}
                              onChange={e => setRescheduleDate(e.target.value)}
                              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleReschedule(match)}
                                disabled={!rescheduleDate}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: rescheduleDate ? 'var(--primary)' : 'var(--border)', color: '#fff', fontWeight: 700, cursor: rescheduleDate ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => { setRescheduleMatchId(null); setRescheduleDate(''); }}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                              >
                                رجوع
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              onClick={() => { setRescheduleMatchId(match.id); setRescheduleDate(match.match_date?.substring(0, 16) || ''); }}
                              style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', color: '#10b981' }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              مباراة قادمة (تعيين التاريخ)
                            </div>
                            <div
                              onClick={() => { handleUpdateStatus(match, 'ملغاة'); }}
                              style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              ملغاة
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : match.match_status === 'ملغاة' ? (
                  <div style={{ position: 'relative' }}>
                    <div
                      className="mc-vs-circle"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 'auto', padding: '4px 16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => setStatusDropdownOpen(statusDropdownOpen === match.id ? null : match.id)}
                    >
                      ملغاة
                    </div>
                    {can('matches', 'changeStatus') && statusDropdownOpen === match.id && (
                      <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', border: '1px solid var(--border)', zIndex: 99, minWidth: '150px', overflow: 'hidden' }}>
                        <div
                          onClick={() => { handleUpdateStatus(match, 'upcoming'); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#10b981' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          إرجاع لمباراة قادمة
                        </div>
                      </div>
                    )}
                  </div>
                ) : match.team_score !== undefined && match.team_score !== null && match.opponent_score !== undefined && match.opponent_score !== null ? (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px', borderRadius: '8px' }}>
                      <div className="mc-vs-circle" style={{ background: 'var(--primary)', color: 'white', width: 'auto', padding: '0 16px', borderRadius: '16px', fontSize: '1.4rem', letterSpacing: '4px', cursor: 'inherit' }}>
                        {match.team_score} - {match.opponent_score}
                      </div>
                      <div className="mc-vs-text" style={{ color: match.team_score > match.opponent_score ? '#10b981' : match.team_score < match.opponent_score ? '#ef4444' : '#64748b', fontWeight: 'bold', cursor: 'inherit' }}>
                        {match.team_score > match.opponent_score ? 'فوز' : match.team_score < match.opponent_score ? 'خسارة' : 'تعادل'}
                      </div>
                    </div>
                    {can('matches', 'report') && (
                      <button 
                        onClick={() => openTimelineDialog(match)}
                        style={{ 
                          background: 'var(--primary)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '6px 16px', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        أحداث المباراة
                      </button>
                    )}
                  </div>
                ) : isMatchLive(match.match_date) ? (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div 
                      className="mc-vs-circle" 
                      onClick={() => setStatusDropdownOpen(statusDropdownOpen === match.id ? null : match.id)}
                      style={{ cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 'auto', padding: '4px 16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span className="mc-live-indicator"></span>
                      مباراة جارية
                    </div>

                    {can('matches', 'report') && (
                      <button 
                        onClick={() => openTimelineDialog(match)}
                        style={{ 
                          background: 'var(--primary)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '6px 16px', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        أحداث المباراة
                      </button>
                    )}

                    {can('matches', 'changeStatus') && statusDropdownOpen === match.id && (
                      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border)', zIndex: 10, minWidth: '160px', overflow: 'hidden' }}>
                        <div 
                          onClick={() => { setStatusDropdownOpen(null); openResultDialog(match); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', color: '#10b981' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          انتهت (تقرير المباراة)
                        </div>
                        <div 
                          onClick={() => { handleUpdateStatus(match, 'مؤجلة'); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', color: '#f59e0b' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          مؤجلة
                        </div>
                        <div 
                          onClick={() => { handleUpdateStatus(match, 'ملغاة'); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ملغاة
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px' }}
                      onClick={() => setStatusDropdownOpen(statusDropdownOpen === match.id ? null : match.id)}
                    >
                      <div className="mc-vs-circle">VS</div>
                      <div className="mc-vs-text">
                        مواجهة قادمة
                      </div>
                    </div>
                    {can('matches', 'changeStatus') && statusDropdownOpen === match.id && (
                      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid var(--border)', zIndex: 99, minWidth: '150px', overflow: 'hidden' }}>
                        <div
                          onClick={() => { handleUpdateStatus(match, 'مؤجلة'); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', color: '#f59e0b' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          مؤجلة
                        </div>
                        <div
                          onClick={() => { handleUpdateStatus(match, 'ملغاة'); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ملغاة
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mc-team">
                <div className="mc-logo mc-logo-blue" style={{ border: (match.opponentClub?.logo || match.opponent_club?.logo) ? 'none' : undefined, background: (match.opponentClub?.logo || match.opponent_club?.logo) ? 'transparent' : undefined, padding: (match.opponentClub?.logo || match.opponent_club?.logo) ? '0' : undefined, overflow: 'hidden' }}>
                  {(match.opponentClub?.logo || match.opponent_club?.logo) ? (
                    <img src={match.opponentClub?.logo || match.opponent_club?.logo} alt={match.opponent} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
                      {match.match_title || 'OPP'}
                    </span>
                  )}
                </div>
                <div className="mc-team-name">{match.opponent || 'خصم غير محدد'}</div>
                {/* <div className="mc-team-sub">المنافس</div> */}
              </div>
            </div>

            {/* Details */}
            <div className="mc-details">

              {/* Date */}
              <div className="mc-detail-row">
                <div className="mc-detail-icon mc-icon-orange">
                  <Calendar size={20} />
                </div>
                <div className="mc-detail-content">
                  <div className="mc-detail-label">موعد اللقاء</div>
                  <div className="mc-detail-value">
                    {match.match_date ? new Date(match.match_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </div>
                  {match.match_date && (
                    <div className="mc-detail-sub mc-sub-orange">
                      <Clock size={12} style={{ marginLeft: '4px' }} />
                      {new Date(match.match_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="mc-detail-row">
                <div className="mc-detail-icon mc-icon-green">
                  <MapPin size={20} />
                </div>
                <div className="mc-detail-content">
                  <div className="mc-detail-label">الملعب والموقع</div>
                  <div className="mc-detail-value">{match.location}</div>
                </div>
              </div>

              {/* Gathering */}
              <div className="mc-detail-split">
                <div className="mc-detail-half">
                  <div className="mc-detail-icon mc-icon-blue">
                    <Clock size={18} />
                  </div>
                  <div className="mc-detail-content">
                    <div className="mc-detail-label">موعد التجمع</div>
                    <div className="mc-detail-value">
                      {match.gathering_time ? new Date(match.gathering_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="mc-detail-half">
                  <div className="mc-detail-icon mc-icon-purple">
                    <MapPin size={18} />
                  </div>
                  <div className="mc-detail-content">
                    <div className="mc-detail-label">مكان التجمع</div>
                    <div className="mc-detail-value">{match.gathering_location || '-'}</div>
                  </div>
                </div>
              </div>
              {/* Attendance Visual Bar */}
              {(() => {
                const stats = match.attendance_stats;
                const total = stats?.total ?? 0;
                const present = stats?.present ?? 0;
                const absent = stats?.absent ?? 0;
                const presentPct = total > 0 ? (present / total) * 100 : 0;
                return (
                  <div className="mc-attendance-bar-wrap">
                    <div className="mc-attendance-bar-header">
                      <span className="mc-attendance-bar-title">الحضور</span>
                      <span className="mc-att-badge mc-att-present">
                        <span className="mc-att-dot mc-att-dot-green"></span>
                        {present}/{total}
                      </span>
                    </div>
                    <div className="mc-attendance-segbar">
                      <div className="mc-att-seg mc-att-seg-green" style={{ width: `${presentPct}%` }}></div>
                    </div>
                    <div className="mc-attendance-bar-footer">
                      <span>{total > 0 ? `${Math.round(presentPct)}٪ نسبة الحضور` : 'لم يُسجّل الحضور بعد'}</span>
                      <span>{absent > 0 ? `${absent} غائب` : ''}</span>
                    </div>
                  </div>
                );
              })()}
            </div>



              {/* View Report Row */}
              {match.team_score !== undefined && match.team_score !== null &&
               match.opponent_score !== undefined && match.opponent_score !== null && (
                <button
                  className="mc-view-report-row"
                  onClick={() => openViewAdministrativeReportDialog(match)}
                >
                  <FileText size={15} />
                  <span>عرض تقرير المباراة</span>
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)', marginRight: 'auto' }} />
                </button>
              )}

            {/* Actions Divider */}
            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0 12px 0', opacity: 0.6 }}></div>

            {/* Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {!(match.team_score !== undefined && match.team_score !== null && match.opponent_score !== undefined && match.opponent_score !== null) && !isMatchLive(match.match_date) && (
                <>
                  {can('matches', 'callups') && (
                    <button className="mc-action-btn" onClick={() => openCallupsDialog(match)}>
                      <Users size={16} /> الاستدعاء
                    </button>
                  )}
                  {can('matches', 'lineup') && (
                    <button className="mc-action-btn" onClick={() => openViewCallupsDialog(match)}>
                      <List size={16} /> التشكيلة
                    </button>
                  )}
                </>
              )}
              
              {(!match.match_date || new Date(match.match_date) <= new Date()) && (
                <>
                  {can('matches', 'attendance') && (
                    <button className="mc-action-btn" onClick={() => navigate(`/matches/${match.id}/attendance`)}>
                      <ClipboardList size={16} /> الحضور
                    </button>
                  )}
                  {can('matches', 'report') && (
                    <button className="mc-action-btn" onClick={() => openResultDialog(match)}>
                      <CheckCircle size={16} /> النتيجة
                    </button>
                  )}

                  {match.team_score !== undefined && match.team_score !== null && match.opponent_score !== undefined && match.opponent_score !== null && (
                    <>
                      {can('matches', 'report') && (
                        <button className="mc-action-btn" onClick={() => openAdministrativeReportDialog(match)}>
                          <FileText size={16} /> التقرير
                        </button>
                      )}
                      {can('matches', 'report') && (
                        <button className="mc-action-btn" onClick={() => openPlayerStatsDialog(match)}>
                          <Activity size={16} /> تقييم اللاعبين
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

          </div>
        ))}
        {filteredMatches.length === 0 && (
          <div className="no-matches">
            <Calendar size={48} style={{ color: 'var(--border)', marginBottom: '8px' }} />
            <h3>لا توجد مباريات</h3>
            <p>{matches.length === 0 ? 'انقر على "إضافة مباراة" لإدراج مباراة جديدة في السجل.' : 'لا توجد نتائج للبحث، جرب اسم فريق مختلف.'}</p>
          </div>
        )}
      </div>
      )}

      {dialogs}
    </div>
  );
};
