import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen } from 'lucide-react';
import { InternalRegulationsDocument } from '../Screen/Payments/PrintableReceipt/InternalRegulationsDocument';
import { useIsMobile } from '../../core/functions/useIsMobile';
import { MobileScreen } from '../Mobile/widgets/MobileScreen';
import './RegulationsViewer.css';

/** An A4 page's width on screen, in pixels (210mm) */
const PAGE_WIDTH = 794;

const block = (e: React.SyntheticEvent) => e.preventDefault();

/** Nothing in it can be selected, copied, dragged or opened with a right click */
const guard = {
  onCopy: block,
  onCut: block,
  onContextMenu: block,
  onDragStart: block,
  onSelect: block,
  onMouseDown: (e: React.MouseEvent) => { if (e.detail > 1) e.preventDefault(); },
};

/**
 * The club's internal regulations to read. Computer: its A4 pages one under the other, sized to the window.
 * Phone: a page of its own, the text in large print, one part after the other. Never copyable.
 */
export const RegulationsViewer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileScreen title="النظام الداخلي" onBack={onClose} layer={3}>
        <div className="reg-phone" {...guard}>
          <InternalRegulationsDocument flow />
        </div>
      </MobileScreen>
    );
  }
  return <RegulationsPages onClose={onClose} />;
};

/** The computer's window: the printed pages, scrolled */
const RegulationsPages: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // The pages fit the window's width (never bigger than the paper)
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, (el.clientWidth - 24) / PAGE_WIDTH));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return createPortal(
    <div className="reg-viewer" role="dialog" aria-modal="true" aria-label="النظام الداخلي">
      <header className="reg-viewer-head">
        <span className="reg-viewer-icon"><BookOpen size={20} /></span>
        <h2>النظام الداخلي</h2>
        <button type="button" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
      </header>
      <div
        ref={scroller}
        className="reg-viewer-pages"
        {...guard}
      >
        <div className="reg-viewer-paper" style={{ zoom }}>
          <InternalRegulationsDocument onScreen />
        </div>
      </div>
    </div>,
    document.body,
  );
};
