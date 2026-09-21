import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import '../Disciplinary.css';

interface ViewSignedDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onEdit?: () => void;
}

export const ViewSignedDocumentDialog: React.FC<ViewSignedDocumentDialogProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onEdit,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <div className="modern-dialog-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '800px' }}>
        <div className="modern-dialog-header app-bar-header no-print">
          <div className="modern-dialog-title">
            <h3 style={{ margin: 0 }}>عرض الوثيقة</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button 
                type="button" 
                className="modern-btn-primary no-print" 
                onClick={onEdit}
                style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                تعديل
              </button>
            )}
            <button type="button" className="modern-close-btn desktop-close-btn no-print" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="modern-dialog-body" style={{ padding: '0', display: 'flex', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
          {imageUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe src={imageUrl} title="الوثيقة" style={{ width: '100%', height: '80vh', border: 'none' }} />
          ) : (
            <img src={imageUrl} alt="الوثيقة" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
