import { Applink } from '../../../LinkApi';
import { Crud } from '../../../core/class/Crud';

export class EquipmentData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getEquipments() {
    const response = await this.crud.getData(Applink.equipments);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addEquipment(data: any, imageFile?: File | null) {
    if (imageFile) {
        const response = await this.crud.addRequestWithImageOne(Applink.createEquipment, data, imageFile, "image");
        return response._tag === 'Left' ? response.left : response.right;
    } else {
        const response = await this.crud.postDataheaders(Applink.createEquipment, data);
        return response._tag === 'Left' ? response.left : response.right;
    }
  }

  async editEquipment(data: any, imageFile?: File | null) {
    if (imageFile) {
        const response = await this.crud.addRequestWithImageOne(Applink.updateEquipment, data, imageFile, "image");
        return response._tag === 'Left' ? response.left : response.right;
    } else {
        const response = await this.crud.postDataheaders(Applink.updateEquipment, data);
        return response._tag === 'Left' ? response.left : response.right;
    }
  }

  async deleteEquipment(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteEquipment, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
