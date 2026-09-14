import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { PlayerMedicalRecord } from './medical_model';

export const useMedicalController = () => {
  const [records, setRecords] = useState<PlayerMedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<PlayerMedicalRecord | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(Applink.medicalRecords, {
        headers: { Authorization: Bearer  }
      });
      if (response.data && response.data.status === 'success') {
        setRecords(response.data.data);
      } else {
        setRecords([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching medical records:', err);
      setError('حدث خطأ أثناء جلب الملفات الطبية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openAddDialog = () => {
    setSelectedRecord(null);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (record: PlayerMedicalRecord) => {
    setSelectedRecord(record);
    setIsAddDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملف الطبي؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(Applink.deleteMedicalRecord(id), {}, {
        headers: { Authorization: Bearer  }
      });
      fetchRecords();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return {
    records,
    loading,
    error,
    fetchRecords,
    isAddDialogOpen,
    selectedRecord,
    openAddDialog,
    openEditDialog,
    closeDialogs,
    handleDelete
  };
};
