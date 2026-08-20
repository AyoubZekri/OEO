import { Crud } from '../../../core/class/Crud';
import { Applink } from '../../../LinkApi';

export class FundsData {
  crud: Crud;

  constructor(crud: Crud) {
    this.crud = crud;
  }

  getFunds = async () => {
    const response = await this.crud.getData(Applink.funds);
    return response._tag === 'Right' ? response.right : null;
  }

  createFund = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.createFund, data);
    return response._tag === 'Right' ? response.right : null;
  }

  updateFund = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.updateFund, data);
    return response._tag === 'Right' ? response.right : null;
  }

  deleteFund = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.deleteFund, data);
    return response._tag === 'Right' ? response.right : null;
  }

  getTransactions = async () => {
    const response = await this.crud.getData(Applink.transactions);
    return response._tag === 'Right' ? response.right : null;
  }

  createTransaction = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.createTransaction, data);
    return response._tag === 'Right' ? response.right : null;
  }

  deleteTransaction = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.deleteTransaction, data);
    return response._tag === 'Right' ? response.right : null;
  }
}
