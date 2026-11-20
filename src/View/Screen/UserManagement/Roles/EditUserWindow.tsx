import React, { useEffect, useRef } from 'react';
import { useUsersController } from '../Users/UsersController';
import { UserDialog } from '../Users/UserDialog';
import { MobileUserForm } from '../../../Mobile/MobileUsers/MobileUserForm';

/**
 * «تعديل المستخدم» from the role's window (a member's ⋮): the users page's edit window, without the role (it stays this
 * one). Above the role's window; closes once saved or cancelled.
 */
export const EditUserWindow: React.FC<{ userId: string; mobile: boolean; onClose: () => void }> = ({ userId, mobile, onClose }) => {
  const c = useUsersController();
  const opened = useRef(false);

  // Once the accounts are loaded: this one's edit window
  useEffect(() => {
    if (opened.current) return;
    const user = c.users.find(u => String(u.id) === userId);
    if (user) c.openEditDialog(user);
  }, [c.users, userId]); // eslint-disable-line react-hooks/exhaustive-deps -- once, when the accounts come
  useEffect(() => {
    if (c.isDialogOpen) opened.current = true;
    else if (opened.current) onClose();
  }, [c.isDialogOpen, onClose]);

  if (!c.isDialogOpen || !c.userToEdit) return null;
  // Out of the role's form (a form in a form): its own submit stays its own
  return (
    <div onSubmit={e => e.stopPropagation()}>
      {mobile ? (
        <MobileUserForm user={c.userToEdit} roles={[]} saving={c.isLoading} onSave={c.handleSaveUser} onClose={c.closeDialog} hideRole />
      ) : (
        <UserDialog isOpen userToEdit={c.userToEdit} onClose={c.closeDialog} onSave={c.handleSaveUser} hideRole />
      )}
    </div>
  );
};
