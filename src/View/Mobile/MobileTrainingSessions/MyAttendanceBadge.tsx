import React from 'react';
import { UserCheck, UserX, Clock, ShieldCheck, Hourglass } from 'lucide-react';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import { computedStatus, myAttendance } from './sessionUtils';
import './MyAttendanceBadge.css';

const ICONS = { present: UserCheck, late: Clock, excused: ShieldCheck, absent: UserX };

/** Personal space: my attendance in the session ("لم تبدأ بعد" before it ends, nothing when cancelled) */
export const MyAttendanceBadge: React.FC<{ session: TrainingSessionModel; now: Date }> = ({ session, now }) => {
  const mine = myAttendance(session, now);
  if (!mine) {
    if (computedStatus(session, now) === 'ملغاة') return null;
    return <span className="my-att-badge pending"><Hourglass size={13} /> لم تنتهِ بعد</span>;
  }
  const Icon = ICONS[mine.tone];
  return <span className={`my-att-badge ${mine.tone}`}><Icon size={13} /> {mine.label}</span>;
};
