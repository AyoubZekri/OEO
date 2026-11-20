import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMembersController } from '../../Members/MembersController';
import { MobileMemberForm } from '../../../Mobile/MobileMembers/MobileMemberForm';
import './AddMemberWindow.css';

/**
 * «إضافة» from the role's window: the members' add form, with the account's email and password too (as on the users
 * page). The new account comes ticked, so it takes this role when the role is saved.
 * A window on a computer, a full page on a phone, above the role's window; closes once saved or cancelled.
 */
export const AddMemberWindow: React.FC<{ mobile: boolean; onClose: () => void }> = ({ mobile, onClose }) => {
  const c = useMembersController();
  const opened = useRef(false);

  useEffect(() => { c.setAccountMode(true); c.openAddMemberDialog(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on opening
  useEffect(() => {
    if (c.isAddMemberOpen) opened.current = true;
    else if (opened.current) onClose();
  }, [c.isAddMemberOpen, onClose]);

  if (!c.isAddMemberOpen) return null;
  // Out of the role's form (a form in a form): its own submit stays its own
  const form = <MobileMemberForm controller={c} />;
  const stop = { onSubmit: (e: React.SyntheticEvent) => e.stopPropagation() };
  return createPortal(
    mobile ? (
      <div className="amw-phone" {...stop}>{form}</div>
    ) : (
      <div className="amw-desk-modal" {...stop} onMouseDown={e => { if (e.target === e.currentTarget) c.closeAddMemberDialog(); }}>
        {form}
      </div>
    ),
    document.body,
  );
};
