import React, { useState } from 'react';
import {
  Save, Loader2, Gavel, ListChecks, Calendar, Users, Plus, X, Search, Check, AlertCircle, UserPlus, ChevronDown, Clock, FileText,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSheet } from '../widgets/MobileSheet';
import { MobileSelect } from '../widgets/MobileSelect';
import type { ChecklistItem, Decision } from '../../Screen/Decisions/decision_model';
import type { Meeting } from '../../Screen/Meetings/meeting_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { fullName, memberPhoto } from '../MobileTeams/teamRoster';
import { isoDay, longDate } from '../MobileTrainingSessions/sessionUtils';
import '../MobileEvaluations/MobileEvaluations.css';

export interface DecisionDraft {
  meetingId: string;
  type: 'normal' | 'checklist';
  text: string;
  category?: string;
  checklistItems: ChecklistItem[];
  assigneeIds: string[];
  deadline: string;
  progress?: number;
}

interface MobileDecisionFormProps {
  /** Decision being edited; null when adding a new one */
  decision: Decision | null;
  /** Meeting chosen in the page filter, preselected for a new decision */
  defaultMeetingId: string;
  meetings: Meeting[];
  members: MemberModel[];
  onSave: (draft: DecisionDraft) => Promise<void>;
  onClose: () => void;
}

const DEADLINES: [string, number][] = [['بعد أسبوع', 7], ['بعد أسبوعين', 14], ['بعد شهر', 30]];

