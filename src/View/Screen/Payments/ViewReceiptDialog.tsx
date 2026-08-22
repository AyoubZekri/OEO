import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './ViewReceiptDialog.css';

interface ViewReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ViewReceiptDialog: React.FC<ViewReceiptDialogProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;



  return (
    <div className="dialog-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="dialog-content view-receipt-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <h2>{t('payments.view_receipt', 'عرض الوصل')}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="close-btn" onClick={onClose} style={{ marginRight: '8px' }}>
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="dialog-body receipt-image-container">
          {imageUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe src={imageUrl} title={t('payments.receipt_image', 'صورة الوصل')} style={{ width: '100%', height: '70vh', border: 'none' }} />
          ) : (
            <img src={imageUrl} alt={t('payments.receipt_image', 'صورة الوصل')} className="receipt-image-preview" />
          )}
          
          <div className="receipt-actions-overlay" style={{ display: 'none' }}>
            {/* Action buttons removed per user request */}
          </div>
        </div>
      </div>
    </div>
  );
};
