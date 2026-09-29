import React, { useRef, useState } from 'react';
import { FileText, Image, Type, Link2, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import type { TaskAttachment } from '../taskUtils';

type ProofType = TaskAttachment['type'];

const TYPES: { value: ProofType; label: string; icon: typeof FileText }[] = [
  { value: 'image', label: 'صورة', icon: Image },
  { value: 'file', label: 'ملف', icon: FileText },
  { value: 'text', label: 'نص', icon: Type },
  { value: 'link', label: 'رابط', icon: Link2 },
];

interface ProofFormProps {
  onSubmit: (proof: { type: ProofType; file?: File | null; url?: string; body?: string }) => Promise<void>;
  onDone: () => void;
}

/** Adds one proof of execution: an image, a file, a text or a link */
export const ProofForm: React.FC<ProofFormProps> = ({ onSubmit, onDone }) => {
  const [type, setType] = useState<ProofType>('image');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const save = async () => {
    if ((type === 'image' || type === 'file') && !file) return setError(type === 'image' ? 'اختر صورة' : 'اختر ملفاً');
    if (type === 'image' && file && !file.type.startsWith('image/')) return setError('الملف المختار ليس صورة');
    if (file && file.size > 10 * 1024 * 1024) return setError('حجم الملف أكبر من 10 ميغا');
    if (type === 'link' && !/^https?:\/\/\S+$/i.test(url.trim())) return setError('أدخل رابطاً صحيحاً يبدأ بـ http');
    if (type === 'text' && !body.trim()) return setError('اكتب النص');
    setError('');
    setSaving(true);
    try {
      await onSubmit({ type, file, url: url.trim() || undefined, body: body.trim() || undefined });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tk-proof-form">
      <div className="tk-seg four">
        {TYPES.map(t => (
          <button key={t.value} type="button" className={type === t.value ? 'on' : ''} onClick={() => { setType(t.value); setError(''); }}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {(type === 'image' || type === 'file') && (
        <>
          <input
            ref={input}
            type="file"
            hidden
            accept={type === 'image' ? 'image/*' : undefined}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <button type="button" className={`tk-drop ${file ? 'has' : ''}`} onClick={() => input.current?.click()}>
            {file ? <Check size={20} /> : <Upload size={20} />}
            <span>{file ? file.name : type === 'image' ? 'اختر صورة من الجهاز' : 'اختر ملفاً (PDF، Word…)'}</span>
            <small>{file ? `${(file.size / 1024).toFixed(0)} كيلوبايت · اضغط للتغيير` : 'حتى 10 ميغا'}</small>
          </button>
        </>
      )}
      {type === 'link' && (
        <input className="tk-input" type="url" dir="ltr" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" />
      )}
      {type === 'text' && (
        <textarea className="tk-input" rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="صف ما تم إنجازه" />
      )}

      {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      <div className="tk-row-end">
        <button type="button" className="tk-btn ghost sm" onClick={onDone}>إلغاء</button>
        <button type="button" className="tk-btn primary sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="tk-spin" /> : <Upload size={15} />}
          رفع الإثبات
        </button>
      </div>
    </div>
  );
};
