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

export interface FinancialMetrics {
  totalExpenses: number;
  paidToPlayers: number;
  paidToStaff: number;
  otherExpenses: number;
  totalDebts: number;
  dueIn7Days: number;
  dueIn30Days: number;
  cashBalance: number;
  bankBalance: number;
  totalBalance: number;
  upcomingEntitlements: number;
}

export interface Operation {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
}

export const useHomeController = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalExpenses: 0,
    paidToPlayers: 0,
    paidToStaff: 0,
    otherExpenses: 0,
    totalDebts: 0,
    upcomingEntitlements: 0,
    dueIn7Days: 0,
    dueIn30Days: 0,
    cashBalance: 0,
    bankBalance: 0,
    totalBalance: 0,
  });

  const [recentOperations, setRecentOperations] = useState<Operation[]>([]);
  const [allOperations, setAllOperations] = useState<Operation[]>([]);
  const [isOperationsDialogOpen, setIsOperationsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const crud = new Crud();
  const membersData = new MembersData(crud);
  const contractsData = new ContractsData(crud);
  const paymentsData = new PaymentsData(crud);
  const fundsData = new FundsData(crud);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [membersRes, contractsRes, paymentsRes, fundsRes, fundTransactionsRes] = await Promise.all([
        membersData.getMembers(),
        contractsData.getContracts(),
        paymentsData.getPayments(),
        fundsData.getFunds(),
        fundsData.getTransactions()
      ]);

      let members: MemberModel[] = [];
      let contracts: ContractModel[] = [];
      let payments: PaymentRecord[] = [];
      let funds: Fund[] = [];
      let fundTransactions: FundTransaction[] = [];

      if (membersRes) members = (Array.isArray(membersRes) ? membersRes : (membersRes.data || [])).map(MemberModel.fromJson);
      if (contractsRes) contracts = (Array.isArray(contractsRes) ? contractsRes : (contractsRes.data || [])).map(ContractModel.fromJson);
      if (paymentsRes) payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.data || []);
      if (fundsRes) funds = Array.isArray(fundsRes) ? fundsRes : (fundsRes.data || []);
      if (fundTransactionsRes) fundTransactions = Array.isArray(fundTransactionsRes) ? fundTransactionsRes : (fundTransactionsRes.data || []);

      // Calculate Funds Balances
      let bankBalance = 0;
      let cashBalance = 0;
      
      funds.forEach(fund => {
        const balance = Number(fund.initialBalance) || 0;
        if (fund.icon === 'bank') bankBalance += balance;
        else cashBalance += balance;
      });

      // Calculate Payments Metrics
      let paidToPlayers = 0;
      let paidToStaff = 0;
      let otherExpenses = 0;

      payments.forEach(p => {
        if (p.amountNature === 'إرجاع سلفة') return; // Skip return of advance

        const amt = Number(p.amount) || 0;
        if (p.memberId) {
           const member = members.find(m => m.id === p.memberId);
           if (member?.type === 'player' || member?.type === 'لاعب') paidToPlayers += amt;
           else paidToStaff += amt;
        } else {
           otherExpenses += amt;
        }
      });

      const totalExpenses = paidToPlayers + paidToStaff + otherExpenses;

      // Calculate Debts and Upcoming Entitlements
      let totalDebts = 0;
      let upcomingEntitlements = 0;
      const today = new Date().getTime();

      contracts.forEach(c => {
         const contractValue = c.contractValue || 0;
         const numPayments = c.numberOfPayments || 1;
         const paymentValue = numPayments > 0 ? contractValue / numPayments : 0;
         
         if (paymentValue <= 0) return;

         let memberPayments = payments
            .filter(p => p.memberId === c.individuals_id && p.amountNature === 'رقم دفعة')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
         const start = new Date(c.startDate).getTime() || today;
         const end = new Date(c.endDate).getTime() || today;
         const duration = end - start > 0 ? end - start : 0;
         const interval = numPayments > 0 ? duration / numPayments : 0;

         for (let i = 1; i <= numPayments; i++) {
           const dueDate = start + (interval * i);
           
           if (memberPayments >= paymentValue) {
             memberPayments -= paymentValue;
           } else {
             const unpaidPortion = paymentValue - memberPayments;
             memberPayments = 0;
             if (dueDate <= today) {
               totalDebts += unpaidPortion;
             } else {
               upcomingEntitlements += unpaidPortion;
             }
           }
         }
      });
      
      setMetrics({
        totalExpenses,
        paidToPlayers,
        paidToStaff,
        otherExpenses,
        totalDebts,
        upcomingEntitlements,
        dueIn7Days: 0,
        dueIn30Days: 0,
        cashBalance,
        bankBalance,
        totalBalance: cashBalance + bankBalance,
      });

      // Unified Recent Operations
      const ops: Operation[] = [];
      
      payments.forEach(p => {
        const member = members.find(m => m.id === p.memberId);
        const name = member ? `${member.first_name} ${member.last_name}` : (p.occasion || 'مصروف');
        ops.push({
          id: `p_${p.id}`,
          name: name,
          type: p.amountNature || 'دفع',
          amount: Number(p.amount) || 0,
          date: p.paymentDate
        });
      });

      fundTransactions.forEach(t => {
         const tFundId = t.fundId || (t as any).fund_id;
         const fund = funds.find(f => f.id === tFundId);
         const fundName = fund ? fund.name : 'صندوق';
         ops.push({
           id: `f_${t.id}`,
           name: fundName,
           type: t.type,
           amount: Number(t.amount) || 0,
           date: t.date || (t as any).transaction_date || ''
         });
      });

      // Sort by date descending
      ops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Take top 3 for recent
      setRecentOperations(ops.slice(0, 3));
      setAllOperations(ops);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    const numStr = (amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const swapped = numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
    return `${swapped} د.ج`;
  };

  return {
    metrics,
    recentOperations,
    allOperations,
    isOperationsDialogOpen,
    setIsOperationsDialogOpen,
    isLoading,
    formatCurrency
  };
};
