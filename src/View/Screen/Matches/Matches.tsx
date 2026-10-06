import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import axios from 'axios';
import { Plus, Calendar, Search } from 'lucide-react';
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
import { MatchCard, MatchDetailsWindow } from '../../Mobile/MobileMatches/MatchCard';
import { useMatchNow } from '../../Mobile/MobileMatches/useMatchNow';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import type { MatchActions } from '../../Mobile/MobileMatches/matchActions';
import { matchState } from '../../Mobile/MobileMatches/matchUtils';
import '../Members/Members.css';
import './Matches.css';

/** personal: the personal space's page (the matches of my category, read only, with my call-up and attendance) */
export const Matches = ({ personal = false }: { personal?: boolean }) => {
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
    selectedMatchForTimeline,
    openTimelineDialog,
    closeTimelineDialog,
    isPlayerStatsDialogOpen,
    selectedMatchForPlayerStats,
    openPlayerStatsDialog,
    closePlayerStatsDialog
  } = useMatchesController({ personal });

  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  // Personal space: read only, every management action is hidden
  const allowed = useCan();
  const can: typeof allowed = (...args) => !personal && allowed(...args);
  // Desktop: ?match=ID (from "عرض التفاصيل" or an alert) opens that match's details in a window
  const [detailsId, setDetailsId] = useUrlDetails('match');
  const now = useMatchNow();
  const details = !isMobile && detailsId ? matches.find(m => String(m.id) === detailsId) : undefined;
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
      }
    } catch (error) {
      console.error('Error updating match status:', error);
      alert('حدث خطأ أثناء تحديث حالة المباراة');
    }
  };

  const handleReschedule = async (match: Match, date: string) => {
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
      }
    } catch (error) {
      console.error('Error rescheduling match:', error);
      alert('حدث خطأ أثناء إعادة جدولة المباراة');
    }
  };

  // What a match's menu and details can do (phone page and desktop cards)
  const actions: MatchActions = {
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
          personal={personal}
          actions={actions}
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
        <div className="matches-grid mmt-vars">
          {/* The phone's match card; its details open from "عرض التفاصيل" (⋮), in a window */}
          {filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              id={`match-card-${match.id}`}
              className={detailsId === String(match.id) ? 'focused' : ''}
              match={match}
              state={matchState(match, now)}
              actions={actions}
              allowed={action => can('matches', action)}
              onOpen={() => setDetailsId(match.id)}
              tapToOpen={false}
              personal={personal}
            />
          ))}
        {filteredMatches.length === 0 && (
          <div className="no-matches">
            <Calendar size={48} style={{ color: 'var(--border)', marginBottom: '8px' }} />
            <h3>لا توجد مباريات</h3>
            <p>{matches.length === 0 ? (personal ? 'لا توجد مباريات لفئتك.' : 'انقر على "إضافة مباراة" لإدراج مباراة جديدة في السجل.') : 'لا توجد نتائج للبحث، جرب اسم فريق مختلف.'}</p>
          </div>
        )}
      </div>
      )}

      {details && (
        <MatchDetailsWindow
          match={details}
          state={matchState(details, now)}
          now={now}
          actions={actions}
          personal={personal}
          onClose={() => setDetailsId(null)}
        />
      )}

      {dialogs}
    </div>
  );
};
