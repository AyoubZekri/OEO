import React, { useState } from 'react';
import { Shirt, Pencil, Search, Users, ShieldCheck } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import type { TeamModel } from '../../Screen/Teams/team_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { TYPE_LABELS, POSITION_LABELS } from '../MobileMembers/memberLabels';
import { LINES, isPlayer, fullName, memberPhoto, playersText, staffText } from './teamRoster';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileTeamDetails.css';

interface MobileTeamDetailsProps {
  team: TeamModel;
  /** Members of the category; null while they load */
  roster: MemberModel[] | null;
  onEdit?: () => void;
  onClose: () => void;
}

const POSITION_ORDER = LINES.flatMap(line => line.positions);
const STAFF_ORDER = ['coach', 'assistant_coach', 'goalkeeper_coach', 'physical_trainer', 'doctor', 'admin', 'employee'];

const rank = (order: string[], value: string) => {
  const i = order.indexOf(value);
  return i === -1 ? order.length : i;
};

const byName = (a: MemberModel, b: MemberModel) => fullName(a).localeCompare(fullName(b), 'ar');

// Players by position, then shirt number; staff by role
const byPosition = (a: MemberModel, b: MemberModel) =>
  rank(POSITION_ORDER, a.position) - rank(POSITION_ORDER, b.position)
  || (a.Shirt_number ?? 999) - (b.Shirt_number ?? 999)
  || byName(a, b);
const byRole = (a: MemberModel, b: MemberModel) => rank(STAFF_ORDER, a.type) - rank(STAFF_ORDER, b.type) || byName(a, b);

const MemberRow: React.FC<{ member: MemberModel }> = ({ member }) => (
  <div className="mtd-row">
    <img src={memberPhoto(member)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
    <span className="mtd-row-text">
      <strong>{fullName(member)}</strong>
      <small>
        {isPlayer(member) ? POSITION_LABELS[member.position] || 'بدون مركز' : TYPE_LABELS[member.type] || member.type}
        {member.status && member.status !== 'active' && <em>غير نشط</em>}
      </small>
    </span>
    {isPlayer(member) && member.Shirt_number != null && (
      <span className="mtd-number" aria-label={`رقم القميص ${member.Shirt_number}`}>{member.Shirt_number}</span>
    )}
  </div>
);

// Members of one category (phone): players by line, staff by role
export const MobileTeamDetails: React.FC<MobileTeamDetailsProps> = ({ team, roster, onEdit, onClose }) => {
  const [tab, setTab] = useState<'players' | 'staff'>('players');
  const [query, setQuery] = useState('');

  const players = (roster || []).filter(isPlayer);
  const staff = (roster || []).filter(m => !isPlayer(m));
  const q = query.trim().toLowerCase();
  const matches = (m: MemberModel) => !q || fullName(m).toLowerCase().includes(q);

  // Players grouped by line; positions outside the four lines go last
  const groups = tab === 'players'
    ? [
      ...LINES.map(line => ({ key: line.key, title: line.title, members: players.filter(p => line.positions.includes(p.position)) })),
      { key: 'other', title: 'بدون مركز', members: players.filter(p => !POSITION_ORDER.includes(p.position)) },
    ]
    : [{ key: 'staff', title: 'الطاقم الفني والإداري', members: staff }];
  const shown = groups
    .map(g => ({ ...g, members: g.members.filter(matches).sort(tab === 'players' ? byPosition : byRole) }))
    .filter(g => g.members.length > 0);

  const tabList = tab === 'players' ? players : staff;

  return (
    <MobileScreen
      title="تفاصيل الفئة"
      onBack={onClose}
      footer={onEdit && (
        <button type="button" className="me-btn primary" onClick={onEdit}>
          <Pencil size={18} /> تعديل الفئة
        </button>
      )}
    >
      <section className="mtd-hero">
        <div className="mtd-hero-top">
          <span className="mtd-hero-icon"><Shirt size={28} /></span>
          <div className="mtd-hero-title">
            <small>فئة</small>
            <strong>{team.name}</strong>
            {roster && <span>{[playersText(players.length), staffText(staff.length)].join(' · ')}</span>}
          </div>
        </div>

        {/* How many players on each line */}
        {roster && players.length > 0 && (
          <div className="mtd-lines">
            {LINES.map(line => (
              <div key={line.key}>
                <strong>{players.filter(p => line.positions.includes(p.position)).length}</strong>
                <small>{line.short}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {roster === null ? (
        <MobileLoader text="جاري تحميل الأعضاء..." />
      ) : (
        <>
          <div className="mtd-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'players'} className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>
              <Users size={16} /> اللاعبون <span>{players.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'staff'} className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>
              <ShieldCheck size={16} /> الطاقم <span>{staff.length}</span>
            </button>
          </div>

          {tabList.length > 0 && (
            <label className="mtd-search">
              <Search size={17} />
              <input type="search" placeholder="ابحث بالاسم..." value={query} onChange={e => setQuery(e.target.value)} />
            </label>
          )}

          {tabList.length === 0 ? (
            <div className="mtd-empty">
              {tab === 'players' ? <Users size={36} /> : <ShieldCheck size={36} />}
              <p>{tab === 'players' ? 'لا يوجد لاعبون في هذه الفئة' : 'لا يوجد طاقم في هذه الفئة'}</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="mtd-empty"><Search size={32} /><p>لا توجد نتائج</p></div>
          ) : shown.map(group => (
            <section key={group.key} className="mtd-group">
              <h3>{group.title} <span>{group.members.length}</span></h3>
              <div className="mtd-group-list">
                {group.members.map(m => <MemberRow key={m.id} member={m} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </MobileScreen>
  );
};
