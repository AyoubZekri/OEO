import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import './MobileRowMenu.css';

export interface MobileRowMenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
  danger?: boolean;
  onClick: () => void;
}

const MENU_WIDTH = 210; // same as .mrm-menu
const ITEM_HEIGHT = 44;
const MARGIN = 8;
const GAP = 6;

/**
 * Where the menu goes, on the screen: under the ⋮ button, its edge lined up with the button,
 * moved sideways only as far as needed to stay on screen, and above the button when there is no room below.
 */
const placeMenu = (button: HTMLElement, count: number): React.CSSProperties => {
  const r = button.getBoundingClientRect();
  const height = count * ITEM_HEIGHT + 12;
  // RTL: the ⋮ button sits on the left, so the menu starts at its left edge and grows to the right
  const left = Math.max(MARGIN, Math.min(r.left, window.innerWidth - MARGIN - MENU_WIDTH));
  const roomBelow = window.innerHeight - r.bottom - GAP - MARGIN;
  return roomBelow >= height || r.top < height
    ? { left, top: r.bottom + GAP }
    : { left, bottom: window.innerHeight - r.top + GAP };
};

/**
 * ⋮ button with a small menu of actions. The menu is drawn over the whole page (above the cards and everything
 * else), next to the button; it closes on a choice, a click outside, Escape, or when the page scrolls.
 */
export const MobileRowMenu: React.FC<{ items: MobileRowMenuItem[]; label?: string }> = ({ items, label = 'الإجراءات' }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    // The menu is fixed on the screen: it would drift away from its card while the page scrolls
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={`mrm-trigger ${open ? 'open' : ''}`}
        onClick={e => {
          e.stopPropagation();
          if (!open) setPosition(placeMenu(e.currentTarget, items.length));
          setOpen(o => !o);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={20} />
      </button>

      {open && createPortal(
        <>
          <div className="mrm-backdrop" onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div className="mrm-menu" style={position} role="menu" aria-label={label} onClick={e => e.stopPropagation()}>
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
        </>,
        document.body,
      )}
    </>
  );
};
