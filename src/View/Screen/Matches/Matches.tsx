import React from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, User, Shield, Users, List, FileText, CheckCircle } from 'lucide-react';
import { AddMatchDialog } from './AddMatchDialog';
import { MatchCallupsDialog } from './MatchCallupsDialog';
import { ViewMatchCallupsDialog } from './ViewMatchCallupsDialog';
import { AdministrativeReportDialog } from './AdministrativeReportDialog';
import { ViewAdministrativeReportDialog } from './ViewAdministrativeReportDialog';
import { SetMatchResultDialog } from './SetMatchResultDialog';
import { useMatchesController } from './MatchesController';
import {type Match } from './match_model';
import '../Members/Members.css';
import './Matches.css';

export const Matches = () => {
  const {
    matches,
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
    closeResultDialog
  } = useMatchesController();


  return (
    <div className="members-container" style={{ margin: '0' }}>
      <div className="members-header">
        <h2 className="page-title">سجل المباريات</h2>
        <div className="members-actions">
          <button className="btn-primary" onClick={openAddDialog}>
            <Plus size={20} /> إضافة مباراة
          </button>
        </div>
      </div>

      <div className="matches-grid">
        {matches.map((match) => (
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
                <button className="mc-icon-btn" onClick={() => handleDelete(match.id)} title="حذف">
                  <Trash2 size={18} />
                </button>
                <button className="mc-icon-btn" onClick={() => openEditDialog(match)} title="تعديل">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>

            {/* Banner */}
            <div className="mc-banner">
              <div className="mc-team">
                <div className="mc-logo mc-logo-orange">
                  <span>oeo</span>
                </div>
                <div className="mc-team-name">أولمبيك ليو</div>
                {/* <div className="mc-team-sub">النادي</div> */}
              </div>

              <div className="mc-vs-center">
                {match.match_status === 'مؤجلة' ? (
                  <>
                    <div className="mc-vs-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 'auto', padding: '4px 16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      مؤجلة
                    </div>
                  </>
                ) : match.team_score !== undefined && match.team_score !== null && match.opponent_score !== undefined && match.opponent_score !== null ? (
                  <>
                    <div className="mc-vs-circle" style={{ background: 'var(--primary)', color: 'white', width: 'auto', padding: '0 16px', borderRadius: '16px', fontSize: '1.4rem', letterSpacing: '4px' }}>
                      {match.team_score} - {match.opponent_score}
                    </div>
                    <div className="mc-vs-text" style={{ color: match.team_score > match.opponent_score ? '#10b981' : match.team_score < match.opponent_score ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                      {match.team_score > match.opponent_score ? 'فوز' : match.team_score < match.opponent_score ? 'خسارة' : 'تعادل'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mc-vs-circle">VS</div>
                    <div className="mc-vs-text">مواجهة قادمة</div>
                  </>
                )}
              </div>

              <div className="mc-team">
                <div className="mc-logo mc-logo-blue">
                  <span style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
                    {match.match_title || 'OPP'}
                  </span>
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
            </div>



            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div className="mc-bottom-actions" style={{ marginTop: 0 }}>
                <button className="mc-btn mc-btn-primary" onClick={() => openCallupsDialog(match)}>
                  <Users size={18} /> الاستدعاء
                </button>
                <button className="mc-btn mc-btn-secondary" onClick={() => openViewCallupsDialog(match)}>
                  <List size={18} /> التشكيلة
                </button>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                <button className="mc-btn mc-btn-secondary" onClick={() => openAdministrativeReportDialog(match)} style={{ color: '#0ea5e9', borderColor: 'rgba(14, 165, 233, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="تعديل التقرير">
                  <FileText size={18} /> إضافة التقرير
                </button>
                <button className="mc-btn mc-btn-secondary" onClick={() => openViewAdministrativeReportDialog(match)} style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="عرض التقرير الإداري">
                  <FileText size={18} /> عرض التقرير
                </button>
              </div>
              <button className="mc-btn mc-btn-secondary" onClick={() => openResultDialog(match)} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="تعيين النتيجة">
                <CheckCircle size={18} /> تعيين النتيجة
              </button>
            </div>

          </div>
        ))}
        {matches.length === 0 && (
          <div className="no-matches">
            <Calendar size={48} style={{ color: 'var(--border)', marginBottom: '8px' }} />
            <h3>لا توجد مباريات</h3>
            <p>انقر على "إضافة مباراة" لإدراج مباراة جديدة في السجل.</p>
          </div>
        )}
      </div>

      <AddMatchDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={fetchMatches}
        matchData={editingMatch}
      />

      <MatchCallupsDialog
        isOpen={isCallupsDialogOpen}
        onClose={closeCallupsDialog}
        matchData={selectedMatchForCallup}
      />

      <ViewMatchCallupsDialog
        isOpen={isViewCallupsDialogOpen}
        onClose={closeViewCallupsDialog}
        matchData={selectedMatchForViewCallups}
      />

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
        onSave={fetchMatches}
        matchData={selectedMatchForResult}
      />
    </div>
  );
};
