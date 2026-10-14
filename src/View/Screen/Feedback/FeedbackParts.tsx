import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Send, Trash2, MessageSquareReply, CalendarClock, UserRound, Reply, Hourglass } from 'lucide-react';
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

const initialsOf = (name?: string | null) => (name || '؟').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('');

/** "How long ago": minutes, hours, then days, then the date */
const agoText = (value: string | null) => {
  if (!value) return '';
  const t = new Date(value.replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return dateText(value);
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} د`;
  const h = Math.round(min / 60);
  if (h < 24) return `منذ ${h} سا`;
  const d = Math.round(h / 24);
  if (d === 1) return 'أمس';
  if (d < 7) return `منذ ${d} أيام`;
  return dateText(value).split(' · ')[0];
};

const RATING_WORDS = ['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];

/**
 * One opinion, like a message thread: the sender (management) or the type and date (personal space), its status,
 * the subject and text, then the management's reply under it — with the stars of a suggestion.
 */
export const FeedbackCard: React.FC<{
  feedback: Feedback;
  /** Management: who sent it, its status, reply / delete */
  admin?: boolean;
  onReply?: () => void;
  onDelete?: () => void;
  /** Opened from an alert: marked */
  focused?: boolean;
}> = ({ feedback: f, admin, onReply, onDelete, focused }) => {
  const meta = typeMeta(f.type);
  const status = statusOf(f);
  const newReply = !admin && f.replied_at && !f.reply_seen;
  const chip = admin
    ? { label: STATUS_META[status].label, tone: STATUS_META[status].tone }
    : newReply ? { label: 'رد جديد', tone: 'orange' } : f.replied_at ? { label: 'تم الرد', tone: 'green' } : { label: 'بانتظار الرد', tone: 'blue' };

  return (
    <article className={`fb-card tone-${meta.tone} ${admin && status === 'new' ? 'is-new' : ''} ${focused ? 'is-focused' : ''}`} id={`feedback-card-${f.id}`}>
      {/* Who and when (or the type, in the personal space), and the status */}
      <header className="fb-card-top">
        {admin ? (
          <span className="fb-who">
            <span className="fb-avatar">{initialsOf(f.member_name)}</span>
            <span className="fb-who-text">
              <strong>{f.member_name || 'عضو'}</strong>
              <small>{f.member_role ? `${f.member_role} · ` : ''}{agoText(f.created_at)}</small>
            </span>
          </span>
        ) : (
          <span className="fb-who">
            <span className="fb-avatar type"><meta.icon size={18} /></span>
            <span className="fb-who-text">
              <strong>{meta.label}</strong>
              <small><CalendarClock size={12} /> {dateText(f.created_at)}</small>
            </span>
          </span>
        )}
        <span className={`fb-status tone-${chip.tone}`}><i />{chip.label}</span>
      </header>

      {/* The opinion */}
      <div className="fb-card-main">
        {admin && <span className="fb-chip"><meta.icon size={13} /> {meta.label}</span>}
        <h4 className="fb-subject">{f.subject}</h4>
        {f.body && <p className="fb-card-body">{f.body}</p>}
      </div>

      {/* The reply, or (personal space) waiting for it */}
      {f.replied_at ? (
        <div className="fb-reply">
          <div className="fb-reply-head">
            <span className="fb-avatar sm reply"><MessageSquareReply size={14} /></span>
            <span className="fb-who-text">
              <strong>رد الإدارة</strong>
              <small>{f.replied_by ? `${f.replied_by} · ` : ''}{agoText(f.replied_at)}</small>
            </span>
          </div>
          {f.type === 'suggestion' && f.rating ? (
            <div className="fb-rating-row">
              <StarRating value={f.rating} size={17} />
              <b>{f.rating}/5</b>
              <span>{RATING_WORDS[f.rating]}</span>
            </div>
          ) : null}
          <p>{f.reply}</p>
        </div>
      ) : !admin ? (
        <div className="fb-waiting"><Hourglass size={15} /> وصل رأيك إلى الإدارة، وستتلقى تنبيهاً عند الرد عليه</div>
      ) : null}

      {(onReply || onDelete) && (
        <footer className="fb-card-actions">
          {onReply && (
            <button type="button" className={`fb-btn ${f.replied_at ? 'ghost' : 'primary'}`} onClick={onReply}>
              {f.type === 'suggestion' ? <Star size={16} /> : <Reply size={16} />}
              {f.replied_at ? 'تعديل الرد' : f.type === 'suggestion' ? 'تقييم ورد' : 'رد'}
            </button>
          )}
          {onDelete && (
            <button type="button" className="fb-icon-btn danger" onClick={onDelete} aria-label="حذف" title="حذف"><Trash2 size={17} /></button>
          )}
        </footer>
      )}
    </article>
  );
};
