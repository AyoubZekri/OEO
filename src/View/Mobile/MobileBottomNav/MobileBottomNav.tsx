import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Users, Dumbbell, Briefcase, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import './MobileBottomNav.css';

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'الرئيسية', icon: House, end: true },
  { to: Approutes.Members, label: 'الأعضاء', icon: Users },
  { to: Approutes.Teams, label: 'القطاع الرياضي', icon: Dumbbell },
  { to: Approutes.Correspondences, label: 'الأعمال', icon: Briefcase },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMoreClick }) => {
  return (
    <nav className="mobile-bottom-nav" dir="ltr">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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

      <button className="nav-item more-btn" onClick={onMoreClick} aria-label="المزيد" title="المزيد">
        <span className="nav-icon-container">
          <LayoutGrid size={24} />
        </span>
      </button>
    </nav>
  );
};
