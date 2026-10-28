import { Applink } from '../../../../LinkApi';

/** A member's stored photo as a link (a path on the server, or already a full link) */
const photoLink = (photo?: string | null) => (photo ? (photo.startsWith('http') ? photo : `${Applink.image}/${photo}`) : '');

export class UserModel {
  id: string;
  name: string;
  email: string;
  roleId: string;
  password?: string;
  /** The type of the member linked to the account (player, coach, employee…), '' when none */
  memberType?: string;
  /** The linked member's photo (a link), '' when none: shown instead of the initials */
  photo?: string;

  constructor({ id, name, email, roleId, password, memberType = '', photo = '' }: { id: string, name: string, email: string, roleId: string, password?: string, memberType?: string, photo?: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.roleId = roleId;
    this.password = password;
    this.memberType = memberType;
    this.photo = photo;
  }

  static fromJson(json: any): UserModel {
    return new UserModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      email: json.email || '',
      roleId: json.role_id?.toString() || '',
      password: json.password,
      memberType: json.individual?.type || json.memberType || '',
      photo: photoLink(json.individual?.photo) || json.photo || '',
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
