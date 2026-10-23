import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';
import { useIsMobile } from '../../core/functions/useIsMobile';
import { MobileScreen } from '../Mobile/widgets/MobileScreen';
import { OPEN_EVENT, type OpenedDoc } from './openDocument';
import './DocViewer.css';

/**
 * Every document of the app (receipts, attachments, proofs, scanned papers) is shown inside the app, never in
 * another tab: `openDocument(url, title)` from anywhere, shown by the one <DocViewerHost /> of the app
 * (a full page on a phone, a window on a computer).
 */

const isPdf = (url: string) => /\.pdf($|[?#])/i.test(url);
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|bmp|svg)($|[?#])/i.test(url) || url.startsWith('data:image') || url.startsWith('blob:');

/** The document itself: an image, a PDF, or any other file in a frame */
const DocBody: React.FC<{ doc: OpenedDoc }> = ({ doc }) => (
  <div className="dv-body">
    {isImage(doc.url) && !isPdf(doc.url)
      ? <img src={doc.url} alt={doc.title} />
      : <iframe src={doc.url} title={doc.title} />}
  </div>
);

export const DocViewerHost: React.FC = () => {
  const [doc, setDoc] = useState<OpenedDoc | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onOpen = (e: Event) => setDoc((e as CustomEvent<OpenedDoc>).detail);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!doc || isMobile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDoc(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, isMobile]);

  if (!doc) return null;
  const close = () => setDoc(null);

  if (isMobile) {
    return createPortal(
      <div className="dv-mobile">
        <MobileScreen title={doc.title} onBack={close} layer={3}>
          <DocBody doc={doc} />
        </MobileScreen>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="dv-overlay" onClick={close}>
      <div className="dv-dialog" role="dialog" aria-modal="true" aria-label={doc.title} onClick={e => e.stopPropagation()}>
        <header className="dv-head">
          <span className="dv-title"><FileText size={18} /> {doc.title}</span>
          <button type="button" className="dv-close" onClick={close} aria-label="إغلاق"><X size={20} /></button>
        </header>
        <DocBody doc={doc} />
      </div>
    </div>,
    document.body,
  );
};
