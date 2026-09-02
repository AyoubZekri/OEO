import { useState, useEffect } from 'react';
import { getCorrespondences, addCorrespondence, updateCorrespondenceStatus, deleteCorrespondence } from './correspondence_data';
import { type CorrespondenceModel } from './correspondence_model';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { Crud } from '../../../core/class/Crud';

export const useCorrespondencesController = () => {
  const [correspondences, setCorrespondences] = useState<CorrespondenceModel[]>([]);
  const [members, setMembers] = useState<MemberModel[]>([]);

  const crud = new Crud();
  const membersData = new MembersData(crud);
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCorrespondence, setSelectedCorrespondence] = useState<CorrespondenceModel | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    // Load data
    setCorrespondences(getCorrespondences());
    
    const fetchMembers = async () => {
      const response = await membersData.getMembers();
      if (response) {
        if (Array.isArray(response)) {
          setMembers(response.map(MemberModel.fromJson));
        } else if (response.data && Array.isArray(response.data)) {
          setMembers(response.data.map(MemberModel.fromJson));
        }
      }
    };
    
    fetchMembers();
  }, []);

  const getMemberName = (memberId: number) => {
    const member = members.find(m => String(m.id) === String(memberId));
    return member ? `${member.first_name} ${member.last_name}` : 'غير معروف';
  };

  const getMember = (memberId: number) => {
    return members.find(m => String(m.id) === String(memberId));
  };

  const handleAddCorrespondence = (data: Omit<CorrespondenceModel, 'id' | 'createdAt'>) => {
    const newCorrespondence = addCorrespondence(data);
    setCorrespondences([newCorrespondence, ...correspondences]);
    setIsAddDialogOpen(false);
  };

  const handleUpdateStatus = (id: string, status: CorrespondenceModel['status']) => {
    updateCorrespondenceStatus(id, status);
    setCorrespondences(correspondences.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleDelete = (id: string) => {
    deleteCorrespondence(id);
    setCorrespondences(correspondences.filter(c => c.id !== id));
  };

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const openViewDialog = (correspondence: CorrespondenceModel) => {
    setSelectedCorrespondence(correspondence);
    setIsDialogOpen(true);
  };

  const closeViewDialog = () => {
    setSelectedCorrespondence(null);
    setIsDialogOpen(false);
  };

  const filteredCorrespondences = correspondences.filter(c => {
    const memberName = getMemberName(c.memberId)?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    const matchesSearch = memberName.includes(search) || 
                          (c.subject?.toLowerCase() || '').includes(search) ||
                          (c.correspondenceNumber?.toLowerCase() || '').includes(search);
    
    const matchesStatus = filterStatus ? c.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  return {
    correspondences: filteredCorrespondences,
    members,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    getMemberName,
    getMember,
    handleAddCorrespondence,
    handleUpdateStatus,
    handleDelete,
    isDialogOpen,
    isAddDialogOpen,
    selectedCorrespondence,
    openAddDialog,
    closeAddDialog,
    openViewDialog,
    closeViewDialog
  };
};
