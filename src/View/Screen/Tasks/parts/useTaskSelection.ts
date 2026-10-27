import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Task } from '../taskUtils';

const HOLD_MS = 500;

/**
 * Deleting several tasks: a long press on the first selects it, then a tap (a click) on the others adds or removes
 * them; the bar at the bottom deletes them all. Without the right to delete, a row only opens.
 */
export const useTaskSelection = (enabled: boolean) => {
  const [ids, setIds] = useState<Set<number>>(() => new Set());
  const timer = useRef<number | undefined>(undefined);
  // The long press just selected: the click that follows it does nothing
  const held = useRef(false);
  const active = ids.size > 0;

  const toggle = (id: number) => setIds(s => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clear = () => setIds(new Set());
  const cancel = () => window.clearTimeout(timer.current);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIds(new Set()); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** A row's (or card's) handlers: hold to select, then a tap selects; otherwise a tap opens */
  const rowProps = (t: Task, open: () => void) => {
    if (!enabled) return { onClick: open };
    return {
      onPointerDown: (e: React.PointerEvent) => {
        // Not from its ⋮ menu
        if (e.button !== 0 || (e.target as HTMLElement).closest('.tsk-menu-cell, .actions-cell')) return;
        held.current = false;
        cancel();
        timer.current = window.setTimeout(() => {
          held.current = true;
          toggle(t.id);
          navigator.vibrate?.(30);
        }, HOLD_MS);
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => { if (active || held.current) e.preventDefault(); },
      onClick: () => {
        if (held.current) { held.current = false; return; }
        if (active) toggle(t.id); else open();
      },
    };
  };

  return { enabled, ids, active, picked: (t: Task) => ids.has(t.id), rowProps, clear, set: setIds };
};
export type TaskSelection = ReturnType<typeof useTaskSelection>;
