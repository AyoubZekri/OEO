import React from 'react';
import { Inbox, WifiOff, ServerCrash } from 'lucide-react';
import { useConnectionProblem } from '../../core/api/connectionState';
import './StateIcon.css';

const KINDS = {
  empty: { icon: Inbox, label: 'لا توجد بيانات' },
  offline: { icon: WifiOff, label: 'لا يوجد اتصال بالإنترنت' },
  server: { icon: ServerCrash, label: 'خطأ في الخادم' },
} as const;

interface StateIconProps {
  /** A smaller picture, inside a section or a dialog */
  small?: boolean;
  /** Draws this kind whatever the connection */
  kind?: keyof typeof KINDS;
  /** The page could not load: no internet when that is the cause, else a server error */
  failed?: boolean;
  className?: string;
}

/**
 * An empty page, no internet or a server error: one picture in the middle, the same on every page, no text
 * (the text is still there for screen readers). Which one comes from the last request.
 */
export const StateIcon: React.FC<StateIconProps> = ({ small, kind, failed, className = '' }) => {
  const problem = useConnectionProblem();
  const shown = kind ?? problem ?? (failed ? 'server' : 'empty');
  const Icon = KINDS[shown].icon;
  return (
    <div className={`state-icon is-${shown} ${small ? 'small' : ''} ${className}`} role="img" aria-label={KINDS[shown].label}>
      <span className="state-icon-core"><Icon size={small ? 30 : 42} strokeWidth={1.8} /></span>
    </div>
  );
};
