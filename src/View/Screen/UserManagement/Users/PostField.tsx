import React from 'react';
import { Briefcase } from 'lucide-react';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { MobileSelect } from '../../../Mobile/widgets/MobileSelect';
import { TYPE_LABELS } from '../../../Mobile/MobileMembers/memberLabels';
import './UserDialog.css';

/** The staff's posts: every type but «لاعب» (the same as the member form's) */
const STAFF_POSTS = Object.entries(TYPE_LABELS).filter(([v]) => v !== 'player').map(([value, label]) => ({ value, label }));

/**
 * A user's post: the staff's only (the players stay on the members page). The app's dropdown: a list on a computer,
 * a bottom sheet on a phone. value '' : not chosen yet.
 */
export const PostField: React.FC<{ value: string; onChange: (type: string) => void; mobile: boolean }> = ({ value, onChange, mobile }) => {
  // A player's account (added on the members page) keeps «لاعب» as it is
  const options = value === 'player' ? [{ value: 'player', label: 'لاعب' }, ...STAFF_POSTS] : STAFF_POSTS;
  return mobile ? (
    <MobileSelect label="المنصب" icon={Briefcase} value={value} options={options} onChange={onChange} placeholder="اختر المنصب" />
  ) : (
    <CustomDropdown<string> value={value} options={options} onChange={onChange} placeholder="اختر المنصب" />
  );
};
