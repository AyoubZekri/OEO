import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useIsMobile } from '../../core/functions/useIsMobile';

/** Where a page puts its search in the top bar (see Topbar) */
export const TOPBAR_SLOT_ID = 'topbar-slot';

const noSubscribe = () => () => {};
const findSlot = () => document.getElementById(TOPBAR_SLOT_ID);

/**
 * A page's search, shown in the top bar instead of the page's own toolbar.
 * On a phone (no search in the bar) it stays where the page puts it.
 */
export const TopbarSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const isMobile = useIsMobile();
  // The top bar is drawn with the page: its slot is read once both are on screen (checked again after mounting)
  const slot = useSyncExternalStore(noSubscribe, findSlot, () => null);
  const box = (
    <label className={`topbar-search ${isMobile ? 'inline' : ''}`}>
      <Search size={18} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'ابحث...'} />
      {value && <button type="button" onClick={() => onChange('')} aria-label="مسح البحث"><X size={15} /></button>}
    </label>
  );
  if (isMobile) return box;
  return slot ? createPortal(box, slot) : null;
};
