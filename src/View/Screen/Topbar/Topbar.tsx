import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, LayoutDashboard, UserRound, ArrowLeftRight, Power } from 'lucide-react';
import { SPACE_LABELS } from '../../../core/context/space';
import '../Personal/Personal.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext';
import './Topbar.css';
import { TOPBAR_SLOT_ID } from '../../widget/TopbarSearch';

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

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : t('topbar.avatar_initial');
  const spaceLabel = SPACE_LABELS[controller.space as 'management' | 'personal'];
  const run = (action: () => void) => () => { setMenuOpen(false); action(); };

  return (
    <>
      <header className="topbar-container">
        {/* Start (right): the menu button on small screens, then the page's search when it has one */}
        <div className="topbar-right-group">
          <button className="mobile-menu-btn" onClick={controller.toggleMobileSidebar} aria-label={t('topbar.menu')}>
            <Menu size={24} />
          </button>
          {/* On a phone the page title stays in the bar */}
          <h1 className="topbar-title tb-phone-title">{t(activeLabel, activeLabel)}</h1>
          <div id={TOPBAR_SLOT_ID} className="topbar-slot" />
        </div>

        {/* End (left): theme, then the account */}
        <div className="topbar-actions">
          <button className="topbar-icon-btn" onClick={controller.toggleTheme} aria-label="Toggle Theme" title={controller.isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}>
            {controller.isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          <div className="profile-section">
            <button
              type="button"
              className={`profile-button ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={user?.name || t('topbar.user_name')}
            >
              <span className="profile-avatar">{initial}<i className="profile-online" /></span>
            </button>

            {menuOpen && (
              <>
                <div className="space-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="tb-menu" role="menu">
                  <div className="tb-menu-head">
                    <span className="profile-avatar lg">{initial}<i className="profile-online" /></span>
                    <span className="tb-menu-who">
                      <strong>{user?.name || t('topbar.user_name')}</strong>
                      <small>{roleName} · {spaceLabel}</small>
                    </span>
                  </div>
                  <div className="tb-menu-list">
                    {controller.canManage ? (
                      <button type="button" role="menuitem" onClick={run(() => controller.switchSpace(other))}>
                        {other === 'management' ? <LayoutDashboard size={20} /> : <UserRound size={20} />}
                        <span>التبديل إلى {SPACE_LABELS[other]}</span>
                        <ArrowLeftRight size={15} className="tb-menu-go" />
                      </button>
                    ) : (
                      <small className="tb-menu-none">حسابك يعمل في فضائك الشخصي فقط</small>
                    )}
                  </div>
                  <div className="tb-menu-list">
                    <button type="button" role="menuitem" className="danger" onClick={run(controller.handleLogout)}>
                      <Power size={20} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

    </>
  );
};
