import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, LayoutDashboard, UserRound, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { SPACE_LABELS } from '../../../core/context/space';
import '../Personal/Personal.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext';
import './Topbar.css';

interface TopbarProps {
  title: string;
  controller: any;
}

export const Topbar: React.FC<TopbarProps> = ({ title, controller }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const other = controller.space === 'personal' ? 'management' : 'personal';

  // Escape closes the account menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);


  const roleJson = localStorage.getItem('role');
  let roleName = t('topbar.admin');
  try {
    if (roleJson) {
      const parsedRole = JSON.parse(roleJson);
      roleName = parsedRole.name || (user?.roleId === '1' ? 'مدير النظام' : 'مستخدم');
    } else {
      roleName = user?.roleId === '1' ? 'مدير النظام' : 'مستخدم';
    }
  } catch (e) {
    roleName = user?.roleId === '1' ? 'مدير النظام' : 'مستخدم';
  }

  let activeLabel = title;
  if (controller.menuSections) {
    for (const section of controller.menuSections) {
      for (const item of section.items) {
        if (item.name === title) {
          activeLabel = item.label;
        }
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (sub.name === title) {
              activeLabel = sub.label;
            }
          }
        }
      }
    }
  }

  return (
    <header className="topbar-container">
      {/* Title & Mobile Menu */}
      <div className="topbar-right-group">
        <button className="mobile-menu-btn" onClick={controller.toggleMobileSidebar} aria-label={t('topbar.menu')}>
          <Menu size={24} />
        </button>
        <h1 className="topbar-title">{t(activeLabel, activeLabel)}</h1>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button className="topbar-icon-btn" onClick={controller.toggleTheme} aria-label="Toggle Theme">
          {controller.isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <span className="topbar-divider" aria-hidden="true" />

        {/* Account: opens the menu that switches between the management and the personal space */}
        <div className="profile-section">
          <button
            type="button"
            className={`profile-button ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : t('topbar.avatar_initial')}
            </span>
            <span className="profile-info">
              <span className="profile-name">{user?.name || t('topbar.user_name')}</span>
              <span className="profile-role">{roleName} · {SPACE_LABELS[controller.space as 'management' | 'personal']}</span>
            </span>
            <ChevronDown size={16} className="profile-chevron" />
          </button>

          {menuOpen && (
            <>
              <div className="space-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="space-menu" role="menu">
                {controller.canManage ? (
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); controller.switchSpace(other); }}>
                    <span className="space-menu-icon">{other === 'management' ? <LayoutDashboard size={17} /> : <UserRound size={17} />}</span>
                    <span className="space-menu-label">التبديل إلى {SPACE_LABELS[other]}</span>
                    <ArrowLeftRight size={15} className="space-menu-go" />
                  </button>
                ) : (
                  <small className="space-menu-none">حسابك يعمل في فضائك الشخصي فقط</small>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
