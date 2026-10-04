import React, { useState } from 'react';
import { X, Send, Clock, Calendar, FileText, AlertCircle, MessageSquareText, Paperclip, Trash2, PenLine } from 'lucide-react';
import { categoryIcon } from '../Absence/absenceUtils';
import { errorText, type MyAbsenceRequest } from './useMyAbsences';
import { REQUEST_KINDS, ANNOUNCE_EVENTS, MAX_DOC, todayIso, requestError } from './absenceRequestForm';
import '../Absence/Absence.css';

type Kind = MyAbsenceRequest['kind'];

/**
 * Personal space: a holiday request (from / to, not linked to an event), or an absence / lateness announced in advance
 * for an event (travel, meeting, training, match, or another one named) on a day. The reason: a text, a document, or both.
 * Sent to the administration, it waits for its decision.
 */
export const MyAbsenceRequestDialog: React.FC<{ onSubmit: (data: MyAbsenceRequest) => Promise<void>; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [kind, setKind] = useState<Kind>('leave');
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState('');
  const [event, setEvent] = useState('');
  const [other, setOther] = useState('');
  const [delay, setDelay] = useState('');
  const [reason, setReason] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const current = REQUEST_KINDS.find(k => k.value === kind) || REQUEST_KINDS[0];
  const announce = kind !== 'leave';

  const pick = (file: File | null) => {
    if (file && file.size > MAX_DOC) return setError('حجم الوثيقة أكبر من 5 ميغا');
    setDoc(file);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = requestError({ kind, from, to, event, other, reason, doc });
    if (problem) return setError(problem);
    setSaving(true);
    try {
      await onSubmit({
        kind,
        event_date: from,
        ...(kind === 'leave' && to ? { end_date: to } : {}),
        ...(announce ? { event_category: event, ...(event === 'أخرى' ? { event_other: other.trim() } : {}) } : {}),
        ...(kind === 'late' && delay.trim() ? { duration: delay.trim() } : {}),
        reason: reason.trim(),
        document: doc,
      });
    } catch (err) {
      setError(errorText(err, 'تعذر إرسال الطلب'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ab-overlay" onClick={onClose}>
      <form className={`ab-dialog tone-${current.tone}`} onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label={current.label}>
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><current.icon size={22} /></span>
          <div className="ab-dialog-title">
            <h2>{current.label}</h2>
            <p>يصل إلى الإدارة، ويبقى قيد الدراسة حتى يتم قبوله أو رفضه</p>
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          <div className="ab-modes n3">
            {REQUEST_KINDS.map(k => (
              <button key={k.value} type="button" className={`tone-${k.tone} ${kind === k.value ? 'on' : ''}`} onClick={() => { setKind(k.value); setError(''); }}>
                <span><k.icon size={20} /></span>
                {k.short}
              </button>
            ))}
          </div>

          {announce && (
            <div className="ab-field">
              <span><FileText size={15} /> {kind === 'late' ? 'ستتأخر عن *' : 'ستغيب عن *'}</span>
              <div className="ab-cats">
                {ANNOUNCE_EVENTS.map(value => (
                  <button key={value} type="button" className={event === value ? 'on' : ''} onClick={() => { setEvent(value); setError(''); }}>
                    {React.createElement(categoryIcon(value), { size: 16 })} {value}
                  </button>
                ))}
              </div>
            </div>
          )}
          {announce && event === 'أخرى' && (
            <label className="ab-field">
              <span><PenLine size={15} /> ما هو الحدث *</span>
              <input type="text" value={other} onChange={e => { setOther(e.target.value); setError(''); }} placeholder="مثال: حصة تصوير، موعد إداري..." />
            </label>
          )}

          <div className={`ab-row ${kind !== 'absence' ? 'two' : ''}`}>
            <label className="ab-field">
              <span><Calendar size={15} /> {kind === 'leave' ? 'من *' : 'التاريخ *'}</span>
              <input type="date" dir="ltr" value={from} min={todayIso()} onChange={e => { setFrom(e.target.value); setError(''); }} />
            </label>
            {kind === 'leave' && (
              <label className="ab-field">
                <span><Calendar size={15} /> إلى (اختياري)</span>
                <input type="date" dir="ltr" value={to} min={from || todayIso()} onChange={e => { setTo(e.target.value); setError(''); }} />
              </label>
            )}
            {kind === 'late' && (
              <label className="ab-field">
                <span><Clock size={15} /> مدة التأخر المتوقعة (اختياري)</span>
                <input type="text" value={delay} onChange={e => setDelay(e.target.value)} placeholder="مثال: 30 دقيقة" />
              </label>
            )}
          </div>

          <div className="ab-field">
            <span><Paperclip size={15} /> وثيقة (اختيارية مع السبب)</span>
            {doc ? (
              <div className="ab-file">
                <Paperclip size={16} /> <b>{doc.name}</b>
                <button type="button" onClick={() => pick(null)} aria-label="إزالة الوثيقة"><Trash2 size={15} /></button>
              </div>
            ) : (
              <label className="ab-file pick">
                <Paperclip size={16} /> اختر ملف PDF أو صورة (تذكرة سفر، استدعاء...)
                <input type="file" accept="application/pdf,image/*" onChange={e => pick(e.target.files?.[0] ?? null)} hidden />
              </label>
            )}
          </div>

          <label className="ab-field">
            <span><MessageSquareText size={15} /> السبب {doc ? '(اختياري مع الوثيقة)' : '*'}</span>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              placeholder={kind === 'leave' ? 'سبب طلب العطلة (سفر، ظرف عائلي...)' : kind === 'late' ? 'سبب التأخر (امتحان، موعد طبي...)' : 'سبب الغياب (امتحان، موعد طبي...)'}
              rows={3}
            />
          </label>
          {error && <p className="ab-error"><AlertCircle size={14} /> {error}</p>}
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="submit" className="ab-btn primary" disabled={saving}>
            <Send size={16} /> {saving ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </footer>
      </form>
    </div>
  );
};
