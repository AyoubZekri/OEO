import React, { useState, useEffect } from 'react';
import type { usePaymentsController } from './PaymentsController';
import type { PaymentRecord } from './payment_model';

/* eslint-disable @typescript-eslint/no-explicit-any -- payments come with mixed field names from the API */

export type TransactionKind = 'دفع' | 'مصروف' | 'مصاريف استثنائية';

// "طبيعة المبلغ" choices of each operation type
export const MEMBER_NATURES = [
  'راتب شهري', 'رقم دفعة', 'تسجيل أهداف', 'منحة مقابلات', 'مصاريف التنقل', 'نتيجة', 'تحفيز',
  'جزء من المستحقات', 'باقي المستحقات', 'تسوية جزئية', 'تسوية نهائية', 'سلفة', 'إرجاع سلفة', 'اخرى',
];
export const EXPENSE_NATURES = ['تعويض مصاريف', 'تنقل', 'اقامة', 'إطعام', 'تجهيزات', 'صيانة', 'فواتير', 'كراء', 'اخرى'];
export const naturesOf = (type: TransactionKind) => (type === 'دفع' ? MEMBER_NATURES : EXPENSE_NATURES);

export const PAYMENT_METHODS = ['نقدا', 'تحويل بنكي', 'صك', 'حوالة', 'دفع إلكتروني', 'أخرى'];

/** Natures whose amount/details come from the contract, so they have no free "occasion" text */
export const NO_OCCASION_NATURES = ['رقم دفعة', 'راتب شهري', 'تسجيل أهداف', 'منحة مقابلات', 'مصاريف التنقل'];

