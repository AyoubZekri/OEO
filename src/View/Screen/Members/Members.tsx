import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMembersController } from './MembersController';
import { Eye, X, Plus, CheckCircle2, Edit2, Trash2, LogOut, TrendingUp, FileSpreadsheet, Shirt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Approutes } from '../../../core/constant/routes';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { EvaluationDialog } from './Evaluation/EvaluationDialog';
import { BulkEvaluationDialog } from './Evaluation/BulkEvaluationDialog';
import { EvaluationHistoryDialog } from './Evaluation/EvaluationHistoryDialog';
import type { EvaluationRecord } from './Evaluation/evaluation_data';
import { ClearanceDialog } from './ClearanceDialog';
import { MobileMembers } from '../../Mobile/MobileMembers/MobileMembers';
import { ActionsMenu } from '../../widget/ActionsMenu';
import { MobileMemberForm } from '../../Mobile/MobileMembers/MobileMemberForm';
import { MobileEvaluationForm } from '../../Mobile/MobileMembers/MobileEvaluationForm';
import { MobileEvaluationHistory } from '../../Mobile/MobileEvaluations/MobileEvaluationHistory';
import { MobileClearance } from '../../Mobile/MobileMembers/MobileClearance';
import { MobileTrackingRecord } from '../../Mobile/MobileMembers/MobileTrackingRecord';
import { TrackingRecordDialog } from './TrackingRecordDialog';
import { useIsMobile } from '../../../core/functions/useIsMobile';

import { useAuth } from '../../../core/context/AuthContext';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { MemberModel } from './member_model';
import '../UserManagement/Roles/AddMemberWindow.css';
import './Members.css';
import '../Disciplinary/Disciplinary.css';
import { useBackCloses } from '../../Mobile/widgets/useBackCloses';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { StateIcon } from '../../widget/StateIcon';
import { MemberDetails } from './MemberDetails';

