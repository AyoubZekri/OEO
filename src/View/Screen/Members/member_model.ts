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
    this.status = data.status || 'active';
    this.is_internal_system_printed = data.is_internal_system_printed === true || data.is_internal_system_printed === 1;
    this.team_id = data.team_id?.toString() || '';
    
    // Auto-generate avatar or use default
    this.photo = data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.first_name + '+' + this.last_name)}&background=3b82f6&color=fff`;
    
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
      status: this.status,
      team_id: this.team_id
    };
  }
}
