import React, { useState } from 'react';
import { Send, Loader2, Calendar, Briefcase, AlertCircle, MessageSquareText, Paperclip, Trash2, Clock, PenLine } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { categoryIcon } from '../../Screen/Absence/absenceUtils';
import { errorText, type MyAbsenceRequest } from '../../Screen/Personal/useMyAbsences';
import { REQUEST_KINDS, ANNOUNCE_EVENTS, MAX_DOC, todayIso, requestError } from '../../Screen/Personal/absenceRequestForm';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileAbsences.css';

type Kind = MyAbsenceRequest['kind'];

// Personal space (phone): a holiday request, or an absence / lateness announced in advance (same fields as the computer)
export const MobileMyAbsenceRequest: React.FC<{ onSubmit: (data: MyAbsenceRequest) => Promise<void>; onClose: () => void }> = ({ onSubmit, onClose }) => {
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
  const announce = kind !== 'leave';
  const current = REQUEST_KINDS.find(k => k.value === kind) || REQUEST_KINDS[0];

  const pick = (file: File | null) => {
    if (file && file.size > MAX_DOC) return setError('حجم الوثيقة أكبر من 5 ميغا');
    setDoc(file);
    setError('');
  };

  const send = async () => {
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
    <MobileScreen
      title={current.label}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={send} disabled={saving}>
          {saving ? <Loader2 size={18} className="mab-spin" /> : <Send size={18} />} إرسال
        </button>
      )}
    >
      {error && <p className="mab-banner"><AlertCircle size={16} /> {error}</p>}

      <section className="me-card">
        <div className="mab-modes n3">
          {REQUEST_KINDS.map(k => (
            <button key={k.value} type="button" className={`tone-${k.tone} ${kind === k.value ? 'on' : ''}`} onClick={() => { setKind(k.value); setError(''); }}>
              <span><k.icon size={20} /></span>
              {k.short}
            </button>
          ))}
        </div>
      </section>

      {announce && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Briefcase size={16} /></span>{kind === 'late' ? 'ستتأخر عن' : 'ستغيب عن'}</h3>
          <div className="mab-cats">
            {ANNOUNCE_EVENTS.map(value => (
              <button key={value} type="button" className={event === value ? 'on' : ''} onClick={() => { setEvent(value); setError(''); }}>
                {React.createElement(categoryIcon(value), { size: 16 })} {value}
              </button>
            ))}
          </div>
          {event === 'أخرى' && (
            <label className="me-field">
              <span className="me-label"><PenLine size={14} /> ما هو الحدث</span>
              <input className="me-input" value={other} onChange={e => { setOther(e.target.value); setError(''); }} placeholder="مثال: حصة تصوير، موعد إداري..." />
            </label>
          )}
        </section>
      )}

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> {kind === 'leave' ? 'من' : 'التاريخ'}</span>
          <input className="me-input" type="date" dir="ltr" value={from} min={todayIso()} onChange={e => { setFrom(e.target.value); setError(''); }} />
        </label>
        {kind === 'leave' && (
          <label className="me-field">
            <span className="me-label"><Calendar size={14} /> إلى (اختياري)</span>
            <input className="me-input" type="date" dir="ltr" value={to} min={from || todayIso()} onChange={e => { setTo(e.target.value); setError(''); }} />
          </label>
        )}
        {kind === 'late' && (
          <label className="me-field">
            <span className="me-label"><Clock size={14} /> مدة التأخر المتوقعة (اختياري)</span>
            <input className="me-input" value={delay} onChange={e => setDelay(e.target.value)} placeholder="مثال: 30 دقيقة" />
          </label>
        )}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><MessageSquareText size={16} /></span>السبب: نص أو وثيقة أو الاثنان</h3>
        {doc ? (
          <div className="mab-file">
            <Paperclip size={16} /> <b>{doc.name}</b>
            <button type="button" onClick={() => pick(null)} aria-label="إزالة الوثيقة"><Trash2 size={15} /></button>
          </div>
        ) : (
          <label className="mab-file pick">
            <Paperclip size={16} /> أرفق وثيقة (PDF أو صورة)
            <input type="file" accept="application/pdf,image/*" onChange={e => pick(e.target.files?.[0] ?? null)} hidden />
          </label>
        )}
        <textarea
          className="mab-textarea"
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          placeholder={kind === 'leave' ? 'سبب طلب العطلة (سفر، ظرف عائلي...)' : kind === 'late' ? 'سبب التأخر (امتحان، موعد طبي...)' : 'سبب الغياب (امتحان، موعد طبي...)'}
          rows={4}
        />
        <p className="mab-note">يصل إلى الإدارة، ويبقى قيد الدراسة حتى يتم قبوله أو رفضه.</p>
      </section>
    </MobileScreen>
  );
};
