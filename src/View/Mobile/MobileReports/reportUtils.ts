import { Users, CreditCard, Briefcase, Landmark } from 'lucide-react';
import type { ReportCategory, IndividualReportType } from '../../Screen/Reports/report_model';
import { MEMBER_NATURES, EXPENSE_NATURES } from '../../Screen/Payments/usePaymentForm';
import { naturesFor, TRANSACTION_KINDS } from '../../Screen/Reports/reportMath';

export const CATEGORIES: { id: ReportCategory; label: string; short: string; icon: typeof Users; tone: string }[] = [
  { id: 'individuals', label: 'تقارير الأفراد', short: 'الأفراد', icon: Users, tone: 'orange' },
  { id: 'expenses', label: 'تقارير المصاريف', short: 'المصاريف', icon: CreditCard, tone: 'red' },
  { id: 'contracts', label: 'تقارير العقود', short: 'العقود', icon: Briefcase, tone: 'blue' },
  { id: 'funds', label: 'تقارير الصندوق والبنك', short: 'الصناديق', icon: Landmark, tone: 'green' },
];

export const INDIVIDUAL_TABS: { id: IndividualReportType; label: string }[] = [
  { id: 'player', label: 'كشف لاعب' },
  { id: 'coach', label: 'كشف مدرب' },
  { id: 'employee', label: 'كشف موظف' },
];

// Same choices as the desktop filters
export const PERIODS = [
  { value: '', label: 'كل الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'this_week', label: 'هذا الأسبوع' },
  { value: 'last_week', label: 'الأسبوع الماضي' },
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'last_month', label: 'الشهر الماضي' },
  { value: 'this_year', label: 'هذه السنة' },
  { value: 'last_year', label: 'السنة الماضية' },
  { value: 'custom', label: 'مخصص' },
];

export const INDIVIDUAL_NATURES = [
  'راتب شهري', 'رقم دفعة', 'تسجيل أهداف', 'منحة مقابلات', 'نتيجة', 'تحفيز', 'جزء من المستحقات', 'باقي المستحقات',
  'تسوية جزئية', 'تسوية نهائية', 'سلفة', 'إرجاع سلفة', 'استقطاع', 'خصم', 'اخرى',
];

export const EXPENSE_TYPES: string[] = TRANSACTION_KINDS;

/** Same choices as the desktop: the natures of the chosen type, all of them without repeats otherwise */
export const expenseNatures = (type: string) => naturesFor(type, MEMBER_NATURES, EXPENSE_NATURES);

export const FUND_TX_TYPES = ['إيداع', 'سحب', 'تحويل', 'إرجاع'];

/** Options of a bottom-sheet filter, with "الكل" first */
export const withAll = (values: string[]) => [{ value: '', label: 'الكل' }, ...values.map(v => ({ value: v, label: v }))];
