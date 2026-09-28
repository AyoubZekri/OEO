import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Users, Briefcase, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { useCan } from '../../../core/functions/useCan';
import type { PermissionModule } from '../../Screen/UserManagement/Roles/role_model';
import './MobileBottomNav.css';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean; module?: PermissionModule }[] = [
  { to: '/', label: 'الرئيسية', icon: House, end: true },
  { to: Approutes.Members, label: 'الأعضاء', icon: Users, module: 'members' },
  { to: Approutes.Correspondences, label: 'الأعمال', icon: Briefcase, module: 'correspondences' },
  { to: Approutes.More, label: 'المزيد', icon: LayoutGrid },
];

export const MobileBottomNav: React.FC = () => {
  const can = useCan();
  return (
    <nav className="mobile-bottom-nav" dir="ltr">
      {NAV_ITEMS.filter(item => !item.module || can(item.module)).map(({ to, label, icon: Icon, end }) => (
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
