import { useState, useEffect } from 'react';
import { RolesData } from './roles_data';
import { Crud } from '../../../../core/class/Crud';

import { RoleModel } from './role_model';

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

  useEffect(() => {
    fetchRoles();
  }, []);
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

  const handleSaveRole = async (roleData: Omit<RoleModel, 'id' | 'toJson'>) => {
    setIsLoading(true);
    // Create a temporary RoleModel object to use its toJson method
    const tempModel = new RoleModel({ id: roleToEdit?.id || '', ...roleData });
    const payload = tempModel.toJson();
    // Exclude id from payload since it's sometimes sent in the URL or body depending on API, but for add we just send payload
    delete payload.id;
    
    if (roleToEdit) {
      const response = await rolesData.editRole({ id: roleToEdit.id, ...payload });
      if (response && !response.error) {
        fetchRoles();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء تعديل الدور');
      }
    } else {
      const response = await rolesData.addRole(payload);
      if (response && !response.error) {
        fetchRoles();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء إضافة الدور');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      setIsLoading(true);
      const response = await rolesData.deleteRole(id);
      if (response && !response.error) {
        fetchRoles();
      } else {
        alert('حدث خطأ أثناء حذف الدور');
      }
      setIsLoading(false);
    }
  };

  return {
    roles,
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
