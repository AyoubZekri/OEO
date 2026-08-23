import { useState, useEffect } from 'react';
import { MembersData } from './members_data';
import { MemberModel } from './member_model';
import { TeamsData } from '../Teams/teams_data';
import { TeamModel } from '../Teams/team_model';
import { Crud } from '../../../core/class/Crud';
import { PaymentsData } from '../Payments/payments_data';
import { ContractsData } from '../Contracts/contracts_data';

export const useMembersController = () => {
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<MemberModel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<MemberModel | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');

  // Form states
  const [formData, setFormData] = useState<any>({
    first_name: '',
    last_name: '',
    type: 'player',
    national_id: '',
    phone: '',
    place_of_birth: '',
    birth_date: '',
    Shirt_number: '',
    status: 'active',
    team_id: ''
  });

  const crud = new Crud();
  const membersData = new MembersData(crud);
  const teamsData = new TeamsData(crud);
  const paymentsData = new PaymentsData(crud);
  const contractsData = new ContractsData(crud);

  const fetchMembers = async () => {
    setIsLoading(true);
    const response = await membersData.getMembers();
    if (response) {
      if (Array.isArray(response)) {
        setMembers(response.map(MemberModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setMembers(response.data.map(MemberModel.fromJson));
      }
    }
    setIsLoading(false);
  };

  const fetchTeams = async () => {
    const response = await teamsData.getTeams();
    if (response) {
      if (Array.isArray(response)) {
        setTeams(response.map(TeamModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setTeams(response.data.map(TeamModel.fromJson));
      }
    }
  };

  const fetchPayments = async () => {
    const response = await paymentsData.getPayments();
    if (response) {
      if (Array.isArray(response)) setPayments(response);
      else if (response.data && Array.isArray(response.data)) setPayments(response.data);
    }
  };

  const fetchContracts = async () => {
    const response = await contractsData.getContracts();
    if (response) {
      if (Array.isArray(response)) setContracts(response);
      else if (response.data && Array.isArray(response.data)) setContracts(response.data);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchTeams();
    fetchPayments();
    fetchContracts();
  }, []);

  const openAddMemberDialog = () => {
    setMemberToEdit(null);
    setFormData({
      first_name: '',
      last_name: '',
      type: 'player',
      national_id: '',
      phone: '',
      place_of_birth: '',
      birth_date: '',
      Shirt_number: '',
      status: 'active',
      team_id: ''
    });
    setIsAddMemberOpen(true);
  };

  const openEditMemberDialog = (member: MemberModel) => {
    setMemberToEdit(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      type: member.type,
      national_id: member.national_id || '',
      phone: member.phone || '',
      place_of_birth: member.place_of_birth || '',
      birth_date: member.birth_date ? member.birth_date.split('T')[0] : '',
      Shirt_number: member.Shirt_number || '',
      status: member.status || 'active',
      team_id: member.team_id || ''
    });
    setIsAddMemberOpen(true);
  };

  const closeAddMemberDialog = () => {
    setIsAddMemberOpen(false);
    setMemberToEdit(null);
  };

  const handleFormDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Convert empty strings to null where appropriate
    const payload = { ...formData };
    if (payload.Shirt_number === '') payload.Shirt_number = null;
    if (payload.team_id === '') payload.team_id = null;
    if (payload.birth_date === '') payload.birth_date = null;

    if (memberToEdit) {
      payload.id = memberToEdit.id;
      const response = await membersData.editMember(payload);
      if (response && !response.error) {
        fetchMembers();
        closeAddMemberDialog();
      } else {
        alert('حدث خطأ أثناء التعديل');
      }
    } else {
      const response = await membersData.addMember(payload);
      if (response && !response.error) {
        fetchMembers();
        closeAddMemberDialog();
      } else {
        alert('حدث خطأ أثناء الإضافة');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العضو؟')) {
      setIsLoading(true);
      const response = await membersData.deleteMember(id);
      if (response && !response.error) {
        fetchMembers();
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
      setIsLoading(false);
    }
  };

  const openExpensesDialog = (member: MemberModel) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMember(null);
  };

  const formatCurrency = (amount: number) => {
    const numStr = (amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const swapped = numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
    return `${swapped} د.ج`;
  };

  const getContractsForMember = (memberId: string) => {
    return contracts.filter(c => 
      String(c.individuals_id) === String(memberId) || 
      String(c.memberId) === String(memberId) || 
      String(c.member_id) === String(memberId)
    );
  };

  const getContractValue = (memberId: string) => {
    const memberContracts = getContractsForMember(memberId);
    return memberContracts.reduce((sum, contract) => {
      return sum + (Number(contract.contractValue) || Number(contract.Contract_value) || Number(contract.contract_value) || 0);
    }, 0);
  };

  const getMemberPayments = (memberId: string) => {
    return payments.filter(p => 
      String(p.memberId) === String(memberId) || 
      String(p.member_id) === String(memberId) ||
      String(p.individuals_id) === String(memberId)
    );
  };

  const getAdvances = (memberId: string) => {
    const memberPayments = getMemberPayments(memberId);
    let totalAdvances = 0;
    memberPayments.forEach(p => {
      const amount = Number(p.amount) || 0;
      if (p.amountNature === 'سلفة' || p.amount_nature === 'سلفة') {
        totalAdvances += amount;
      } else if (p.amountNature === 'إرجاع سلفة' || p.amount_nature === 'إرجاع سلفة') {
        totalAdvances -= amount;
      }
    });
    return totalAdvances;
  };

  const getTotalExpensesForMember = (memberId: string) => {
    const memberPayments = getMemberPayments(memberId);
    // As per user request: "المدفوع" is only "رقم دفعة"
    const paid = memberPayments.filter(p => 
      p.amountNature === 'رقم دفعة' || p.amount_nature === 'رقم دفعة'
    );
    return paid.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  const getPaidForContract = (memberId: string, contract: any) => {
    const memberPayments = getMemberPayments(memberId);
    const paid = memberPayments.filter(p => {
      if (p.amountNature !== 'رقم دفعة' && p.amount_nature !== 'رقم دفعة') return false;
      if (p.contract_id) {
        return String(p.contract_id) === String(contract.id);
      }
      // Fallback for older records
      const cStart = contract.startDate || contract.start_date;
      const cStartPayment = p.dateFrom || p.start_date;
      return cStart === cStartPayment;
    });
    return paid.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  const getRemainingAmount = (memberId: string) => {
    const totalDeducted = getAdvances(memberId) + getTotalExpensesForMember(memberId);
    return getContractValue(memberId) - totalDeducted;
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const typeArabic = member.type === 'player' ? 'لاعب' : member.type === 'coach' ? 'مدرب' : 'موظف إداري';
    
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      typeArabic.includes(searchLower);
      
    const matchesTeam = filterTeamId === '' || member.team_id?.toString() === filterTeamId;

    return matchesSearch && matchesTeam;
  });

  return {
    members,
    filteredMembers,
    searchQuery,
    setSearchQuery,
    filterTeamId,
    setFilterTeamId,
    teams,
    isLoading,
    selectedMember,
    isDialogOpen,
    isAddMemberOpen,
    memberToEdit,
    formData,
    setFormData,
    handleFormDataChange,
    handleSaveMember,
    openAddMemberDialog,
    openEditMemberDialog,
    closeAddMemberDialog,
    handleDeleteMember,
    openExpensesDialog,
    closeDialog,
    formatCurrency,
    getContractsForMember,
    getContractValue,
    getPaidForContract,
    getTotalExpensesForMember,
    getRemainingAmount,
    getAdvances,
    getMemberPayments,
  };
};
