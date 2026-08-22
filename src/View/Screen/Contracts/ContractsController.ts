import { useState, useEffect } from 'react';
import { ContractsData } from './contracts_data';
import { ContractModel } from './contract_model';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { showSnackbar } from '../../../core/functions/Snacpar';

export interface Entitlement {
  id: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
  description: string;
}

export const useContractsController = () => {
  const [contracts, setContracts] = useState<ContractModel[]>([]);
  const [individuals, setIndividuals] = useState<MemberModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMismatchWarningOpen, setIsMismatchWarningOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractModel | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [contractToRenew, setContractToRenew] = useState<ContractModel | null>(null);
  const [renewEndDate, setRenewEndDate] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const crud = new Crud();
  const contractsData = new ContractsData(crud);
  const membersData = new MembersData(crud);

  // Form State
  const [formData, setFormData] = useState({
    individuals_id: '',
    contractNumber: '',
    startDate: '',
    endDate: '',
    contractValue: '' as number | string,
    numberOfPayments: 1 as number | string,
    monthlySalary: '' as number | string,
    winBonus: '' as number | string,
    goalsBonus: '' as number | string,
    notes: '',
    status: 'active',
    installments: [] as { installment_number: string; amount: number }[]
  });

  const openRenewModal = (contract: ContractModel) => {
    setContractToRenew(contract);
    setRenewEndDate(contract.endDate || '');
    setIsRenewModalOpen(true);
  };

  const closeRenewModal = () => {
    setIsRenewModalOpen(false);
    setContractToRenew(null);
    setRenewEndDate('');
  };

  const handleRenewContract = async () => {
    if (!contractToRenew || !renewEndDate) return;
    setIsLoading(true);
    const payload = {
      id: contractToRenew.id,
      individuals_id: contractToRenew.individuals_id,
      end_date: renewEndDate,
      start_date: contractToRenew.startDate,
      Contract_value: contractToRenew.contractValue,
      Number_payments: contractToRenew.numberOfPayments,
      Monthly_Salary: contractToRenew.monthlySalary,
      Winning_Bonus: contractToRenew.winBonus,
      Goals_Bonus: contractToRenew.goalsBonus,
      nots: contractToRenew.notes,
      status: 'active'
    };
    const response = await contractsData.editContract(payload);
    if (response && !response.error) {
      fetchData();
      closeRenewModal();
    } else {
      alert('حدث خطأ أثناء التجديد');
    }
    setIsLoading(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [contractsRes, membersRes] = await Promise.all([
        contractsData.getContracts(),
        membersData.getMembers()
      ]);

      if (contractsRes) {
        if (Array.isArray(contractsRes)) {
          setContracts(contractsRes.map(ContractModel.fromJson));
        } else if (contractsRes.data && Array.isArray(contractsRes.data)) {
          setContracts(contractsRes.data.map(ContractModel.fromJson));
        }
      }

      if (membersRes) {
        if (Array.isArray(membersRes)) {
          setIndividuals(membersRes.map(MemberModel.fromJson));
        } else if (membersRes.data && Array.isArray(membersRes.data)) {
          setIndividuals(membersRes.data.map(MemberModel.fromJson));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingContractId(null);
    setErrors({});
    setFormData({
      individuals_id: '',
      contractNumber: '',
      startDate: '',
      endDate: '',
      contractValue: '',
      numberOfPayments: 1,
      monthlySalary: '',
      winBonus: '',
      goalsBonus: '',
      notes: '',
      status: 'active',
      installments: [{ installment_number: '1', amount: 0 }]
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (contract: ContractModel) => {
    setEditingContractId(contract.id);
    setErrors({});
    setFormData({
      individuals_id: contract.individuals_id,
      contractNumber: contract.contractNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      contractValue: contract.contractValue || '',
      numberOfPayments: contract.numberOfPayments || 1,
      monthlySalary: contract.monthlySalary || '',
      winBonus: contract.winBonus || '',
      goalsBonus: contract.goalsBonus || '',
      notes: contract.notes,
      status: contract.status,
      installments: contract.installments ? [...contract.installments] : []
    });
    setIsAddEditModalOpen(true);
  };

  const closeAddEditModal = () => {
    setIsAddEditModalOpen(false);
    setEditingContractId(null);
    setErrors({});
  };

  const openScheduleModal = (contract: ContractModel) => {
    setSelectedContract(contract);
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedContract(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => {
      const numValue = ['contractValue', 'numberOfPayments', 'monthlySalary', 'winBonus', 'goalsBonus'].includes(name) 
        ? (value === '' ? '' : Number(value)) 
        : value;

      const newFormData = { ...prev, [name]: numValue };

      // Auto-generate installments if numberOfPayments changes
      if (name === 'numberOfPayments') {
        const numInstallments = Number(value) || 0;
        let newInstallments = [...(prev.installments || [])];
        
        if (numInstallments > newInstallments.length) {
          // add more
          for (let i = newInstallments.length; i < numInstallments; i++) {
            newInstallments.push({ installment_number: String(i + 1), amount: 0 });
          }
        } else if (numInstallments < newInstallments.length) {
          // remove excess
          newInstallments = newInstallments.slice(0, numInstallments);
        }
        
        newFormData.installments = newInstallments;
      }

      return newFormData;
    });
  };

  const setFormDataValue = (name: string, value: any) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, { installment_number: String(prev.installments.length + 1), amount: 0 }]
    }));
  };

  const handleUpdateInstallment = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newInst = [...prev.installments];
      newInst[index] = { ...newInst[index], [field]: value };
      return { ...prev, installments: newInst };
    });
  };

  const handleRemoveInstallment = (index: number) => {
    setFormData(prev => {
      const newInst = [...prev.installments];
      newInst.splice(index, 1);
      return { ...prev, installments: newInst };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.individuals_id) {
      newErrors.individuals_id = 'يرجى اختيار المستفيد';
    } else if (!editingContractId && contracts.some(c => String(c.individuals_id) === String(formData.individuals_id))) {
      newErrors.individuals_id = 'هذا العضو يمتلك عقداً بالفعل. يرجى استخدام ميزة التجديد.';
      showSnackbar('تنبيه', 'هذا العضو يمتلك عقداً بالفعل. يرجى استخدام ميزة التجديد.', '#ef4444');
    }
    if (formData.contractValue === '' || Number(formData.contractValue) < 0) {
      newErrors.contractValue = 'يرجى إدخال قيمة صحيحة للعقد';
    }
    if (formData.numberOfPayments === '' || Number(formData.numberOfPayments) < 1) {
      newErrors.numberOfPayments = 'عدد الدفعات يجب أن يكون 1 على الأقل';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'يرجى إدخال تاريخ البداية';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'يرجى إدخال تاريخ النهاية';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveContract = async () => {
    if (!validateForm()) return;

    const contractVal = Number(formData.contractValue) || 0;
    const installmentsSum = formData.installments.reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);

    // If sum is different, show warning dialog first
    if (Math.abs(contractVal - installmentsSum) > 0.01) {
      setIsMismatchWarningOpen(true);
      return;
    }

    proceedSaveContract();
  };

  const proceedSaveContract = async () => {
    setIsMismatchWarningOpen(false);
    setIsLoading(true);
    const payload = {
      individuals_id: formData.individuals_id,
      numper: null, // As requested, ID is the contract number
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      Contract_value: formData.contractValue || 0,
      Number_payments: formData.numberOfPayments || 1,
      Monthly_Salary: formData.monthlySalary || 0,
      Winning_Bonus: formData.winBonus || 0,
      Goals_Bonus: formData.goalsBonus || 0,
      nots: formData.notes,
      status: formData.status,
      installments: formData.installments
    };

    if (editingContractId) {
      const response = await contractsData.editContract({ ...payload, id: editingContractId });
      if (response && !response.error) {
        fetchData();
        closeAddEditModal();
      } else {
        alert('حدث خطأ أثناء التعديل');
      }
    } else {
      const response = await contractsData.addContract(payload);
      if (response && !response.error) {
        fetchData();
        closeAddEditModal();
      } else {
        alert('حدث خطأ أثناء الإضافة');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteContract = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العقد؟')) {
      setIsLoading(true);
      const response = await contractsData.deleteContract(id);
      if (response && !response.error) {
        fetchData();
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const numStr = (amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const swapped = numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
    return `${swapped} د.ج`;
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String(c.id).includes(searchQuery);
    const matchesFilter = filterType === 'all' || c.contractType.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  return {
    contracts: filteredContracts,
    individuals,
    isLoading,
    isAddEditModalOpen,
    isScheduleModalOpen,
    isMismatchWarningOpen,
    setIsMismatchWarningOpen,
    proceedSaveContract,
    selectedContract,
    formData,
    errors,
    openAddModal,
    openEditModal,
    closeAddEditModal,
    openScheduleModal,
    closeScheduleModal,
    handleFormChange,
    setFormDataValue,
    saveContract,
    handleDeleteContract,
    formatCurrency,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isRenewModalOpen,
    contractToRenew,
    renewEndDate,
    setRenewEndDate,
    openRenewModal,
    closeRenewModal,
    handleRenewContract,
    handleAddInstallment,
    handleUpdateInstallment,
    handleRemoveInstallment
  };
};
