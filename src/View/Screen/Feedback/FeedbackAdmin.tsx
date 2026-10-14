import React, { useState } from 'react';
import { MessageSquare, Inbox, Sparkles, Hourglass, CheckCircle2, Star, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { useCan } from '../../../core/functions/useCan';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { FEEDBACK_TYPES, STATUS_META, statusOf, type FeedbackStatus, type FeedbackType } from './feedbackUtils';
import { useFeedbackAdmin } from './useFeedback';
import { FeedbackCard, ReplyForm, StarRating } from './FeedbackParts';
import './Feedback.css';

/**
 * Management: the members' opinions. Each one is replied to; a suggestion is also rated with stars.
 * New ones (never opened) come first in their own colour.
 */
export const FeedbackAdmin: React.FC = () => {
  const c = useFeedbackAdmin();
  const isMobile = useIsMobile();
  const can = useCan();
  const [type, setType] = useState<FeedbackType | ''>('');
  const [status, setStatus] = useState<FeedbackStatus | ''>('');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = c.items
    .filter(f => (!type || f.type === type) && (!status || statusOf(f) === status))
    .filter(f => !q || [f.subject, f.body, f.member_name].some(v => (v || '').toLowerCase().includes(q)));
  const count = (s: FeedbackStatus) => c.items.filter(f => statusOf(f) === s).length;
  const rated = c.items.filter(f => f.type === 'suggestion' && f.rating);
  const average = rated.length ? Math.round((rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length) * 10) / 10 : 0;

  const tiles = [
    { key: 'new', label: 'جديدة', value: count('new'), icon: Sparkles, tone: 'orange' },
    { key: 'waiting', label: 'بانتظار الرد', value: count('waiting'), icon: Hourglass, tone: 'blue' },
    { key: 'replied', label: 'تم الرد', value: count('replied'), icon: CheckCircle2, tone: 'green' },
  ] as const;

  return (
    <div className={`fb-page ${isMobile ? 'mobile' : ''}`}>
      {isMobile && <MobileAppBar title="آراء الأعضاء" />}
      <TopbarSearch value={query} onChange={setQuery} placeholder="ابحث بالموضوع أو اسم العضو..." />

      <section className="fb-hero">
        <span className="fb-hero-icon"><MessageSquare size={28} /></span>
        <div className="fb-hero-text">
          <small>آراء الأعضاء</small>
          <strong>{c.items.length} <span>رأي</span></strong>
          <em>اقتراحات، شكاوى وملاحظات من الفضاء الشخصي</em>
        </div>
        <div className="fb-tiles">
          {tiles.map(t => (
            <button key={t.key} type="button" className={`fb-tile tone-${t.tone} ${status === t.key ? 'on' : ''}`} onClick={() => setStatus(status === t.key ? '' : t.key)}>
              <span><t.icon size={17} /></span>
              <strong>{t.value}</strong>
              <small>{t.label}</small>
            </button>
          ))}
          <div className="fb-tile tone-amber">
            <span><Star size={17} /></span>
            <strong>{average || '—'}</strong>
            <small>{rated.length ? <StarRating value={Math.round(average)} size={11} /> : 'تقييم الاقتراحات'}</small>
          </div>
        </div>
      </section>

      <div className="fb-chips">
        <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>كل الأنواع</button>
        {FEEDBACK_TYPES.map(t => (
          <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>
            <t.icon size={14} /> {t.label} ({c.items.filter(f => f.type === t.value).length})
          </button>
        ))}
        {status && <span className="fb-chip-note">{STATUS_META[status].label} <button type="button" onClick={() => setStatus('')} aria-label="إلغاء">×</button></span>}
      </div>

      {c.error ? (
        <div className="fb-empty">
          <span><Inbox size={34} /></span>
          <strong>{c.error}</strong>
          <button type="button" className="fb-btn soft" onClick={() => c.reload()}><RefreshCw size={16} /> إعادة المحاولة</button>
        </div>
      ) : list.length === 0 ? (
        <div className="fb-empty">
          <span><Inbox size={34} /></span>
          <strong>{c.isLoading ? 'جاري التحميل...' : c.items.length ? 'لا توجد آراء بهذه التصفية' : 'لم يرسل الأعضاء أي رأي بعد'}</strong>
        </div>
      ) : (
        <div className="fb-grid">
          {list.map(f => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              admin
              onReply={can('feedback', 'reply') ? () => c.openReply(f) : undefined}
              onDelete={can('feedback', 'delete') ? () => c.remove(f) : undefined}
            />
          ))}
        </div>
      )}

      {c.replying && <ReplyForm feedback={c.replying} onSave={(text, rating) => c.reply(c.replying!, text, rating)} onClose={c.closeReply} />}
    </div>
  );
};
