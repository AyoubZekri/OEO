import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Moon, Sun, ChevronLeft, Scale, Shield, Calendar, FileWarning, Trophy, Stethoscope,
  FileText, Banknote, Wallet, BarChart3, Briefcase, Gavel, Package, ArrowLeftRight, KeyRound, UserCog, LayoutGrid, Shirt, ListTodo, Bus, Repeat, Landmark, ArrowLeftRight as SwitchIcon, UserRound, LayoutDashboard, CalendarX2 } from 'lucide-react';
import { SPACE_LABELS } from '../../../core/context/space';
import '../../Screen/Personal/Personal.css';
import { useAuth } from '../../../core/context/AuthContext';
import { Approutes } from '../../../core/constant/routes';
import type { useSaidparController } from '../../Screen/Saidpar/SaidparController';
import { MobileAppBar } from '../widgets/MobileAppBar';
import './MobileMore.css';

interface MobileMoreProps {
  controller: ReturnType<typeof useSaidparController>;
}

interface PageLink {
  name: string;
  label: string;
  route: string;
}

type IconType = React.ComponentType<{ size?: number }>;

// Pages already in the bottom nav are not repeated here
const IN_BOTTOM_NAV = new Set<string>(['/', Approutes.Members, Approutes.Correspondences]);

const GROUPS: { title: string; names: string[] }[] = [
  { title: 'فضائي الشخصي', names: ['MyTasks', 'MyTrainingSessions', 'MyMatches', 'MyAbsences', 'MyMeetings', 'MyDisciplinary'] },
  { title: 'الرياضي', names: ['Teams', 'Matches', 'Travels', 'TrainingSessions', 'AbsenceRequests', 'MedicalRecords', 'Disciplinary', 'Clubs'] },
  { title: 'المالية', names: ['Contracts', 'Payments', 'Funds', 'Debts', 'Reports'] },
  { title: 'الإدارة', names: ['Tasks', 'PeriodicTasks', 'Meetings', 'Decisions', 'Equipment', 'EquipmentOperations', 'Users', 'Roles'] },
];

// Icon and colour of each page tile
const PAGE_STYLE: Record<string, { icon: IconType; color: string }> = {
  Teams: { icon: Shirt, color: '#22c55e' },
  Matches: { icon: Trophy, color: '#f97316' },
  Travels: { icon: Bus, color: '#0ea5e9' },
  TrainingSessions: { icon: Calendar, color: '#0ea5e9' },
  AbsenceRequests: { icon: FileWarning, color: '#f59e0b' },
  MedicalRecords: { icon: Stethoscope, color: '#ef4444' },
  Disciplinary: { icon: Scale, color: '#8b5cf6' },
  Clubs: { icon: Shield, color: '#14b8a6' },
  Contracts: { icon: FileText, color: '#3b82f6' },
  Payments: { icon: Banknote, color: '#10b981' },
  Funds: { icon: Wallet, color: '#f97316' },
  Debts: { icon: Landmark, color: '#ef4444' },
  Reports: { icon: BarChart3, color: '#6366f1' },
  Tasks: { icon: ListTodo, color: '#f97316' },
  MyTasks: { icon: ListTodo, color: '#f97316' },
  MyTrainingSessions: { icon: Calendar, color: '#0ea5e9' },
  MyMatches: { icon: Trophy, color: '#f97316' },
  MyAbsences: { icon: CalendarX2, color: '#ef4444' },
  MyMeetings: { icon: Briefcase, color: '#0ea5e9' },
  MyDisciplinary: { icon: Scale, color: '#8b5cf6' },
  PeriodicTasks: { icon: Repeat, color: '#8b5cf6' },
  Meetings: { icon: Briefcase, color: '#0ea5e9' },
  Decisions: { icon: Gavel, color: '#8b5cf6' },
  Equipment: { icon: Package, color: '#f59e0b' },
  EquipmentOperations: { icon: ArrowLeftRight, color: '#14b8a6' },
  Users: { icon: UserCog, color: '#3b82f6' },
  Roles: { icon: KeyRound, color: '#ef4444' },
};

