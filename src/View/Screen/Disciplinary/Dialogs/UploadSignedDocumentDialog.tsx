import React, { useState } from 'react';
import { compressDocumentImage } from '../../../../core/functions/compressDocumentImage';
import { createPortal } from 'react-dom';
import { type DisciplinaryModel } from '../disciplinary_data';
import { X, Upload, FileText, ArrowRight, Save, Image as ImageIcon } from 'lucide-react';
import '../Disciplinary.css';

interface UploadSignedDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, file: File) => Promise<void>;
  item: DisciplinaryModel | null;
}

export const UploadSignedDocumentDialog: React.FC<UploadSignedDocumentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        setIsSubmitting(true);
        const processedFile = await compressDocumentImage(file, 5);
        setSelectedFile(processedFile);
        setError('');
      } catch (err: any) {
        setError(err.message);
        setSelectedFile(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('يرجى اختيار ملف لرفعه.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(item.id, selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      console.error(err.message || 'حدث خطأ أثناء رفع الملف.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modern-dialog-overlay" onClick={!isSubmitting ? onClose : undefined}>
      <div className="modern-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="modern-dialog-header app-bar-header no-print">
          <button type="button" className="mobile-back-btn" onClick={onClose} disabled={isSubmitting}>
            <ArrowRight size={24} />
          </button>
          <div className="modern-dialog-title">
            <div className="modern-dialog-title-icon desktop-icon-container">
              <Upload size={24} color="#0056b3" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="desktop-title">رفع الوثيقة</span>
            </div>
          </div>
          <button type="button" className="modern-close-btn desktop-close-btn no-print" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modern-dialog-body" style={{ padding: '24px' }}>
          
          <div className="modern-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText size={18} /> اختر الوثيقة (صورة أو PDF)
            </label>
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
              onClick={() => document.getElementById('signed-doc-upload')?.click()}
            >
              {selectedFile ? (
                <>
                  <ImageIcon size={40} color="var(--primary-color)" />
                  <div style={{ fontWeight: 'bold' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <Upload size={40} color="var(--text-muted)" />
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>انقر لاختيار ملف</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>JPG, PNG, PDF المدعومة</div>
                </>
              )}
            </div>
            <input
              id="signed-doc-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {error && <div style={{ color: 'var(--danger-color)', marginTop: '8px', fontSize: '0.9rem' }}>{error}</div>}
          </div>

        </form>

        <div className="modern-dialog-footer no-print">
          <button type="button" className="modern-btn-secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </button>
          <button type="submit" className="modern-btn-primary" onClick={handleSubmit} disabled={isSubmitting || !selectedFile} style={{ opacity: (isSubmitting || !selectedFile) ? 0.7 : 1 }}>
            <Save size={18} />
            {isSubmitting ? 'جاري الرفع...' : 'رفع وحفظ'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
