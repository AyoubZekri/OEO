import React, { useState } from 'react';
import { Send, Loader2, Plane, UserX, Calendar, Briefcase, AlertCircle, MessageSquareText } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { EVENT_CATEGORIES } from '../../Screen/Absence/absenceUtils';
import { errorText, type MyAbsenceRequest } from '../../Screen/Personal/useMyAbsences';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileAbsences.css';

const KINDS = [
  { value: 'leave' as const, label: 'طلب عطلة', icon: Plane, tone: 'violet' },
  { value: 'absence' as const, label: 'إعلام بغياب', icon: UserX, tone: 'red' },
];

// Personal space (phone): ask for a holiday, or announce an absence in advance
export const MobileMyAbsenceRequest: React.FC<{ onSubmit: (data: MyAbsenceRequest) => Promise<void>; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [kind, setKind] = useState<'leave' | 'absence'>('leave');
  const [from, setFrom] = useState(isoDay());
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('تدريب');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const send = async () => {
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
    <MobileScreen
      title="طلب جديد"
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={send} disabled={saving}>
          {saving ? <Loader2 size={18} className="mab-spin" /> : <Send size={18} />} إرسال الطلب
        </button>
      )}
    >
      {error && <p className="mab-banner"><AlertCircle size={16} /> {error}</p>}

      <section className="me-card">
        <div className="mab-modes n2">
          {KINDS.map(k => (
            <button key={k.value} type="button" className={`tone-${k.tone} ${kind === k.value ? 'on' : ''}`} onClick={() => { setKind(k.value); setError(''); }}>
              <span><k.icon size={20} /></span>
              {k.label}
            </button>
          ))}
        </div>
      </section>

      {kind === 'absence' && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Briefcase size={16} /></span>ما ستغيب عنه</h3>
          <div className="mab-cats">
            {EVENT_CATEGORIES.map(cat => (
              <button key={cat.value} type="button" className={category === cat.value ? 'on' : ''} onClick={() => setCategory(cat.value)}>
                <cat.icon size={16} /> {cat.value}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> {kind === 'leave' ? 'من' : 'التاريخ'}</span>
          <input className="me-input" type="date" dir="ltr" value={from} min={isoDay()} onChange={e => { setFrom(e.target.value); setError(''); }} />
        </label>
        {kind === 'leave' && (
          <label className="me-field">
            <span className="me-label"><Calendar size={14} /> إلى (اختياري)</span>
            <input className="me-input" type="date" dir="ltr" value={to} min={from || isoDay()} onChange={e => { setTo(e.target.value); setError(''); }} />
          </label>
        )}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><MessageSquareText size={16} /></span>السبب</h3>
        <textarea
          className="mab-textarea"
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          placeholder={kind === 'leave' ? 'سبب طلب العطلة (سفر، ظرف عائلي...)' : 'سبب الغياب (امتحان، موعد طبي...)'}
          rows={5}
        />
        <p className="mab-note">يبقى الطلب قيد الدراسة حتى يتم قبوله أو رفضه.</p>
      </section>
    </MobileScreen>
  );
};
