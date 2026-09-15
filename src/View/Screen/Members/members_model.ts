
export interface PlayerClearance {
  id?: number;
  player_id: number;
  exit_date: string;
  exit_reason: string;
  equipment_status: string;
  equipment_notes: string;
  equipment_manager_id: string;
  equipment_cleared_at: string;
  admin_status: string;
  admin_id: string;
  admin_cleared_at: string;
  sporting_status: string;
  sporting_director_id: string;
  sporting_cleared_at: string;
  financial_status: string;
  finance_manager_id: string;
  finance_cleared_at: string;
  medical_status: string;
  medical_staff_id: string;
  medical_cleared_at: string;
  general_notes: string;
  player_signature: boolean;
  player_signed_at: string;
}
