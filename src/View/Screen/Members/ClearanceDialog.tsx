import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import type { MemberModel } from './member_model';
import { ClearanceBoard } from './ClearanceBoard';
import { useClearance } from './useClearance';
import './Clearance.css';

interface ClearanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: MemberModel;
  /** Something changed (the members list refreshes: status, "leaving") */
  onUpdate?: () => void;
}

/** Desktop clearance card ("الإخلاء والمغادرة") of a member, in three steps */
export const ClearanceDialog: React.FC<ClearanceDialogProps> = ({ isOpen, onClose, player, onUpdate }) => {
  const can = useCan();
  const cl = useClearance(Number(player.id), { onChanged: onUpdate });

  if (!isOpen) return null;

  return createPortal(
    <div className="clr-dialog-overlay" onClick={onClose}>
      <div className="clr-dialog" role="dialog" aria-modal="true" aria-label="الإخلاء والمغادرة" onClick={e => e.stopPropagation()}>
        <header className="clr-dialog-head">
          <span><LogOut size={20} /></span>
          <h2>الإخلاء والمغادرة</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>
        <div className="clr-dialog-body">
          <ClearanceBoard player={player} cl={cl} can={can} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
