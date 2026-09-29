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

  async addMemberWithImage(data: any, image: File) {
    const response = await this.crud.addRequestWithImageOne(Applink.createIndividual, data, image, 'photo');
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editMember(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateIndividual, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editMemberWithImage(data: any, image: File) {
    const response = await this.crud.addRequestWithImageOne(Applink.updateIndividual, data, image, 'photo');
    return response._tag === 'Left' ? response.left : response.right;
  }

  async saveMemberFormData(url: string, formData: FormData) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });
      if (response.status === 200 || response.status === 201) {
        return await response.json();
      }
      // The server's reason (e.g. the email is already another account's login), shown to the user
      const body = await response.json().catch(() => null);
      const firstError = body?.errors ? Object.values(body.errors).flat()[0] : null;
      return { status: 'error', message: 'Error saving data', serverMessage: (typeof firstError === 'string' && firstError) || body?.message || null };
    } catch (e) {
      return { status: 'error', message: String(e) };
    }
  }

  async deleteMember(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteIndividual, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }

  async printMember(id: string) {
    const response = await this.crud.postDataheaders(Applink.printIndividual, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}

