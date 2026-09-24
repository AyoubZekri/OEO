import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Users, MoreVertical, TrendingUp } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import type { useMembersController } from '../../Screen/Members/MembersController';
import type { MemberModel } from '../../Screen/Members/member_model';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import './MobileMembers.css';

interface MobileMembersProps {
  controller: ReturnType<typeof useMembersController>;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAddEvaluation: (member: MemberModel) => void;
}

const TYPE_LABELS: Record<string, string> = {
  player: 'لاعب',
  coach: 'مدرب',
  assistant_coach: 'مساعد مدرب',
  goalkeeper_coach: 'مدرب حراس',
  physical_trainer: 'محضر بدني',
  employee: 'موظف',
  admin: 'إداري',
  doctor: 'طبيب',
};

const POSITION_LABELS: Record<string, string> = {
  GK: 'حارس مرمى',
  CB: 'قلب دفاع',
  SW: 'ليبرو',
  RB: 'ظهير أيمن',
  LB: 'ظهير أيسر',
  RWB: 'ظهير جناح أيمن',
  LWB: 'ظهير جناح أيسر',
  CDM: 'وسط دفاعي',
  CM: 'وسط محوري',
  CAM: 'صانع ألعاب',
  RM: 'وسط أيمن',
  LM: 'وسط أيسر',
  RW: 'جناح أيمن',
  LW: 'جناح أيسر',
  SS: 'مهاجم ثانٍ',
  CF: 'قلب هجوم',
  ST: 'رأس حربة',
};

// The model falls back to a generated ui-avatars URL; use the app's own default image instead
const getPhoto = (member: MemberModel) =>
  member.photo && !member.photo.includes('ui-avatars.com') ? member.photo : defaultAvatar;

export const MobileMembers: React.FC<MobileMembersProps> = ({ controller, canAdd, canEdit, canDelete, onAddEvaluation }) => {
  const { filteredMembers, searchQuery, setSearchQuery, filterTeamId, setFilterTeamId, teams } = controller;
  const categories = [{ id: '', name: 'الكل' }, ...teams];

  // Member whose actions menu is open; the menu sits inside that card so it scrolls with it
  const [actionMember, setActionMember] = useState<MemberModel | null>(null);
  const [menuUp, setMenuUp] = useState(false);

  useEffect(() => {
    if (!actionMember) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActionMember(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actionMember]);

  // Evaluations are for players only, same as desktop
  const hasActions = (member: MemberModel) => member.type === 'player' || canEdit || canDelete;

  const openMenu = (member: MemberModel, button: HTMLElement) => {
    if (actionMember?.id === member.id) {
      setActionMember(null);
      return;
    }
    const itemCount = (member.type === 'player' ? 1 : 0) + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
    const menuHeight = itemCount * 46 + 12;
    // Open below the button, or above it when it would run under the bottom nav
    setMenuUp(button.getBoundingClientRect().bottom + 6 + menuHeight > window.innerHeight - 96);
    setActionMember(member);
  };

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

      <div className="mm-chips" role="tablist" aria-label="الفئات">
        {categories.map(team => (
          <button
            key={team.id || 'all'}
            role="tab"
            aria-selected={filterTeamId === team.id}
            className={`mm-chip ${filterTeamId === team.id ? 'active' : ''}`}
            onClick={() => setFilterTeamId(team.id)}
          >
            {team.name}
          </button>
        ))}
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
                  {member.position && (
                    <span className="mm-tag">{POSITION_LABELS[member.position] || member.position}</span>
                  )}
                </div>
              </div>

              {hasActions(member) && (
                <button
                  className={`mm-more ${actionMember?.id === member.id ? 'open' : ''}`}
                  onClick={e => openMenu(member, e.currentTarget)}
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
                  <div className={`mm-menu ${menuUp ? 'up' : ''}`} role="menu" aria-label="خيارات العضو">
                    {member.type === 'player' && (
                      <button role="menuitem" className="mm-menu-item eval" onClick={() => runAction(onAddEvaluation)}>
                        <TrendingUp size={17} />
                        إضافة تقييم
                      </button>
                    )}
                    {canEdit && (
                      <button role="menuitem" className="mm-menu-item edit" onClick={() => runAction(controller.openEditMemberDialog)}>
                        <Pencil size={17} />
                        تعديل
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
