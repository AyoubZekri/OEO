import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { countsOf, statusOf } from './absenceUtils';
import { errorText } from '../Personal/useMyAbsences';

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
  meeting_id?: number;
  meeting_topic?: string;
  location?: string;
  duration?: string;
  reason: string;
  is_justified: boolean;
  justification_status: 'لا_يوجد' | 'قيد_الدراسة' | 'مقبول' | 'مرفوض' | 'none' | 'pending' | 'accepted' | 'rejected';
  record_source: string;
  /** When it was recorded, and when the justification was decided (alerts) */
  created_at?: string | null;
  decision_date?: string | null;
  /** The justification document (PDF or picture) */
  attachment_url?: string | null;
  /** Until when the member may justify it (24 hours after it was logged); none for a holiday request */
  justify_until?: string | null;
  /** Why the administration refused it */
  decision_note?: string | null;
  /** Who sent the justification: the member, or the administration for them */
  justified_by?: 'member' | 'administration' | null;
}

// The API answers either with the list itself or with { data: [...] }
const listOf = (body: any): any[] => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

export const useAbsenceRequestsController = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'registry' | 'members'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'requests' || tab === 'registry' ? tab : 'members';
  });

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
    fetchMeetings();
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [filterTeamId, filterStatus, filterCategory]);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${Applink.server}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(listOf(res.data));
    } catch (err) {
      console.error('Error fetching teams', err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${Applink.server}/meetings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMeetings(listOf(res.data));
    } catch (err) {
      console.error('Error fetching meetings', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(Applink.individuals, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMembers(listOf(res.data));
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
      setAbsences(listOf(res.data));
    } catch (err) {
      console.error('Error fetching absences', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJustification = async (
    id: number,
    status: AbsenceRecord['justification_status'],
    text?: string,
    decisionNote?: string,
  ) => {
    try {
      await axios.post(`${Applink.server}/absences/update-justification`, {
        id,
        justification_status: status,
        justification_text: text,
        decision_note: decisionNote,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchAbsences();
    } catch (err) {
      alert(errorText(err, 'حدث خطأ أثناء التحديث'));
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

  /** The administration justifies a record for the member: a text, a document (PDF / picture), or both; then decided as usual */
  const submitJustification = async (text: string, document?: File | null) => {
    if (selectedAbsenceId === null) return;
    const form = new FormData();
    form.append('id', String(selectedAbsenceId));
    if (text) form.append('text', text);
    if (document) form.append('document', document);
    try {
      await axios.post(`${Applink.server}/absences/justify`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      alert(errorText(err, 'تعذر حفظ التبرير'));
      return;
    }
    closeJustificationDialog();
    await fetchAbsences();
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

  // Accept at once; a refusal first asks why (the member reads it)
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const decide = (id: number, status: 'مقبول' | 'مرفوض') => {
    if (status === 'مقبول') handleUpdateJustification(id, status);
    else setRejectingId(id);
  };
  const confirmReject = async (note: string) => {
    if (rejectingId === null) return;
    const id = rejectingId;
    setRejectingId(null);
    await handleUpdateJustification(id, 'مرفوض', undefined, note);
  };
  const rejecting = absences.find(a => a.id === rejectingId) ?? null;

  // Same status rule as the cards (see statusOf)
  const stats = {
    ...countsOf(absences),
    justified: absences.filter(a => statusOf(a) === 'accepted').length,
  };

  return {
    absences,
    isLoading,
    teams,
    meetings,
    members,
    filterTeamId, setFilterTeamId,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    activeTab, setActiveTab,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    stats,
    handleUpdateJustification,
    decide,
    rejecting,
    confirmReject,
    closeReject: () => setRejectingId(null),
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
