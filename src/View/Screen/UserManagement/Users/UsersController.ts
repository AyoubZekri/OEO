import { useState, useEffect } from 'react';
import { UsersData } from './users_data';
import { Crud } from '../../../../core/class/Crud';

import { UserModel } from './user_model';

export const useUsersController = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const crud = new Crud();
  const usersData = new UsersData(crud);

  const fetchUsers = async () => {
    setIsLoading(true);
    const response = await usersData.getUsers();
    if (response) {
      if (Array.isArray(response)) {
        setUsers(response.map(UserModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setUsers(response.data.map(UserModel.fromJson));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserModel | null>(null);

  const openAddDialog = () => {
    setUserToEdit(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: UserModel) => {
    setUserToEdit(user);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setUserToEdit(null);
  };

  const handleSaveUser = async (userData: Omit<UserModel, 'id' | 'toJson'>) => {
    setIsLoading(true);
    const tempModel = new UserModel({ id: userToEdit?.id || '', ...userData });
    const payload = tempModel.toJson();
    delete payload.id;

    if (userToEdit) {
      const response = await usersData.editUser({ id: userToEdit.id, ...payload });
      if (response && !response.error) {
        fetchUsers();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء تعديل المستخدم');
      }
    } else {
      const response = await usersData.addUser(payload);
      if (response && !response.error) {
        fetchUsers();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء إضافة المستخدم');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      setIsLoading(true);
      const response = await usersData.deleteUser(id);
      if (response && !response.error) {
        fetchUsers();
      } else {
        alert('حدث خطأ أثناء حذف المستخدم');
      }
      setIsLoading(false);
    }
  };

  return {
    users,
    isDialogOpen,
    userToEdit,
    isLoading,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveUser,
    handleDeleteUser,
  };
};
