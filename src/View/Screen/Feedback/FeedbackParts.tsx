import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Send, Trash2, MessageSquareReply, CalendarClock, UserRound, Reply } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileScreen } from '../../Mobile/widgets/MobileScreen';
import { FEEDBACK_TYPES, STATUS_META, dateText, statusOf, typeMeta, type Feedback, type FeedbackType } from './feedbackUtils';

/** Stars, 1 → 5: to read, or to choose (onChange) */
export const StarRating: React.FC<{ value: number | null; onChange?: (v: number) => void; size?: number }> = ({ value, onChange, size = 18 }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value || 0;
  return (
    <span className={`fb-stars ${onChange ? 'input' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value || 0} من 5`}>
      {[1, 2, 3, 4, 5].map(n => (onChange ? (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} نجوم`}
          className={n <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star size={size} />
        </button>
      ) : (
        <Star key={n} size={size} className={n <= shown ? 'on' : ''} />
      )))}
    </span>
  );
};

/** A form's frame: a centred window on a computer, a full page on a phone */
export const FeedbackShell: React.FC<{ title: string; onClose: () => void; footer: React.ReactNode; children: React.ReactNode }> = ({ title, onClose, footer, children }) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileScreen title={title} onBack={onClose} footer={<div className="fb-foot">{footer}</div>}><div className="fb-form">{children}</div></MobileScreen>;
  }
  return createPortal(
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="fb-dialog-head">
          <h3>{title}</h3>
          <button type="button" className="fb-close" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </header>
        <div className="fb-form">{children}</div>
        <footer className="fb-foot">{footer}</footer>
      </div>
    </div>,
    document.body,
  );
};

/** Personal space: a new opinion — its type, subject and text */
export const FeedbackForm: React.FC<{ onSend: (d: { type: FeedbackType; subject: string; body: string }) => Promise<string | null>; onClose: () => void }> = ({ onSend, onClose }) => {
  const [type, setType] = useState<FeedbackType | ''>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!type) return setError('اختر النوع');
    if (!subject.trim()) return setError('اكتب الموضوع');
    setBusy(true);
    const err = await onSend({ type, subject: subject.trim(), body: body.trim() });
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <FeedbackShell
      title="رأي جديد"
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="fb-btn ghost" onClick={onClose}>إلغاء</button>
          <button type="button" className="fb-btn primary" onClick={submit} disabled={busy}><Send size={17} /> {busy ? 'جاري الإرسال...' : 'إرسال'}</button>
        </>
      )}
    >
      <div className="fb-field">
        <label>النوع</label>
        <div className="fb-types">
          {FEEDBACK_TYPES.map(t => (
            <button key={t.value} type="button" className={`fb-type tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => { setType(t.value); setError(''); }}>
              <span className="fb-type-icon"><t.icon size={20} /></span>
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="fb-field">
        <label htmlFor="fb-subject">الموضوع</label>
        <input id="fb-subject" value={subject} maxLength={200} onChange={e => { setSubject(e.target.value); setError(''); }} placeholder="عنوان قصير لرأيك" />
      </div>
      <div className="fb-field">
        <label htmlFor="fb-body">التفاصيل <span>(اختياري)</span></label>
        <textarea id="fb-body" rows={5} value={body} maxLength={5000} onChange={e => setBody(e.target.value)} placeholder="اشرح رأيك بالتفصيل..." />
      </div>
      {error && <p className="fb-error">{error}</p>}
    </FeedbackShell>
  );
};

/** Management: the reply — and, for a suggestion, its rating in stars */
export const ReplyForm: React.FC<{ feedback: Feedback; onSave: (text: string, rating: number | null) => Promise<string | null>; onClose: () => void }> = ({ feedback, onSave, onClose }) => {
  const isSuggestion = feedback.type === 'suggestion';
  const meta = typeMeta(feedback.type);
  const [text, setText] = useState(feedback.reply || '');
  const [rating, setRating] = useState<number | null>(feedback.rating);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (isSuggestion && !rating) return setError('قيّم الاقتراح بالنجوم');
    if (!text.trim()) return setError('اكتب الرد');
    setBusy(true);
    const err = await onSave(text.trim(), rating);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <FeedbackShell
      title={isSuggestion ? 'تقييم الاقتراح والرد' : `الرد على ال${meta.label}`}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="fb-btn ghost" onClick={onClose}>إلغاء</button>
          <button type="button" className="fb-btn primary" onClick={submit} disabled={busy}><Send size={17} /> {busy ? 'جاري الحفظ...' : 'حفظ الرد'}</button>
        </>
      )}
    >
      <div className={`fb-quote tone-${meta.tone}`}>
        <span className="fb-chip"><meta.icon size={14} /> {meta.label}</span>
        <strong>{feedback.subject}</strong>
        {feedback.body && <p>{feedback.body}</p>}
        <small><UserRound size={13} /> {feedback.member_name}{feedback.member_role ? ` · ${feedback.member_role}` : ''} · {dateText(feedback.created_at)}</small>
      </div>
      {isSuggestion && (
        <div className="fb-field">
          <label>تقييم الاقتراح</label>
          <div className="fb-rate">
            <StarRating value={rating} onChange={v => { setRating(v); setError(''); }} size={30} />
            <span>{rating ? `${rating} / 5` : 'اختر من نجمة إلى خمس'}</span>
          </div>
        </div>
      )}
      <div className="fb-field">
        <label htmlFor="fb-reply">الرد</label>
        <textarea id="fb-reply" rows={5} value={text} maxLength={5000} onChange={e => { setText(e.target.value); setError(''); }} placeholder="اكتب ردك على العضو..." autoFocus />
      </div>
      {error && <p className="fb-error">{error}</p>}
    </FeedbackShell>
  );
};