export const Members: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const navigate = useNavigate();
  const controller = useMembersController();
  const isMobile = useIsMobile();

  // ?member=ID (from a birthday task): that member's record opens once the list is there
  const [params, setParams] = useSearchParams();
  const askedMember = params.get('member');
  const { members: allMembers, openExpensesDialog: openRecord } = controller;
  useEffect(() => {
    if (!askedMember || !allMembers.length) return;
    const member = allMembers.find(m => String(m.id) === askedMember);
    if (member) openRecord(member);
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('member');
      return next;
    }, { replace: true });
  }, [askedMember, allMembers, openRecord, setParams]);
  const {
    filteredMembers,
    searchQuery,
    setSearchQuery,
    filterTeamId,
    setFilterTeamId,
    teams,
    selectedMember,
    isDialogOpen,
    isAddMemberOpen,
    openAddMemberDialog,
    openEditMemberDialog,
    closeAddMemberDialog,
    handleDeleteMember,
    openExpensesDialog,
    closeDialog,
    isClearanceDialogOpen,
    selectedClearanceMember,
    openClearanceDialog,
    closeClearanceDialog,
  } = controller;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [evalMember, setEvalMember] = useState<MemberModel | null>(null);
  // The active players' group evaluation from Excel
  const [bulkOpen, setBulkOpen] = useState(false);
  // The member whose details are open (a tap on their row or card)
  const [viewingMember, setViewingMember] = useState<MemberModel | null>(null);
  const activePlayers = controller.members
    .filter(m => m.type === 'player' && m.status === 'active')
    .map(m => ({ id: String(m.id), name: `${m.first_name} ${m.last_name}`.trim(), team: m.team_name || '' }));
  /** The tracking record's evaluations tab (players): each evaluation's actions there; only it without the record's permission */
  const recordEvaluations = (member: MemberModel) => (member.type === 'player' ? {
    evaluations: {
      onEdit: hasAccess(permissions.members.evaluate) ? (ev: EvaluationRecord) => setEditingEvaluation({ player: member, data: ev }) : undefined,
      onDelete: hasAccess(permissions.members.evaluate) ? (id: string) => controller.deleteEvaluation(id) : undefined,
      // Read again after a save, an edit or a delete
      refreshKey: `${controller.evaluations.map(e => `${e.id}:${e.totalScore}`).join(',')}-${evalMember ? 'add' : ''}-${editingEvaluation ? 'edit' : ''}`,
    },
    onlyEvaluations: !hasAccess(permissions.members.viewFinancialRecord),
  } : {});
  const [editingEvaluation, setEditingEvaluation] = useState<{player: MemberModel, data: any} | null>(null);


  const closeEvaluationForm = () => {
    setEvalMember(null);
    setEditingEvaluation(null);
  };

  // Desktop: every member window (add / edit, tracking record, evaluation, evaluations, clearance) closes with the
  // browser's back and the page stays; windows open one over another close one by one
  // (the phone's full-screen pages do the same by themselves)
  useBackCloses(closeDialog, isMobile || !isDialogOpen);
  useBackCloses(controller.closeEvalHistory, isMobile || !controller.evalHistoryMember);
  useBackCloses(closeClearanceDialog, isMobile || !isClearanceDialogOpen);
  useBackCloses(closeEvaluationForm, isMobile || !(evalMember || editingEvaluation));

  // Shared by the desktop dialog and the phone form
  const saveEvaluationForm = (data: any) => {
    const date = new Date().toISOString().split('T')[0];
    if (editingEvaluation) {
      controller.updateEvaluation({
        id: editingEvaluation.data.id,
        member_id: Number(editingEvaluation.player.id),
        evalDate: editingEvaluation.data.evalDate,
        season: data.season,
        period: data.period,
        fromDate: data.period === 'شهري' ? data.fromDate : '',
        toDate: data.period === 'شهري' ? data.toDate : '',
        totalScore: data.totalScore,
        recommendation: data.recommendation,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        scores: data.scores
      });
      setEditingEvaluation(null);
    } else if (evalMember) {
      controller.saveEvaluation({
        member_id: Number(evalMember.id),
        season: data.season,
        period: data.period,
        fromDate: data.period === 'شهري' ? data.fromDate : '',
        toDate: data.period === 'شهري' ? data.toDate : '',
        evalDate: date,
        totalScore: data.totalScore,
        recommendation: data.recommendation,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        scores: data.scores
      });
      setEvalMember(null);
    }
  };

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string, memberId?: string | number) => {
    // A clearance card still open: the member is leaving
    const card = memberId != null ? controller.leavingOf(memberId) : undefined;
    if (card && status === 'active') {
      return <span className="badge badge-amber">في طور المغادرة</span>;
    }
    if (status === 'active') return <span className="badge badge-green">{t('members.active', 'نشط')}</span>;
    if (status === 'suspended') return <span className="badge badge-red">{t('members.suspended', 'موقوف')}</span>;
    return <span className="badge badge-red">{t('members.inactive', 'غير نشط')}</span>;
  };

  const filterTeamOptions = [
    { value: '', label: t('members.all_teams', 'جميع الفئات (الفرق)') },
    { value: 'kind:players', label: 'كل اللاعبين' },
    ...teams.filter(team => team.kind !== 'staff').map(team => ({ value: team.id.toString(), label: `— ${team.name}` })),
    { value: 'kind:staff', label: 'كل الطاقم' },
    ...teams.filter(team => team.kind === 'staff').map(team => ({ value: team.id.toString(), label: `— ${team.name}` })),
  ];

  return (
    <div className="members-container">
      {/* Phone layout */}
      <div className="members-mobile">
        <MobileMembers
          onView={setViewingMember}
          onAddEvaluation={setEvalMember}
          onBulkEvaluate={hasAccess(permissions.members.evaluate) ? () => setBulkOpen(true) : undefined}
          controller={controller}
          canAdd={hasAccess(permissions.members.add)}
          canEdit={hasAccess(permissions.members.edit)}
          canDelete={hasAccess(permissions.members.delete)}
          canViewRecord={hasAccess(permissions.members.viewFinancialRecord)}
        />
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="members-desktop">
      <div className="members-header">


        <div className="members-actions">
          <TopbarSearch value={searchQuery} onChange={v => setSearchQuery(v)} placeholder={t('members.search_placeholder', 'ابحث بالاسم أو المنصب...')} />
          <CustomDropdown<string>
            value={filterTeamId}
            options={filterTeamOptions}
            onChange={(val) => setFilterTeamId(val)}
            placeholder={t('members.all_teams', 'جميع الفئات (الفرق)')}
          />
          {/* Computer: the teams' page is reached from here (no longer in its sidebar) */}
          {hasAccess(permissions.teams.view) && (
            <button type="button" className="members-teams-btn" onClick={() => navigate(Approutes.Teams)}>
              <Shirt size={18} />
              فئات الفرق
            </button>
          )}
          {hasAccess(permissions.members.evaluate) && (
            <button className="import-excel-btn" onClick={() => setBulkOpen(true)}>
              <FileSpreadsheet size={18} />
              تقييم جماعي (Excel)
            </button>
          )}
          {hasAccess(permissions.members.add) && (
            <button className="btn-primary" onClick={openAddMemberDialog}>
              <Plus size={18} />
              {t('members.add_member', 'إضافة عضو')}
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="members-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('members.photo', 'الصورة')}</th>
                <th>{t('members.name', 'الاسم واللقب')}</th>
                <th>{t('members.type', 'المنصب')}</th>
                <th>{t('members.jersey', 'رقم القميص')}</th>
                <th>{t('members.team', 'الفريق')}</th>
                <th>{t('members.status', 'الحالة')}</th>
                <th>{t('members.internal_system', 'النظام الداخلي')}</th>
                <th>{t('members.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {controller.isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div className="loading-container">
                      <div className="premium-loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-dot"></div>
                      </div>
                      <p className="loading-text">جاري تحميل الأعضاء...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedMembers.map(member => (
                <tr
                  key={member.id}
                  className="member-row member-row-open"
                  tabIndex={0}
                  onClick={() => setViewingMember(member)}
                  onKeyDown={e => { if (e.key === 'Enter') setViewingMember(member); }}
                >
                  <td data-label={t('members.photo', 'الصورة')} className="avatar-cell">
                    {member.photo && member.photo !== '' && !member.photo.includes('default') ? (
                      <img src={member.photo} alt={member.first_name} className="member-avatar" />
                    ) : (
                      <div className="member-avatar placeholder">
                        {member.first_name?.charAt(0) || ''}{member.last_name?.charAt(0) || ''}
                      </div>
                    )}
                  </td>
                  <td data-label={t('members.name', 'الاسم واللقب')} className="member-name-cell">
                    {member.first_name} {member.last_name}
                  </td>
                  <td data-label={t('members.type', 'المنصب')}>
                    {member.type === 'player' ? 'لاعب' : member.type === 'coach' ? 'مدرب' : member.type === 'assistant_coach' ? 'مساعد مدرب' : member.type === 'goalkeeper_coach' ? 'مدرب حراس' : member.type === 'physical_trainer' ? 'محضر بدني' : member.type === 'equipment_manager' ? 'مسؤول العتاد' : member.type === 'admin' ? 'إداري' : member.type === 'doctor' ? 'طبيب' : member.type === 'employee' ? 'موظف' : member.type}
                  </td>
                  <td data-label={t('members.jersey', 'رقم القميص')} className="jersey-cell">
                    {member.Shirt_number ? <span className="jersey-number">{member.Shirt_number}</span> : '-'}
                  </td>
                  <td data-label={t('members.team', 'الفريق')}>{member.team_name || '-'}</td>
                  <td data-label={t('members.status', 'الحالة')}>{getStatusBadge(member.status, member.id)}</td>
                  <td data-label={t('members.internal_system', 'النظام الداخلي')}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {member.is_internal_system_printed ? (
                        <div
                          title="تمت طباعة النظام الداخلي"
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#ecfdf5', color: '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
                            border: '1px solid #a7f3d0'
                          }}>
                          <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div
                          title="لم تتم الطباعة"
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#f8fafc', color: '#cbd5e1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed #e2e8f0'
                          }}>
                          <X size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td data-label={t('members.actions', 'إجراءات')} className="actions-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    <ActionsMenu
                      label="إجراءات العضو"
                      items={[
                        { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#3b82f6', onClick: () => setViewingMember(member) },
                        ...(member.type === 'player' && hasAccess(permissions.members.evaluate) ? [{ key: 'eval', label: 'إضافة تقييم', icon: TrendingUp, color: '#8b5cf6', onClick: () => setEvalMember(member) }] : []),
                        // The record holds the player's evaluations too: open to whoever can see the record or a player's evaluations
                        ...(hasAccess(permissions.members.viewFinancialRecord) || member.type === 'player' ? [
                          { key: 'record', label: 'سجل المتابعة', icon: Eye, color: '#10b981', onClick: () => openExpensesDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.edit) ? [
                          { key: 'edit', label: 'تعديل', icon: Edit2, color: '#3b82f6', onClick: () => openEditMemberDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.clearance) ? [
                          { key: 'clearance', label: 'الإخلاء والمغادرة', icon: LogOut, color: '#f59e0b', onClick: () => openClearanceDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.delete) ? [
                          { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => handleDeleteMember(member.id) },
                        ] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8}><StateIcon /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={filteredMembers.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
      </div>

      {/* Add/Edit Member: full-screen form on phones */}
      {/* Add / edit a member: the same form everywhere — a window on the computer (as from the roles), a page on phones */}
      {isAddMemberOpen && (isMobile ? <MobileMemberForm controller={controller} /> : createPortal(
        <div className="amw-desk-modal" onMouseDown={e => { if (e.target === e.currentTarget) closeAddMemberDialog(); }}>
          <MobileMemberForm controller={controller} />
        </div>,
        document.body,
      ))}

      {bulkOpen && <BulkEvaluationDialog players={activePlayers} onClose={() => setBulkOpen(false)} onDone={() => undefined} />}

      {/* A member's details: a window on the computer, a page on phones */}
      {viewingMember && (
        <MemberDetails
          member={viewingMember}
          mobile={isMobile}
          leaving={Boolean(controller.leavingOf(viewingMember.id))}
          onEdit={hasAccess(permissions.members.edit) ? () => { const m = viewingMember; setViewingMember(null); openEditMemberDialog(m); } : undefined}
          onClose={() => setViewingMember(null)}
        />
      )}

      {/* Tracking Record: full-screen page on phones */}
      {isDialogOpen && selectedMember && isMobile && (
        <MobileTrackingRecord member={selectedMember} controller={controller} onClose={closeDialog} {...recordEvaluations(selectedMember)} />
      )}

      {/* Tracking Record Dialog */}
      {isDialogOpen && selectedMember && !isMobile && (
        <TrackingRecordDialog member={selectedMember} controller={controller} onClose={closeDialog} {...recordEvaluations(selectedMember)} />
      )}

      {/* Evaluation Dialog */}
      {(evalMember || editingEvaluation) && (isMobile ? (
        // Full-screen form on phones
        <MobileEvaluationForm
          player={(evalMember || editingEvaluation?.player)!}
          initialData={editingEvaluation?.data}
          onClose={closeEvaluationForm}
          onSave={saveEvaluationForm}
        />
      ) : (
        <EvaluationDialog
          player={evalMember || editingEvaluation?.player}
          initialData={editingEvaluation?.data}
          onClose={closeEvaluationForm}
          onSave={saveEvaluationForm}
        />
      ))}

      {/* Evaluation History Dialog */}
      {controller.evalHistoryMember && (isMobile ? (
        // Full-screen archive on phones
        <MobileEvaluationHistory
          player={controller.evalHistoryMember}
          evaluations={controller.evaluations}
          onClose={controller.closeEvalHistory}
          onEdit={(ev) => setEditingEvaluation({ player: controller.evalHistoryMember!, data: ev })}
          onDelete={(id) => controller.deleteEvaluation(id)}
        />
      ) : (
        <EvaluationHistoryDialog
          player={controller.evalHistoryMember}
          evaluations={controller.evaluations}
          onClose={controller.closeEvalHistory}
          onEdit={(ev) => setEditingEvaluation({ player: controller.evalHistoryMember!, data: ev })}
          onDelete={(id) => controller.deleteEvaluation(id)}
        />
      ))}

      {isClearanceDialogOpen && selectedClearanceMember && (isMobile ? (
        // Full-screen clearance card on phones
        <MobileClearance
          player={selectedClearanceMember}
          onClose={closeClearanceDialog}
          onUpdate={controller.fetchMembers}
        />
      ) : (
        <ClearanceDialog
          isOpen={isClearanceDialogOpen}
          onClose={closeClearanceDialog}
          player={selectedClearanceMember}
          onUpdate={controller.fetchMembers}
        />
      ))}

    </div>
  );
};
