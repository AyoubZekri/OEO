import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { PlayerMedicalRecord } from './medical_model';

export const useMedicalController = () => {
  const [records, setRecords] = useState<PlayerMedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isViewInitialExamDialogOpen, setIsViewInitialExamDialogOpen] = useState<boolean>(false);
  const [isViewFinalDecisionDialogOpen, setIsViewFinalDecisionDialogOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<PlayerMedicalRecord | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [recordsRes, indsRes] = await Promise.all([
        axios.get(Applink.medicalRecords, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(Applink.individuals, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);
      
      let fetchedRecords = [];
      if (recordsRes.data && recordsRes.data.status === 'success') {
        fetchedRecords = recordsRes.data.data;
      } else if (Array.isArray(recordsRes.data)) {
        fetchedRecords = recordsRes.data;
      } else if (recordsRes.data && Array.isArray(recordsRes.data.data)) {
        fetchedRecords = recordsRes.data.data;
      }

      if (indsRes && indsRes.data) {
        const allInds = Array.isArray(indsRes.data) ? indsRes.data : (indsRes.data.data || []);
        fetchedRecords = fetchedRecords.map((record: any) => {
           // Handle if backend returns the object inside player_id/doctor_id
           if (!record.player && record.player_id && typeof record.player_id === 'object') {
             record.player = record.player_id;
             record.player_id = record.player.id;
           } else if (!record.player && record.player_id) {
             record.player = allInds.find((ind: any) => ind.id == record.player_id) || null;
           }
           
           if (!record.doctor && record.doctor_id && typeof record.doctor_id === 'object') {
             record.doctor = record.doctor_id;
             record.doctor_id = record.doctor.id;
           } else if (!record.doctor && record.doctor_id) {
             record.doctor = allInds.find((ind: any) => ind.id == record.doctor_id) || null;
           }
           return record;
        });
      }

      console.log('Raw Records API Response:', recordsRes.data);
      console.log('Final Mapped Records (JSON):', JSON.parse(JSON.stringify(fetchedRecords)));

      setRecords(fetchedRecords);
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

  const [dialogMode, setDialogMode] = useState<'injury' | 'initial_exam' | 'final_exam' | 'return_decision'>('injury');

  const openAddDialog = () => {
    setSelectedRecord(null);
    setDialogMode('injury');
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (record: PlayerMedicalRecord, mode: 'injury' | 'initial_exam' | 'final_exam' | 'return_decision' = 'injury') => {
    setSelectedRecord(record);
    setDialogMode(mode);
    setIsAddDialogOpen(true);
  };

  const openViewInitialExamDialog = (record: PlayerMedicalRecord) => {
    setSelectedRecord(record);
    setIsViewInitialExamDialogOpen(true);
  };

  const openViewFinalDecisionDialog = (record: PlayerMedicalRecord) => {
    setSelectedRecord(record);
    setIsViewFinalDecisionDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsViewInitialExamDialogOpen(false);
    setIsViewFinalDecisionDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملف الطبي؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(Applink.deleteMedicalRecord(id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecords();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteInitialExam = async (record: PlayerMedicalRecord) => {
    if (!window.confirm('هل أنت متأكد من حذف الفحص الأولي؟ سيتم التراجع عن الحالة إلى مفتوح/مصاب.')) return;
    try {
      const token = localStorage.getItem('token');
      const payload: any = { ...record };
      payload.diagnosis = null;
      payload.initial_recommendation = null;
      payload.record_status = 'مفتوح/مصاب';
      delete payload.player;
      delete payload.doctor;
      delete payload.created_at;
      delete payload.updated_at;

      await axios.post(Applink.updateMedicalRecord(record.id), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecords();
    } catch (err) {
      console.error('Error deleting initial exam:', err);
      alert('حدث خطأ أثناء حذف الفحص الأولي');
    }
  };

  const handleDeleteFinalDecision = async (record: PlayerMedicalRecord) => {
    if (!window.confirm('هل أنت متأكد من حذف القرار النهائي؟ سيتم التراجع عن الحالة إلى بانتظار الفحص النهائي.')) return;
    try {
      const token = localStorage.getItem('token');
      const payload: any = { ...record };
      payload.medical_decision = null;
      payload.restrictions = null;
      payload.last_exam_date = null;
      payload.record_status = 'بانتظار الفحص النهائي';
      delete payload.player;
      delete payload.doctor;
      delete payload.created_at;
      delete payload.updated_at;

      await axios.post(Applink.updateMedicalRecord(record.id), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecords();
      setIsViewFinalDecisionDialogOpen(false);
    } catch (err) {
      console.error('Error deleting final decision:', err);
      alert('حدث خطأ أثناء حذف القرار النهائي');
    }
  };


  return {
    records,
    loading,
    error,
    fetchRecords,
    isAddDialogOpen,
    isViewInitialExamDialogOpen,
    isViewFinalDecisionDialogOpen,
    selectedRecord,
    dialogMode,
    openAddDialog,
    openEditDialog,
    openViewInitialExamDialog,
    openViewFinalDecisionDialog,
    closeDialogs,
    handleDelete,
    handleDeleteInitialExam,
    handleDeleteFinalDecision
  };
};
