import { Applink } from '../../../../LinkApi';
import { Crud } from '../../../../core/class/Crud';

export class LoginData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async postdata(password: string, email: string) {
    const response = await this.crud.postData(Applink.login, {
      "email": email,
      "password": password,
    });
    return response._tag === 'Left' ? response.left : response.right;
  }

  async logout() {
    const response = await this.crud.postDataheadersLogout(Applink.logout);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async getUser() {
    const response = await this.crud.getData(Applink.getUser);
    return response._tag === 'Left' ? response.left : response.right;
  }
}