const getDefaultSeasonYear = () => {
  const d = new Date();
  const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear} - ${startYear + 1}`;
};

// Add / edit payment form state, shared by the desktop dialog and the phone page
/** A purchase on credit as the debts API takes it */
export interface CreditPurchase {
  kind: 'purchase';
  creditor: string;
  creditor_phone: string | null;
  title: string | null;
  amount: number;
  debt_date: string;
  due_date: string | null;
  expense_nature: string;
  notes: string | null;
}

/**
 * `saveCredit`: records an expense bought on credit (not paid yet) as a purchase debt;
 * it is paid later, in parts or at once, from the "مشتريات بالدين" view of the same page.
 */
export const usePaymentForm = (controller: ReturnType<typeof usePaymentsController>, { saveCredit }: { saveCredit?: (data: CreditPurchase) => Promise<void> } = {}) => {
  const { contracts, editingPayment, openDialog, savePayment, getMemberDetails } = controller;

  const [transactionType, setTransactionType] = useState<TransactionKind>('دفع');
  const [memberId, setMemberId] = useState('');
  const [fundId, setFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [postalCheck, setPostalCheck] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدا');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountNature, setAmountNature] = useState('راتب شهري');
  const [installmentNumber, setInstallmentNumber] = useState('');
  const [dateFrom, setDateFrom] = useState(getDefaultSeasonYear());
  const [dateTo, setDateTo] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState<number>(1);
  const [occasion, setOccasion] = useState('');
  const [numberOfGoals, setNumberOfGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  // Expense bought on credit: who we owe, and when it is due
  const [onCredit, setOnCredit] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [creditorPhone, setCreditorPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditError, setCreditError] = useState('');

  // Auto-calculate amount based on contract and amountNature
  /* eslint-disable react-hooks/set-state-in-effect -- original desktop behaviour, moved here unchanged */
  useEffect(() => {
    if (transactionType === 'دفع' && memberId && amountNature && contracts.length > 0 && !editingPayment) {
      const memberContracts = contracts.filter(c => String(c.individuals_id) === String(memberId));
      let contract = memberContracts.find(c => String(c.id) === String(selectedContractId));
      if (!contract && memberContracts.length > 0) {
        contract = memberContracts[0];
        setSelectedContractId(contract.id);
        setDateFrom(contract.startDate || getDefaultSeasonYear());
        setDateTo(contract.endDate || '');
      }

      if (contract) {
        if (amountNature === 'راتب شهري') {
          setAmount(((contract.monthlySalary || 0) * numberOfMonths).toString());
        } else if (amountNature === 'تسجيل أهداف') {
          const goals = parseInt(numberOfGoals) || 0;
          setAmount(((contract.goalsBonus || 0) * goals).toString());
        } else if (amountNature === 'منحة مقابلات') {
          setAmount(contract.winBonus?.toString() || '0');
        } else if (amountNature === 'مصاريف التنقل') {
          setAmount(contract.transportationExpenses?.toString() || '0');
        } else if (amountNature === 'رقم دفعة') {
          if (installmentNumber && contract.installments && Array.isArray(contract.installments)) {
            const installment = contract.installments.find((inst: any) => String(inst.installment_number) === String(installmentNumber));
            if (installment) {
              setAmount(installment.amount.toString());
              return;
            }
          }
          setAmount(contract.paymentValue ? contract.paymentValue.toString() : '0');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same dependencies as the original desktop effect
  }, [memberId, amountNature, numberOfGoals, installmentNumber, numberOfMonths, contracts, editingPayment, selectedContractId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenDialog = (payment?: PaymentRecord, credit = false) => {
    setOnCredit(credit);
    setCreditor('');
    setCreditorPhone('');
    setDueDate('');
    setCreditError('');
    if (payment) {
      setTransactionType(payment.transactionType || (payment as any).transaction_type || (payment as any).type || 'دفع');
      setMemberId(payment.memberId || (payment as any).id_individuals?.toString() || '');
      setFundId(payment.fundId || payment.fund_id?.toString() || '');
      setAmount((payment.amount || (payment as any).Amount || 0).toString());
      setPaymentMethod(payment.paymentMethod || (payment as any).Payment_method || 'نقدا');
      setPaymentDate(payment.paymentDate || (payment as any).Date || '');
      setPostalCheck(payment.postal_check || (payment as any).checkNumber || '');

      const nature = payment.amountNature || (payment as any).Nature_amount || (payment as any).amount_nature || 'راتب شهري';
      setAmountNature(nature);

      const occasionOrNum = payment.installmentNumber || payment.checkNumber || (payment as any).Occasion_Reason_numper || '';
      const rawOccasion = payment.occasion || occasionOrNum.toString() || '';
      if (nature === 'رقم دفعة') {
        let instNum = occasionOrNum;
        if (!instNum) instNum = payment.checkNumber || ''; // Fallback as seen in table logic
        setInstallmentNumber(instNum.toString());
        setOccasion('');
      } else if (nature === 'راتب شهري') {
        setInstallmentNumber('');
        const parts = rawOccasion.split('-');
        if (parts.length === 2) {
          setMonth(parts[0]);
          setYear(parts[1]);
        } else {
          setMonth(payment.month || '');
          setYear(payment.year || '');
        }
        setOccasion('');
      } else if (nature === 'تسجيل أهداف') {
        setInstallmentNumber('');
        setNumberOfGoals(rawOccasion || payment.numberOfGoals?.toString() || '');
        setOccasion('');
      } else {
        setInstallmentNumber('');
        setOccasion(rawOccasion);
      }

      setDateFrom(payment.dateFrom || '');
      setDateTo(payment.dateTo || '');
      setNumberOfMonths(payment.numberOfMonths || (payment as any).Number_of_months || 1);
      if (nature !== 'تسجيل أهداف') setNumberOfGoals(payment.numberOfGoals?.toString() || '');
      if (nature !== 'راتب شهري') {
        setMonth(payment.month || '');
        setYear(payment.year || '');
      }
      setNotes(payment.notes || (payment as any).nots || '');
      setSelectedContractId(payment.contract_id?.toString() || '');
    } else {
      setTransactionType('دفع');
      setMemberId('');
      setFundId('');
      setAmount('');
      setPaymentMethod('نقدا');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPostalCheck('');
      setAmountNature('راتب شهري');
      setInstallmentNumber('');
      setDateFrom(getDefaultSeasonYear());
      setDateTo('');
      setMonth('');
      setYear('');
      setNumberOfMonths(1);
      setOccasion('');
      setNumberOfGoals('');
      setNotes('');
      setSelectedContractId('');
      if (credit) {
        setTransactionType('مصروف');
        setAmountNature('تجهيزات');
      }
    }
    setFormSubmitted(false);
    openDialog(payment);
  };

  /** Contract picker change: also moves the season dates, like the desktop */
  const selectContract = (val: string) => {
    setSelectedContractId(val);
    const selectedContract = contracts.find(c => String(c.id) === String(val));
    if (selectedContract) {
      setDateFrom(selectedContract.startDate || getDefaultSeasonYear());
      setDateTo(selectedContract.endDate || '');
    }
  };

  /** The expense is on credit: only a new expense (مصروف) can be, and only when the page handles it */
  const creditMode = onCredit && transactionType === 'مصروف' && !editingPayment && !!saveCredit;

  const saveOnCredit = async () => {
    if (!creditor.trim()) return setCreditError('اكتب اسم البائع أو المحل');
    if (!(parseFloat(amount) > 0)) return setCreditError('اكتب المبلغ');
    if (!paymentDate) return setCreditError('حدد تاريخ الشراء');
    if (dueDate && dueDate < paymentDate) return setCreditError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الشراء');
    setCreditError('');
    setCreditSaving(true);
    try {
      await saveCredit!({
        kind: 'purchase',
        creditor: creditor.trim(),
        creditor_phone: creditorPhone.trim() || null,
        title: occasion.trim() || null,
        amount: parseFloat(amount) || 0,
        debt_date: paymentDate,
        due_date: dueDate || null,
        expense_nature: amountNature,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setCreditError((err as Error).message);
    } finally {
      setCreditSaving(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormSubmitted(true);
    if (creditMode) {
      saveOnCredit();
      return;
    }
    if (transactionType === 'دفع' && !memberId) return;
    if (transactionType !== 'مصاريف استثنائية' && !fundId) return;

    let computedOccasion = occasion;
    if (amountNature === 'راتب شهري') {
      computedOccasion = (month && year) ? `${month}-${year}` : occasion;
    } else if (amountNature === 'تسجيل أهداف') {
      computedOccasion = numberOfGoals;
    } else if (['رقم دفعة', 'منحة مقابلات', 'مصاريف التنقل'].includes(amountNature)) {
      computedOccasion = '';
    }

    savePayment({
      transactionType,
      memberId: transactionType === 'دفع' ? memberId : undefined,
      fundId: fundId || undefined,
      amount: parseFloat(amount) || 0,
      paymentMethod,
      paymentDate,
      postal_check: postalCheck,
      amountNature,
      installmentNumber: amountNature === 'رقم دفعة' ? installmentNumber : undefined,
      dateFrom: amountNature === 'رقم دفعة' ? dateFrom : undefined,
      dateTo: amountNature === 'رقم دفعة' ? dateTo : undefined,
      month: amountNature === 'راتب شهري' ? month : undefined,
      year: amountNature === 'راتب شهري' ? year : undefined,
      numberOfMonths: amountNature === 'راتب شهري' ? numberOfMonths : undefined,
      occasion: computedOccasion || undefined,
      numberOfGoals: amountNature === 'تسجيل أهداف' ? (parseInt(numberOfGoals) || 0) : undefined,
      notes,
      contract_id: selectedContractId || undefined
    });
  };

  const selectedMemberDetails = memberId ? getMemberDetails(memberId) : null;

  return {
    transactionType, setTransactionType,
    memberId, setMemberId,
    fundId, setFundId,
    amount, setAmount,
    postalCheck, setPostalCheck,
    paymentMethod, setPaymentMethod,
    paymentDate, setPaymentDate,
    amountNature, setAmountNature,
    installmentNumber, setInstallmentNumber,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    month, setMonth,
    year, setYear,
    numberOfMonths, setNumberOfMonths,
    occasion, setOccasion,
    numberOfGoals, setNumberOfGoals,
    notes, setNotes,
    selectedContractId, setSelectedContractId,
    selectContract,
    formSubmitted,
    handleOpenDialog,
    handleSave,
    selectedMemberDetails,
    canCredit: !!saveCredit,
    onCredit, setOnCredit, creditMode,
    creditor, setCreditor,
    creditorPhone, setCreditorPhone,
    dueDate, setDueDate,
    creditSaving, creditError,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
