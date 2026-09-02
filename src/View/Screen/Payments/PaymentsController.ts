import { useState, useEffect } from 'react';
import { Crud } from '../../../core/class/Crud';
import { PaymentsData } from './payments_data';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { FundsData } from '../Funds/funds_data';
import type { Fund } from '../Funds/FundsController';
import { ContractsData } from '../Contracts/contracts_data';
import { ContractModel } from '../Contracts/contract_model';

export interface PaymentMember {
  id: string;
  firstName: string;
  lastName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  contractType: string;
  memberRole: string; // صفة العضو
  nationalId: string;
  contractNumber: string;
  phoneNumber: string;
}

export interface PaymentRecord {
  id: string;
  transactionType?: 'دفع' | 'مصروف' | 'مصاريف استثنائية';
  memberId?: string;
  fundId?: string;
  fund_id?: string;
  amount: number;
  paymentMethod: string; // نقدا, تحويل بنكي, صك, حوالة, دفع إلكتروني, أخرى
  paymentDate: string;
  checkNumber?: string;
  amountNature: string; // راتب شهري, نتيجة, تحفيز, إلخ
  installmentNumber?: string; // If amountNature is 'رقم دفعة'
  
  // Conditional fields
  dateFrom?: string; // For 'رقم دفعة'
  dateTo?: string; // For 'رقم دفعة'
  month?: string; // For 'راتب شهري'
  year?: string; // For 'راتب شهري'
  occasion?: string; // For 'اخرى' and others
  numberOfMonths?: number; // For 'راتب شهري'
  numberOfGoals?: number; // For 'تسجيل أهداف'

  notes?: string;
  member?: any;
  postal_check?: string;
  receipt_file?: string | File | null;
  contract_id?: string;
}

