import React, { useState } from 'react';
import { X, Send, Clock, Calendar, FileText, AlertCircle, MessageSquareText, Paperclip, Trash2, PenLine } from 'lucide-react';
import { categoryIcon } from '../Absence/absenceUtils';
import { errorText, type MyAbsenceRequest } from './useMyAbsences';
import { REQUEST_KINDS, ANNOUNCE_EVENTS, MAX_DOC, todayIso, requestError, requestErrorField, type RequestField } from './absenceRequestForm';
import { showSnackbar } from '../../../core/functions/Snacpar';
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
  // A field left wrong: its message under it (the event, a choice: a snackbar)
  const [error, setError] = useState<{ field: RequestField; text: string } | null>(null);
  const errorOf = (field: RequestField) => (error?.field === field ? error.text : '');
  const [saving, setSaving] = useState(false);
  const current = REQUEST_KINDS.find(k => k.value === kind) || REQUEST_KINDS[0];
  const announce = kind !== 'leave';

  const pick = (file: File | null) => {
    if (file && file.size > MAX_DOC) return showSnackbar('خطأ', 'حجم الوثيقة أكبر من 5 ميغا', '#ef4444');
    setDoc(file);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = requestError({ kind, from, to, event, other, reason, doc });
    const field = problem ? requestErrorField(problem) : null;
    setError(field ? { field, text: problem } : null);
    if (problem && !field) showSnackbar('خطأ', problem, '#ef4444');
    if (problem) return;
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
      showSnackbar('خطأ', errorText(err, 'تعذر إرسال الطلب'), '#ef4444');
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
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          <div className="ab-modes n3">
            {REQUEST_KINDS.map(k => (
              <button key={k.value} type="button" className={`tone-${k.tone} ${kind === k.value ? 'on' : ''}`} onClick={() => { setKind(k.value); setError(null); }}>
                <span><k.icon size={20} /></span>
                {k.short}
              </button>
            ))}
          </div>

          {announce && (
            <div className="ab-field">
              <span><FileText size={15} /> {kind === 'late' ? 'ستتأخر عن' : 'ستغيب عن'}</span>
              <div className="ab-cats">
                {ANNOUNCE_EVENTS.map(value => (
                  <button key={value} type="button" className={event === value ? 'on' : ''} onClick={() => setEvent(value)}>
                    {React.createElement(categoryIcon(value), { size: 16 })} {value}
                  </button>
                ))}
              </div>
            </div>
          )}
          {announce && event === 'أخرى' && (
            <label className="ab-field">
              <span><PenLine size={15} /> ما هو الحدث</span>
              <input type="text" className={errorOf('other') ? 'is-missing' : ''} value={other} onChange={e => { setOther(e.target.value); setError(null); }} />
              {errorOf('other') && <p className="ab-field-error"><AlertCircle size={13} /> {errorOf('other')}</p>}
            </label>
          )}

          <div className={`ab-row ${kind !== 'absence' ? 'two' : ''}`}>
            <label className="ab-field">
              <span><Calendar size={15} /> {kind === 'leave' ? 'من' : 'التاريخ'}</span>
              <input type="date" dir="ltr" className={errorOf('from') ? 'is-missing' : ''} value={from} min={todayIso()} onChange={e => { setFrom(e.target.value); setError(null); }} />
              {errorOf('from') && <p className="ab-field-error"><AlertCircle size={13} /> {errorOf('from')}</p>}
            </label>
            {kind === 'leave' && (
              <label className="ab-field">
                <span><Calendar size={15} /> إلى</span>
                <input type="date" dir="ltr" className={errorOf('to') ? 'is-missing' : ''} value={to} min={from || todayIso()} onChange={e => { setTo(e.target.value); setError(null); }} />
                {errorOf('to') && <p className="ab-field-error"><AlertCircle size={13} /> {errorOf('to')}</p>}
              </label>
            )}
            {kind === 'late' && (
              <label className="ab-field">
                <span><Clock size={15} /> مدة التأخر</span>
                <input type="text" value={delay} onChange={e => setDelay(e.target.value)} />
              </label>
            )}
          </div>

          <div className="ab-field">
            <span><Paperclip size={15} /> الوثيقة</span>
            {doc ? (
              <div className="ab-file">
                <Paperclip size={16} /> <b>{doc.name}</b>
                <button type="button" onClick={() => pick(null)} aria-label="إزالة الوثيقة"><Trash2 size={15} /></button>
              </div>
            ) : (
              <label className="ab-file pick">
                <Paperclip size={16} /> إرفاق وثيقة
                <input type="file" accept="application/pdf,image/*" onChange={e => pick(e.target.files?.[0] ?? null)} hidden />
              </label>
            )}
          </div>

          <label className="ab-field">
            <span><MessageSquareText size={15} /> السبب</span>
            <textarea
              className={errorOf('reason') ? 'is-missing' : ''}
              value={reason}
              onChange={e => { setReason(e.target.value); setError(null); }}
              rows={3}
            />
            {errorOf('reason') && <p className="ab-field-error"><AlertCircle size={13} /> {errorOf('reason')}</p>}
          </label>
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="submit" className="ab-btn primary" disabled={saving}>
            <Send size={16} /> {saving ? 'جاري الإرسال...' : 'تأكيد'}
          </button>
        </footer>
      </form>
    </div>
  );
};
