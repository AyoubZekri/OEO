import { useState } from 'react';
import { permissionsForPost, emptyPermissions, type AppPermissions } from './role_model';

/** A member tapped in the role's window: their permissions are the ones shown and changed there */
export interface FocusedMember {
  id: string;
  name: string;
  own: AppPermissions | null;
  /** Their post (the member's type) */
  type?: string | null;
  /** The one using the app: their permissions are shown, never changed (by themselves) */
  self?: boolean;
  /** The role's other members (their post, their saved permissions): one of the same post is copied */
  peers?: { id: string; type?: string | null; own: AppPermissions | null }[];
}

/** A member's permissions as changed in the window: their own, or null (back to the role's) */
export type MemberChanges = Record<string, AppPermissions | null>;

const copy = (p: AppPermissions): AppPermissions => JSON.parse(JSON.stringify(p));

/**
 * The role's window, one member at a time: tapping a linked member shows their permissions in the same place as the
 * role's (their own, or the role's to start from); a change there is theirs only. Saved with the role.
 */
export const useMemberPerms = (rolePerms: AppPermissions) => {
  const [focus, setFocus] = useState<FocusedMember | null>(null);
  const [changes, setChanges] = useState<MemberChanges>({});

  const baseOf = (c: MemberChanges, m: FocusedMember) => (m.id in c ? c[m.id] ?? rolePerms : m.own ?? rolePerms);
  /** What is shown: the member's (when one is tapped) */
  const current = focus ? baseOf(changes, focus) : null;
  /** The tapped member has permissions of their own (not the role's) */
  const isOwn = focus ? (focus.id in changes ? changes[focus.id] !== null : focus.own !== null) : false;

  /** A change, for the tapped member only */
  const edit = (fn: (p: AppPermissions) => AppPermissions) => {
    if (!focus || focus.self) return;
    const m = focus;
    setChanges(c => ({ ...c, [m.id]: fn(copy(baseOf(c, m))) }));
  };
  /** The tapped member back to the role's permissions */
  const resetToRole = () => { if (focus) setChanges(c => ({ ...c, [focus.id]: null })); };

  /**
   * A member tapped, the same when adding or editing a role. Their own (as saved) kept to their post's groups; else
   * those of a member of the same post in the role (set here, or saved) — the same as theirs; else nothing on, only
   * their post's groups shown. That is what they get once saved.
   */
  const focusOn = (m: FocusedMember | null) => {
    setFocus(m);
    if (!m || m.self) return;
    setChanges(c => {
      if (m.id in c) return c;
      const samePost = (m.peers || []).filter(p => p.type === m.type);
      const fromPeer = samePost.map(p => (p.id in c ? c[p.id] : p.own)).find(Boolean) || null;
      const kept = m.own
        ? permissionsForPost(m.own, m.type, true)
        : fromPeer ? JSON.parse(JSON.stringify(fromPeer)) as AppPermissions : JSON.parse(JSON.stringify(emptyPermissions)) as AppPermissions;
      // Their own already only in their groups: nothing to change
      if (m.own && JSON.stringify(kept) === JSON.stringify(m.own)) return c;
      return { ...c, [m.id]: kept };
    });
  };

  return { focus, setFocus: focusOn, current, isOwn, edit, resetToRole, changes, reset: () => { setFocus(null); setChanges({}); } };
};
