export interface DashboardPermissions {
  view: boolean;
}

export interface MembersPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  viewFinancialRecord: boolean;
}

export interface TeamsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ContractsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  renew: boolean;
}

export interface PaymentsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface FundsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  addTransaction: boolean;
}

export interface ReportsPermissions {
  view: boolean;
  viewIndividuals: boolean;
  viewTeams: boolean;
  viewContracts: boolean;
  viewFunds: boolean;
}

export interface UsersRolesPermissions {
  view: boolean;
  viewUsers: boolean;
  addUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  viewRoles: boolean;
  addRoles: boolean;
  editRoles: boolean;
  deleteRoles: boolean;
}

export interface EquipmentPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
}

export interface EquipmentOperationsPermissions {
  view: boolean;
  handover: boolean;
  return: boolean;
  print: boolean;
  edit: boolean;
  delete: boolean;
}

export interface AppPermissions {
  dashboard: DashboardPermissions;
  members: MembersPermissions;
  teams: TeamsPermissions;
  contracts: ContractsPermissions;
  payments: PaymentsPermissions;
  funds: FundsPermissions;
  reports: ReportsPermissions;
  usersAndRoles: UsersRolesPermissions;
  equipment: EquipmentPermissions;
  equipmentOperations: EquipmentOperationsPermissions;
}

export const defaultPermissions: AppPermissions = {
  dashboard: { view: true },
  members: { view: true, add: true, edit: true, delete: true, viewFinancialRecord: true },
  teams: { view: true, add: true, edit: true, delete: true },
  contracts: { view: true, add: true, edit: true, delete: true, print: true, renew: true },
  payments: { view: true, add: true, edit: true, delete: true },
  funds: { view: true, add: true, edit: true, delete: true, addTransaction: true },
  reports: { view: true, viewIndividuals: true, viewTeams: true, viewContracts: true, viewFunds: true },
  usersAndRoles: { view: true, viewUsers: true, addUsers: true, editUsers: true, deleteUsers: true, viewRoles: true, addRoles: true, editRoles: true, deleteRoles: true },
  equipment: { view: true, add: true, edit: true, delete: true, print: true },
  equipmentOperations: { view: true, handover: true, return: true, print: true, edit: true, delete: true },
};

export const emptyPermissions: AppPermissions = {
  dashboard: { view: false },
  members: { view: false, add: false, edit: false, delete: false, viewFinancialRecord: false },
  teams: { view: false, add: false, edit: false, delete: false },
  contracts: { view: false, add: false, edit: false, delete: false, print: false, renew: false },
  payments: { view: false, add: false, edit: false, delete: false },
  funds: { view: false, add: false, edit: false, delete: false, addTransaction: false },
  reports: { view: false, viewIndividuals: false, viewTeams: false, viewContracts: false, viewFunds: false },
  usersAndRoles: { view: false, viewUsers: false, addUsers: false, editUsers: false, deleteUsers: false, viewRoles: false, addRoles: false, editRoles: false, deleteRoles: false },
  equipment: { view: false, add: false, edit: false, delete: false, print: false },
  equipmentOperations: { view: false, handover: false, return: false, print: false, edit: false, delete: false },
};

export class RoleModel {
  id: string;
  name: string;
  accessLevel: 'full' | 'partial';
  permissions: AppPermissions;

  constructor({ id, name, accessLevel, permissions }: { id: string, name: string, accessLevel: 'full' | 'partial', permissions: AppPermissions }) {
    this.id = id;
    this.name = name;
    this.accessLevel = accessLevel;
    this.permissions = permissions;
  }

  static fromJson(json: any): RoleModel {
    if (Array.isArray(json) && json.length > 0) {
      json = json[0];
    }
    const accessLevelRaw = json?.type || json?.accessLevel || 'partial';
    const accessLevel = String(accessLevelRaw).toLowerCase();
    
    if (accessLevel === 'full') {
      return new RoleModel({
        id: json.id?.toString() || '',
        name: json.name || '',
        accessLevel: 'full',
        permissions: defaultPermissions
      });
    }

    let parsedPermissions = emptyPermissions;
    
    if (json.permissions) {
      try {
        const parsed = typeof json.permissions === 'string' ? JSON.parse(json.permissions) : json.permissions;
        // Merge with emptyPermissions to ensure all keys exist
        parsedPermissions = {
          dashboard: { ...emptyPermissions.dashboard, ...(parsed.dashboard || {}) },
          members: { ...emptyPermissions.members, ...(parsed.members || {}) },
          teams: { ...emptyPermissions.teams, ...(parsed.teams || {}) },
          contracts: { ...emptyPermissions.contracts, ...(parsed.contracts || {}) },
          payments: { ...emptyPermissions.payments, ...(parsed.payments || {}) },
          funds: { ...emptyPermissions.funds, ...(parsed.funds || {}) },
          reports: { ...emptyPermissions.reports, ...(parsed.reports || {}) },
          usersAndRoles: { ...emptyPermissions.usersAndRoles, ...(parsed.usersAndRoles || {}) },
          equipment: { ...emptyPermissions.equipment, ...(parsed.equipment || {}) },
          equipmentOperations: { ...emptyPermissions.equipmentOperations, ...(parsed.equipmentOperations || {}) }
        };
      } catch (e) {
        parsedPermissions = emptyPermissions;
      }
    }

    return new RoleModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      accessLevel: 'partial',
      permissions: parsedPermissions
    });
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.accessLevel,
      permissions: JSON.stringify(this.permissions)
    };
  }
}
