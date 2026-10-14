import React, { useState } from 'react';
import { MessageSquare, Plus, Inbox } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { FEEDBACK_TYPES, type FeedbackType } from './feedbackUtils';
import { useMyFeedback } from './useFeedback';
import { FeedbackCard, FeedbackForm } from './FeedbackParts';
import './Feedback.css';

/**
 * Personal space: my opinions. I send a suggestion, a complaint or a note (its subject and text),
 * and read the management's reply — with its stars for a suggestion. One without a reply can be taken back.
 */
export const MyFeedback: React.FC = () => {
  const c = useMyFeedback();
  const isMobile = useIsMobile();
  const [type, setType] = useState<FeedbackType | ''>('');
  const list = c.items.filter(f => !type || f.type === type);
  const replied = c.items.filter(f => f.replied_at).length;

  return (
    <div className={`fb-page ${isMobile ? 'mobile' : ''}`}>
      {isMobile && <MobileAppBar title="آرائي واقتراحاتي" />}

      <section className="fb-hero">
        <span className="fb-hero-icon"><MessageSquare size={28} /></span>
        <div className="fb-hero-text">
          <small>آرائي واقتراحاتي</small>
          <strong>{c.items.length} <span>رأي</span></strong>
          <em>{replied} تم الرد عليها · {c.items.length - replied} بانتظار الرد</em>
        </div>
        <button type="button" className="fb-btn primary fb-hero-add" onClick={c.openForm}><Plus size={18} /> رأي جديد</button>
      </section>

      {c.items.length > 0 && (
        <div className="fb-chips">
          <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>الكل ({c.items.length})</button>
          {FEEDBACK_TYPES.map(t => (
            <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>
              <t.icon size={14} /> {t.label} ({c.items.filter(f => f.type === t.value).length})
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="fb-empty">
          <span><Inbox size={34} /></span>
          <strong>{c.isLoading ? 'جاري التحميل...' : c.items.length ? 'لا توجد آراء من هذا النوع' : 'لم ترسل أي رأي بعد'}</strong>
          {!c.isLoading && !c.items.length && <p>شاركنا اقتراحاتك وملاحظاتك، أو أخبرنا بمشكل تريد حله.</p>}
        </div>
      ) : (
        <div className="fb-grid">
          {list.map(f => (
            <FeedbackCard key={f.id} feedback={f} onDelete={f.replied_at ? undefined : () => c.remove(f)} />
          ))}
        </div>
      )}

      {c.formOpen && <FeedbackForm onSend={c.send} onClose={c.closeForm} />}
    </div>
  );
};
