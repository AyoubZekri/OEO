/* eslint-disable @typescript-eslint/no-explicit-any -- operations and movements come untyped from the API */

export interface EquipmentPermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  viewMovements: boolean;
}

export interface OperationPermissions {
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  giveBack: boolean;
}

// Same choices as the desktop dialogs
export const HANDOVER_CONDITIONS = ['جيد', 'متوسط', 'جديد'];
export const RETURN_CONDITIONS = ['ممتاز', 'جيد', 'مقبول', 'سيء', 'تالف'];

export const personOf = (op: any) => op?.individual || op?.member || null;
export const memberNameOf = (op: any) => {
  const p = personOf(op);
  return p ? `${p.first_name} ${p.last_name}` : 'غير معروف';
};

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('') || '؟';

export const movementsOf = (op: any): any[] => op?.movements || [];
export const returnedCount = (op: any) => movementsOf(op).filter(m => m.return_date).length;

/** dd/mm/yyyy like the desktop tables */
export const shortDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('en-GB') : 'غير متوفر');

/** "2026/2027" seasons for the quick choices (the desktop placeholder uses this format) */
export const seasonChoice = (offset = 0) => {
  const d = new Date();
  const start = (d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1) + offset;
  return `${start}/${start + 1}`;
};

export const availableOf = (eq: any) => Number(eq?.available_quantity ?? eq?.availableQuantity ?? 0);
/* eslint-enable @typescript-eslint/no-explicit-any */
