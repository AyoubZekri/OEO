export class UserModel {
  id: string;
  name: string;
  email: string;
  roleId: string;
  password?: string;
  /** The type of the member linked to the account (player, coach, employee…), '' when none */
  memberType?: string;

  constructor({ id, name, email, roleId, password, memberType = '' }: { id: string, name: string, email: string, roleId: string, password?: string, memberType?: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.roleId = roleId;
    this.password = password;
    this.memberType = memberType;
  }

  static fromJson(json: any): UserModel {
    return new UserModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      email: json.email || '',
      roleId: json.role_id?.toString() || '',
      password: json.password,
      memberType: json.individual?.type || json.memberType || '',
    });
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role_id: this.roleId,
      password: this.password
    };
  }
}
