import React, { useState } from 'react';
import { Plus, Layers, ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import { FEEDBACK_TYPES, type FeedbackType } from './feedbackUtils';
import { useMyFeedback, useFocusedFeedback } from './useFeedback';
import { FeedbackCard, FeedbackForm } from './FeedbackParts';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Feedback.css';
import { StateIcon } from '../../widget/StateIcon';

const TYPE_OPTIONS = [{ value: 'all', label: 'كل الأنواع' }, ...FEEDBACK_TYPES.map(t => ({ value: t.value, label: t.label }))];

/**
 * Personal space: my opinions. I send a suggestion, a complaint or a note (its subject and text),
 * and read the management's reply — with its stars for a suggestion. One without a reply can be taken back.
 * Same layout as the other pages (phone: sheet filter, list and the + button).
 */
export const MyFeedback: React.FC = () => {
  const c = useMyFeedback();
  const isMobile = useIsMobile();
  const [type, setType] = useState<FeedbackType | ''>('');
  const focusId = useFocusedFeedback(!c.isLoading);
  const list = c.items.filter(f => !type || f.type === type);

  const body = c.isLoading && !c.items.length ? <PageLoader mobile={isMobile} text="جاري تحميل آرائك..." />
    : list.length === 0 ? (
      <StateIcon />
    ) : (
      <div className={isMobile ? 'tk-list' : 'tk-grid'}>
        {list.map(f => <FeedbackCard key={f.id} feedback={f} focused={focusId === f.id} onDelete={f.replied_at ? undefined : () => c.remove(f)} />)}
      </div>
    );
  const form = c.formOpen && <FeedbackForm onSend={c.send} onClose={c.closeForm} />;

  if (isMobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="آراء واقتراحات" />

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

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <CustomDropdown options={TYPE_OPTIONS} value={type || 'all'} onChange={v => setType(v === 'all' ? '' : v as FeedbackType)} />
        <button type="button" className="btn-primary" onClick={c.openForm}><Plus size={18} />رأي جديد</button>
      </div>

      {body}
      {form}
    </div>
  );
};
