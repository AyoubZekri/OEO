import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext';
import './Topbar.css';

interface TopbarProps {
  title: string;
  controller: any;
}

export const Topbar: React.FC<TopbarProps> = ({ controller }) => {
  const { t } = useTranslation();
  const { user } = useAuth();


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

  return (
    <header className="topbar-container">
      {/* Title & Mobile Menu */}
      <div className="topbar-right-group">
        <button className="mobile-menu-btn" onClick={controller.toggleMobileSidebar} aria-label={t('topbar.menu')}>
          <Menu size={24} />
        </button>
        {/* <h1 className="topbar-title">{title}</h1> */}
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button className="topbar-icon-btn" onClick={controller.toggleTheme} aria-label="Toggle Theme">
          {controller.isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : t('topbar.avatar_initial')}
          </div>
          <div className="profile-info">
            <span className="profile-name">{user?.name || t('topbar.user_name')}</span>
            <span className="profile-role">{roleName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
