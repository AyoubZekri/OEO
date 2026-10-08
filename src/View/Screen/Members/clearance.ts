import type { PermissionModule } from '../UserManagement/Roles/role_model';

/**
 * Clearance card ("إخلاء الطرف") of a member leaving the club, in three steps:
 * 1. start the departure (date, reason); 2. each department clears the member, seeing what is still pending there;
 * 3. the player acknowledges and the file is closed (the member becomes inactive).
 */
export type DepartmentId = 'admin' | 'sporting' | 'medical' | 'financial' | 'equipment';

export interface ClearanceCard {
  id: number;
  player_id: number;
  exit_date?: string | null;
  exit_reason?: string | null;
  general_notes?: string | null;
  player_signature?: boolean | null;
  player_signed_at?: string | null;
  [column: string]: unknown;
}

/** Something still pending in a department (an amount for the financial ones) */
export interface PendingItem {
  text: string;
  amount?: number;
}

export interface ClearanceState {
  card: ClearanceCard | null;
  checks: Record<DepartmentId, PendingItem[]>;
  signers: Partial<Record<DepartmentId, string>>;
}

/** A member's card, as the members list gets it */
export interface ClearanceSummary {
  player_id: number;
  exit_date: string | null;
  exit_reason: string | null;
  signed: number;
  total: number;
  closed: boolean;
}

export const DEPARTURE_REASONS = ['انتهاء العقد', 'انتقال', 'إعارة', 'فسخ عقد', 'اعتزال', 'سبب آخر'];

/** Each department: its columns, what it checks, and who may sign it (beside full access) */
export const DEPARTMENTS: {
  id: DepartmentId;
  label: string;
  checks: string;
  columns: { status: string; signer: string; at: string; notes: string };
  permission: [PermissionModule, string];
}[] = [
  {
    id: 'admin', label: 'الشؤون الإدارية', checks: 'العقود السارية بعد تاريخ المغادرة',
    columns: { status: 'admin_status', signer: 'admin_id', at: 'admin_cleared_at', notes: 'admin_notes' },
    permission: ['members', 'clearance'],
  },
  {
    id: 'sporting', label: 'الإدارة الرياضية', checks: 'الإجراءات التأديبية المفتوحة',
    columns: { status: 'sporting_status', signer: 'sporting_director_id', at: 'sporting_cleared_at', notes: 'sporting_notes' },
    permission: ['trainingSessions', 'view'],
  },
  {
    id: 'medical', label: 'القسم الطبي', checks: 'الملفات الطبية غير المغلقة',
    columns: { status: 'medical_status', signer: 'medical_staff_id', at: 'medical_cleared_at', notes: 'medical_notes' },
    permission: ['medical', 'view'],
  },
  {
    id: 'financial', label: 'الإدارة المالية', checks: 'السلف ومستحقات العقد',
    columns: { status: 'financial_status', signer: 'finance_manager_id', at: 'finance_cleared_at', notes: 'financial_notes' },
    permission: ['payments', 'view'],
  },
  {
    id: 'equipment', label: 'مخزن العتاد', checks: 'المعدات غير المسترجعة',
    columns: { status: 'equipment_status', signer: 'equipment_manager_id', at: 'equipment_cleared_at', notes: 'equipment_notes' },
    permission: ['equipmentOperations', 'view'],
  },
];

export const isSigned = (card: ClearanceCard | null, id: DepartmentId) =>
  card?.[DEPARTMENTS.find(d => d.id === id)!.columns.status] === 'مكتمل';

/** "2026-10-20…" → "20/10/2026" */
export const dayText = (value?: unknown) => {
  const m = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

/** 100.000,00 د.ج */
export const money = (value: number) =>
  `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} د.ج`;