const readRoleName = (fallback: string) => {
  try {
    return JSON.parse(localStorage.getItem('role') || '')?.name || fallback;
  } catch {
    return fallback;
  }
};

// Phone "More" page: account card with the theme switch, then every other page the user can open
export const MobileMore: React.FC<MobileMoreProps> = ({ controller }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  // Same pages (and permissions) as the sidebar, dropdown children flattened
  const pages: PageLink[] = controller.menuSections
    .flatMap(section => section.items)
    .flatMap(item => (item.subItems?.length
      ? item.subItems.map(sub => ({ name: sub.name, label: t(sub.label, sub.label), route: sub.route }))
      : item.route ? [{ name: item.name, label: t(item.label, item.label), route: item.route }] : []))
    .filter(page => !IN_BOTTOM_NAV.has(page.route));

  const q = query.trim();
  const visible = q ? pages.filter(p => p.label.includes(q)) : pages;
  const grouped = GROUPS
    .map(g => ({
      title: g.title,
      // Listed in the order of the group definition, most used first
      pages: visible.filter(p => g.names.includes(p.name)).sort((x, y) => g.names.indexOf(x.name) - g.names.indexOf(y.name)),
    }))
    .filter(g => g.pages.length > 0);
  const others = visible.filter(p => !GROUPS.some(g => g.names.includes(p.name)));
  if (others.length) grouped.push({ title: 'أخرى', pages: others });

  const name = user?.name || t('topbar.user_name', 'المستخدم');

  return (
    <div className="mo-page">
      <MobileAppBar title="المزيد" />

      {/* Account */}
      <section className="mo-account">
        <span className="mo-avatar">{name.charAt(0).toUpperCase()}</span>
        <div className="mo-account-text">
          <strong>{name}</strong>
          <span>{readRoleName(user?.roleId === '1' ? 'مدير النظام' : 'مستخدم')}</span>
        </div>
        <button type="button" className="mo-theme" onClick={controller.toggleTheme} aria-label="تبديل الوضع">
          {controller.isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </section>

      {controller.canManage && (
        <button
          type="button"
          className="mo-space-switch"
          onClick={() => controller.switchSpace(controller.space === 'personal' ? 'management' : 'personal')}
        >
          {controller.space === 'personal' ? <LayoutDashboard size={19} /> : <UserRound size={19} />}
          <span>التبديل إلى {controller.space === 'personal' ? SPACE_LABELS.management : SPACE_LABELS.personal}</span>
          <SwitchIcon size={17} />
        </button>
      )}

      <label className="mo-search">
        <Search size={17} />
        <input type="search" placeholder="ابحث عن صفحة..." value={query} onChange={e => setQuery(e.target.value)} />
      </label>

      {grouped.length === 0 ? (
        <div className="mo-empty">
          <LayoutGrid size={40} />
          <p>{pages.length === 0 ? 'لا توجد صفحات في فضائك الشخصي بعد' : 'لا توجد صفحة بهذا الاسم'}</p>
        </div>
      ) : grouped.map(group => (
        <section key={group.title} className="mo-group">
          <h2>{group.title}</h2>
          <div className="mo-grid">
            {group.pages.map(page => {
              const style = PAGE_STYLE[page.name] || { icon: ChevronLeft, color: '#64748b' };
              const Icon = style.icon;
              return (
                <button
                  key={page.route}
                  type="button"
                  className="mo-tile"
                  style={{ '--mo-color': style.color } as React.CSSProperties}
                  onClick={() => controller.handleItemClick(page.name, page.route)}
                >
                  <span className="mo-tile-icon"><Icon size={22} /></span>
                  <span className="mo-tile-label">{page.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
