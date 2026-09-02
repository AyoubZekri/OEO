import { useState } from 'react';
import type { TrainingSessionModel } from './TrainingSessionDialog';

export const useTrainingSessionsController = () => {
  const [sessions, setSessions] = useState<TrainingSessionModel[]>([
    { id: 1, date: '2024-05-12', location: 'القاعة الرئيسية', start: '10:00', end: '12:00', status: 'مكتملة' },
    { id: 2, date: '2024-05-14', location: 'الملعب المفتوح', start: '16:00', end: '18:30', status: 'جارية' },
    { id: 3, date: '2024-05-16', location: 'المسبح الأولمبي', start: '08:00', end: '10:00', status: 'مجدولة' },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TrainingSessionModel | null>(null);

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

  const handleSaveSession = (session: TrainingSessionModel) => {
    if (session.id) {
      setSessions(sessions.map(s => s.id === session.id ? { ...session, id: s.id } : s));
    } else {
      setSessions([...sessions, { ...session, id: Math.random() }]);
    }
    closeDialog();
  };

  const handleDeleteSession = (id?: number) => {
    if (id && window.confirm('هل أنت متأكد من حذف هذه الحصة التدريبية؟')) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  const handleChangeStatus = (id: number | undefined, newStatus: string) => {
    if (!id) return;
    setSessions(sessions.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  return {
    sessions,
    isDialogOpen,
    sessionToEdit,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveSession,
    handleDeleteSession,
    handleChangeStatus,
  };
};
