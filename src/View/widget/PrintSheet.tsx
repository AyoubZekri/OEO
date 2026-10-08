import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../Screen/Equipment/EquipmentOperations.css'; // print-only-receipt rules

/**
 * Puts a printable document on the page (hidden on screen) and opens the browser's print sheet at once;
 * onDone once the sheet is closed. Mount it with a new key for each print.
 */
export const PrintSheet: React.FC<{ onDone: () => void; children: React.ReactNode }> = ({ onDone, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });

  useEffect(() => {
    let cancelled = false; // StrictMode runs the effect twice: only the last one prints
    const images = [...(ref.current?.querySelectorAll('img') || [])];
    // The background image must be loaded, or the sheet prints without it (2 s at most)
    const loaded = Promise.all(images.map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
    Promise.race([loaded, new Promise(r => setTimeout(r, 2000))]).then(() => {
      if (cancelled) return;
      setTimeout(() => {
        if (cancelled) return;
        const finish = () => { window.removeEventListener('afterprint', finish); doneRef.current(); };
        window.addEventListener('afterprint', finish);
        window.print();
      }, 60);
    });
    return () => { cancelled = true; };
  }, []);

  return createPortal(<div className="print-only-receipt" ref={ref}>{children}</div>, document.body);
};
