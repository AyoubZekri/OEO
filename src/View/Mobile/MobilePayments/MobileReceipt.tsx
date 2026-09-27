import React, { useEffect, useState } from 'react';
import { UploadCloud, Loader2, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { PaymentRecord } from '../../Screen/Payments/payment_model';
import { moneyText } from '../MobileContracts/contractUtils';
import { amountOf, dateOf, kindMeta } from './paymentUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileReceiptUploadProps {
  payment: PaymentRecord;
  title: string;
  onUpload: (paymentId: string, file: File) => Promise<void>;
  onClose: () => void;
}

// Phone version of UploadReceiptDialog: pick an image or PDF, preview it, upload
export const MobileReceiptUpload: React.FC<MobileReceiptUploadProps> = ({ payment, title, onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const meta = kindMeta(payment);

  // Free the local preview when it is replaced or the page closes
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    await onUpload(payment.id, file);
    setUploading(false);
  };

  return (
    <MobileScreen
      title="إرفاق وصل العملية"
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={upload} disabled={!file || uploading}>
          {uploading ? <Loader2 size={18} className="mpy-spin" /> : <UploadCloud size={18} />}
          {uploading ? 'جاري الرفع...' : 'رفع وحفظ'}
        </button>
      )}
    >
      <section className={`mpy-mini tone-${meta.tone}`}>
        <span className="mpy-kind-icon"><meta.icon size={19} /></span>
        <span>
          <strong>{title || meta.label}</strong>
          <small dir="ltr">{dateOf(payment)}</small>
        </span>
        <b dir="ltr">{moneyText(amountOf(payment))}</b>
      </section>

      <label className={`mpy-drop ${file ? 'has-file' : ''}`}>
        <input type="file" accept="image/*,.pdf" onChange={pick} disabled={uploading} />
        {!file ? (
          <>
            <span className="mpy-drop-icon"><UploadCloud size={34} /></span>
            <strong>اختر صورة الوصل أو ملف PDF</strong>
            <small>أقصى حجم: 5 ميغابايت (JPG, PNG, PDF)</small>
          </>
        ) : (
          <>
            {preview ? <img src={preview} alt="معاينة الوصل" /> : <span className="mpy-drop-icon"><FileText size={34} /></span>}
            <span className="mpy-file">
              <CheckCircle2 size={16} />
              <span><strong>{file.name}</strong><small dir="ltr">{(file.size / 1024 / 1024).toFixed(2)} MB</small></span>
            </span>
            <em><RefreshCw size={13} /> اضغط لاختيار ملف آخر</em>
          </>
        )}
      </label>
    </MobileScreen>
  );
};

// Full-screen receipt: the image, or the PDF in a frame
export const MobileReceiptView: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => (
  <MobileScreen title="عرض الوصل" onBack={onClose} layer={3}>
    <div className="mpy-viewer">
      {url.toLowerCase().endsWith('.pdf')
        ? <iframe src={url} title="صورة الوصل" />
        : <img src={url} alt="صورة الوصل" />}
    </div>
  </MobileScreen>
);
