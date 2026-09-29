import {
  Activity, Users, UsersRound, FileText, Wallet, Vault, PieChart, Shield, Package, ArrowLeftRight, Gavel, FileWarning,
  ShieldHalf, Dumbbell, Trophy, Stethoscope, Briefcase, ListChecks, Mail, Plus, Pencil, Trash2, Printer, Search, RefreshCw,
  PenTool, CheckCircle, MessageSquare, RotateCw, TrendingUp, LogOut, FileCheck, ClipboardCheck, LayoutGrid, Megaphone,
  ClipboardList, Target, Eye, ListTodo, BadgeCheck, BarChart3, Repeat,
} from 'lucide-react';
import type { PermissionModule } from './role_model';

export type PermissionIcon = typeof Activity;

export const MODULE_ICONS: Record<PermissionModule, PermissionIcon> = {
  dashboard: Activity,
  members: Users,
  absences: FileWarning,
  disciplinary: Gavel,
  teams: UsersRound,
  clubs: ShieldHalf,
  trainingSessions: Dumbbell,
  matches: Trophy,
  medical: Stethoscope,
  meetings: Briefcase,
  decisions: ListChecks,
  correspondences: Mail,
  tasks: ListTodo,
  contracts: FileText,
  payments: Wallet,
  funds: Vault,
  reports: PieChart,
  equipment: Package,
  equipmentOperations: ArrowLeftRight,
  usersAndRoles: Shield,
};

const ACTION_ICONS: Record<string, PermissionIcon> = {
  view: Eye,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  print: Printer,
  renew: RotateCw,
  handover: ArrowLeftRight,
  return: RefreshCw,
  addTransaction: Plus,
  viewFinancialRecord: Search,
  evaluate: TrendingUp,
  clearance: LogOut,
  justify: FileCheck,
  attendance: ClipboardCheck,
  callups: Megaphone,
  lineup: LayoutGrid,
  report: ClipboardList,
  progress: Target,
  review: BadgeCheck,
  manage: BarChart3,
  templates: Repeat,
  sign: PenTool,
  changeStatus: CheckCircle,
  viewReply: MessageSquare,
  editReply: Pencil,
  addUsers: Plus,
  editUsers: Pencil,
  deleteUsers: Trash2,
  addRoles: Plus,
  editRoles: Pencil,
  deleteRoles: Trash2,
};

export const actionIcon = (action: string): PermissionIcon => ACTION_ICONS[action] || Search;
