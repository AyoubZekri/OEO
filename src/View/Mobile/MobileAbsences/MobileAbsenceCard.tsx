import React from 'react';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import { AbsenceCard } from '../../Screen/Absence/AbsenceCard';
import '../../Screen/Absence/Absence.css';

interface MobileAbsenceCardProps {
  absence: AbsenceRecord;
  hideMember?: boolean;
  onJustify: (id: number) => void;
  onDecide: (id: number, status: 'مقبول' | 'مرفوض') => void;
  onDelete: (id: number) => void;
  /** Personal space: my own record (no delete or decision; justified within 24 hours) */
  personal?: boolean;
  /** Opened from an alert: marked */
  focused?: boolean;
  /** Personal space: the current time, for the 24-hour justification window */
  now?: number;
}

// One record on the phone: the same card as on the computer (same parts, same states, same size)
export const MobileAbsenceCard: React.FC<MobileAbsenceCardProps> = props => <AbsenceCard {...props} />;
