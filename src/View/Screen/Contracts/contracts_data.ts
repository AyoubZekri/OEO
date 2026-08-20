import { Applink } from '../../../LinkApi';
import { Crud } from '../../../core/class/Crud';

export class ContractsData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getContracts() {
    const response = await this.crud.getData(Applink.contracts);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addContract(data: any) {
    const response = await this.crud.postDataheaders(Applink.createContract, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editContract(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateContract, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async deleteContract(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteContract, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