export const usePaymentsController = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [members, setMembers] = useState<PaymentMember[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [contracts, setContracts] = useState<ContractModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNature, setFilterNature] = useState('all');
  const [selectedFundFilter, setSelectedFundFilter] = useState('all');

  const crud = new Crud();
  const paymentsData = new PaymentsData(crud);
  const membersData = new MembersData(crud);
  const fundsData = new FundsData(crud);
  const contractsData = new ContractsData(crud);

  const fetchContracts = async () => {
    const response = await contractsData.getContracts();
    if (response) {
      if (Array.isArray(response)) {
        setContracts(response.map(ContractModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setContracts(response.data.map(ContractModel.fromJson));
      }
    }
  };

  const fetchFunds = async () => {
    const response = await fundsData.getFunds();
    if (response) {
      if (Array.isArray(response)) {
        setFunds(response);
      } else if (response.data && Array.isArray(response.data)) {
        setFunds(response.data);
      }
    }
  };

  const fetchMembers = async () => {
    const response = await membersData.getMembers();
    if (response) {
      let fetchedMembers: MemberModel[] = [];
      if (Array.isArray(response)) {
        fetchedMembers = response.map(MemberModel.fromJson);
      } else if (response.data && Array.isArray(response.data)) {
        fetchedMembers = response.data.map(MemberModel.fromJson);
      }
      
      const mappedMembers: PaymentMember[] = fetchedMembers.map(m => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        placeOfBirth: m.place_of_birth,
        dateOfBirth: m.birth_date,
        contractType: '-',
        memberRole: m.type,
        nationalId: m.national_id,
        contractNumber: '-',
        phoneNumber: m.phone,
      }));
      setMembers(mappedMembers);
    }
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    const response = await paymentsData.getPayments();
    if (response) {
      console.log("=== RAW BACKEND DATA (PAYMENTS) ===", response);
      if (Array.isArray(response)) {
        setPayments(response);
      } else if (response.data && Array.isArray(response.data)) {
        setPayments(response.data);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    fetchMembers();
    fetchFunds();
    fetchContracts();
  }, []);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [paymentForUpload, setPaymentForUpload] = useState<PaymentRecord | null>(null);

  const openDialog = (payment?: PaymentRecord) => {
    if (payment) {
      setEditingPayment(payment);
    } else {
      setEditingPayment(null);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPayment(null);
  };

  const openUploadDialog = (payment: PaymentRecord) => {
    setPaymentForUpload(payment);
    setIsUploadDialogOpen(true);
  };

  const closeUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setPaymentForUpload(null);
  };

  const uploadReceipt = async (paymentId: string, file: File) => {
    setIsLoading(true);
    const response = await paymentsData.updatePayment({ id: paymentId }, file);
    if (response) {
      fetchPayments();
    }
    closeUploadDialog();
    setIsLoading(false);
  };

  const returnPayment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من إرجاع هذه الدفعة وإلغائها؟ سيتم إرجاع المبلغ للصندوق.')) {
      setIsLoading(true);
      const response = await paymentsData.returnPayment({ id });
      if (response) {
        setPayments(payments.filter(p => p.id !== id));
      }
      setIsLoading(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ (الحذف لا يقوم بإرجاع المبلغ للصندوق تلقائياً)')) {
      setIsLoading(true);
      const response = await paymentsData.deletePayment({ id });
      if (response) {
        setPayments(payments.filter(p => p.id !== id));
      }
      setIsLoading(false);
    }
  };

  const savePayment = async (payment: Omit<PaymentRecord, 'id'>) => {
    setIsLoading(true);
    let payload: any = { ...payment };

    if (payload.fundId) {
      payload.fund_id = payload.fundId; // Add for backend
      delete payload.fundId; // Not strictly needed but clean
    }

    if (payload.transactionType) {
      payload.transaction_type = payload.transactionType; // Add for backend
      payload.type = payload.transactionType; // Some backends use 'type'
      // Keep transactionType as well since backend update() checks for it
    }

    const receiptFile = payload.receipt_file instanceof File ? payload.receipt_file : undefined;
    delete payload.receipt_file; // Don't send as string in formData

    if (editingPayment) {
      // Update
      const response = await paymentsData.updatePayment({ id: editingPayment.id, ...payload }, receiptFile);
      if (response) {
        fetchPayments();
      }
    } else {
      // Add
      const response = await paymentsData.createPayment(payload, receiptFile);
      if (response) {
        fetchPayments();
      }
    }
    closeDialog();
    setIsLoading(false);
  };

  const handlePrintMemberSystem = async (memberId: string) => {
    try {
      await membersData.printMember(memberId);
    } catch (e) {
      console.error('Error setting print flag', e);
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

  const getMemberDetails = (memberId?: string) => {
    if (!memberId) return undefined;
    return members.find(m => m.id === memberId);
  };
  
  const filteredPayments = payments.filter(p => {
    const member = getMemberDetails(p.memberId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (member && `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower)) ||
      (p.amountNature && p.amountNature.toLowerCase().includes(searchLower)) ||
      (p.paymentDate && p.paymentDate.includes(searchLower));
      
    const matchesFilter = filterNature === 'all' || p.amountNature === filterNature;
    const matchesFund = selectedFundFilter === 'all' || p.fund_id === selectedFundFilter;
    
    return matchesSearch && matchesFilter && matchesFund;
  });

  return {
    payments: filteredPayments,
    members,
    funds,
    contracts,
    isDialogOpen,
    editingPayment,
    isLoading,
    openDialog,
    closeDialog,
    deletePayment,
    returnPayment,
    savePayment,
    handlePrintMemberSystem,
    formatCurrency,
    getMemberDetails,
    searchQuery,
    setSearchQuery,
    filterNature,
    setFilterNature,
    selectedFundFilter,
    setSelectedFundFilter,
    isUploadDialogOpen,
    paymentForUpload,
    openUploadDialog,
    closeUploadDialog,
    uploadReceipt,
  };
};
