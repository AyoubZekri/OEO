import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, X, Filter, Layers, ChevronDown, Plus } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { useCan } from '../../../core/functions/useCan';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import { FEEDBACK_TYPES, STATUS_META, statusOf, type FeedbackStatus, type FeedbackType } from './feedbackUtils';
import { useFeedbackAdmin, useFocusedFeedback } from './useFeedback';
import { FeedbackCard, FeedbackDetails, FeedbackForm, ReplyForm } from './FeedbackParts';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Feedback.css';
import { StateIcon } from '../../widget/StateIcon';

const TYPE_OPTIONS = [{ value: 'all', label: 'كل الأنواع' }, ...FEEDBACK_TYPES.map(t => ({ value: t.value, label: t.label }))];
const STATUS_OPTIONS = [{ value: 'all', label: 'كل الحالات' }, ...(Object.keys(STATUS_META) as FeedbackStatus[]).map(s => ({ value: s, label: STATUS_META[s].label }))];

/**
 * Management: the members' opinions, the one opinions page (for who has its permission; without it, mine only).
 * Each one is replied to; a suggestion is also rated with stars; «رأي جديد» sends my own from here.
 * Same layout as the other pages: the filters, then the cards (phone: sheets, list).
 */
export const FeedbackAdmin: React.FC = () => {
  const c = useFeedbackAdmin();
  const isMobile = useIsMobile();
  const can = useCan();
  const [type, setType] = useState<FeedbackType | ''>('');
  const [status, setStatus] = useState<FeedbackStatus | ''>('');
  const [query, setQuery] = useState('');
  const [viewingId, setViewingId] = useState<number | null>(null);
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

  const cards = list.map(f => (
    <FeedbackCard
      key={f.id}
      feedback={f}
      admin
      focused={focusId === f.id}
      onReply={can('feedback', 'reply') ? () => c.openReply(f) : undefined}
      onDelete={can('feedback', 'delete') ? () => c.remove(f) : undefined}
      onOpen={() => { setViewingId(f.id); if (!f.read) c.markRead(f); }}
    />
  ));
  const viewing = viewingId != null ? c.items.find(f => f.id === viewingId) : undefined;
  const details = viewing && (
    <FeedbackDetails
      feedback={viewing}
      admin
      onReply={can('feedback', 'reply') ? () => { setViewingId(null); c.openReply(viewing); } : undefined}
      onDelete={can('feedback', 'delete') ? () => { setViewingId(null); c.remove(viewing); } : undefined}
      onClose={() => setViewingId(null)}
    />
  );
  const body = c.isLoading && !c.items.length ? <PageLoader mobile={isMobile} text="جاري تحميل الآراء..." />
    : c.error ? (
      <div className="tk-state">
        <StateIcon failed />
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : list.length === 0 ? (
      <StateIcon />
    ) : <div className={isMobile ? 'tk-list' : 'tk-grid'}>{cards}</div>;
  const reply = c.replying && <ReplyForm feedback={c.replying} onSave={(text, rating) => c.reply(c.replying!, text, rating)} onClose={c.closeReply} />;
  const form = c.formOpen && <FeedbackForm onSend={c.send} onClose={c.closeForm} />;

  if (isMobile) {
    const typeLabel = FEEDBACK_TYPES.find(t => t.value === type)?.label || 'الكل';
    const statusLabel = status ? STATUS_META[status].label : 'الكل';
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="آراء الأعضاء" />

        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالموضوع أو اسم العضو" />
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

        <button type="button" className="tk-fab" onClick={c.openForm} aria-label="رأي جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
        {details}
        {reply}
        {form}
      </div>
    );
  }

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={setQuery} placeholder="ابحث بالموضوع أو اسم العضو" />
        <CustomDropdown options={TYPE_OPTIONS} value={type || 'all'} onChange={v => setType(v === 'all' ? '' : v as FeedbackType)} />
        <CustomDropdown options={STATUS_OPTIONS} value={status || 'all'} onChange={v => setStatus(v === 'all' ? '' : v as FeedbackStatus)} />
        <button type="button" className="btn-primary" onClick={c.openForm}><Plus size={18} />رأي جديد</button>
      </div>

      {body}
      {details}
      {reply}
      {form}
    </div>
  );
};
