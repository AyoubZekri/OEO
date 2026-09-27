import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Shirt, Users, ChevronLeft, UserX } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { useTeamsController } from '../../Screen/Teams/TeamsController';
import type { TeamModel } from '../../Screen/Teams/team_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { useClubMembers, isPlayer, memberPhoto, playersText, staffText, membersText } from './teamRoster';
import { MobileTeamDetails } from './MobileTeamDetails';
import { MobileTeamForm } from './MobileTeamForm';
import './MobileTeams.css';

interface MobileTeamsProps {
  controller: ReturnType<typeof useTeamsController>;
  can: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    /** Member names and photos are shown only to users who may see the members */
    viewMembers: boolean;
  };
}

const AVATARS_SHOWN = 5;

// "18 لاعباً · 3 مؤطرين"
const rosterSummary = (roster: MemberModel[]) => {
  const players = roster.filter(isPlayer).length;
  const staff = roster.length - players;
  if (!roster.length) return 'لا يوجد أعضاء بعد';
  return [players && playersText(players), staff && staffText(staff)].filter(Boolean).join(' · ');
};

// Phone version of the team categories page: summary, one card per category, details and form on their own pages
export const MobileTeams: React.FC<MobileTeamsProps> = ({ controller, can }) => {
  const members = useClubMembers(can.viewMembers);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const { teams } = controller;

  // Members of each category, by team id
  const byTeam = useMemo(() => {
    const map = new Map<string, MemberModel[]>();
    (members || []).forEach(m => {
      if (m.team_id) map.set(m.team_id, [...(map.get(m.team_id) || []), m]);
    });
    return map;
  }, [members]);

  // Looked up by id so a rename shows at once; closes by itself if the category is deleted
  const detailsTeam = detailsId ? teams.find(t => t.id === detailsId) : undefined;
  const editing = controller.teamToEdit;

  const inTeams = teams.flatMap(t => byTeam.get(t.id) || []);
  const totalPlayers = inTeams.filter(isPlayer).length;
  const unassigned = members ? members.length - inTeams.length : 0;

  const menuItems = (team: TeamModel): MobileRowMenuItem[] => [
    ...(can.viewMembers ? [{ key: 'view', label: 'عرض الأعضاء', icon: Users, color: '#f97316', onClick: () => setDetailsId(team.id) }] : []),
    ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => controller.openEditDialog(team) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => controller.handleDeleteTeam(team.id) }] : []),
  ];

  return (
    <div className="mt-page">
      <MobileAppBar title="فئات الفرق" />

      {controller.isLoading && !controller.isDialogOpen ? (
        <MobileLoader text="جاري تحميل الفئات..." />
      ) : teams.length === 0 ? (
        <div className="mt-empty">
          <span className="mt-empty-icon"><Shirt size={40} /></span>
          <strong>لا توجد فئات بعد</strong>
          <p>أنشئ فئات النادي (الفريق الأول، U21، U19...) ثم وزّع الأعضاء عليها.</p>
          {can.add && (
            <button type="button" className="mt-empty-btn" onClick={controller.openAddDialog}>
              <Plus size={18} /> إضافة أول فئة
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary */}
          <section className="mt-hero">
            <div className="mt-hero-top">
              <span className="mt-hero-icon"><Shirt size={26} /></span>
              <div>
                <small>فئات النادي</small>
                <strong>{teams.length}</strong>
              </div>
            </div>
            {can.viewMembers && (
              <div className="mt-stats">
                <div>
                  <strong>{members ? totalPlayers : '…'}</strong>
                  <small>اللاعبون</small>
                </div>
                <div>
                  <strong>{members ? inTeams.length - totalPlayers : '…'}</strong>
                  <small>المؤطرون</small>
                </div>
                <div>
                  <strong>{members ? inTeams.length : '…'}</strong>
                  <small>الأعضاء</small>
                </div>
              </div>
            )}
            {unassigned > 0 && (
              <p className="mt-hero-note"><UserX size={14} /> {membersText(unassigned)} بدون فئة</p>
            )}
          </section>

          {/* Categories */}
          <div className="mt-list">
            {teams.map(team => {
              const roster = byTeam.get(team.id) || [];
              const open = can.viewMembers ? () => setDetailsId(team.id) : undefined;
              return (
                <article
                  key={team.id}
                  className={`mt-card ${open ? 'clickable' : ''}`}
                  role={open ? 'button' : undefined}
                  tabIndex={open ? 0 : undefined}
                  onClick={open}
                  onKeyDown={e => { if (open && e.key === 'Enter') open(); }}
                >
                  <div className="mt-card-top">
                    <span className="mt-badge"><Shirt size={22} /></span>
                    <div className="mt-card-text">
                      <strong>{team.name}</strong>
                      {can.viewMembers && (members
                        ? <small>{rosterSummary(roster)}</small>
                        : <span className="mt-skeleton" aria-hidden="true" />)}
                    </div>
                    <MobileRowMenu items={menuItems(team)} label="إجراءات الفئة" />
                  </div>

                  {members && roster.length > 0 && (
                    <div className="mt-card-bottom">
                      <div className="mt-avatars">
                        {roster.slice(0, AVATARS_SHOWN).map(m => (
                          <img key={m.id} src={memberPhoto(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                        ))}
                        {roster.length > AVATARS_SHOWN && <span>+{roster.length - AVATARS_SHOWN}</span>}
                      </div>
                      <span className="mt-open">عرض الأعضاء <ChevronLeft size={16} /></span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {can.add && teams.length > 0 && (
        <button type="button" className="mt-fab" onClick={controller.openAddDialog} aria-label="إضافة فئة" title="إضافة فئة">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {detailsTeam && (
        <MobileTeamDetails
          team={detailsTeam}
          roster={members ? byTeam.get(detailsTeam.id) || [] : null}
          onEdit={can.edit ? () => controller.openEditDialog(detailsTeam) : undefined}
          onClose={() => setDetailsId(null)}
        />
      )}

      {controller.isDialogOpen && (
        <MobileTeamForm
          key={editing?.id || 'new'}
          team={editing}
          otherNames={teams.filter(t => t.id !== editing?.id).map(t => t.name)}
          memberCount={editing && members ? (byTeam.get(editing.id) || []).length : null}
          isSaving={controller.isLoading}
          onSave={name => controller.handleSaveTeam({ name })}
          onClose={controller.closeDialog}
        />
      )}
    </div>
  );
};
