import { useState, useMemo } from 'react';
import {type DisciplinaryModel, mockDisciplinaryData } from './disciplinary_data';

export const useDisciplinaryController = () => {
  const [disciplinaryList, setDisciplinaryList] = useState<DisciplinaryModel[]>(mockDisciplinaryData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('الكل');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DisciplinaryModel | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: DisciplinaryModel) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = (item: DisciplinaryModel) => {
    if (editingItem) {
      setDisciplinaryList(prev => prev.map(d => d.id === item.id ? item : d));
    } else {
      setDisciplinaryList(prev => [{ ...item, id: Math.random().toString() }, ...prev]);
    }
    closeDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإجراء التأديبي؟')) {
      setDisciplinaryList(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, newStatus: DisciplinaryModel['status']) => {
    setDisciplinaryList(prev => prev.map(d => 
      d.id === id ? { ...d, status: newStatus } : d
    ));
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
    editingItem,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSave,
    handleDelete,
    handleUpdateStatus,
  };
};
