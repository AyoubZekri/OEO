import { useState, useEffect } from 'react';
import { Crud } from '../../../core/class/Crud';
import { FundsData } from './funds_data';

export interface Fund {
  id: string;
  name: string;
  icon: 'bank' | 'mail' | 'wallet' | 'default';
  initialBalance: number;
}

export type TransactionType = 'إيداع' | 'سحب' | 'تحويل';

export interface FundTransaction {
  id: string;
  fundId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  toFundId?: string; // Only used if type === 'تحويل'
}

export const useFundsController = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const crud = new Crud();
  const fundsData = new FundsData(crud);

  const fetchFunds = async () => {
    setIsLoading(true);
    const response = await fundsData.getFunds();
    if (response) {
      if (Array.isArray(response)) {
        setFunds(response);
      } else if (response.data && Array.isArray(response.data)) {
        setFunds(response.data);
      }
    }
    setIsLoading(false);
  };

  const fetchTransactions = async () => {
    const response = await fundsData.getTransactions();
    if (response) {
      if (Array.isArray(response)) {
        setTransactions(response);
      } else if (response.data && Array.isArray(response.data)) {
        setTransactions(response.data);
      }
    }
  };

  useEffect(() => {
    fetchFunds();
    fetchTransactions();
  }, []);
  
  // Dialog States
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  
  // Selected Fund for operations
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);

  // Filter States
  const [filterFundId, setFilterFundId] = useState<string | 'الكل'>('الكل');
  const [filterType, setFilterType] = useState<TransactionType | 'الكل'>('الكل');

  // Fund CRUD
  const addFund = async (fund: Omit<Fund, 'id'>) => {
    const response = await fundsData.createFund(fund);
    if (response) {
      fetchFunds();
      setIsFundDialogOpen(false);
    }
  };

  const editFund = async (id: string, updated: Partial<Fund>) => {
    const response = await fundsData.updateFund({ id, ...updated });
    if (response) {
      fetchFunds();
      setIsFundDialogOpen(false);
      setEditingFund(null);
    }
  };

  const deleteFund = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصندوق؟ سيتم حذف جميع معاملاته أيضاً.')) {
      const response = await fundsData.deleteFund({ id });
      if (response) {
        setFunds(funds.filter(f => f.id !== id));
        setTransactions(transactions.filter(t => t.fundId !== id && t.toFundId !== id));
      }
    }
  };

  const openFundDialog = (fund?: Fund) => {
    if (fund) {
      setEditingFund(fund);
    } else {
      setEditingFund(null);
    }
    setIsFundDialogOpen(true);
  };

  const closeFundDialog = () => {
    setIsFundDialogOpen(false);
    setEditingFund(null);
  };

  // Operations
  const openOperationDialog = (fundId: string) => {
    setSelectedFundId(fundId);
    setIsOperationDialogOpen(true);
  };

  const closeOperationDialog = () => {
    setIsOperationDialogOpen(false);
    setSelectedFundId(null);
  };

  const addTransaction = async (transaction: Omit<FundTransaction, 'id'>) => {
    if (transaction.type === 'تحويل' || transaction.type === 'سحب') {
      const balance = getBalance(transaction.fundId);
      if (Number(transaction.amount) > balance) {
        alert('الرصيد المتوفر لا يكفي لإتمام هذه العملية.');
        return;
      }
    }

    const response = await fundsData.createTransaction(transaction);
    if (response) {
      if (response.error) {
         alert(response.error);
         return;
      }
      fetchTransactions();
      fetchFunds(); // Update fund balances
      closeOperationDialog();
    }
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      const response = await fundsData.deleteTransaction({ id });
      if (response) {
        setTransactions(transactions.filter(t => t.id !== id));
        fetchFunds(); // Update fund balances
      }
    }
  };

  const getBalance = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    return fund ? (Number(fund.initialBalance) || 0) : 0;
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterFundId !== 'الكل' && t.fundId !== filterFundId && t.toFundId !== filterFundId) return false;
    if (filterType !== 'الكل' && t.type !== filterType) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    const numStr = (amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const swapped = numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
    return `${swapped} د.ج`;
  };

  return {
    funds,
    transactions: filteredTransactions,
    isFundDialogOpen,
    isOperationDialogOpen,
    selectedFundId,
    editingFund,
    filterFundId,
    filterType,
    isLoading,
    setFilterFundId,
    setFilterType,
    openFundDialog,
    closeFundDialog,
    addFund,
    editFund,
    deleteFund,
    openOperationDialog,
    closeOperationDialog,
    addTransaction,
    deleteTransaction,
    getBalance,
    formatCurrency
  };
};
