import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, UploadCloud, File, CheckCircle2 } from 'lucide-react';
import './UploadReceiptDialog.css';

interface UploadReceiptDialogProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  onUpload: (paymentId: string, file: File) => Promise<void>;
}

export const UploadReceiptDialog: React.FC<UploadReceiptDialogProps> = ({ payment, isOpen, onClose, onUpload }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !payment) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await onUpload(payment.id, selectedFile);
    setIsUploading(false);
    setSelectedFile(null);
  };

  return (
    <div className="dialog-overlay active">
      <div className="dialog-content upload-dialog">
        <div className="dialog-header">
          <h2>{t('payments.upload_receipt', 'إرفاق وصل العملية')}</h2>
          <button className="btn-close" onClick={onClose} disabled={isUploading}>
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body text-center">
          <p className="upload-subtitle mb-4">الرجاء اختيار ملف الصورة أو الـ PDF للوصل الموقّع للدفعة.</p>
          <div className="upload-area">
            <input 
              type="file" 
              id="receipt-upload" 
              className="upload-input" 
              accept="image/*,.pdf" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
            <label htmlFor="receipt-upload" className="upload-label">
              <UploadCloud size={48} className="upload-icon" />
              <span className="upload-text">اضغط هنا لاختيار الملف</span>
              <span className="upload-hint">أقصى حجم: 5 ميغابايت (JPG, PNG, PDF)</span>
            </label>
          </div>
          {selectedFile && (
            <div className="selected-file-info mt-4">
              <File size={24} className="file-icon" />
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <CheckCircle2 size={20} className="success-icon" />
            </div>
          )}
        </div>
        <div className="dialog-footer mt-4 px-0 pb-0 border-0 bg-transparent" style={{ justifyContent: 'center', gap: '1rem' }}>
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isUploading} style={{ minWidth: '120px' }}>
            {t('payments.cancel', 'إلغاء')}
          </button>
          <button type="button" className="btn-primary" onClick={handleUpload} disabled={!selectedFile || isUploading} style={{ minWidth: '120px' }}>
            {isUploading ? 'جاري الرفع...' : 'رفع وحفظ'}
          </button>
        </div>
      </div>
    </div>
  );
};
