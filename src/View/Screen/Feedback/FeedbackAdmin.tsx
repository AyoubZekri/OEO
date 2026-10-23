import React, { useEffect, useState } from 'react';
import { MessageSquare, Inbox, Sparkles, Hourglass, CheckCircle2, Star, RefreshCw, Search, X, Filter, Layers, ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { useCan } from '../../../core/functions/useCan';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import { FEEDBACK_TYPES, STATUS_META, statusOf, type FeedbackStatus, type FeedbackType } from './feedbackUtils';
import { useFeedbackAdmin, useFocusedFeedback } from './useFeedback';
import { FeedbackCard, ReplyForm } from './FeedbackParts';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Feedback.css';

const TYPE_OPTIONS = [{ value: 'all', label: 'كل الأنواع' }, ...FEEDBACK_TYPES.map(t => ({ value: t.value, label: t.label }))];
const STATUS_OPTIONS = [{ value: 'all', label: 'كل الحالات' }, ...(Object.keys(STATUS_META) as FeedbackStatus[]).map(s => ({ value: s, label: STATUS_META[s].label }))];

/**
 * Management: the members' opinions. Each one is replied to; a suggestion is also rated with stars.
 * Same layout as the other pages: the figures, the filters, then the cards (phone: hero, sheets, list).
 */
export const FeedbackAdmin: React.FC = () => {
  const c = useFeedbackAdmin();
  const isMobile = useIsMobile();
  const can = useCan();
  const [type, setType] = useState<FeedbackType | ''>('');
  const [status, setStatus] = useState<FeedbackStatus | ''>('');
  const [query, setQuery] = useState('');
  const focusId = useFocusedFeedback(!c.isLoading);
  const focused = focusId ? c.items.find(f => f.id === focusId) : undefined;
  useEffect(() => {
    if (focused && !focused.read) c.markRead(focused);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened opinion
  }, [focused?.id]);

  const q = query.trim().toLowerCase();
  const list = c.items
    .filter(f => (!type || f.type === type) && (!status || statusOf(f) === status))
    .filter(f => !q || [f.subject, f.body, f.member_name].some(v => (v || '').toLowerCase().includes(q)));
  const count = (s: FeedbackStatus) => c.items.filter(f => statusOf(f) === s).length;
  const rated = c.items.filter(f => f.type === 'suggestion' && f.rating);
  const average = rated.length ? Math.round((rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length) * 10) / 10 : 0;

  const cards = list.map(f => (
    <FeedbackCard
      key={f.id}
      feedback={f}
      admin
      focused={focusId === f.id}
      onReply={can('feedback', 'reply') ? () => c.openReply(f) : undefined}
      onDelete={can('feedback', 'delete') ? () => c.remove(f) : undefined}
    />
  ));
  const body = c.isLoading && !c.items.length ? <PageLoader mobile={isMobile} text="جاري تحميل الآراء..." />
    : c.error ? (
      <div className="tk-state">
        <MessageSquare size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : list.length === 0 ? (
      <div className="tk-state"><Inbox size={32} /><p>{c.items.length ? 'لا توجد آراء بهذه التصفية' : 'لم يرسل الأعضاء أي رأي بعد'}</p></div>
    ) : <div className={isMobile ? 'tk-list' : 'tk-grid'}>{cards}</div>;
  const reply = c.replying && <ReplyForm feedback={c.replying} onSave={(text, rating) => c.reply(c.replying!, text, rating)} onClose={c.closeReply} />;

  if (isMobile) {
    const typeLabel = FEEDBACK_TYPES.find(t => t.value === type)?.label || 'الكل';
    const statusLabel = status ? STATUS_META[status].label : 'الكل';
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="آراء الأعضاء" />

        <section className="tk-hero">
          <div className="tk-hero-top">
            <span className="tk-hero-icon"><MessageSquare size={26} /></span>
            <div>
              <small>آراء الأعضاء</small>
              <strong>{c.items.length} رأي</strong>
            </div>
          </div>
          <div className="tk-hero-tiles fb-hero-tiles">
            {[
              { label: 'جديدة', v: count('new'), icon: Sparkles, tone: 'orange' },
              { label: 'بانتظار الرد', v: count('waiting'), icon: Hourglass, tone: 'blue' },
              { label: 'تم الرد', v: count('replied'), icon: CheckCircle2, tone: 'green' },
              { label: 'تقييم الاقتراحات', v: average || '—', icon: Star, tone: 'amber' },
            ].map(t => (
              <div key={t.label} className={`tone-${t.tone}`}>
                <t.icon size={14} />
                <strong>{t.v}</strong>
                <small>{t.label}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالموضوع أو اسم العضو..." />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <div className="fb-mfilters">
            <MobileSelect
              label="النوع"
              icon={Layers}
              value={type || 'all'}
              options={TYPE_OPTIONS}
              onChange={v => setType(v === 'all' ? '' : v as FeedbackType)}
              renderTrigger={open => (
                <button type="button" className={`tk-filter-btn ${type ? 'active' : ''}`} onClick={open}>
                  <Layers size={15} />
                  <span><small>النوع</small><strong>{typeLabel}</strong></span>
                  <ChevronDown size={15} />
                </button>
              )}
            />
            <MobileSelect
              label="الحالة"
              icon={Filter}
              value={status || 'all'}
              options={STATUS_OPTIONS}
              onChange={v => setStatus(v === 'all' ? '' : v as FeedbackStatus)}
              renderTrigger={open => (
                <button type="button" className={`tk-filter-btn ${status ? 'active' : ''}`} onClick={open}>
                  <Filter size={15} />
                  <span><small>الحالة</small><strong>{statusLabel}</strong></span>
                  <ChevronDown size={15} />
                </button>
              )}
            />
          </div>
        </div>

        {body}
        {reply}
      </div>
    );
  }

  const stats = [
    { icon: Sparkles, label: 'آراء جديدة', value: String(count('new')), hint: 'لم تُفتح بعد', tone: 'orange' },
    { icon: Hourglass, label: 'بانتظار الرد', value: String(count('waiting')), hint: 'فُتحت ولم يُرد عليها', tone: 'blue' },
    { icon: CheckCircle2, label: 'تم الرد', value: String(count('replied')), hint: `من أصل ${c.items.length} رأي`, tone: 'green' },
    { icon: Star, label: 'تقييم الاقتراحات', value: average ? `${average} / 5` : '—', hint: rated.length ? `${rated.length} اقتراح مقيّم` : 'لا توجد اقتراحات مقيّمة', tone: 'amber' },
  ];

  return (
    <div className="tk-page tk-scope">
      <div className="db-stats">
        {stats.map(s => (
          <div key={s.label} className={`tone-${s.tone}`}>
            <span className="db-stat-icon"><s.icon size={22} /></span>
            <span className="db-stat-text">
              <small>{s.label}</small>
              <b>{s.value}</b>
              <em>{s.hint}</em>
            </span>
          </div>
        ))}
      </div>

      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={setQuery} placeholder="ابحث بالموضوع أو اسم العضو..." />
        <CustomDropdown options={TYPE_OPTIONS} value={type || 'all'} onChange={v => setType(v === 'all' ? '' : v as FeedbackType)} />
        <CustomDropdown options={STATUS_OPTIONS} value={status || 'all'} onChange={v => setStatus(v === 'all' ? '' : v as FeedbackStatus)} />
      </div>

      {body}
      {reply}
    </div>
  );
};
