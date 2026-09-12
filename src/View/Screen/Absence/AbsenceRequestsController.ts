import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';

export interface AbsenceRecord {
  id: number;
  player_id: number;
  player_name: string;
  shirt_number?: string;
  team_name: string;
  absence_type: string;
  event_category?: string;
  event_date: string;
  session_id?: number;
  session_date?: string;
  location?: string;
  duration?: string;
  reason: string;
  is_justified: boolean;
  justification_status: 'none' | 'pending' | 'accepted' | 'rejected';
  record_source: string;
}

export const useAbsenceRequestsController = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'registry' | 'members'>('members');

  const [isJustificationDialogOpen, setIsJustificationDialogOpen] = useState(false);
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<number | null>(null);
  const [isAddAbsenceDialogOpen, setIsAddAbsenceDialogOpen] = useState(false);
  const [selectedMemberForAbsenceId, setSelectedMemberForAbsenceId] = useState<number | null>(null);
  const [isMultiMode, setIsMultiMode] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [filterTeamId, filterStatus, filterCategory]);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${Applink.server}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(Applink.individuals, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMembers(res.data);
    } catch (err) {
      console.error('Error fetching members', err);
    }
  };

  const fetchAbsences = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterTeamId) params.team_id = filterTeamId;
      if (filterStatus) params.justification_status = filterStatus;
      if (filterCategory) params.event_category = filterCategory;

      const res = await axios.get(`${Applink.server}/absences`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAbsences(res.data);
    } catch (err) {
      console.error('Error fetching absences', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJustification = async (
    id: number,
    status: AbsenceRecord['justification_status'],
    text?: string
  ) => {
    try {
      await axios.post(`${Applink.server}/absences/update-justification`, {
        id,
        justification_status: status,
        justification_text: text,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchAbsences();
    } catch (err) {
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await axios.post(`${Applink.server}/absences/delete`, { id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchAbsences();
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const openJustificationDialog = (id: number) => {
    setSelectedAbsenceId(id);
    setIsJustificationDialogOpen(true);
  };

  const closeJustificationDialog = () => {
    setSelectedAbsenceId(null);
    setIsJustificationDialogOpen(false);
  };

  const submitJustification = async (text: string, _file: File | null) => {
    if (selectedAbsenceId !== null) {
      await handleUpdateJustification(selectedAbsenceId, 'pending', text);
    }
    closeJustificationDialog();
  };

  const openAddAbsenceDialog = (memberId?: number, multi: boolean = false) => {
    if (typeof memberId === 'number') {
      setSelectedMemberForAbsenceId(memberId);
      setIsMultiMode(false);
    } else {
      setSelectedMemberForAbsenceId(null);
      setIsMultiMode(multi);
    }
    setIsAddAbsenceDialogOpen(true);
  };
  
  const closeAddAbsenceDialog = () => {
    setIsAddAbsenceDialogOpen(false);
    setSelectedMemberForAbsenceId(null);
  };

  const openHistoryDialog = (memberId: number) => {
    setSelectedMemberId(memberId);
    setIsHistoryDialogOpen(true);
  };

  const closeHistoryDialog = () => {
    setSelectedMemberId(null);
    setIsHistoryDialogOpen(false);
  };

  const handleAddAbsence = async (data: any) => {
    try {
      if (data.player_ids && Array.isArray(data.player_ids)) {
        const { player_ids, member_reasons, ...rest } = data;
        const promises = player_ids.map((id: string) => 
          axios.post(Applink.server + '/absences/create', { ...rest, player_id: id, reason: member_reasons?.[id] || '' }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        );
        await Promise.all(promises);
      } else {
        await axios.post(Applink.server + '/absences/create', data, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      await fetchAbsences();
      alert('تم التسجيل بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء التسجيل');
      console.error(err);
    }
  };

  const selectedAbsence = absences.find(a => a.id === selectedAbsenceId) ?? null;

  const stats = {
    total: absences.length,
    late: absences.filter(a => a.absence_type === 'متأخر').length,
    absent: absences.filter(a => a.absence_type === 'غائب غير مبرر').length,
    justified: absences.filter(a => a.absence_type === 'غائب مبرر' || a.is_justified).length,
    pending: absences.filter(a => a.justification_status === 'pending').length,
  };

  return {
    absences,
    isLoading,
    teams,
    members,
    filterTeamId, setFilterTeamId,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    activeTab, setActiveTab,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    stats,
    handleUpdateJustification,
    handleDelete,
    isJustificationDialogOpen,
    openJustificationDialog,
    closeJustificationDialog,
    isAddAbsenceDialogOpen,
    openAddAbsenceDialog,
    closeAddAbsenceDialog,
    selectedMemberForAbsenceId,
    isMultiMode,
    handleAddAbsence,
    submitJustification,
    selectedAbsence,
    fetchAbsences,
    isHistoryDialogOpen,
    selectedMemberId,
    openHistoryDialog,
    closeHistoryDialog,
  };
};
