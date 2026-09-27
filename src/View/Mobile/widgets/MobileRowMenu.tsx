import React, { useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { revealMenu, menuPositionUnder } from './revealMenu';
import './MobileRowMenu.css';

export interface MobileRowMenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
  danger?: boolean;
  onClick: () => void;
}

/**
 * ⋮ button with a small menu that opens right under it, lined up with the button.
 * The parent card must be `position: relative`.
 */
const MENU_WIDTH = 210; // same as .mrm-menu

export const MobileRowMenu: React.FC<{ items: MobileRowMenuItem[]; label?: string }> = ({ items, label = 'الإجراءات' }) => {
  const [open, setOpen] = useState(false);
  // Where the menu sits inside the card, measured from the button when it opens
  const [position, setPosition] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={`mrm-trigger ${open ? 'open' : ''}`}
        onClick={e => {
          e.stopPropagation();
          if (!open) setPosition(menuPositionUnder(e.currentTarget, MENU_WIDTH));
          setOpen(o => !o);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <>
          <div className="mrm-backdrop" onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div ref={revealMenu} className="mrm-menu" style={position} role="menu" aria-label={label} onClick={e => e.stopPropagation()}>
            {items.map(item => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`mrm-item ${item.danger ? 'danger' : ''}`}
                onClick={() => { setOpen(false); item.onClick(); }}
              >
                <span className="mrm-icon" style={item.color && !item.danger ? { color: item.color } : undefined}>
                  <item.icon size={17} />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};
