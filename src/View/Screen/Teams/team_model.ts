export class TeamModel {
  id: string;
  name: string;

  constructor({ id, name }: { id: string, name: string }) {
    this.id = id;
    this.name = name;
  }

  static fromJson(json: any): TeamModel {
    return new TeamModel({
      id: json.id?.toString() || '',
      name: json.name || ''
    });
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name
    };
  }
}
