import React, { useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { Plus, Eye, Pencil, Trash2, Gavel, Filter, ChevronDown, Calendar, ListChecks } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { Decision } from '../../Screen/Decisions/decision_model';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { decisionTitle, decisionState, STATE_LABEL } from './decisionUtils';
import { MobileDecisionDetails } from './MobileDecisionDetails';
import { MobileDecisionForm, type DecisionDraft } from './MobileDecisionForm';
import './MobileDecisions.css';

export interface MobileDecisionsProps {
  decisions: Decision[];
  isLoading: boolean;
  meetings: Meeting[];
  members: MemberModel[];
  onSave: (draft: DecisionDraft, editingId: string | null) => Promise<void>;
  onDelete: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
  onToggleTask: (decisionId: string, itemId: string) => void;
}

// Phone version of the decisions page: summary, filters, short cards, details and form on their own pages
export const MobileDecisions: React.FC<MobileDecisionsProps> = ({
  decisions, isLoading, meetings, members, onSave, onDelete, onProgress, onToggleTask,
}) => {
  const can = useCan();
  const [meetingId, setMeetingId] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('decision');
  // undefined = form closed, null = new decision
  const [editing, setEditing] = useState<Decision | null | undefined>(undefined);

  const meetingName = (id?: string) => meetings.find(m => String(m.id) === String(id))?.topic;
  const byMeeting = meetingId ? decisions.filter(d => String(d.meetingId) === meetingId) : decisions;
  const list = byMeeting;

  const avg = decisions.length ? Math.round(decisions.reduce((s, d) => s + (d.progress || 0), 0) / decisions.length) : 0;
  const details = detailsId ? decisions.find(d => String(d.id) === detailsId) : undefined;
  const selectedMeeting = meetings.find(m => String(m.id) === meetingId);

  const remove = (d: Decision) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القرار؟')) onDelete(d.id);
  };

  const menuItems = (d: Decision): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(d.id) },
    ...(can('decisions', 'edit') ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => setEditing(d) }] : []),
    ...(can('decisions', 'delete') ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => remove(d) }] : []),
  ];

  return (
    <div className="mdc-page">
      <MobileAppBar title="القرارات" />

      {isLoading ? (
        <MobileLoader text="جاري تحميل القرارات..." />
      ) : (
        <>
          {/* Summary */}
          <section className="mdc-hero">
            <div className="mdc-hero-top">
              <div className="mdc-ring" style={{ '--mdc-p': avg } as React.CSSProperties}>
                <span><strong>{avg}%</strong><small>الإنجاز</small></span>
              </div>
              <div className="mdc-hero-text">
                <small>قرارات النادي</small>
                <strong>{decisions.length}</strong>
                <span>متوسط نسبة الإنجاز لكل القرارات</span>
              </div>
            </div>
            <div className="mdc-stats">
              <div><strong>{decisions.filter(d => decisionState(d) === 'active' || decisionState(d) === 'new').length}</strong><small>جارية</small></div>
              <div className="done"><strong>{decisions.filter(d => decisionState(d) === 'done').length}</strong><small>مكتملة</small></div>
              <div className="late"><strong>{decisions.filter(d => decisionState(d) === 'late').length}</strong><small>متأخرة</small></div>
            </div>
          </section>

          {/* Meeting filter (searchable, any number of meetings) */}
          {meetings.length > 0 && (
            <MobileSelect
              label="تصفية حسب الاجتماع"
              icon={Calendar}
              value={meetingId}
              options={[{ value: '', label: 'كل الاجتماعات' }, ...meetings.map(m => ({ value: String(m.id), label: m.topic, hint: m.date }))]}
              onChange={setMeetingId}
              searchable
              renderTrigger={open => (
                <button type="button" className={`mdc-filter ${selectedMeeting ? 'active' : ''}`} onClick={open}>
                  <Filter size={17} />
                  <span><small>الاجتماع</small><strong>{selectedMeeting?.topic || 'كل الاجتماعات'}</strong></span>
                  <ChevronDown size={18} />
                </button>
              )}
            />
          )}

          {list.length === 0 ? (
            <div className="mdc-empty">
              <span className="mdc-empty-icon"><Gavel size={36} /></span>
              <strong>{decisions.length ? 'لا توجد قرارات لهذا الاجتماع' : 'لا توجد قرارات حالياً'}</strong>
              <p>{decisions.length ? 'اختر اجتماعاً آخر لرؤية قراراته.' : 'أضف قراراً جديداً بالزر + وعيّن المسؤولين عنه.'}</p>
            </div>
          ) : (
            <div className="mdc-list">
              {list.map(d => {
                const state = decisionState(d);
                const open = () => setDetailsId(d.id);
                return (
                  <article
                    key={d.id}
                    className={`mdc-card st-${state}`}
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={e => { if (e.key === 'Enter') open(); }}
                  >
                    <div className="mdc-card-top">
                      <span className="mdc-card-icon">{d.type === 'checklist' ? <ListChecks size={19} /> : <Gavel size={19} />}</span>
                      <span className="mdc-card-text">
                        <strong>{decisionTitle(d)}</strong>
                        {meetingName(d.meetingId) && <small>{meetingName(d.meetingId)}</small>}
                      </span>
                      <MobileRowMenu items={menuItems(d)} label="إجراءات القرار" />
                    </div>
                    <div className="mdc-progress">
                      <em className={`mdc-state st-${state}`}>{STATE_LABEL[state]}</em>
                      <div className="mdc-bar"><div style={{ width: `${d.progress || 0}%` }} /></div>
                      <b>{d.progress || 0}%</b>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {can('decisions', 'add') && (
        <button type="button" className="mdc-fab" onClick={() => setEditing(null)} aria-label="إضافة قرار" title="إضافة قرار">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileDecisionDetails
          decision={details}
          meetingName={meetingName(details.meetingId)}
          members={members}
          onProgress={p => onProgress(details.id, p)}
          onToggleTask={itemId => onToggleTask(details.id, itemId)}
          onEdit={() => setEditing(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {editing !== undefined && (
        <MobileDecisionForm
          key={editing?.id || 'new'}
          decision={editing}
          defaultMeetingId={meetingId}
          meetings={meetings}
          members={members}
          onSave={draft => onSave(draft, editing?.id ?? null)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
};
