import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Match } from '../Matches/match_model';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { ContractsData } from '../Contracts/contracts_data';
import { ContractModel } from '../Contracts/contract_model';
import { PaymentsData } from '../Payments/payments_data';
import type { PaymentRecord } from '../Payments/payment_model';
import { FundsData } from '../Funds/funds_data';
import type { Fund, FundTransaction } from '../Funds/fund_model';
import { buildOperations } from '../Operations/operation_model';
import type { Operation } from '../Operations/operation_model';
import { contractDues, homeExpenses, seasonStartOf } from '../Reports/reportMath';
import client from '../../../core/api/client';

/** What is left to pay on a list of debts (loans or purchases on credit) */
const leftOn = (res: { data?: { data?: { remaining?: number }[] } } | null) =>
  Math.round((res?.data?.data || []).reduce((s, d) => s + (Number(d.remaining) || 0), 0) * 100) / 100;

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

export interface MobileDashboard {
  nextMatch: Match | null;
  overdueContracts: number;
}

// Match dates come as "YYYY-MM-DD HH:mm:ss" in Algeria time (UTC+1)
export const parseMatchDate = (matchDate?: string): Date | null => {
  if (!matchDate) return null;
  let formatted = matchDate.includes('T') ? matchDate : matchDate.replace(' ', 'T');
  if (!formatted.includes('+') && !formatted.includes('Z')) formatted = `${formatted}+01:00`;
  const date = new Date(formatted);
  return isNaN(date.getTime()) ? null : date;
};

const isMatchPlayed = (m: Match) =>
  m.match_status === 'منتهية' ||
  (m.team_score !== null && m.team_score !== undefined && m.opponent_score !== null && m.opponent_score !== undefined);

const toList = <T,>(res: { data?: unknown } | null): T[] => {
  const body = res?.data as { data?: unknown } | T[] | undefined;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data as T[];
  return [];
};

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
  const [dashboard, setDashboard] = useState<MobileDashboard>({
    nextMatch: null,
    overdueContracts: 0,
  });

  const crud = new Crud();
  const membersData = new MembersData(crud);
  const contractsData = new ContractsData(crud);
  const paymentsData = new PaymentsData(crud);
  const fundsData = new FundsData(crud);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      const [membersRes, contractsRes, paymentsRes, fundsRes, fundTransactionsRes, matchesRes, loansRes, creditRes] = await Promise.all([
        membersData.getMembers(),
        contractsData.getContracts(),
        paymentsData.getPayments(),
        fundsData.getFunds(),
        fundsData.getTransactions(),
        axios.get(Applink.matches, authHeaders).catch(() => null),
        client.get('/debts').catch(() => null),
        client.get('/payments/credit').catch(() => null),
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

      // Spent since the start of the season (advance returns subtracted), by who was paid
      const memberType = new Map(members.map(m => [String(m.id), m.type]));
      const spent = homeExpenses(payments, id => memberType.get(id), seasonStartOf());
      const paidToPlayers = spent.players;
      const paidToStaff = spent.staff;
      const otherExpenses = spent.other;
      const totalExpenses = spent.total;

      // Debts (instalments already due and unpaid) and upcoming dues, from the active contracts
      const dues = contractDues(contracts, payments);
      // All the club owes: contract instalments due and unpaid, loans put into the funds, purchases on credit
      const totalDebts = Math.round((dues.debts + leftOn(loansRes) + leftOn(creditRes)) * 100) / 100;
      // "المستحقات القادمة": what is left to pay on the instalments of the active contracts
      const upcomingEntitlements = dues.remaining;
      const overdueContracts = dues.overdueContracts;

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

      // Operations for the desktop table (mobile uses the Operations page)
      const ops = buildOperations(payments, members, funds, fundTransactions);
      setRecentOperations(ops.slice(0, 3));
      setAllOperations(ops);

      // Nearest unplayed match from today onwards (today's match stays until it gets a result)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const nextMatch = toList<Match>(matchesRes)
        .map(m => ({ m, date: parseMatchDate(m.match_date) }))
        .filter(({ m, date }) => date && date.getTime() >= startOfToday.getTime() && m.match_status !== 'ملغاة' && !isMatchPlayed(m))
        .sort((a, b) => a.date!.getTime() - b.date!.getTime())[0]?.m || null;

      setDashboard({ nextMatch, overdueContracts });
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
    dashboard,
    formatCurrency
  };
};
