import { useState, useEffect } from 'react';
import { EquipmentData } from './equipment_data';
import { Crud } from '../../../core/class/Crud';
import { EquipmentModel } from './equipment_model';

export const useEquipmentController = () => {
  const [equipments, setEquipments] = useState<EquipmentModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const crud = new Crud();
  const equipmentData = new EquipmentData(crud);

  const fetchEquipments = async () => {
    setIsLoading(true);
    const response = await equipmentData.getEquipments();
    if (response) {
      if (Array.isArray(response)) {
        setEquipments(response.map(EquipmentModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setEquipments(response.data.map(EquipmentModel.fromJson));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<EquipmentModel | null>(null);

  const openAddDialog = () => {
    setEquipmentToEdit(null);
    setIsEquipmentDialogOpen(true);
  };

  const openEditDialog = (equipment: EquipmentModel) => {
    setEquipmentToEdit(equipment);
    setIsEquipmentDialogOpen(true);
  };

  const closeDialog = () => {
    setIsEquipmentDialogOpen(false);
    setEquipmentToEdit(null);
  };

  const handleSaveEquipment = async ({ data, imageFile }: { data: Omit<EquipmentModel, 'id' | 'toJson' | 'image' | 'holders'>, imageFile: File | null }) => {
    setIsLoading(true);
    const tempModel = new EquipmentModel({ id: equipmentToEdit?.id || '', ...data });
    const payload = tempModel.toJson();
    delete payload.id;

    if (equipmentToEdit) {
      const response = await equipmentData.editEquipment({ id: equipmentToEdit.id, ...payload }, imageFile);
      if (response && !response.error) {
        fetchEquipments();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء تعديل العتاد');
      }
    } else {
      const response = await equipmentData.addEquipment(payload, imageFile);
      if (response && !response.error) {
        fetchEquipments();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء إضافة العتاد');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العتاد؟')) {
      setIsLoading(true);
      const response = await equipmentData.deleteEquipment(id);
      if (response && !response.error) {
        fetchEquipments();
      } else {
        alert('حدث خطأ أثناء حذف العتاد');
      }
      setIsLoading(false);
    }
  };

  return {
    equipments,
    isEquipmentDialogOpen,
    equipmentToEdit,
    isLoading,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveEquipment,
    handleDeleteEquipment,
  };
};
