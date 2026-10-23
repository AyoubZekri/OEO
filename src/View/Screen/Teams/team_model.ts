/** A category of players, or of the staff */
export type TeamKind = 'players' | 'staff';

export const TEAM_KINDS: { value: TeamKind; label: string; hint: string }[] = [
  { value: 'players', label: 'اللاعبين', hint: 'فئة لاعبين (الفريق الأول، U19…)' },
  { value: 'staff', label: 'الطاقم', hint: 'فئة الطاقم (الفني، الطبي، الإداري…)' },
];

export const teamKindLabel = (kind: TeamKind) => (kind === 'staff' ? 'الطاقم' : 'اللاعبين');

export class TeamModel {
  id: string;
  name: string;
  kind: TeamKind;

  constructor({ id, name, kind = 'players' }: { id: string, name: string, kind?: TeamKind }) {
    this.id = id;
    this.name = name;
    this.kind = kind;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- teams come untyped from the API
  static fromJson(json: any): TeamModel {
    return new TeamModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      kind: json.kind === 'staff' ? 'staff' : 'players',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sent as is to the API
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
    };
  }
}
