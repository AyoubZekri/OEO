import { useState, useEffect } from 'react';
import type { TrainingSessionModel } from './TrainingSessionDialog';
import { TrainingSessionData } from './training_session_data';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
export const useTrainingSessionsController = () => {
  const [sessions, setSessions] = useState<TrainingSessionModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TrainingSessionModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${Applink.server}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await TrainingSessionData.getSessions(selectedTeamId);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setSessionToEdit(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (session: TrainingSessionModel) => {
    setSessionToEdit(session);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSessionToEdit(null);
  };

  const handleSaveSession = async (session: TrainingSessionModel) => {
    try {
      await TrainingSessionData.saveSession(session);
      await fetchSessions();
      closeDialog();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDeleteSession = async (id?: number) => {
    if (id && window.confirm('هل أنت متأكد من حذف هذه الحصة التدريبية؟')) {
      try {
        await TrainingSessionData.deleteSession(id);
        await fetchSessions();
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleChangeStatus = async (id: number | undefined, newStatus: string) => {
    if (!id) return;
    try {
      await TrainingSessionData.updateStatus(id, newStatus);
      await fetchSessions();
    } catch (error) {
      alert('حدث خطأ أثناء التحديث');
    }
  };

  return {
    sessions,
    isDialogOpen,
    sessionToEdit,
    isLoading,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveSession,
    handleDeleteSession,
    handleChangeStatus,
  };
};
