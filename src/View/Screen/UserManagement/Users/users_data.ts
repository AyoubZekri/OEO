import { Applink } from '../../../../LinkApi';
import { Crud } from '../../../../core/class/Crud';

export class UsersData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getUsers() {
    const response = await this.crud.getData(Applink.users);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addUser(data: any) {
    const response = await this.crud.postDataheaders(Applink.createUser, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editUser(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateUser, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async deleteUser(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteUser, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
