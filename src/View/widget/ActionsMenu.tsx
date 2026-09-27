import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import './ActionsMenu.css';

export interface ActionsMenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Icon colour */
  color?: string;
  /** Red label, separated from the other items */
  danger?: boolean;
  onClick: () => void;
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
  label?: string;
}

const MENU_WIDTH = 220;
const GAP = 6;

/**
 * ⋮ button that opens a list of row actions.
 * The menu is rendered in <body> with fixed positioning so scrolling table wrappers cannot clip it.
 */
export const ActionsMenu: React.FC<ActionsMenuProps> = ({ items, label = 'الإجراءات' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Place the menu under the button (or above it when there is no room), inside the viewport
  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;
    const button = buttonRef.current.getBoundingClientRect();
    const height = menuRef.current.offsetHeight;
    const below = button.bottom + GAP;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, button.top - GAP - height) : below;
    const left = Math.min(Math.max(8, button.left), window.innerWidth - MENU_WIDTH - 8);
    setPos({ top, left });
  }, [open]);

  // Close on outside click, Escape, scroll or resize (the menu does not follow the page)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (items.length === 0) return null;

  const regular = items.filter(i => !i.danger);
  const danger = items.filter(i => i.danger);

  const renderItem = (item: ActionsMenuItem) => (
    <button
      key={item.key}
      type="button"
      role="menuitem"
      className={`am-item ${item.danger ? 'danger' : ''}`}
      onClick={() => {
        setOpen(false);
        item.onClick();
      }}
    >
      <span className="am-icon" style={item.color ? { color: item.color, background: `${item.color}1a` } : undefined}>
        <item.icon size={17} />
      </span>
      {item.label}
    </button>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`am-trigger ${open ? 'open' : ''}`}
        onClick={() => {
          setPos(null);
          setOpen(o => !o);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        <MoreVertical size={18} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="am-menu"
          role="menu"
          aria-label={label}
          // Hidden until measured, so it never flashes at the wrong spot
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: MENU_WIDTH, visibility: pos ? 'visible' : 'hidden' }}
        >
          {regular.map(renderItem)}
          {regular.length > 0 && danger.length > 0 && <div className="am-separator" />}
          {danger.map(renderItem)}
        </div>,
        document.body
      )}
    </>
  );
};
