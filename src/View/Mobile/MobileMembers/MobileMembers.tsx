import React, { useEffect, useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Search, Plus, Pencil, Trash2, Users, MoreVertical, TrendingUp, LogOut, FileText, Briefcase, ChevronDown } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import type { useMembersController } from '../../Screen/Members/MembersController';
import type { MemberModel } from '../../Screen/Members/member_model';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { revealMenu, menuPositionUnder } from '../widgets/revealMenu';
import { TYPE_LABELS, POSITION_LABELS } from './memberLabels';
import './MobileMembers.css';

interface MobileMembersProps {
  controller: ReturnType<typeof useMembersController>;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewRecord: boolean;
  onAddEvaluation: (member: MemberModel) => void;
}

// The model falls back to a generated ui-avatars URL; use the app's own default image instead
const getPhoto = (member: MemberModel) =>
  member.photo && !member.photo.includes('ui-avatars.com') ? member.photo : defaultAvatar;

export const MobileMembers: React.FC<MobileMembersProps> = ({ controller, canAdd, canEdit, canDelete, canViewRecord, onAddEvaluation }) => {
  const can = useCan();
  const { filteredMembers, searchQuery, setSearchQuery, filterTeamId, setFilterTeamId, teams } = controller;
  // The filter's kind: chosen whole ('kind:…') or through one of its categories
  const chosenTeam = teams.find(t => t.id === filterTeamId);
  const activeKind = filterTeamId.startsWith('kind:') ? filterTeamId.slice(5) : chosenTeam?.kind || '';
  const kindButton = (kind: 'staff' | 'players', label: string, Icon: typeof Users) => {
    const list = teams.filter(t => (kind === 'staff' ? t.kind === 'staff' : t.kind !== 'staff'));
    const active = activeKind === kind;
    return (
      <MobileSelect
        label={label}
        icon={Icon}
        value={filterTeamId}
        // "كل الأعضاء" brings everyone back (there is no "all" button)
        options={[{ value: '', label: 'كل الأعضاء' }, { value: `kind:${kind}`, label: `كل ${label}` }, ...list.map(t => ({ value: t.id, label: t.name }))]}
        onChange={setFilterTeamId}
        renderTrigger={open => (
          <button type="button" className={`mm-kind ${active ? 'active' : ''}`} onClick={open}>
            <Icon size={16} />
            <span>{active && chosenTeam ? chosenTeam.name : label}</span>
            <ChevronDown size={14} />
          </button>
        )}
      />
    );
  };

  // Member whose actions menu is open; the menu sits inside that card so it scrolls with it
  const [actionMember, setActionMember] = useState<MemberModel | null>(null);
  // Menu position under the ⋮ button, measured when it opens
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!actionMember) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActionMember(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actionMember]);

  // Evaluations are for players only, same as desktop
  const hasActions = (member: MemberModel) => member.type === 'player' || canViewRecord || canEdit || canDelete || can('members', 'clearance');

  const openMenu = (member: MemberModel) =>
    setActionMember(current => (current?.id === member.id ? null : member));

  const runAction = (action: (member: MemberModel) => void) => {
    const member = actionMember;
    setActionMember(null);
    if (member) action(member);
  };

  return (
    <div className="mm-page">
      <MobileAppBar title="الأعضاء" />

      <label className="mm-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="ابحث عن عضو..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </label>

      {/* The staff or the players: each opens its categories from the bottom */}
      <div className="mm-kinds" role="group" aria-label="الفئات">
        {kindButton('staff', 'الطاقم', Briefcase)}
        {kindButton('players', 'اللاعبين', Users)}
      </div>

      {controller.isLoading ? (
        <MobileLoader text="جاري تحميل الأعضاء..." />
      ) : filteredMembers.length === 0 ? (
        <div className="mm-state">
          <Users size={40} />
          <p>لا يوجد أعضاء مطابقين للبحث</p>
        </div>
      ) : (
        <div className="mm-list">
          {filteredMembers.map(member => (
            <article key={member.id} className="mm-card">
              <div className="mm-photo">
                <img
                  src={getPhoto(member)}
                  alt={`${member.first_name} ${member.last_name}`}
                  loading="lazy"
                  onError={e => {
                    if (e.currentTarget.src !== defaultAvatar) e.currentTarget.src = defaultAvatar;
                  }}
                />
                {member.Shirt_number && <span className="mm-number">{member.Shirt_number}</span>}
              </div>

              <div className="mm-info">
                <h2 className="mm-name">{member.first_name} {member.last_name}</h2>
                <div className="mm-tags">
                  <span className="mm-tag type">{TYPE_LABELS[member.type] || member.type}</span>
                  {controller.leavingOf(member.id) && member.status === 'active' && <span className="mm-tag leaving">في طور المغادرة</span>}
                  {member.position && (
                    <span className="mm-tag">{POSITION_LABELS[member.position] || member.position}</span>
                  )}
                </div>
              </div>

              {hasActions(member) && (
                <button
                  className={`mm-more ${actionMember?.id === member.id ? 'open' : ''}`}
                  onClick={e => {
                    if (actionMember?.id !== member.id) setMenuPos(menuPositionUnder(e.currentTarget, 170)); // .mm-menu width
                    openMenu(member);
                  }}
                  aria-label="خيارات العضو"
                  aria-haspopup="menu"
                  aria-expanded={actionMember?.id === member.id}
                  title="خيارات"
                >
                  <MoreVertical size={20} />
                </button>
              )}

              {actionMember?.id === member.id && (
                <>
                  <div className="mm-menu-backdrop" onClick={() => setActionMember(null)} />
                  <div ref={revealMenu} className="mm-menu" style={menuPos} role="menu" aria-label="خيارات العضو">
                    {member.type === 'player' && can('members', 'evaluate') && (
                      <button role="menuitem" className="mm-menu-item eval" onClick={() => runAction(onAddEvaluation)}>
                        <TrendingUp size={17} />
                        إضافة تقييم
                      </button>
                    )}
                    {/* The record holds the player's evaluations too */}
                    {(canViewRecord || member.type === 'player') && (
                      <button role="menuitem" className="mm-menu-item record" onClick={() => runAction(controller.openExpensesDialog)}>
                        <FileText size={17} />
                        سجل المتابعة
                      </button>
                    )}
                    {canEdit && (
                      <button role="menuitem" className="mm-menu-item edit" onClick={() => runAction(controller.openEditMemberDialog)}>
                        <Pencil size={17} />
                        تعديل
                      </button>
                    )}
                    {can('members', 'clearance') && (
                      <button role="menuitem" className="mm-menu-item clearance" onClick={() => runAction(controller.openClearanceDialog)}>
                        <LogOut size={17} />
                        الإخلاء والمغادرة
                      </button>
                    )}
                    {canDelete && (
                      <button role="menuitem" className="mm-menu-item delete" onClick={() => runAction(m => controller.handleDeleteMember(m.id))}>
                        <Trash2 size={17} />
                        حذف
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {canAdd && (
        <button className="mm-fab" onClick={controller.openAddMemberDialog} aria-label="إضافة عضو" title="إضافة عضو">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
