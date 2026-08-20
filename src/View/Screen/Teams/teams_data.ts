import { Applink } from '../../../LinkApi';
import { Crud } from '../../../core/class/Crud';

export class TeamsData {
  crud: Crud;
  
  constructor(crud: Crud) {
    this.crud = crud;
  }

  async getTeams() {
    const response = await this.crud.getData(Applink.teams);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async addTeam(data: any) {
    const response = await this.crud.postDataheaders(Applink.createTeam, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async editTeam(data: any) {
    const response = await this.crud.postDataheaders(Applink.updateTeam, data);
    return response._tag === 'Left' ? response.left : response.right;
  }

  async deleteTeam(id: string) {
    const response = await this.crud.postDataheaders(Applink.deleteTeam, { id });
    return response._tag === 'Left' ? response.left : response.right;
  }
}
