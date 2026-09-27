import React from 'react';
import { ArrowRight } from 'lucide-react';
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
// page actions go in the footer.
export const MobileScreen: React.FC<MobileScreenProps> = ({ title, onBack, footer, layer = 1, children }) => (
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
