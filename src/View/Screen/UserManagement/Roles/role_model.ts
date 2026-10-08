export interface DashboardPermissions {
  view: boolean;
}

export interface MembersPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  viewFinancialRecord: boolean;
  evaluate: boolean;
  clearance: boolean;
}

export interface AbsencesPermissions {
  view: boolean;
  add: boolean;
  justify: boolean;
  delete: boolean;
}

export interface MeetingsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  attendance: boolean;
}

export interface DecisionsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  progress: boolean;
}

export interface CorrespondencesPermissions {
  view: boolean;
  add: boolean;
  changeStatus: boolean;
  delete: boolean;
}

export interface TeamsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ClubsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface TrainingSessionsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  attendance: boolean;
}

export interface MatchesPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  changeStatus: boolean;
  callups: boolean;
  lineup: boolean;
  attendance: boolean;
  report: boolean;
}

export interface MedicalPermissions {
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
  print: boolean;
}

export interface FundsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  addTransaction: boolean;
}

export interface DebtsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  repay: boolean;
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

export interface TravelsPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface TasksPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  review: boolean;
  manage: boolean;
  templates: boolean;
}

export interface DisciplinaryPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  sign: boolean;
  changeStatus: boolean;
  viewReply: boolean;
  editReply: boolean;
}

export interface AppPermissions {
  dashboard: DashboardPermissions;
  members: MembersPermissions;
  absences: AbsencesPermissions;
  disciplinary: DisciplinaryPermissions;
  teams: TeamsPermissions;
  clubs: ClubsPermissions;
  trainingSessions: TrainingSessionsPermissions;
  matches: MatchesPermissions;
  medical: MedicalPermissions;
  travels: TravelsPermissions;
  meetings: MeetingsPermissions;
  decisions: DecisionsPermissions;
  correspondences: CorrespondencesPermissions;
  tasks: TasksPermissions;
  contracts: ContractsPermissions;
  payments: PaymentsPermissions;
  funds: FundsPermissions;
  debts: DebtsPermissions;
  reports: ReportsPermissions;
  equipment: EquipmentPermissions;
  equipmentOperations: EquipmentOperationsPermissions;
  usersAndRoles: UsersRolesPermissions;
}

export type PermissionModule = keyof AppPermissions;

/**
 * Every section of the app and its actions ("view" = opening the page is always first and implied).
 * Single source for the role editors, the role views and the defaults below.
 */
export const MODULE_ACTIONS: Record<PermissionModule, string[]> = {
  dashboard: [],
  members: ['add', 'edit', 'delete', 'viewFinancialRecord', 'evaluate', 'clearance'],
  absences: ['add', 'justify', 'delete'],
  disciplinary: ['add', 'edit', 'delete', 'print', 'changeStatus', 'viewReply', 'editReply'],
  teams: ['add', 'edit', 'delete'],
  clubs: ['add', 'edit', 'delete'],
  trainingSessions: ['add', 'edit', 'delete', 'attendance'],
  matches: ['add', 'edit', 'delete', 'changeStatus', 'callups', 'lineup', 'attendance', 'report'],
  medical: ['add', 'edit', 'delete'],
  travels: ['add', 'edit', 'delete'],
  meetings: ['add', 'edit', 'delete', 'attendance'],
  decisions: ['add', 'edit', 'delete', 'progress'],
  correspondences: ['add', 'changeStatus', 'delete'],
  tasks: ['add', 'edit', 'delete', 'review', 'manage', 'templates'],
  contracts: ['add', 'edit', 'delete', 'print', 'renew'],
  payments: ['add', 'edit', 'delete', 'print'],
  funds: ['add', 'edit', 'delete', 'addTransaction'],
  debts: ['add', 'edit', 'delete', 'repay'],
  reports: ['viewIndividuals', 'viewTeams', 'viewContracts', 'viewFunds'],
  equipment: ['add', 'edit', 'delete', 'print'],
  equipmentOperations: ['handover', 'return', 'edit', 'delete', 'print'],
  usersAndRoles: ['viewUsers', 'addUsers', 'editUsers', 'deleteUsers', 'viewRoles', 'addRoles', 'editRoles', 'deleteRoles'],
};

