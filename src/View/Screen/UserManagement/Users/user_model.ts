export class UserModel {
  id: string;
  name: string;
  email: string;
  roleId: string;
  password?: string;

  constructor({ id, name, email, roleId, password }: { id: string, name: string, email: string, roleId: string, password?: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.roleId = roleId;
    this.password = password;
  }

  static fromJson(json: any): UserModel {
    return new UserModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      email: json.email || '',
      roleId: json.role_id?.toString() || '',
      password: json.password
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
