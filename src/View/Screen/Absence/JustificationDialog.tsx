import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

interface JustificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, file: File | null) => void;
}

export const JustificationDialog: React.FC<JustificationDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [justificationText, setJustificationText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificationText.trim() && !selectedFile) {
      alert('الرجاء إدخال نص التبرير أو إرفاق وثيقة');
      return;
    }
    onSubmit(justificationText, selectedFile);
    setJustificationText('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>تقديم تبرير الغياب</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-h, #374151)' }}>نص التبرير</label>
            <textarea 
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              placeholder="اكتب سبب الغياب هنا بوضوح..."
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border, #d1d5db)',
                minHeight: '120px', fontFamily: 'inherit', outline: 'none', background: 'var(--bg, #f9fafb)',
                color: 'var(--text-h, #1f2937)', resize: 'vertical', transition: 'border-color 0.3s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent, #3b82f6)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border, #d1d5db)'}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-h, #374151)' }}>إرفاق وثيقة (اختياري)</label>
            <div style={{
              border: '2px dashed var(--accent, #3b82f6)', borderRadius: '12px', padding: '24px',
              textAlign: 'center', position: 'relative', background: 'rgba(59, 130, 246, 0.05)',
              transition: 'background 0.3s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
            >
              <UploadCloud size={36} color="var(--accent, #3b82f6)" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, color: 'var(--text-h, #1f2937)', fontSize: '0.95rem', fontWeight: '500' }}>
                {selectedFile ? selectedFile.name : 'اضغط هنا أو قم بسحب الملف'}
              </p>
              <input 
                type="file" 
                onChange={handleFileChange}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer'
                }}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-submit">إرسال التبرير</button>
          </div>
        </form>
      </div>
    </div>
  );
};
