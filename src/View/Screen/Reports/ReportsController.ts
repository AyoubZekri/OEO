import { useState, useEffect } from 'react';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { ContractsData } from '../Contracts/contracts_data';
import { ContractModel } from '../Contracts/contract_model';
import { PaymentsData } from '../Payments/payments_data';
import type { PaymentRecord } from '../Payments/PaymentsController';
import { FundsData } from '../Funds/funds_data';
import type { Fund, FundTransaction } from '../Funds/FundsController';

export type ReportCategory = 'individuals' | 'expenses' | 'contracts' | 'funds';
export type IndividualReportType = 'player' | 'coach' | 'employee';
export type ExpenseReportType = 'daily' | 'monthly' | 'seasonal' | 'byType' | 'byTeam';
export type ContractReportType = 'total' | 'paid' | 'remaining' | 'upcoming';
export type FundReportType = 'fundMovement' | 'bankMovement' | 'transfers' | 'balance';

export const useReportsController = () => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('individuals');
  
  // States for sub-tabs
  const [activeIndividualTab, setActiveIndividualTab] = useState<IndividualReportType>('player');
  const [activeExpenseTab, setActiveExpenseTab] = useState<ExpenseReportType>('daily');
  const [activeContractTab, setActiveContractTab] = useState<ContractReportType>('total');

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [presetDate, setPresetDate] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>('');
  const [individualPaymentTypeFilter, setIndividualPaymentTypeFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');
  const [fundTransactionTypeFilter, setFundTransactionTypeFilter] = useState<string>('');

  const handlePresetDateChange = (preset: string) => {
    setPresetDate(preset);
    const today = new Date();
    
    // Helper to format date to YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let start = new Date(today);
    let end = new Date(today);

    switch (preset) {
      case 'today':
        setFromDate(formatDate(today));
        setToDate(formatDate(today));
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        setFromDate(formatDate(start));
        setToDate(formatDate(start));
        break;
      case 'this_week':
        const firstDayOfWeek = today.getDate() - today.getDay(); 
        start.setDate(firstDayOfWeek);
        setFromDate(formatDate(start));
        setToDate(formatDate(today));
        break;
      case 'last_week':
        const firstDayOfLastWeek = today.getDate() - today.getDay() - 7;
        start.setDate(firstDayOfLastWeek);
        end.setDate(firstDayOfLastWeek + 6);
        setFromDate(formatDate(start));
        setToDate(formatDate(end));
        break;
      case 'this_month':
        start.setDate(1);
        setFromDate(formatDate(start));
        setToDate(formatDate(today));
        break;
      case 'last_month':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end.setMonth(today.getMonth());
        end.setDate(0);
        setFromDate(formatDate(start));
        setToDate(formatDate(end));
        break;
      case 'this_year':
        start.setMonth(0, 1);
        setFromDate(formatDate(start));
        setToDate(formatDate(today));
        break;
      case 'last_year':
        start.setFullYear(today.getFullYear() - 1, 0, 1);
        end.setFullYear(today.getFullYear() - 1, 11, 31);
        setFromDate(formatDate(start));
        setToDate(formatDate(end));
        break;
      default:
        // custom or all
        setFromDate('');
        setToDate('');
        break;
    }
  };

  // Data
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [contracts, setContracts] = useState<ContractModel[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const crud = new Crud();
  const membersData = new MembersData(crud);
  const contractsData = new ContractsData(crud);
  const paymentsData = new PaymentsData(crud);
  const fundsData = new FundsData(crud);

  const fetchData = async () => {
    setIsLoading(true);
    const [membersRes, contractsRes, paymentsRes, fundsRes, fundTransactionsRes] = await Promise.all([
      membersData.getMembers(),
      contractsData.getContracts(),
      paymentsData.getPayments(),
      fundsData.getFunds(),
      fundsData.getTransactions()
    ]);

    if (membersRes) {
      const data = Array.isArray(membersRes) ? membersRes : (membersRes.data || []);
      setMembers(data.map(MemberModel.fromJson));
    }
    
    if (contractsRes) {
      const data = Array.isArray(contractsRes) ? contractsRes : (contractsRes.data || []);
      setContracts(data.map(ContractModel.fromJson));
    }

    if (paymentsRes) {
      const data = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.data || []);
      setPayments(data);
    }
    
    if (fundsRes) {
      const data = Array.isArray(fundsRes) ? fundsRes : (fundsRes.data || []);
      setFunds(data);
    }

    if (fundTransactionsRes) {
      const data = Array.isArray(fundTransactionsRes) ? fundTransactionsRes : (fundTransactionsRes.data || []);
      setFundTransactions(data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Calculations for Individuals Report
  const getIndividualSummary = () => {
    let relevantContracts = [...contracts];
    let relevantPayments = [...payments];

    // Filter by member/type
    if (selectedMember && selectedMember !== '') {
      relevantContracts = relevantContracts.filter(c => c.individuals_id === selectedMember);
      relevantPayments = relevantPayments.filter(p => p.memberId === selectedMember);
    } else {
      // Filter by type (player, coach, employee)
      const filteredMembers = members.filter(m => m.type === activeIndividualTab).map(m => m.id);
      relevantContracts = relevantContracts.filter(c => filteredMembers.includes(c.individuals_id));
      relevantPayments = relevantPayments.filter(p => filteredMembers.includes(p.memberId));
    }

    // Filter payments by date range
    if (fromDate) {
      relevantPayments = relevantPayments.filter(p => p.paymentDate >= fromDate);
    }
    if (toDate) {
      relevantPayments = relevantPayments.filter(p => p.paymentDate <= toDate);
    }

    // Filter by payment type if selected
    if (individualPaymentTypeFilter) {
      relevantPayments = relevantPayments.filter(p => p.amountNature === individualPaymentTypeFilter);
    }

    const contractValue = relevantContracts.reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0);
    const dueTillToday = relevantContracts.reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0); // Simplified, adjust if needed
    
    let paid = 0;
    let deductions = 0;
    let advances = 0;

    relevantPayments.forEach(p => {
      const amount = Number(p.amount) || 0;
      if (p.amountNature === 'سلفة') {
        advances += amount;
      } else if (p.amountNature === 'إرجاع سلفة') {
        advances -= amount;
      } else if (p.amountNature === 'استقطاع' || p.amountNature === 'خصم') {
        deductions += amount;
      } else if (p.amountNature === 'رقم دفعة') {
        paid += amount;
      }
    });

    const remaining = contractValue - paid;

    return {
      contractValue,
      dueTillToday,
      paid,
      deductions,
      advances,
      remaining,
      payments: relevantPayments
    };
  };

  // Calculations for Expenses Report
  const getExpenseSummary = () => {
    let relevantPayments = payments.filter(p => p.transactionType === 'مصروف' || (!p.memberId && ['تعويض مصاريف', 'تنقل', 'اقامة', 'إطعام', 'تجهيزات', 'صيانة', 'فواتير', 'كراء', 'اخرى'].includes(p.amountNature)));
    
    // Filter payments by date range
    if (fromDate) {
      relevantPayments = relevantPayments.filter(p => p.paymentDate >= fromDate);
    }
    if (toDate) {
      relevantPayments = relevantPayments.filter(p => p.paymentDate <= toDate);
    }

    // Filter by expense type if selected
    if (expenseTypeFilter) {
      relevantPayments = relevantPayments.filter(p => p.amountNature === expenseTypeFilter);
    }

    let totalAmount = 0;
    relevantPayments.forEach(p => {
      totalAmount += (Number(p.amount) || 0);
    });

    return {
      totalAmount,
      payments: relevantPayments
    };
  };

  // Calculations for Contracts Report
  const getContractsSummary = () => {
    let relevantContracts = [...contracts];

    if (fromDate) {
      relevantContracts = relevantContracts.filter(c => c.startDate >= fromDate || c.endDate >= fromDate);
    }
    if (toDate) {
      relevantContracts = relevantContracts.filter(c => c.startDate <= toDate);
    }
    
    if (selectedMember && selectedMember !== '') {
      relevantContracts = relevantContracts.filter(c => c.individuals_id === selectedMember);
    }

    let totalValue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    const enrichedContracts = relevantContracts.map(contract => {
      const memberPayments = payments.filter(p => p.memberId === contract.individuals_id);
      
      let contractPaid = 0;

      memberPayments.forEach(p => {
        const amount = Number(p.amount) || 0;
        if (p.amountNature === 'رقم دفعة') {
          contractPaid += amount;
        }
      });

      const netPaid = contractPaid;
      const remaining = contract.contractValue - netPaid;
      
      totalValue += contract.contractValue;
      totalPaid += netPaid;
      totalRemaining += remaining;

      return {
        ...contract,
        netPaid,
        remaining
      };
    });

    return {
      totalValue,
      totalPaid,
      totalRemaining,
      contracts: enrichedContracts
    };
  };

  // Calculations for Funds Report
  const getFundsSummary = () => {
    let relevantFunds = [...funds];
    let relevantTransactions = [...fundTransactions];

    const fundsWithBalance = relevantFunds.map(fund => {
      let txs = fundTransactions.filter(t => {
        const tFundId = t.fundId || (t as any).fund_id;
        const tToFundId = t.toFundId || (t as any).to_fund_id;
        return tFundId === fund.id || tToFundId === fund.id;
      });
      if (toDate) {
         txs = txs.filter(t => t.date <= toDate);
      }
      
      let balance = Number(fund.initialBalance) || 0;
      let totalDeposits = 0;
      let totalWithdrawals = 0;

      txs.forEach(t => {
        const amt = Number(t.amount) || 0;
        const tFundId = t.fundId || (t as any).fund_id;
        const tToFundId = t.toFundId || (t as any).to_fund_id;
        
        if (t.type === 'إيداع' && tFundId === fund.id) {
          totalDeposits += amt;
        } else if (t.type === 'سحب' && tFundId === fund.id) {
          totalWithdrawals += amt;
        } else if (t.type === 'تحويل') {
          if (tFundId === fund.id) {
            totalWithdrawals += amt;
          }
          if (tToFundId === fund.id) {
            totalDeposits += amt;
          }
        }
      });
      return { ...fund, balance, totalDeposits, totalWithdrawals };
    });

    if (fromDate) {
       relevantTransactions = relevantTransactions.filter(t => t.date >= fromDate);
    }
    if (toDate) {
       relevantTransactions = relevantTransactions.filter(t => t.date <= toDate);
    }

    if (fundFilter && fundFilter !== '') {
       relevantTransactions = relevantTransactions.filter(t => {
         const tFundId = t.fundId || (t as any).fund_id;
         const tToFundId = t.toFundId || (t as any).to_fund_id;
         return tFundId === fundFilter || tToFundId === fundFilter;
       });
    }

    if (fundTransactionTypeFilter && fundTransactionTypeFilter !== '') {
       relevantTransactions = relevantTransactions.filter(t => t.type === fundTransactionTypeFilter);
    }

    let filteredTransactions = relevantTransactions;

    const totalBalance = fundsWithBalance.reduce((sum, f) => sum + f.balance, 0);

    return {
      fundsWithBalance,
      transactions: filteredTransactions,
      totalBalance
    };
  };

  const formatCurrency = (amount: number) => {
    const numStr = (amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const swapped = numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
    return `${swapped} د.ج`;
  };

  return {
    activeCategory,
    setActiveCategory,
    
    activeIndividualTab,
    setActiveIndividualTab,
    
    activeExpenseTab,
    setActiveExpenseTab,
    
    activeContractTab,
    setActiveContractTab,
    
    fromDate,
    setFromDate: (val: string) => { setFromDate(val); setPresetDate('custom'); },
    toDate,
    setToDate: (val: string) => { setToDate(val); setPresetDate('custom'); },
    presetDate,
    handlePresetDateChange,
    selectedMember,
    setSelectedMember,
    expenseTypeFilter,
    setExpenseTypeFilter,
    individualPaymentTypeFilter,
    setIndividualPaymentTypeFilter,
    fundFilter,
    setFundFilter,
    fundTransactionTypeFilter,
    setFundTransactionTypeFilter,

    members,
    contracts,
    funds,
    fundTransactions,
    isLoading,
    getIndividualSummary,
    getExpenseSummary,
    getContractsSummary,
    getFundsSummary,
    formatCurrency,

    handlePrint,
  };
};
