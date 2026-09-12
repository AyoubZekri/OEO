import { useState, useMemo, useEffect } from 'react';
import { type DisciplinaryModel } from './disciplinary_data';
import { Applink } from '../../../LinkApi';
import axios from 'axios';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { Crud } from '../../../core/class/Crud';

const DISCIPLINARY = Applink.disciplinary;

export const useDisciplinaryController = () => {
  const [disciplinaryList, setDisciplinaryList] = useState<DisciplinaryModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('الكل');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DisciplinaryModel | null>(null);
  
  const [members, setMembers] = useState<MemberModel[]>([]);
  const crud = new Crud();
  const membersData = new MembersData(crud);

  const fetchDisciplinary = async () => {
    try {
      const response = await axios.get(DISCIPLINARY, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDisciplinaryList(response.data);
    } catch (error) {
      console.error("Error fetching disciplinary records:", error);
    }
  };

  useEffect(() => {
    fetchDisciplinary();
    
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

  const openAddDialog = () => {
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: DisciplinaryModel) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const openResponseDialog = (item: DisciplinaryModel) => {
    setEditingItem(item);
    setIsResponseDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setIsResponseDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (item: DisciplinaryModel) => {
    try {
      console.log("Data being sent to backend:", item); // Debug log for the user

      if (editingItem && editingItem.id) {
        const response = await axios.post(`${DISCIPLINARY}/update`, item, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log("Backend response (update):", response.data);
      } else {
        const response = await axios.post(`${DISCIPLINARY}/create`, item, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log("Backend response (create):", response.data);
      }
      await fetchDisciplinary();
      closeDialog();
    } catch (error) {
      console.error("Error saving disciplinary record:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإجراء التأديبي؟')) {
      try {
        await axios.post(`${DISCIPLINARY}/delete`, { id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchDisciplinary();
      } catch (error) {
        console.error("Error deleting disciplinary record:", error);
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: DisciplinaryModel['status']) => {
    try {
      const itemToUpdate = disciplinaryList.find(d => d.id === id);
      if (itemToUpdate) {
        await axios.post(`${DISCIPLINARY}/update`, { ...itemToUpdate, status: newStatus }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchDisciplinary();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAcknowledge = async (item: DisciplinaryModel) => {
    if (window.confirm('تأكيد توقيع اللاعب بالاستلام؟)')) {
      try {
        const now = new Date();
        const currentDate = now.getFullYear() + '-' + 
                           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(now.getDate()).padStart(2, '0') + ' ' + 
                           String(now.getHours()).padStart(2, '0') + ':' + 
                           String(now.getMinutes()).padStart(2, '0') + ':' + 
                           String(now.getSeconds()).padStart(2, '0');
        
        const updatedItem = {
          ...item,
          is_acknowledged: true,
          acknowledged_at: currentDate
        };
        await axios.post(`${DISCIPLINARY}/update`, updatedItem, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchDisciplinary();
      } catch (error) {
        console.error("Error acknowledging disciplinary record:", error);
        alert("حدث خطأ أثناء التوقيع");
      }
    }
  };

  const filteredList = useMemo(() => {
    return disciplinaryList.filter(item => {
      const matchesSearch = item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'الكل' || item.actionType === filterType;
      const matchesStatus = filterStatus === 'الكل' || item.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [disciplinaryList, searchQuery, filterType, filterStatus]);

  return {
    disciplinaryList: filteredList,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    isAddDialogOpen,
    isResponseDialogOpen,
    editingItem,
    openAddDialog,
    openEditDialog,
    openResponseDialog,
    closeDialog,
    handleSave,
    handleDelete,
    handleUpdateStatus,
    handleAcknowledge,
    members,
  };
};
