import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Users, LayoutGrid, Dumbbell, Trophy, CalendarX2, PieChart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { useCan } from '../../../core/functions/useCan';
import { useAuth } from '../../../core/context/AuthContext';
import { useSpace } from '../../../core/context/space';
import type { PermissionModule } from '../../Screen/UserManagement/Roles/role_model';
import './MobileBottomNav.css';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean; module?: PermissionModule; optional?: PermissionModule }[] = [
  { to: '/', label: 'الرئيسية', icon: House, end: true },
  { to: Approutes.Members, label: 'الأعضاء', icon: Users, module: 'members' },
  // Finance: like the sidebar, unless the role turns it off
  { to: Approutes.Finance, label: 'المالية', icon: PieChart, optional: 'dashboard' },
  { to: Approutes.More, label: 'المزيد', icon: LayoutGrid },
];

/** The personal space's bar */
const PERSONAL_ITEMS: typeof NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: House, end: true },
  { to: Approutes.MyTrainingSessions, label: 'تدريبات', icon: Dumbbell },
  { to: Approutes.MyMatches, label: 'مباريات', icon: Trophy },
  { to: Approutes.MyAbsences, label: 'غيابات', icon: CalendarX2 },
  NAV_ITEMS[NAV_ITEMS.length - 1],
];

export const MobileBottomNav: React.FC = () => {
  const can = useCan();
  const { permissions } = useAuth();
  const off = (m?: PermissionModule) => Boolean(m) && (permissions[m!] as unknown as { view?: boolean } | undefined)?.view === false;
  const { space } = useSpace();
  // Personal space: my home page, my training sessions, matches, absences, and "More"
  const items = space === 'personal' ? PERSONAL_ITEMS : NAV_ITEMS;
  return (
    <nav className="mobile-bottom-nav" dir="rtl">
      {items.filter(item => (!item.module || can(item.module)) && !off(item.optional)).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          title={label}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-container">
            <Icon size={24} />
          </span>
        </NavLink>
      ))}
    </nav>
  );
};
