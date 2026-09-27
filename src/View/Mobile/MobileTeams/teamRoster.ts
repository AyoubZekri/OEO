import { useEffect, useState } from 'react';
import defaultAvatar from '../../../assets/AVETER.png';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../../Screen/Members/members_data';
import { MemberModel } from '../../Screen/Members/member_model';

/** Club members, loaded once for the category counts; null while loading or when not allowed */
export const useClubMembers = (enabled: boolean) => {
  const [members, setMembers] = useState<MemberModel[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    new MembersData(new Crud()).getMembers()
      .then(response => {
        const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        if (active) setMembers(list.map(MemberModel.fromJson));
      })
      .catch(() => { if (active) setMembers([]); });
    return () => { active = false; };
  }, [enabled]);

  return members;
};

export const isPlayer = (m: MemberModel) => m.type === 'player';

export const fullName = (m: MemberModel) => `${m.first_name} ${m.last_name}`.trim();

// The model falls back to a generated ui-avatars URL; use the app's own default image instead
export const memberPhoto = (m: MemberModel) =>
  m.photo && !m.photo.includes('ui-avatars.com') ? m.photo : defaultAvatar;

// Football lines, in the order they are shown
export const LINES: { key: string; title: string; short: string; positions: string[] }[] = [
  { key: 'gk', title: 'حراسة المرمى', short: 'حراسة', positions: ['GK'] },
  { key: 'def', title: 'الدفاع', short: 'دفاع', positions: ['CB', 'SW', 'RB', 'LB', 'RWB', 'LWB'] },
  { key: 'mid', title: 'الوسط', short: 'وسط', positions: ['CDM', 'CM', 'CAM', 'RM', 'LM'] },
  { key: 'att', title: 'الهجوم', short: 'هجوم', positions: ['RW', 'LW', 'SS', 'CF', 'ST'] },
];

/** Arabic count: 1 → "لاعب واحد", 2 → "لاعبان", 3–10 → "3 لاعبين", 11+ → "11 لاعباً" */
export const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : `${n} ${n >= 3 && n <= 10 ? few : many}`;

export const playersText = (n: number) => arCount(n, 'لاعب واحد', 'لاعبان', 'لاعبين', 'لاعباً');
export const staffText = (n: number) => arCount(n, 'مؤطر واحد', 'مؤطران', 'مؤطرين', 'مؤطراً');
export const membersText = (n: number) => arCount(n, 'عضو واحد', 'عضوان', 'أعضاء', 'عضواً');