/** The sections grouped by domain, in the order the role editors show them */
export const PERMISSION_DOMAINS: { key: string; label: string; modules: PermissionModule[] }[] = [
  { key: 'general', label: 'عام', modules: ['dashboard'] },
  { key: 'members', label: 'الأعضاء والانضباط', modules: ['members', 'absences', 'disciplinary'] },
  { key: 'sport', label: 'الرياضي', modules: ['teams', 'clubs', 'trainingSessions', 'matches', 'medical', 'travels'] },
  { key: 'admin', label: 'الإدارة', modules: ['meetings', 'decisions', 'tasks'] },
  { key: 'finance', label: 'المالية', modules: ['contracts', 'payments', 'funds', 'debts', 'reports'] },
  { key: 'equipment', label: 'العتاد', modules: ['equipment', 'equipmentOperations'] },
  { key: 'system', label: 'إدارة النظام', modules: ['usersAndRoles'] },
];

export const ALL_MODULES = PERMISSION_DOMAINS.flatMap(d => d.modules);

const buildPermissions = (value: boolean): AppPermissions => {
  const result: Record<string, Record<string, boolean>> = {};
  ALL_MODULES.forEach(m => {
    result[m] = { view: value };
    MODULE_ACTIONS[m].forEach(a => { result[m][a] = value; });
  });
  // usersAndRoles keeps its own "view" flag next to viewUsers / viewRoles
  return result as unknown as AppPermissions;
};

export const defaultPermissions: AppPermissions = buildPermissions(true);
export const emptyPermissions: AppPermissions = buildPermissions(false);

/** Version written with every saved role; roles saved before it get the migration below */
const PERMISSIONS_VERSION = 2;

/** Pages that had no permission check before version 2: everyone could open and use them */
const OPEN_BEFORE_V2: PermissionModule[] = ['absences', 'clubs', 'trainingSessions', 'matches', 'medical', 'meetings', 'decisions', 'correspondences'];

/** Actions added to existing sections in version 2 */
const NEW_ACTIONS_V2: Partial<Record<PermissionModule, string[]>> = {
  members: ['evaluate', 'clearance'],
  payments: ['print'],
};

/* eslint-disable @typescript-eslint/no-explicit-any -- roles come untyped from the API */

/**
 * Stored permissions → full AppPermissions.
 * Roles saved before version 2 keep what they could do: pages that were open stay open,
 * and new actions of an existing section follow that section's "view".
 * No stored permissions at all (no role, or a role without permissions) = no permission: only the user's own tasks.
 */
export const parsePermissions = (parsed: any): AppPermissions => {
  const legacy = Boolean(parsed) && parsed._v !== PERMISSIONS_VERSION;
  const result: Record<string, Record<string, boolean>> = {};

  ALL_MODULES.forEach(m => {
    const empty = emptyPermissions[m] as unknown as Record<string, boolean>;
    const full = defaultPermissions[m] as unknown as Record<string, boolean>;
    const stored = parsed?.[m];

    if (legacy && OPEN_BEFORE_V2.includes(m)) {
      result[m] = { ...full };
      return;
    }

    const merged = { ...empty, ...(stored || {}) };
    if (legacy) {
      (NEW_ACTIONS_V2[m] || []).forEach(a => {
        if (stored?.[a] === undefined) merged[a] = merged.view === true;
      });
      // The disciplinary page used to be listed for everyone who could view members
      if (m === 'disciplinary' && stored?.view === undefined) merged.view = parsed?.members?.view === true;
    }
    // Roles saved before the tasks section: everyone sees the tasks given to them (same rule as the server)
    if (m === 'tasks' && stored === undefined) merged.view = true;
    // Roles saved before the debts section: whoever manages the funds manages the debts
    if (m === 'debts' && stored === undefined) {
      const funds = parsed?.funds || {};
      Object.assign(merged, { view: funds.view === true, add: funds.add === true, edit: funds.edit === true, delete: funds.delete === true, repay: funds.addTransaction === true });
    }
    result[m] = merged;
  });

  return result as unknown as AppPermissions;
};

/** A user with no role (or a role without stored permissions): nothing to manage, only their own space */
export const NO_ROLE_PERMISSIONS: AppPermissions = parsePermissions(null);

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
        parsedPermissions = parsePermissions(parsed);
      } catch {
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
      permissions: JSON.stringify({ ...this.permissions, _v: PERMISSIONS_VERSION })
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
