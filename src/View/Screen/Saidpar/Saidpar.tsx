import React from 'react';
import { useSaidparController } from './SaidparController';
import { PanelRightClose, PanelRightOpen, ChevronDown, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Saidpar.css';

export const Saidpar: React.FC<{ controller: ReturnType<typeof useSaidparController> }> = ({ controller }) => {
  const {
    isOpen,
    activeItem,
    toggleSidebar,
    handleItemClick,
    menuSections,
    openDropdowns,
    toggleDropdown,
    isMobileOpen,
    toggleMobileSidebar,
  } = controller;

  const { t } = useTranslation();
  
  const effectivelyOpen = isOpen || isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div className="mobile-backdrop" onClick={toggleMobileSidebar}></div>
      )}

      <aside className={`saidpar-container ${effectivelyOpen ? 'open' : 'closed'} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header (Logo + Toggle) */}
        <div className="saidpar-header">
          {effectivelyOpen && (
          <div className="saidpar-logo-area">
            <div className="logo-icon">OEO</div>
            <span className="saidpar-logo-text">Olympic OEO</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="toggle-btn" aria-label="Toggle Sidebar">
          {effectivelyOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </div>

      {/* Menu Sections */}
      <div className="saidpar-scrollable-content">
        {menuSections.map((section, idx) => (
          <div key={idx} className="menu-section">
            {effectivelyOpen && <h4 className="section-title">{t(section.title)}</h4>}
            {(!effectivelyOpen) && <div className="section-divider"></div>}

            <nav className="saidpar-menu">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isDropdownOpen = openDropdowns[item.name];
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isEffectivelyDropdown = item.isDropdown && hasSubItems;
                
                return (
                  <div key={item.name} className="menu-item-wrapper">
                      <div
                        className={`menu-item ${activeItem === item.name ? 'active' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`}
                        onClick={() => {
                          if (isEffectivelyDropdown) {
                            if (!effectivelyOpen) toggleSidebar();
                            toggleDropdown(item.name);
                          } else {
                            handleItemClick(item.name, item.route);
                          }
                        }}
                      >
                        <Icon className="menu-icon" size={22} />
                        {effectivelyOpen && <span className="menu-text">{t(item.label)}</span>}
                        {isEffectivelyDropdown && effectivelyOpen && (
                          <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                        )}
                      </div>
                    {isEffectivelyDropdown && (isDropdownOpen || !effectivelyOpen) && (
                      <div className={`submenu-container ${(!effectivelyOpen && isDropdownOpen) ? 'force-open' : ''}`}>
                        {item.subItems?.map(subItem => (
                          <div
                            key={subItem.name}
                            className={`sub-menu-item ${activeItem === subItem.name ? 'active' : ''}`}
                            onClick={() => handleItemClick(subItem.name, subItem.route)}
                          >
                            <Circle size={6} className="sub-menu-bullet" />
                            <span>{t(subItem.label)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Area (Logout) */}
      <div className="saidpar-footer">
        <div 
          className="logout-btn" 
          onClick={controller.handleLogout}
          title={!effectivelyOpen ? t('sidebar.logout', 'تسجيل خروج') : ''}
        >
          <svg className="logout-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {effectivelyOpen && <span className="logout-text">{t('sidebar.logout', 'تسجيل خروج')}</span>}
        </div>
      </div>
    </aside>
    </>
  );
};
