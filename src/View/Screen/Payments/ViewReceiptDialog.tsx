import React from 'react';
import { X, Download, Printer } from 'lucide-react';
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${t('payments.receipt_image', 'صورة الوصل')}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #fff; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `receipt_${Date.now()}.png`; // Set a default name
    link.target = "_blank"; // Fallback if download attribute is not supported
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
