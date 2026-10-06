import React from 'react';
import { Bell } from 'lucide-react';
import { alertsBell, useAlertsBell } from '../../widget/TaskAlerts/alertsBell';
import './MobileAppBar.css';

interface MobileAppBarProps {
  title: string;
  showNotificationDot?: boolean;
}

// Sticky phone app bar: club logo, page title, notifications bell (the number of alerts; opens them all)
export const MobileAppBar: React.FC<MobileAppBarProps> = ({ title, showNotificationDot }) => {
  const { count } = useAlertsBell();
  return (
    // The slot keeps the bar's space in the page; the bar itself is fixed to the screen
    <div className="m-appbar-slot">
    <header className="m-appbar" dir="rtl">
      <img className="m-appbar-logo" src="/LOGO.webp" alt="أولمبيك الوادي" />
      <h1 className="m-appbar-title">{title}</h1>
      <button type="button" className="m-appbar-bell" onClick={alertsBell.open} aria-label={count ? `التنبيهات: ${count}` : 'التنبيهات'}>
        <Bell size={22} />
        {count > 0
          ? <span className="m-appbar-count">{count > 99 ? '99+' : count}</span>
          : showNotificationDot && <span className="m-appbar-dot" />}
      </button>
    </header>
    </div>
  );
};
