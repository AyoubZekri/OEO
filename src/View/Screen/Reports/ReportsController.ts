import { useState, useEffect } from 'react';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { ContractsData } from '../Contracts/contracts_data';
import { ContractModel } from '../Contracts/contract_model';
import { PaymentsData } from '../Payments/payments_data';
import type { PaymentRecord } from '../Payments/payment_model';
import { FundsData } from '../Funds/funds_data';
import type { Fund, FundTransaction } from '../Funds/fund_model';
import type { ReportCategory, IndividualReportType, ExpenseReportType, ContractReportType } from './report_model';
import { contractCommitments, expenseSummary, fundSummary, individualSummary, inRange, normDate, presetRange } from './reportMath';

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
  const [expenseTransactionTypeFilter, setExpenseTransactionTypeFilter] = useState<string>('');

  const handlePresetDateChange = (preset: string) => {
    setPresetDate(preset);
    const range = presetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
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

  // Calculations for Individuals Report: see reportMath.individualSummary
  const getIndividualSummary = () => {
    const summary = individualSummary({
      members,
      contracts,
      payments,
      memberId: selectedMember,
      group: activeIndividualTab,
      nature: individualPaymentTypeFilter,
      from: fromDate,
      to: toDate,
    });
    return {
      ...summary,
      // Kept for the existing screens
      dueTillToday: summary.due,
      payments: summary.rows,
    };
  };

  // Calculations for Expenses Report (payments & expenses table): see reportMath.expenseSummary
  const getExpenseSummary = () => {
    const summary = expenseSummary(payments, {
      kind: expenseTransactionTypeFilter,
      nature: expenseTypeFilter,
      from: fromDate,
      to: toDate,
    });
    return {
      ...summary,
      // Kept for the existing screens: the net total and the filtered rows
      totalAmount: summary.net,
      payments: summary.rows,
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

    // Calculate totalPaid from payments table directly (including deleted contracts)
    let paymentsForTotal = [...payments];
    if (selectedMember && selectedMember !== '') {
      paymentsForTotal = paymentsForTotal.filter(p => p.memberId === selectedMember);
    }
    paymentsForTotal = paymentsForTotal.filter(p => inRange(normDate(p.paymentDate), fromDate, toDate));

    paymentsForTotal.forEach(p => {
      const nature = p.amountNature || '';
      if (nature === 'رقم دفعة') {
        totalPaid += (Number(p.amount) || 0);
      }
    });

    const enrichedContracts = relevantContracts.map(contract => {
      const memberPayments = payments.filter(p => p.memberId === contract.individuals_id);
      
      let allTimeContractPaid = 0;

      memberPayments.forEach(p => {
        const amount = Number(p.amount) || 0;
        const nature = p.amountNature || '';
        
        if (nature === 'رقم دفعة') {
          // Add extra check to make sure it belongs to the contract if possible
          // to perfectly match MembersController behavior
          let belongsToContract = true;
          if (p.contract_id && String(p.contract_id) !== String(contract.id)) {
             belongsToContract = false;
          }
          
          if (belongsToContract) {
            allTimeContractPaid += amount;
          }
        }
      });

      const netPaid = allTimeContractPaid;
      const remaining = contract.contractValue - allTimeContractPaid;
      
      totalValue += contract.contractValue;

      return {
        ...contract,
        netPaid,
        remaining
      };
    });

    totalRemaining = totalValue - totalPaid;

    return {
      totalValue,
      totalPaid,
      totalRemaining,
      contracts: enrichedContracts
    };
  };

  // Calculations for Funds Report: balance at the end of the period and what was paid from each fund (see reportMath.fundSummary)
  const getFundsSummary = () => {
    const summary = fundSummary(funds, fundTransactions, payments, { fund: fundFilter, from: fromDate, to: toDate });
    const idOf = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    // The movements list, with the same period and fund
    const transactions = fundTransactions.filter(t => {
      const from = idOf(t.fundId ?? (t as unknown as { fund_id?: string }).fund_id);
      const to = idOf(t.toFundId ?? (t as unknown as { to_fund_id?: string }).to_fund_id);
      return inRange(normDate(t.date), fromDate, toDate)
        && (!fundFilter || from === fundFilter || to === fundFilter)
        && (!fundTransactionTypeFilter || t.type === fundTransactionTypeFilter);
    });

    return {
      ...summary,
      // Kept for the existing screens
      fundsWithBalance: summary.funds,
      transactions,
    };
  };

  /** Monthly salaries and transport expenses of the active contracts (what is owed each month, not what was paid) */
  const getContractCommitments = () => contractCommitments(contracts);

  const deleteFundTransaction = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      const response = await fundsData.deleteTransaction({ id });
      if (response) {
        setFundTransactions(prev => prev.filter(t => t.id !== id));
      }
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
    expenseTransactionTypeFilter,
    setExpenseTransactionTypeFilter,

    members,
    contracts,
    funds,
    fundTransactions,
    isLoading,
    getIndividualSummary,
    getExpenseSummary,
    getContractsSummary,
    getFundsSummary,
    getContractCommitments,
    deleteFundTransaction,
    formatCurrency,

    handlePrint,
  };
};
