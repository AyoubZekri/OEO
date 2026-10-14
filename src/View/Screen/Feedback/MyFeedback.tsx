import React, { useState } from 'react';
import { MessageSquare, Plus, Inbox, Lightbulb, AlertTriangle, StickyNote, CheckCircle2, Hourglass, Layers, ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { TaskLoader } from '../Tasks/parts/TaskLoader';
import { FEEDBACK_TYPES, type FeedbackType } from './feedbackUtils';
import { useMyFeedback, useFocusedFeedback } from './useFeedback';
import { FeedbackCard, FeedbackForm } from './FeedbackParts';
import '../Tasks/Tasks.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Feedback.css';

const TYPE_OPTIONS = [{ value: 'all', label: 'كل الأنواع' }, ...FEEDBACK_TYPES.map(t => ({ value: t.value, label: t.label }))];

/**
 * Personal space: my opinions. I send a suggestion, a complaint or a note (its subject and text),
 * and read the management's reply — with its stars for a suggestion. One without a reply can be taken back.
 * Same layout as the other pages (phone: hero, sheet filter, list and the + button).
 */
export const MyFeedback: React.FC = () => {
  const c = useMyFeedback();
  const isMobile = useIsMobile();
  const [type, setType] = useState<FeedbackType | ''>('');
  const focusId = useFocusedFeedback(!c.isLoading);
  const list = c.items.filter(f => !type || f.type === type);
  const replied = c.items.filter(f => f.replied_at).length;
  const ofType = (t: FeedbackType) => c.items.filter(f => f.type === t).length;

  const body = c.isLoading && !c.items.length ? <TaskLoader mobile={isMobile} text="جاري تحميل آرائك..." />
    : list.length === 0 ? (
      <div className="tk-state">
        <Inbox size={32} />
        <p>{c.items.length ? 'لا توجد آراء من هذا النوع' : 'لم ترسل أي رأي بعد — شاركنا اقتراحاتك وملاحظاتك'}</p>
      </div>
    ) : (
      <div className={isMobile ? 'tk-list' : 'tk-grid'}>
        {list.map(f => <FeedbackCard key={f.id} feedback={f} focused={focusId === f.id} onDelete={f.replied_at ? undefined : () => c.remove(f)} />)}
      </div>
    );
  const form = c.formOpen && <FeedbackForm onSend={c.send} onClose={c.closeForm} />;

  if (isMobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="آرائي واقتراحاتي" />

        <section className="tk-hero">
          <div className="tk-hero-top">
            <span className="tk-hero-icon"><MessageSquare size={26} /></span>
            <div>
              <small>آرائي واقتراحاتي</small>
              <strong>{c.items.length} رأي</strong>
            </div>
          </div>
          <div className="tk-hero-tiles fb-hero-tiles">
            {[
              { label: 'تم الرد', v: replied, icon: CheckCircle2, tone: 'green' },
              { label: 'بانتظار الرد', v: c.items.length - replied, icon: Hourglass, tone: 'blue' },
              { label: 'اقتراحات', v: ofType('suggestion'), icon: Lightbulb, tone: 'amber' },
              { label: 'شكاوى', v: ofType('complaint'), icon: AlertTriangle, tone: 'red' },
            ].map(t => (
              <div key={t.label} className={`tone-${t.tone}`}>
                <t.icon size={14} />
                <strong>{t.v}</strong>
                <small>{t.label}</small>
              </div>
            ))}
          </div>
        </section>

        {c.items.length > 0 && (
          <div className="tk-toolbar">
            <MobileSelect
              label="النوع"
              icon={Layers}
              value={type || 'all'}
              options={TYPE_OPTIONS}
              onChange={v => setType(v === 'all' ? '' : v as FeedbackType)}
              renderTrigger={open => (
                <button type="button" className={`tk-filter-btn ${type ? 'active' : ''}`} onClick={open}>
                  <Layers size={15} />
                  <span><small>النوع</small><strong>{FEEDBACK_TYPES.find(t => t.value === type)?.label || 'الكل'}</strong></span>
                  <ChevronDown size={15} />
                </button>
              )}
            />
          </div>
        )}

        {body}

        <button type="button" className="tk-fab" onClick={c.openForm} aria-label="رأي جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
        {form}
      </div>
    );
  }

  const stats = [
    { icon: MessageSquare, label: 'آرائي', value: String(c.items.length), hint: `${replied} تم الرد عليها`, tone: 'orange' },
    { icon: Lightbulb, label: 'الاقتراحات', value: String(ofType('suggestion')), hint: 'أفكار لتحسين النادي', tone: 'amber' },
    { icon: AlertTriangle, label: 'الشكاوى', value: String(ofType('complaint')), hint: 'مشاكل تريد حلها', tone: 'red' },
    { icon: StickyNote, label: 'الملاحظات', value: String(ofType('note')), hint: 'ملاحظات للإدارة', tone: 'blue' },
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
        <CustomDropdown options={TYPE_OPTIONS.map(o => ({ ...o, label: o.value === 'all' ? `${o.label} (${c.items.length})` : `${o.label} (${ofType(o.value as FeedbackType)})` }))} value={type || 'all'} onChange={v => setType(v === 'all' ? '' : v as FeedbackType)} />
        <button type="button" className="btn-primary" onClick={c.openForm}><Plus size={18} />رأي جديد</button>
      </div>

      {body}
      {form}
    </div>
  );
};
