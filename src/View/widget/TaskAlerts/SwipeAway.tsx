import React, { useRef, useState } from 'react';

/** How far (px) an alert is pulled sideways before it goes */
const AWAY_PX = 90;
/** Under this a move is still a tap */
const MOVE_PX = 8;

/**
 * Phones: an alert pulled sideways (either way) follows the finger, fades, and goes past 90px
 * (it springs back otherwise). Vertical moves stay a scroll; a tap stays a tap.
 */
export const SwipeAway: React.FC<{ onAway: () => void; className?: string; children: React.ReactNode }> = ({ onAway, className = '', children }) => {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [gone, setGone] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const end = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) > AWAY_PX) {
      setGone(Math.sign(dx));
      window.setTimeout(onAway, 180);
    } else {
      setDx(0);
    }
  };

  return (
    <div
      className={`ta-swipe ${className}`}
      data-dragging={dragging || undefined}
      style={{
        transform: gone ? `translateX(${gone * 120}%)` : `translateX(${dx}px)`,
        opacity: gone ? 0 : Math.max(0.25, 1 - Math.abs(dx) / 260),
        transition: dragging ? 'none' : 'transform 0.18s ease, opacity 0.18s ease',
      }}
      onPointerDown={e => {
        if (gone) return;
        start.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
      }}
      onPointerMove={e => {
        if (!start.current) return;
        const x = e.clientX - start.current.x;
        const y = e.clientY - start.current.y;
        if (!swiped.current) {
          if (Math.abs(x) < MOVE_PX && Math.abs(y) < MOVE_PX) return;
          // Mostly vertical: a scroll, not a swipe
          if (Math.abs(y) > Math.abs(x)) { start.current = null; return; }
          swiped.current = true;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setDx(x);
      }}
      onPointerUp={end}
      onPointerCancel={() => { start.current = null; setDragging(false); setDx(0); }}
      // A swipe is not a tap: the card under the finger is not opened
      onClickCapture={e => {
        if (swiped.current) {
          e.stopPropagation();
          e.preventDefault();
          swiped.current = false;
        }
      }}
    >
      {children}
    </div>
  );
};
