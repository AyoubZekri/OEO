export interface PlayerMedicalRecord {
  id: number;
  player_id: number;
  doctor_id: number;
  injury_date: string;
  incident_location: string;
  injury_nature: string;
  diagnosis: string;
  initial_recommendation: string;
  last_exam_date: string;
  medical_decision: string;
  restrictions: string;
  next_exam_date: string;
  record_status: string;
  created_at: string;
  updated_at: string;
  player?: any;
  doctor?: any;
}
