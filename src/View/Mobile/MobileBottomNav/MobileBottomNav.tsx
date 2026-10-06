import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Users, LayoutGrid, ListTodo, Trophy, CalendarX2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { useCan } from '../../../core/functions/useCan';
import { useSpace } from '../../../core/context/space';
import type { PermissionModule } from '../../Screen/UserManagement/Roles/role_model';
import './MobileBottomNav.css';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean; module?: PermissionModule }[] = [
  { to: '/', label: 'الرئيسية', icon: House, end: true },
  { to: Approutes.Members, label: 'الأعضاء', icon: Users, module: 'members' },
  { to: Approutes.Matches, label: 'المباريات', icon: Trophy, module: 'matches' },
  { to: Approutes.More, label: 'المزيد', icon: LayoutGrid },
];

/** The personal space's bar */
const PERSONAL_ITEMS: typeof NAV_ITEMS = [
  { to: Approutes.MyTasks, label: 'مهامي', icon: ListTodo },
  { to: Approutes.MyMatches, label: 'مباريات', icon: Trophy },
  { to: Approutes.MyAbsences, label: 'غيابات', icon: CalendarX2 },
  NAV_ITEMS[NAV_ITEMS.length - 1],
];

export const MobileBottomNav: React.FC = () => {
  const can = useCan();
  const { space } = useSpace();
  // Personal space (no home page): my tasks, matches, absences, and "More"
  const items = space === 'personal' ? PERSONAL_ITEMS : NAV_ITEMS;
  return (
    <nav className="mobile-bottom-nav" dir="ltr">
      {items.filter(item => !item.module || can(item.module)).map(({ to, label, icon: Icon, end }) => (
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
