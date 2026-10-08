import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useBackCloses } from './useBackCloses';
import './MobileScreen.css';

interface MobileScreenProps {
  title: string;
  onBack: () => void;
  /** Sticky bottom bar, e.g. a save button */
  footer?: React.ReactNode;
  /** Stacking level; screens opened from another screen pass a higher layer */
  layer?: 1 | 2 | 3;
  children: React.ReactNode;
}

// Full-screen phone page. The app bar only ever holds the back button and the title;
// page actions go in the footer. The phone's back button closes it too (and stays on the page under it).
export const MobileScreen: React.FC<MobileScreenProps> = ({ title, onBack, footer, layer = 1, children }) => {
  // A first-level screen opened from the address (details kept in it) already has its own history entry
  const urlDetails = layer === 1 && Boolean((window.history.state as { usr?: { urlDetails?: string } } | null)?.usr?.urlDetails);
  useBackCloses(onBack, urlDetails);

  return (
  <div className={`m-screen layer-${layer}`} role="dialog" aria-modal="true" aria-label={title}>
    <header className="m-screen-bar">
      <button type="button" className="m-screen-icon" onClick={onBack} aria-label="رجوع">
        <ArrowRight size={22} />
      </button>
      <div className="m-screen-titles">
        <h1>{title}</h1>
      </div>
      <span className="m-screen-spacer" aria-hidden="true" />
    </header>
    <div className="m-screen-body">{children}</div>
    {footer && <footer className="m-screen-footer">{footer}</footer>}
  </div>
  );
};
