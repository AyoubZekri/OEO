import React, { useState } from 'react';
import { Loader2, AlertCircle, PauseCircle, Undo2 } from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { BLOCK_REASONS, type Task } from '../taskUtils';

interface ReasonPromptProps {
  mobile: boolean;
  task: Task;
  kind: 'block' | 'return';
  onSubmit: (extra: { reason: string; note?: string }) => Promise<void>;
  onClose: () => void;
}

/** Why a task is blocked (reason from the list, a note required for "other"), or why it goes back for correction */
export const ReasonPrompt: React.FC<ReasonPromptProps> = ({ mobile, task, kind, onSubmit, onClose }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const block = kind === 'block';

  const save = async () => {
    if (block && !reason) return setError('اختر سبب التعطيل');
    if (block && reason === 'other' && !note.trim()) return setError('اكتب سبب التعطيل');
    if (!block && !reason.trim()) return setError('اكتب سبب الإرجاع وما يجب تصحيحه');
    setError('');
    setSaving(true);
    try {
      await onSubmit(block ? { reason, note: note.trim() || undefined } : { reason: reason.trim() });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskPanel
      mobile={mobile}
      sheet
      size="sm"
      layer={2}
      title={block ? 'تعطيل المهمة' : 'إرجاع للتصحيح'}
      subtitle={task.title}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="tk-btn ghost" onClick={onClose}>إلغاء</button>
          <button type="button" className={`tk-btn ${block ? 'danger' : 'warn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : block ? <PauseCircle size={17} /> : <Undo2 size={17} />}
            {block ? 'تعطيل' : 'إرجاع'}
          </button>
        </>
      )}
    >
      <div className="tk-form">
        {block ? (
          <>
            <span className="tk-label">سبب التعطيل</span>
            <div className="tk-choice-list">
              {BLOCK_REASONS.map(r => (
                <button key={r.value} type="button" className={reason === r.value ? 'on' : ''} onClick={() => setReason(r.value)}>
                  <span className="tk-radio" aria-hidden="true" />
                  {r.label}
                </button>
              ))}
            </div>
            <label className="tk-field">
              <span className="tk-label">{reason === 'other' ? 'اكتب السبب' : 'ملاحظة (اختياري)'}</span>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: بانتظار موافقة الرئيس على الميزانية" />
            </label>
          </>
        ) : (
          <label className="tk-field">
            <span className="tk-label">سبب الإرجاع وما يجب تصحيحه</span>
            <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: الصور غير واضحة، أعد تصوير الأرضية بعد التنظيف" autoFocus />
          </label>
        )}
        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </TaskPanel>
  );
};
