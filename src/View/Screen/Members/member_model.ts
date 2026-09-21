import { Applink } from '../../../LinkApi';

export class MemberModel {
  id: string;
  type: string;
  first_name: string;
  last_name: string;
  national_id: string;
  phone: string;
  place_of_birth: string;
  birth_date: string;
  Shirt_number: number | null;
  email: string;
  position: string;
  preferred_foot: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  national_id_document: string | File | null;
  medical_certificate: string | File | null;
  insurance_document: string | File | null;
  bank_account_number: string;
  status: string;
  is_internal_system_printed: boolean;
  team_id: string;
  
  // Custom properties for display
  photo: string;
  team_name?: string;

  constructor(data: any) {
    this.id = data.id?.toString() || '';
    this.type = data.type || 'player';
    this.first_name = data.first_name || '';
    this.last_name = data.last_name || '';
    this.national_id = data.national_id || '';
    this.phone = data.phone || '';
    this.place_of_birth = data.place_of_birth || '';
    this.birth_date = data.birth_date || '';
    this.Shirt_number = data.Shirt_number || null;
    this.email = data.email || '';
    this.position = data.position || '';
    this.preferred_foot = data.preferred_foot || '';
    this.emergency_contact_name = data.emergency_contact_name || '';
    this.emergency_contact_phone = data.emergency_contact_phone || '';
    this.national_id_document = data.national_id_document || null;
    this.medical_certificate = data.medical_certificate || null;
    this.insurance_document = data.insurance_document || null;
    this.bank_account_number = data.bank_account_number || '';
    this.status = data.status || 'active';
    this.is_internal_system_printed = data.is_internal_system_printed === true || data.is_internal_system_printed === 1;
    this.team_id = data.team_id?.toString() || '';
    
    // Auto-generate avatar or use default
    if (data.photo) {
      this.photo = data.photo.startsWith('http') ? data.photo : `${Applink.image}/${data.photo}`;
    } else {
      this.photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.first_name + '+' + this.last_name)}&background=3b82f6&color=fff`;
    }
    
    // Get team name from relationship if it exists
    this.team_name = data.team?.name;
  }

  static fromJson(json: any): MemberModel {
    return new MemberModel(json);
  }

  toJson(): any {
    return {
      id: this.id,
      type: this.type,
      first_name: this.first_name,
      last_name: this.last_name,
      national_id: this.national_id,
      phone: this.phone,
      place_of_birth: this.place_of_birth,
      birth_date: this.birth_date,
      Shirt_number: this.Shirt_number,
      email: this.email,
      position: this.position,
      preferred_foot: this.preferred_foot,
      emergency_contact_name: this.emergency_contact_name,
      emergency_contact_phone: this.emergency_contact_phone,
      national_id_document: this.national_id_document,
      medical_certificate: this.medical_certificate,
      insurance_document: this.insurance_document,
      bank_account_number: this.bank_account_number,
      status: this.status,
      team_id: this.team_id
    };
  }
}

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


