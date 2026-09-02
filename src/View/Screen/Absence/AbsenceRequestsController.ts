import { useState } from 'react';

export interface AbsenceRequest {
  id: number;
  playerName: string;
  type: 'غياب' | 'تأخر' | 'مغادرة مبكرة';
  date: string;
  duration?: string;
  reason: string;
  status: 'قيد الانتظار' | 'مقبول' | 'مرفوض';
  submittedAt: string;
}

export interface AbsenceJustification {
  id: number;
  playerName: string;
  absenceDate: string;
  reason: string;
  hasAttachment: boolean;
  status: 'قيد الانتظار' | 'مقبول' | 'مرفوض';
  submittedAt: string;
}

export interface HistoricalAbsence {
  id: number;
  playerName: string;
  date: string;
  sessionName: string;
  isJustified: boolean;
  justificationText?: string;
  justificationStatus: 'none' | 'pending' | 'accepted' | 'rejected';
}

export const useAbsenceRequestsController = () => {
  const [activeTab, setActiveTab] = useState<'registry' | 'requests'>('requests');

  const [requests, setRequests] = useState<AbsenceRequest[]>([
    {
      id: 1,
      playerName: 'ياسين براهيمي',
      type: 'تأخر',
      date: '2023-11-15',
      duration: '30 دقيقة',
      reason: 'ازدحام مروري شديد',
      status: 'قيد الانتظار',
      submittedAt: 'منذ ساعتين'
    },
    {
      id: 2,
      playerName: 'أحمد بن علي',
      type: 'غياب',
      date: '2023-11-16',
      reason: 'أسباب عائلية طارئة',
      status: 'مقبول',
      submittedAt: 'منذ يوم'
    }
  ]);

  const [justifications, setJustifications] = useState<AbsenceJustification[]>([
    {
      id: 1,
      playerName: 'محمد الأمين',
      absenceDate: '2023-11-10',
      reason: 'مرض مفاجئ (يوجد شهادة طبية)',
      hasAttachment: true,
      status: 'قيد الانتظار',
      submittedAt: 'منذ يومين'
    }
  ]);

  const [historicalAbsences, setHistoricalAbsences] = useState<HistoricalAbsence[]>([
    {
      id: 1,
      playerName: 'خالد مرزوق',
      date: '2023-11-12',
      sessionName: 'حصة تدريب مسائية',
      isJustified: true,
      justificationText: 'عذر عائلي قاهر',
      justificationStatus: 'accepted'
    },
    {
      id: 2,
      playerName: 'محمد الأمين',
      date: '2023-11-14',
      sessionName: 'حصة تدريب صباحية',
      isJustified: false,
      justificationStatus: 'none'
    },
    {
      id: 3,
      playerName: 'ياسين براهيمي',
      date: '2023-11-05',
      sessionName: 'حصة تكتيكية',
      isJustified: true,
      justificationText: 'شهادة طبية (إصابة طفيفة)',
      justificationStatus: 'pending'
    }
  ]);

  const [isJustificationDialogOpen, setIsJustificationDialogOpen] = useState(false);
  const [selectedAbsenceForJustification, setSelectedAbsenceForJustification] = useState<number | null>(null);

  const handleUpdateHistoricalJustificationStatus = (id: number, newStatus: HistoricalAbsence['justificationStatus'], justificationText?: string) => {
    setHistoricalAbsences(historicalAbsences.map(h => {
      if (h.id === id) {
        return { 
          ...h, 
          justificationStatus: newStatus,
          isJustified: newStatus === 'accepted' ? true : h.isJustified,
          ...(justificationText ? { justificationText } : {})
        };
      }
      return h;
    }));
  };

  const openJustificationDialog = (id: number) => {
    setSelectedAbsenceForJustification(id);
    setIsJustificationDialogOpen(true);
  };

  const closeJustificationDialog = () => {
    setSelectedAbsenceForJustification(null);
    setIsJustificationDialogOpen(false);
  };

  const submitJustification = (text: string, file: File | null) => {
    if (selectedAbsenceForJustification !== null) {
      handleUpdateHistoricalJustificationStatus(selectedAbsenceForJustification, 'pending', text);
    }
    closeJustificationDialog();
  };

  const handleUpdateReqStatus = (id: number, newStatus: AbsenceRequest['status']) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleUpdateJustStatus = (id: number, newStatus: AbsenceJustification['status']) => {
    setJustifications(justifications.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  return {
    activeTab,
    setActiveTab,
    requests,
    justifications,
    historicalAbsences,
    handleUpdateReqStatus,
    handleUpdateJustStatus,
    handleUpdateHistoricalJustificationStatus,
    isJustificationDialogOpen,
    openJustificationDialog,
    closeJustificationDialog,
    submitJustification
  };
};
