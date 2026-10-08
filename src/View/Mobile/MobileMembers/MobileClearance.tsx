import React from 'react';
import { MobileScreen } from '../widgets/MobileScreen';
import { useCan } from '../../../core/functions/useCan';
import type { MemberModel } from '../../Screen/Members/member_model';
import { ClearanceBoard } from '../../Screen/Members/ClearanceBoard';
import { useClearance } from '../../Screen/Members/useClearance';

interface MobileClearanceProps {
  player: MemberModel;
  onClose: () => void;
  /** Something changed (the members list refreshes: status, "leaving") */
  onUpdate?: () => void;
}

/** Phone clearance card ("الإخلاء والمغادرة"): the same three steps as the desktop dialog, in a full screen */
export const MobileClearance: React.FC<MobileClearanceProps> = ({ player, onClose, onUpdate }) => {
  const can = useCan();
  const cl = useClearance(Number(player.id), { onChanged: onUpdate });

  return (
    <MobileScreen title="الإخلاء والمغادرة" onBack={onClose}>
      <div className="clr-mobile-wrap">
        <ClearanceBoard player={player} cl={cl} can={can} variant="mobile" />
      </div>
    </MobileScreen>
  );
};
