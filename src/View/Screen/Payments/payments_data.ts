import { Crud } from '../../../core/class/Crud';
import { Applink } from '../../../LinkApi';

export class PaymentsData {
  crud: Crud;

  constructor(crud: Crud) {
    this.crud = crud;
  }

  getPayments = async () => {
    const response = await this.crud.getData(Applink.payments);
    return response._tag === 'Right' ? response.right : null;
  }

  createPayment = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.createPayment, data);
    return response._tag === 'Right' ? response.right : null;
  }

  updatePayment = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.updatePayment, data);
    return response._tag === 'Right' ? response.right : null;
  }

  deletePayment = async (data: any) => {
    const response = await this.crud.postDataheaders(Applink.deletePayment, data);
    return response._tag === 'Right' ? response.right : null;
  }
}
