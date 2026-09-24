import React from 'react';
import { Bell } from 'lucide-react';
import './MobileAppBar.css';

interface MobileAppBarProps {
  title: string;
  showNotificationDot?: boolean;
}

// Sticky phone app bar: club logo, page title, notifications icon (display only)
export const MobileAppBar: React.FC<MobileAppBarProps> = ({ title, showNotificationDot }) => (
  // The slot keeps the bar's space in the page; the bar itself is fixed to the screen
  <div className="m-appbar-slot">
  <header className="m-appbar" dir="rtl">
    <img className="m-appbar-logo" src="/LOGO.webp" alt="أولمبيك الوادي" />
    <h1 className="m-appbar-title">{title}</h1>
    <span className="m-appbar-bell" role="img" aria-label="التنبيهات">
      <Bell size={22} />
      {showNotificationDot && <span className="m-appbar-dot" />}
    </span>
  </header>
  </div>
);
