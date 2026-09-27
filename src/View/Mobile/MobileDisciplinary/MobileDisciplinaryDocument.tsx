import React, { useEffect, useMemo, useState } from 'react';
import { UploadCloud, FileText, RefreshCw, Save, ExternalLink, ImageIcon, X } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { compressDocumentImage } from '../../../core/functions/compressDocumentImage';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinaryActions.css';

const fileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const isPdf = (name: string) => name.toLowerCase().split('?')[0].endsWith('.pdf');

/** Upload the signed paper of an action (phone version of UploadSignedDocumentDialog) */
export const MobileDisciplinaryUpload: React.FC<{
  item: DisciplinaryModel;
  onSave: (id: string, file: File) => Promise<void>;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Local preview of the picked image
  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (picked?: File) => {
    if (!picked) return;
    setError('');
    try {
      setFile(await compressDocumentImage(picked, 5));
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? e.message : 'تعذر قراءة الملف');
    }
  };

  const save = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onSave(item.id, file);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء رفع الملف');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen
      title="رفع الوثيقة الممضاة"
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={!file || busy}>
          <Save size={18} /> {busy ? 'جاري الرفع...' : 'حفظ الوثيقة'}
        </button>
      )}
    >
      <section className="mda-head">
        <span className="mda-head-icon"><FileText size={22} /></span>
        <div>
          <strong>{item.memberName}</strong>
          <span>{item.actionType}</span>
        </div>
      </section>

      {file ? (
        <section className="mda-file">
          {preview
            ? <img src={preview} alt="" className="mda-file-preview" />
            : <span className="mda-file-pdf"><FileText size={42} /> PDF</span>}
          <div className="mda-file-info">
            <div>
              <strong>{file.name}</strong>
              <small>{fileSize(file.size)}</small>
            </div>
            <button type="button" className="mda-icon-btn" onClick={() => setFile(null)} aria-label="إزالة الملف"><X size={18} /></button>
          </div>
        </section>
      ) : (
        <label className="mda-drop">
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          <span className="mda-drop-icon"><UploadCloud size={30} /></span>
          <strong>اضغط لاختيار الوثيقة</strong>
          <small>صورة (JPG, PNG) أو ملف PDF — الصور الكبيرة تُضغط تلقائياً</small>
        </label>
      )}

      {error && <p className="mda-error">{error}</p>}
    </MobileScreen>
  );
};

/** Signed document viewer (phone version of ViewSignedDocumentDialog) */
export const MobileDisciplinaryDocumentView: React.FC<{
  item: DisciplinaryModel;
  onReplace?: () => void;
  onClose: () => void;
}> = ({ item, onReplace, onClose }) => {
  const url = item.signed_document || '';
  const pdf = isPdf(url);

  return (
    <MobileScreen
      title="الوثيقة الممضاة"
      onBack={onClose}
      layer={2}
      footer={(
        <>
          <a className="me-btn mda-btn" href={url} target="_blank" rel="noreferrer">
            <ExternalLink size={18} /> فتح
          </a>
          {onReplace && (
            <button type="button" className="me-btn primary mda-btn" onClick={onReplace}>
              <RefreshCw size={18} /> تغيير الوثيقة
            </button>
          )}
        </>
      )}
    >
      <section className="mda-head">
        <span className="mda-head-icon">{pdf ? <FileText size={22} /> : <ImageIcon size={22} />}</span>
        <div>
          <strong>{item.memberName}</strong>
          <span>{item.actionType}</span>
        </div>
      </section>

      <section className="mda-doc">
        {pdf
          ? <iframe src={url} title="الوثيقة الممضاة" />
          : <img src={url} alt="الوثيقة الممضاة" />}
      </section>
    </MobileScreen>
  );
};
