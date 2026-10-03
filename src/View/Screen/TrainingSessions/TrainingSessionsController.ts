import { useState, useEffect } from 'react';
import type { TrainingSessionModel } from './TrainingSessionDialog';
import { TrainingSessionData } from './training_session_data';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
/** personal: the sessions of my category only (personal space), read only */
export const useTrainingSessionsController = ({ personal = false }: { personal?: boolean } = {}) => {
  const [sessions, setSessions] = useState<TrainingSessionModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TrainingSessionModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    if (!personal) fetchTeams();
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
    if (personal) {
      try {
        setSessions(await TrainingSessionData.getMySessions());
      } catch {
        console.error('Failed to fetch my sessions');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    try {
      const data = await TrainingSessionData.getSessions(selectedTeamId);
      
      const dataWithRealStats = await Promise.all(data.map(async (session) => {
        if (session.attendance_stats) return session;

        try {
          const response = await axios.get(
            `${Applink.server}/training-sessions/${session.id}/attendance`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          const players = response.data.players || [];
          const total = players.length;
          const present = players.filter((p: any) => p.status === 'حاضر' || p.status === 'متأخر').length;
          const absent = players.filter((p: any) => p.status === 'غائب غير مبرر' || p.status === 'غائب مبرر').length;
          
          return {
            ...session,
            attendance_stats: { total, present, absent }
          };
        } catch (err) {
          return {
            ...session,
            attendance_stats: { total: 0, present: 0, absent: 0 }
          };
        }
      }));
      
      setSessions(dataWithRealStats);
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
      } catch (error: any) {
        const msg = error.response?.data?.message || error.response?.data?.error || 'حدث خطأ أثناء الحذف';
        const errorString = typeof msg === 'string' ? msg : JSON.stringify(msg);
        
        if (errorString.includes('foreign key constraint fails') || errorString.includes('Integrity constraint violation')) {
          alert('لا يمكن حذف هذه الحصة التدريبية لأنها تحتوي على سجلات غياب/حضور مسجلة للفاعبين. يرجى حذف تلك السجلات أولاً أو تغيير حالة الحصة إلى "ملغاة".');
        } else {
          alert(errorString);
        }
      }
    }
  };

  const handleChangeStatus = async (id: number | undefined, newStatus: string) => {
    if (!id) return;
    
    // Optimistic UI update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    
    try {
      await TrainingSessionData.updateStatus(id, newStatus);
      await fetchSessions();
    } catch (error) {
      alert('حدث خطأ أثناء التحديث');
      await fetchSessions(); // Revert on failure
    }
  };

  return {
    personal,
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