// Phone add / edit page of a decision (same fields and rules as the desktop form)
export const MobileDecisionForm: React.FC<MobileDecisionFormProps> = ({
  decision, defaultMeetingId, meetings, members, onSave, onClose,
}) => {
  const [draft, setDraft] = useState<DecisionDraft>(() => ({
    meetingId: decision ? String(decision.meetingId || '') : defaultMeetingId,
    type: decision?.type === 'checklist' ? 'checklist' : 'normal',
    text: decision?.text || '',
    category: decision?.category,
    checklistItems: decision?.checklistItems || [],
    assigneeIds: (decision?.assigneeIds || []).map(String),
    deadline: decision?.deadline ? decision.deadline.split('T')[0] : '',
    progress: decision?.progress,
  }));
  const [newTask, setNewTask] = useState('');
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof DecisionDraft>(field: K, value: DecisionDraft[K]) => setDraft(prev => ({ ...prev, [field]: value }));

  const errors = {
    text: draft.type === 'normal' && !draft.text.trim() ? 'اكتب نص القرار' : null,
    tasks: draft.type === 'checklist' && !draft.checklistItems.length ? 'أضف مهمة واحدة على الأقل' : null,
    assignees: !draft.assigneeIds.length ? 'اختر مسؤولاً واحداً على الأقل' : null,
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    set('checklistItems', [...draft.checklistItems, { id: Date.now().toString(), text: newTask.trim(), checked: false }]);
    setNewTask('');
  };

  const toggleMember = (id: string) =>
    set('assigneeIds', draft.assigneeIds.includes(id) ? draft.assigneeIds.filter(x => x !== id) : [...draft.assigneeIds, id]);

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const err = (text: string | null) => (showErrors && text ? <p className="mdc-error"><AlertCircle size={14} /> {text}</p> : null);
  const meeting = meetings.find(m => String(m.id) === draft.meetingId);
  const chosen = draft.assigneeIds.map(id => members.find(m => String(m.id) === id)).filter((m): m is MemberModel => !!m);
  const q = query.trim().toLowerCase();
  const listed = q ? members.filter(m => fullName(m).toLowerCase().includes(q)) : members;

  return (
    <MobileScreen
      title={decision ? 'تعديل القرار' : 'قرار جديد'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mdc-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ القرار'}
        </button>
      )}
    >
      {/* Meeting */}
      <section className="mdc-form-card">
        <h3 className="mdc-form-title"><span>1</span> الاجتماع التابع له</h3>
        <MobileSelect
          label="الاجتماع"
          icon={Calendar}
          value={draft.meetingId}
          options={[{ value: '', label: 'بدون اجتماع' }, ...meetings.map(m => ({ value: String(m.id), label: m.topic, hint: m.date }))]}
          onChange={v => set('meetingId', v)}
          searchable
          renderTrigger={open => (
            <button type="button" className={`mdc-pick ${meeting ? 'has-value' : ''}`} onClick={open}>
              <span className="mdc-pick-icon"><Calendar size={18} /></span>
              <span className="mdc-pick-text">
                <small>الاجتماع</small>
                <strong>{meeting?.topic || 'اختر الاجتماع'}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
          )}
        />
      </section>

      {/* Decision */}
      <section className={`mdc-form-card ${showErrors && (errors.text || errors.tasks) ? 'has-error' : ''}`}>
        <h3 className="mdc-form-title"><span>2</span> القرار</h3>
        <div className="mdc-seg">
          <button type="button" className={draft.type === 'normal' ? 'active' : ''} onClick={() => set('type', 'normal')}><FileText size={16} /> نص القرار</button>
          <button type="button" className={draft.type === 'checklist' ? 'active' : ''} onClick={() => set('type', 'checklist')}><ListChecks size={16} /> مهام متعددة</button>
        </div>

        {draft.type === 'normal' ? (
          <>
            <textarea
              className="me-textarea"
              rows={5}
              value={draft.text}
              onChange={e => set('text', e.target.value)}
              placeholder="اكتب تفاصيل القرار بشكل واضح ليفهمه المسؤولون..."
            />
            {err(errors.text)}
          </>
        ) : (
          <>
            <div className="mdc-add-task">
              <input
                className="me-input"
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                placeholder="اكتب مهمة ثم اضغط +"
              />
              <button type="button" onClick={addTask} disabled={!newTask.trim()} aria-label="إضافة المهمة"><Plus size={20} /></button>
            </div>
            {draft.checklistItems.length > 0 && (
              <ol className="mdc-task-list">
                {draft.checklistItems.map((item, i) => (
                  <li key={item.id}>
                    <span>{i + 1}</span>
                    <p>{item.text}</p>
                    <button type="button" onClick={() => set('checklistItems', draft.checklistItems.filter(x => x.id !== item.id))} aria-label="حذف المهمة">
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {err(errors.tasks)}
          </>
        )}
      </section>

      {/* People + deadline */}
      <section className={`mdc-form-card ${showErrors && errors.assignees ? 'has-error' : ''}`}>
        <h3 className="mdc-form-title"><span>3</span> التنفيذ</h3>
        <div className="me-field">
          <span className="me-label"><Users size={14} /> المسؤولون عن التنفيذ</span>
          <div className="mdc-chosen">
            {chosen.map(m => (
              <span key={m.id} className="mdc-chip">
                <img src={memberPhoto(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                {fullName(m)}
                <button type="button" onClick={() => toggleMember(String(m.id))} aria-label={`إزالة ${fullName(m)}`}><X size={13} /></button>
              </span>
            ))}
            <button type="button" className="mdc-add-person" onClick={() => setPicker(true)}>
              <UserPlus size={15} /> {chosen.length ? 'إضافة' : 'اختر المسؤولين'}
            </button>
          </div>
        </div>
        {err(errors.assignees)}

        <label className="me-field">
          <span className="me-label"><Clock size={14} /> الأجل الزمني (اختياري)</span>
          <input className="me-input" type="date" dir="ltr" value={draft.deadline} onChange={e => set('deadline', e.target.value)} />
        </label>
        <div className="mdc-quick">
          {DEADLINES.map(([label, days]) => (
            <button key={label} type="button" className={draft.deadline === isoDay(days) ? 'active' : ''} onClick={() => set('deadline', isoDay(days))}>{label}</button>
          ))}
          {draft.deadline && <button type="button" onClick={() => set('deadline', '')}>بدون أجل</button>}
        </div>
        {draft.deadline && <p className="mdc-hint"><Gavel size={13} /> {longDate(draft.deadline)}</p>}
      </section>

      {picker && (
        <MobileSheet
          title="المسؤولون عن التنفيذ"
          onClose={() => { setPicker(false); setQuery(''); }}
          footer={(
            <button type="button" className="mdc-sheet-done" onClick={() => { setPicker(false); setQuery(''); }}>
              <Check size={18} /> تم{draft.assigneeIds.length ? ` (${draft.assigneeIds.length})` : ''}
            </button>
          )}
        >
          <div className="mdc-sheet-search">
            <label className="mdc-search">
              <Search size={17} />
              <input type="search" placeholder="ابحث بالاسم..." value={query} onChange={e => setQuery(e.target.value)} />
            </label>
          </div>
          <div className="mdc-member-list">
            {listed.length === 0 && <p className="mdc-hint">لا توجد نتائج</p>}
            {listed.map(m => {
              const on = draft.assigneeIds.includes(String(m.id));
              return (
                <button key={m.id} type="button" className={`mdc-member ${on ? 'on' : ''}`} onClick={() => toggleMember(String(m.id))}>
                  <img src={memberPhoto(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                  <span><strong>{fullName(m)}</strong><small>{TYPE_LABELS[m.type] || m.type}</small></span>
                  <i>{on && <Check size={14} strokeWidth={3} />}</i>
                </button>
              );
            })}
          </div>
        </MobileSheet>
      )}
    </MobileScreen>
  );
};
