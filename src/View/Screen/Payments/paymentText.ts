import type { PaymentRecord } from './payment_model';
import { Applink } from '../../../LinkApi';

/* eslint-disable @typescript-eslint/no-explicit-any -- payments come with mixed field names from the API */

export const getInstallmentText = (num: any) => {
  const strNum = String(num).trim();
  const map: Record<string, string> = {
    '1': 'الأولى',
    '2': 'الثانية',
    '3': 'الثالثة',
    '4': 'الرابعة',
    '5': 'الخامسة',
    '6': 'السادسة',
    '7': 'السابعة',
    '8': 'الثامنة',
    '9': 'التاسعة',
    '10': 'العاشرة',
  };
  return map[strNum] || strNum;
};

export const MONTHS: { value: string; label: string }[] = [
  { value: '01', label: 'جانفي' },
  { value: '02', label: 'فيفري' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أفريل' },
  { value: '05', label: 'ماي' },
  { value: '06', label: 'جوان' },
  { value: '07', label: 'جويلية' },
  { value: '08', label: 'أوت' },
  { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
];

export const getMonthName = (monthStr: string) => MONTHS.find(m => m.value === monthStr)?.label || monthStr;

/** "طبيعة المبلغ" column text: installment name, salary months, or nature - occasion */
export const paymentNatureText = (payment: PaymentRecord) => {
  const amountNatureVal = String(payment.amountNature || (payment as any).amount_nature || '').trim();
  let instNumVal = payment.installmentNumber || (payment as any).Occasion_Reason_numper || (payment as any).occasion_reason_numper || (payment as any).Occasion_reason_numper;
  if (!instNumVal && amountNatureVal === 'رقم دفعة') {
    instNumVal = payment.checkNumber;
  }

  const isInstallment = amountNatureVal === 'رقم دفعة' || !!(payment.installmentNumber || (payment as any).Occasion_Reason_numper || (payment as any).occasion_reason_numper);

  if (isInstallment && instNumVal) {
    return `الدفعة ${getInstallmentText(instNumVal)}`;
  }

  const occasionVal = payment.occasion || payment.checkNumber;

  if (amountNatureVal === 'راتب شهري' && occasionVal) {
    const parts = occasionVal.split('-');
    if (parts.length === 2) {
      const mStr = parts[0];
      const yStr = parts[1];
      const numMonths = payment.numberOfMonths || (payment as any).Number_of_months || 1;

      if (numMonths > 3) {
        const currentMonthNum = parseInt(mStr);
        const currentYearNum = parseInt(yStr);
        let endMonthNum = currentMonthNum + numMonths - 1;
        let endYearNum = currentYearNum;

        while (endMonthNum > 12) {
          endMonthNum -= 12;
          endYearNum++;
        }

        const startMonthName = getMonthName(currentMonthNum.toString().padStart(2, '0'));
        const endMonthName = getMonthName(endMonthNum.toString().padStart(2, '0'));

        if (currentYearNum !== endYearNum) {
          return `${amountNatureVal} - من شهر ${startMonthName} ${currentYearNum} إلى شهر ${endMonthName} ${endYearNum}`;
        } else {
          return `${amountNatureVal} - من شهر ${startMonthName} إلى شهر ${endMonthName} - ${yStr}`;
        }
      } else if (numMonths > 1) {
        let currentMonthNum = parseInt(mStr);
        let currentYearNum = parseInt(yStr);
        const monthNames = [];
        for (let i = 0; i < numMonths; i++) {
          const formattedMonth = currentMonthNum.toString().padStart(2, '0');
          monthNames.push(getMonthName(formattedMonth));
          currentMonthNum++;
          if (currentMonthNum > 12) {
            currentMonthNum = 1;
            currentYearNum++;
          }
        }
        return `${amountNatureVal} - ${monthNames.join('، ')} - ${yStr}`;
      } else {
        return `${amountNatureVal} - ${getMonthName(mStr)}-${yStr}`;
      }
    }
  }

  return occasionVal ? `${amountNatureVal} - ${occasionVal}` : amountNatureVal;
};

/** Full URL of an uploaded receipt, or null */
export const receiptUrl = (payment: PaymentRecord) => {
  const file = payment.receipt_file;
  if (typeof file !== 'string' || !file) return null;
  return file.startsWith('http') ? file : `${Applink.image}/${file.replace(/^[/\\]/, '')}`;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