/** One opinion: its type, subject, text, and the reply (with the stars of a suggestion) */
export const FeedbackCard: React.FC<{
  feedback: Feedback;
  /** Management: who sent it, its status, reply / delete */
  admin?: boolean;
  onReply?: () => void;
  onDelete?: () => void;
}> = ({ feedback: f, admin, onReply, onDelete }) => {
  const meta = typeMeta(f.type);
  const status = statusOf(f);
  const newReply = !admin && f.replied_at && !f.reply_seen;
  return (
    <article className={`fb-card tone-${meta.tone} ${admin && status === 'new' ? 'is-new' : ''}`}>
      <header className="fb-card-head">
        <span className="fb-card-icon"><meta.icon size={20} /></span>
        <div className="fb-card-title">
          <span className="fb-chip">{meta.label}</span>
          <strong>{f.subject}</strong>
        </div>
        {admin
          ? <span className={`fb-status tone-${STATUS_META[status].tone}`}>{STATUS_META[status].label}</span>
          : <span className={`fb-status tone-${f.replied_at ? 'green' : 'blue'}`}>{newReply ? 'رد جديد' : f.replied_at ? 'تم الرد' : 'بانتظار الرد'}</span>}
      </header>

      {f.body && <p className="fb-card-body">{f.body}</p>}

      <div className="fb-card-meta">
        {admin && <span><UserRound size={13} /> {f.member_name}{f.member_role ? ` · ${f.member_role}` : ''}</span>}
        <span><CalendarClock size={13} /> {dateText(f.created_at)}</span>
      </div>

      {f.replied_at && (
        <div className="fb-reply">
          <div className="fb-reply-head">
            <span><MessageSquareReply size={15} /> رد الإدارة</span>
            {f.type === 'suggestion' && f.rating ? <StarRating value={f.rating} size={16} /> : null}
          </div>
          <p>{f.reply}</p>
          <small>{f.replied_by ? `${f.replied_by} · ` : ''}{dateText(f.replied_at)}</small>
        </div>
      )}

      {(onReply || onDelete) && (
        <footer className="fb-card-actions">
          {onReply && (
            <button type="button" className="fb-btn soft" onClick={onReply}>
              {f.type === 'suggestion' ? <Star size={16} /> : <Reply size={16} />}
              {f.replied_at ? 'تعديل الرد' : f.type === 'suggestion' ? 'تقييم ورد' : 'رد'}
            </button>
          )}
          {onDelete && <button type="button" className="fb-btn danger" onClick={onDelete} aria-label="حذف"><Trash2 size={16} /> حذف</button>}
        </footer>
      )}
    </article>
  );
};
