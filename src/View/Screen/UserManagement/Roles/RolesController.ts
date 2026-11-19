import { showAlert } from '../../../shared/appDialog';
import { useState, useEffect } from 'react';
import { RolesData } from './roles_data';
import { Crud } from '../../../../core/class/Crud';

import { RoleModel, serializePermissions } from './role_model';
import type { MemberChanges } from './useMemberPerms';
import { confirmDelete } from '../../../shared/confirmDelete';
import client from '../../../../core/api/client';

/** A section of the roles page */
export interface RoleSection { id: string; name: string }

const errorText = (e: unknown, fallback: string) => {
  const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' && msg ? msg : fallback;
};

export const useRolesController = () => {
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const crud = new Crud();
  const rolesData = new RolesData(crud);

  const fetchRoles = async () => {
    setIsLoading(true);
    const response = await rolesData.getRoles();
    if (response) {
      if (Array.isArray(response)) {
        setRoles(response.map(RoleModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setRoles(response.data.map(RoleModel.fromJson));
      }
    }
    setIsLoading(false);
  };

  // The page's sections: listed on top; a role is dragged (computer) or moved (phone) into one
  const [sections, setSections] = useState<RoleSection[]>([]);
  const fetchSections = async () => {
    try {
      const res = await client.get('/role-sections');
      setSections((Array.isArray(res.data) ? res.data : []).map((s: { id: number; name: string }) => ({ id: String(s.id), name: s.name })));
    } catch {
      setSections([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchSections();
  }, []);

  /** A new section, or a renamed one: null when done, else the server's reason */
  const saveSection = async (name: string, id?: string): Promise<string | null> => {
    try {
      if (id) await client.post('/role-sections/update', { id: Number(id), name });
      else await client.post('/role-sections/create', { name });
      await fetchSections();
      return null;
    } catch (e) {
      return errorText(e, 'تعذر حفظ القسم');
    }
  };

  /** One or several sections (their roles stay, in no section) */
  const deleteSections = async (ids: string[]) => {
    try {
      await client.post('/role-sections/delete', { ids: ids.map(Number) });
      setSections(list => list.filter(s => !ids.includes(s.id)));
      setRoles(list => list.map(r => (ids.includes(r.sectionId) ? Object.assign(Object.create(Object.getPrototypeOf(r)), r, { sectionId: '' }) : r)));
    } catch (e) {
      showAlert(errorText(e, 'تعذر حذف القسم'));
    }
  };

  /** A role into a section ('' : none); shown at once, put back if the server refuses */
  const moveRole = async (roleId: string, sectionId: string) => {
    const before = roles.find(r => r.id === roleId)?.sectionId ?? '';
    if (before === sectionId) return;
    const withSection = (to: string) => setRoles(list => list.map(r => (r.id === roleId ? Object.assign(Object.create(Object.getPrototypeOf(r)), r, { sectionId: to }) : r)));
    withSection(sectionId);
    try {
      await client.post('/role-sections/move', { role_id: Number(roleId), section_id: sectionId ? Number(sectionId) : null });
    } catch (e) {
      withSection(before);
      showAlert(errorText(e, 'تعذر نقل الدور'));
    }
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleModel | null>(null);
  const [roleToView, setRoleToView] = useState<RoleModel | null>(null);

  const openAddDialog = () => {
    setRoleToEdit(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: RoleModel) => {
    setRoleToEdit(role);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setRoleToEdit(null);
  };

  const openViewDialog = (role: RoleModel) => {
    setRoleToView(role);
  };

  const closeViewDialog = () => {
    setRoleToView(null);
  };

  /** The members' permissions changed in the window: their own, or null (back to the role's) */
  const saveMemberPermissions = async (changes: MemberChanges) => {
    for (const [id, perms] of Object.entries(changes)) {
      try {
        await client.post('/users/permissions', { id: Number(id), permissions: perms ? serializePermissions(perms) : null });
      } catch (e) {
        showAlert(errorText(e, 'تعذر حفظ صلاحيات أحد الأعضاء'));
      }
    }
  };

  /**
   * userIds: the role's users, when they were chosen in the window (null: left as they are);
   * memberChanges: some of them given their own permissions (or back to the role's), saved once the role is
   */
  const handleSaveRole = async (roleData: Omit<RoleModel, 'id' | 'toJson' | 'sectionId'>, userIds: string[] | null = null, memberChanges: MemberChanges = {}) => {
    setIsLoading(true);
    // Create a temporary RoleModel object to use its toJson method
    const tempModel = new RoleModel({ id: roleToEdit?.id || '', ...roleData });
    const payload = tempModel.toJson();
    // Exclude id from payload since it's sometimes sent in the URL or body depending on API, but for add we just send payload
    delete payload.id;
    if (userIds) payload.user_ids = userIds.map(Number);

    if (roleToEdit) {
      const response = await rolesData.editRole({ id: roleToEdit.id, ...payload });
      if (response && !response.error) {
        await saveMemberPermissions(memberChanges);
        fetchRoles();
        closeDialog();
      } else {
        showAlert('حدث خطأ أثناء تعديل الدور');
      }
    } else {
      const response = await rolesData.addRole(payload);
      if (response && !response.error) {
        await saveMemberPermissions(memberChanges);
        fetchRoles();
        closeDialog();
      } else {
        showAlert('حدث خطأ أثناء إضافة الدور');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteRole = async (id: string) => {
    if (await confirmDelete('حذف الدور؟')) {
      setIsLoading(true);
      const response = await rolesData.deleteRole(id);
      if (response && !response.error) {
        fetchRoles();
      } else {
        showAlert('حدث خطأ أثناء حذف الدور');
      }
      setIsLoading(false);
    }
  };

  return {
    roles,
    sections, saveSection, deleteSections, moveRole,
    isDialogOpen,
    roleToEdit,
    isLoading,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveRole,
    handleDeleteRole,
    roleToView,
    openViewDialog,
    closeViewDialog,
  };
};
