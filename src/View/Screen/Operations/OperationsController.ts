import { useEffect, useMemo, useState } from 'react';
import { Crud } from '../../../core/class/Crud';
import { MembersData } from '../Members/members_data';
import { MemberModel } from '../Members/member_model';
import { PaymentsData } from '../Payments/payments_data';
import type { PaymentRecord } from '../Payments/payment_model';
import { FundsData } from '../Funds/funds_data';
import type { Fund, FundTransaction } from '../Funds/fund_model';
import { buildOperations, operationTotals } from './operation_model';
import type { Operation, OperationDirection } from './operation_model';

export type OperationsFilter = 'all' | OperationDirection;

const asList = <T,>(res: unknown): T[] => {
  if (Array.isArray(res)) return res;
  const data = (res as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? data : [];
};

export const useOperationsController = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OperationsFilter>('all');

  useEffect(() => {
    const crud = new Crud();
    const membersData = new MembersData(crud);
    const paymentsData = new PaymentsData(crud);
    const fundsData = new FundsData(crud);

    const fetchData = async () => {
      setIsLoading(true);
      const [membersRes, paymentsRes, fundsRes, transactionsRes] = await Promise.all([
        membersData.getMembers(),
        paymentsData.getPayments(),
        fundsData.getFunds(),
        fundsData.getTransactions(),
      ]);

      const members = asList(membersRes).map(MemberModel.fromJson);
      const paymentList = asList<PaymentRecord>(paymentsRes);
      setPayments(paymentList);
      setOperations(buildOperations(
        paymentList,
        members,
        asList<Fund>(fundsRes),
        asList<FundTransaction>(transactionsRes)
      ));
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const totals = useMemo(() => operationTotals(operations, payments), [operations, payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return operations.filter(op =>
      (filter === 'all' || op.direction === filter) &&
      (!q || op.name.toLowerCase().includes(q) || op.type.toLowerCase().includes(q))
    );
  }, [operations, search, filter]);

  // Group by month, keeping newest first
  const groups = useMemo(() => {
    const map = new Map<string, Operation[]>();
    filtered.forEach(op => {
      const d = new Date(op.date);
      const key = isNaN(d.getTime())
        ? 'بدون تاريخ'
        : new Intl.DateTimeFormat('ar-DZ', { month: 'long', year: 'numeric' }).format(d);
      map.set(key, [...(map.get(key) || []), op]);
    });
    return [...map.entries()];
  }, [filtered]);

  return {
    isLoading,
    operations,
    totals,
    groups,
    filteredCount: filtered.length,
    search,
    setSearch,
    filter,
    setFilter,
  };
};
