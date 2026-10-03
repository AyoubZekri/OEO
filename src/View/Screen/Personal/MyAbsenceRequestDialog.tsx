import React, { useState } from 'react';
import { X, Send, Plane, UserX, Calendar, FileText, AlertCircle, MessageSquareText } from 'lucide-react';
import { EVENT_CATEGORIES } from '../Absence/absenceUtils';
import { errorText, type MyAbsenceRequest } from './useMyAbsences';
import '../Absence/Absence.css';

const KINDS = [
  { value: 'leave' as const, label: 'طلب عطلة', icon: Plane, tone: 'violet' },
  { value: 'absence' as const, label: 'إعلام مسبق بغياب', icon: UserX, tone: 'red' },
];

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/**
 * Personal space: ask for a holiday (from / to), or announce an absence in advance (a day and what is missed).
 * Sent to the administration, it stays under review until accepted or refused.
 */
export const MyAbsenceRequestDialog: React.FC<{ onSubmit: (data: MyAbsenceRequest) => Promise<void>; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [kind, setKind] = useState<'leave' | 'absence'>('leave');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('تدريب');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const current = KINDS.find(k => k.value === kind) || KINDS[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from) return setError('حدد التاريخ');
    if (kind === 'leave' && to && to < from) return setError('تاريخ النهاية قبل تاريخ البداية');
    if (!reason.trim()) return setError('اكتب السبب');
    setSaving(true);
    try {
      await onSubmit({
        kind,
        event_date: from,
        ...(kind === 'leave' && to ? { end_date: to } : {}),
        ...(kind === 'absence' ? { event_category: category } : {}),
        reason: reason.trim(),
      });
    } catch (err) {
      setError(errorText(err, 'تعذر إرسال الطلب'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ab-overlay" onClick={onClose}>
      <form className={`ab-dialog tone-${current.tone}`} onClick={e => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label="طلب جديد">
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><current.icon size={22} /></span>
          <div className="ab-dialog-title">
            <h2>{current.label}</h2>
            <p>يبقى الطلب قيد الدراسة حتى يتم قبوله أو رفضه</p>
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          <div className="ab-modes n2">
            {KINDS.map(k => (
              <button key={k.value} type="button" className={`tone-${k.tone} ${kind === k.value ? 'on' : ''}`} onClick={() => { setKind(k.value); setError(''); }}>
                <span><k.icon size={20} /></span>
                {k.label}
              </button>
            ))}
          </div>

          {kind === 'absence' && (
            <div className="ab-field">
              <span><FileText size={15} /> ما ستغيب عنه</span>
              <div className="ab-cats">
                {EVENT_CATEGORIES.map(cat => (
                  <button key={cat.value} type="button" className={category === cat.value ? 'on' : ''} onClick={() => setCategory(cat.value)}>
                    <cat.icon size={16} /> {cat.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`ab-row ${kind === 'leave' ? 'two' : ''}`}>
            <label className="ab-field">
              <span><Calendar size={15} /> {kind === 'leave' ? 'من *' : 'التاريخ *'}</span>
              <input type="date" dir="ltr" value={from} min={today()} onChange={e => { setFrom(e.target.value); setError(''); }} />
            </label>
            {kind === 'leave' && (
              <label className="ab-field">
                <span><Calendar size={15} /> إلى (اختياري)</span>
                <input type="date" dir="ltr" value={to} min={from || today()} onChange={e => { setTo(e.target.value); setError(''); }} />
              </label>
            )}
          </div>

          <label className="ab-field">
            <span><MessageSquareText size={15} /> السبب *</span>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              placeholder={kind === 'leave' ? 'سبب طلب العطلة (سفر، ظرف عائلي...)' : 'سبب الغياب (امتحان، موعد طبي...)'}
              rows={4}
            />
          </label>
          {error && <p className="ab-error"><AlertCircle size={14} /> {error}</p>}
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose} disabled={saving}>إلغاء</button>
          <button type="submit" className="ab-btn primary" disabled={saving}>
            <Send size={16} /> {saving ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </footer>
      </form>
    </div>
  );
};
