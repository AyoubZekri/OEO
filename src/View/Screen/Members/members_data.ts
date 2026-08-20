import { Applink } from '../../../LinkApi';
import { Crud } from '../../../core/class/Crud';

export class MembersData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getMembers() {
    const response = await this.crud.getData(Applink.individuals);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addMember(data: any) {
    const response = await this.crud.postDataheaders(Applink.createIndividual, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editMember(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateIndividual, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async deleteMember(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteIndividual, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
