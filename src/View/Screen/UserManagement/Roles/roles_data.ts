import { Applink } from '../../../../LinkApi';
import { Crud } from '../../../../core/class/Crud';

export class RolesData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getRoles() {
    const response = await this.crud.getData(Applink.roles);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addRole(data: any) {
    const response = await this.crud.postDataheaders(Applink.createRole, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editRole(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateRole, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async deleteRole(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteRole, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
