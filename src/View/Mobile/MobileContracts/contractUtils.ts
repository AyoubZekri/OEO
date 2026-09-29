import type { ContractModel } from '../../Screen/Contracts/contract_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { memberPhoto } from '../MobileTeams/teamRoster';
import defaultAvatar from '../../../assets/AVETER.png';

export interface ContractPermissions {
  add: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

/** The number part of an amount, exactly as the desktop writes it: 1.250.000,00 */
export const amountText = (amount: number) =>
  (amount || 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');

// Same amount format as the desktop (formatCurrency): 1.250.000,00 د.ج
export const moneyText = (amount: number) => `${amountText(amount)} د.ج`;

export const contractNumber = (c: ContractModel) => String(c.id).padStart(4, '0');

export const STATUS_LABEL: Record<string, string> = { active: 'نشط', inactive: 'غير نشط' };

// The season is stored in start_date ("2026 - 2027"); old records may hold a real date
export const seasonText = (c: ContractModel) =>
  c.startDate && /^\d{4}-\d{2}-\d{2}$/.test(c.startDate)
    ? new Intl.DateTimeFormat('ar-DZ').format(new Date(c.startDate))
    : c.startDate || '—';

/** Current football season (starts in July), shifted by `offset` seasons */
export const seasonLabel = (offset = 0) => {
  const d = new Date();
  const start = (d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1) + offset;
  return `${start} - ${start + 1}`;
};

export const installmentsTotal = (list: { amount: number | string }[] = []) =>
  list.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

export const beneficiaryOf = (c: ContractModel, individuals: MemberModel[]) =>
  individuals.find(m => String(m.id) === String(c.individuals_id));

export const photoOf = (m?: MemberModel) => (m ? memberPhoto(m) : defaultAvatar);

export const paymentsText = (n: number) =>
  n === 1 ? 'دفعة واحدة' : n === 2 ? 'دفعتان' : n >= 3 && n <= 10 ? `${n} دفعات` : `${n} دفعة`;
