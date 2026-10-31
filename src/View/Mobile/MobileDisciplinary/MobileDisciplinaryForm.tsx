import React, { useRef, useState } from 'react';
import {
  Save, Loader2, MessageSquare, Calendar, AlertTriangle, UserPlus, UserRound, ChevronLeft, Check, Search,
  MapPin, BookOpen, FileText, Paperclip, Plus, X, AlertCircle, Clock, Users,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { MobileSheet } from '../widgets/MobileSheet';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import type { MemberModel } from '../../Screen/Members/member_model';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinaryForm.css';

interface MobileDisciplinaryFormProps {
  /** Action being edited; null when adding a new one */
  item: DisciplinaryModel | null;
  members: MemberModel[];
  isSubmitting: boolean;
  onSave: (item: DisciplinaryModel) => void;
  onClose: () => void;
}

type IconType = React.ComponentType<{ size?: number }>;
type ActionType = DisciplinaryModel['actionType'];

// The types offered by the desktop dialog (same icons as the list)
const TYPE_CHOICES: { value: ActionType; icon: IconType; hint: string }[] = [
  { value: 'طلب توضيح', icon: MessageSquare, hint: 'يُطلب من العضو رد مكتوب قبل أجل محدد.' },
  { value: 'استدعاء جلسة', icon: Calendar, hint: 'يُستدعى العضو إلى جلسة استماع في موعد ومكان محددين.' },
];

// Desktop joins the present people with an Arabic comma
const PEOPLE_SEPARATOR = '، ';

const fullName = (m: MemberModel) => `${m.first_name} ${m.last_name}`.trim();
const photoOf = (m?: MemberModel) => (m?.photo && !m.photo.includes('ui-avatars.com') ? m.photo : defaultAvatar);
const memberHint = (m: MemberModel) => [TYPE_LABELS[m.type] || m.type, m.team_name].filter(Boolean).join(' · ');
const splitPeople = (value?: string) => (value || '').split(/[,،\n]/).map(p => p.trim()).filter(Boolean);

// yyyy-mm-dd in local time, `offset` days from today (toISOString alone would give the UTC day)
const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const dayOnly = (value?: string) => (value || '').split(/[T ]/)[0];


const Step: React.FC<{
  title: string;
  error?: boolean;
  sectionRef?: React.Ref<HTMLElement>;
  children: React.ReactNode;
}> = ({ title, error, sectionRef, children }) => (
  <section ref={sectionRef} className={`mdf-step ${error ? 'has-error' : ''}`}>
    <div className="mdf-step-head">
      <h3>{title}</h3>
    </div>
    {children}
  </section>
);

const FieldError: React.FC<{ text: string }> = ({ text }) => (
  <p className="mdf-error"><AlertCircle size={14} /> {text}</p>
);

// Bottom sheet listing the members, with search; single choice or several
const MemberPicker: React.FC<{
  title: string;
  members: MemberModel[];
  multiple?: boolean;
  isSelected: (m: MemberModel) => boolean;
  onPick: (m: MemberModel) => void;
  /** A typed name that is not a member can be used as is */
  onPickName?: (name: string) => void;
  onClose: () => void;
}> = ({ title, members, multiple, isSelected, onPick, onPickName, onClose }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q ? members.filter(m => fullName(m).toLowerCase().includes(q)) : members;
  const count = members.filter(isSelected).length;
  const freeName = onPickName && q && !members.some(m => fullName(m).toLowerCase() === q) ? query.trim() : '';

  return (
    <MobileSheet
      title={title}
      onClose={onClose}
      footer={multiple && (
        <button type="button" className="mdf-sheet-done" onClick={onClose}>
          <Check size={18} /> تم{count > 0 && ` (${count})`}
        </button>
      )}
    >
      <div className="mdf-search-wrap">
        <label className="mdf-search">
          <Search size={17} />
          <input type="search" placeholder="ابحث بالاسم..." value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>

      <div className="mdf-list">
        {freeName && (
          <button type="button" className="mdf-row" onClick={() => onPickName!(freeName)}>
            <span className="mdf-member-icon"><UserPlus size={18} /></span>
            <span className="mdf-row-text">
              <strong>استخدام «{freeName}»</strong>
              <small>اسم من خارج قائمة الأعضاء</small>
            </span>
          </button>
        )}
        {list.length === 0 && !freeName && <p className="mdf-empty">لا توجد نتائج</p>}
        {list.map(m => {
          const selected = isSelected(m);
          return (
            <button
              key={m.id}
              type="button"
              className={`mdf-row ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onPick(m)}
            >
              <img src={photoOf(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
              <span className="mdf-row-text">
                <strong>{fullName(m)}</strong>
                {memberHint(m) && <small>{memberHint(m)}</small>}
              </span>
              <span className={`mdf-check ${multiple ? 'square' : ''}`}>{selected && <Check size={14} strokeWidth={3} />}</span>
            </button>
          );
        })}
      </div>
    </MobileSheet>
  );
};

/** Phone add / edit page of a disciplinary action (same fields as the desktop DisciplinaryDialog) */
export const MobileDisciplinaryForm: React.FC<MobileDisciplinaryFormProps> = ({
  item, members, isSubmitting, onSave, onClose,
}) => {
  const [form, setForm] = useState<Partial<DisciplinaryModel>>(() => item
    ? { ...item, incidentDate: dayOnly(item.incidentDate), deadlineOrHearingDate: dayOnly(item.deadlineOrHearingDate) }
    : {
      memberId: '',
      memberName: '',
      actionType: 'طلب توضيح',
      incidentDate: isoDay(),
      reason: '',
      status: 'مفتوح',
      incidentLocation: '',
      violatedRule: '',
      presentPeople: '',
      attachments: '',
      deadlineOrHearingDate: '',
      hearingLocation: '',
    });
  const [picker, setPicker] = useState<'member' | 'people' | 'officer' | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const memberRef = useRef<HTMLElement>(null);
  const incidentRef = useRef<HTMLElement>(null);

  const set = <K extends keyof DisciplinaryModel>(field: K, value: DisciplinaryModel[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const type = (form.actionType || 'طلب توضيح') as ActionType;
  // An old type (تنبيه، إنذار...) stays selectable when editing such an action
  const choices = TYPE_CHOICES.some(c => c.value === type)
    ? TYPE_CHOICES
    : [...TYPE_CHOICES, { value: type, icon: AlertTriangle, hint: 'نوع قديم، لم يعد متاحاً عند إضافة إجراء جديد.' }];
  const hasDeadline = type === 'طلب توضيح' || type === 'استدعاء جلسة';

  const member = members.find(m => String(m.id) === String(form.memberId));
  const people = splitPeople(form.presentPeople);
  const officer = members.find(m => fullName(m) === form.hearingOfficer);

  const errors = {
    member: !form.memberId,
    date: !form.incidentDate,
    reason: !form.reason?.trim(),
  };

  const togglePerson = (m: MemberModel) => {
    const name = fullName(m);
    const next = people.includes(name) ? people.filter(p => p !== name) : [...people, name];
    set('presentPeople', next.join(PEOPLE_SEPARATOR));
  };

  const submit = () => {
    if (errors.member || errors.date || errors.reason) {
      setShowErrors(true);
      // The member, a choice: a snackbar (the fields to type: their message under them)
      if (errors.member) showSnackbar('خطأ', 'اختر العضو المعني', '#ef4444');
      (errors.member ? memberRef : incidentRef).current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    // Dates and places of another type are dropped when the type was changed here
    const typeChanged = !item || item.actionType !== type;
    onSave({
      ...form,
      reason: form.reason?.trim(),
      presentPeople: people.join(PEOPLE_SEPARATOR),
      ...(typeChanged && !hasDeadline ? { deadlineOrHearingDate: '' } : {}),
      ...(typeChanged && type !== 'استدعاء جلسة' ? { hearingLocation: '', hearingOfficer: '' } : {}),
    } as DisciplinaryModel);
  };

  const dateChips = (field: 'incidentDate' | 'deadlineOrHearingDate', chips: { label: string; days: number }[]) => (
    <div className="mdf-chips">
      {chips.map(c => {
        const value = isoDay(c.days);
        return (
          <button key={c.label} type="button" className={form[field] === value ? 'active' : ''} onClick={() => set(field, value)}>
            {c.label}
          </button>
        );
      })}
    </div>
  );


  return (
    <MobileScreen
      title={item ? 'تعديل الإجراء' : 'إجراء جديد'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 size={18} className="mdf-spin" /> : <Save size={18} />}
          {isSubmitting ? 'جاري الحفظ...' : item ? 'حفظ التعديلات' : 'تأكيد'}
        </button>
      )}
    >
      {/* Type */}
      <Step title="نوع الإجراء">
        <div className={`mdf-types ${choices.length > 3 ? 'four' : ''}`}>
          {choices.map(c => (
            <button
              key={c.value}
              type="button"
              className={`mdf-type ${c.value === type ? 'active' : ''}`}
              aria-pressed={c.value === type}
              onClick={() => set('actionType', c.value)}
            >
              <span className="mdf-type-icon"><c.icon size={20} /></span>
              {c.value}
            </button>
          ))}
        </div>
      </Step>

      {/* Member */}
      <Step title="العضو المعني" error={showErrors && errors.member} sectionRef={memberRef}>
        <button type="button" className={`mdf-member ${member ? '' : 'empty'}`} onClick={() => setPicker('member')}>
          {member
            ? <img src={photoOf(member)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
            : <span className="mdf-member-icon"><UserPlus size={22} /></span>}
          <span className="mdf-member-text">
            <strong>{member ? fullName(member) : form.memberName || 'اختر العضو'}</strong>
            {member && memberHint(member) && <small>{memberHint(member)}</small>}
          </span>
          <ChevronLeft size={20} />
        </button>
      </Step>

      {/* Incident */}
      <Step title="تفاصيل الواقعة" error={showErrors && (errors.date || errors.reason)} sectionRef={incidentRef}>
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> تاريخ الحدث</span>
          <input
            className={`me-input ${showErrors && errors.date ? 'invalid' : ''}`}
            type="date"
            dir="ltr"
            value={form.incidentDate || ''}
            max={isoDay()}
            onChange={e => set('incidentDate', e.target.value)}
          />
        </label>
        <div className="mdf-date-row">
          {dateChips('incidentDate', [{ label: 'اليوم', days: 0 }, { label: 'أمس', days: -1 }])}
        </div>
        {showErrors && errors.date && <FieldError text="حدد تاريخ الحدث" />}

        <label className="me-field">
          <span className="me-label"><Clock size={14} /> ساعة الحدث</span>
          <input className="me-input" type="time" dir="ltr" value={form.incidentTime || ''} onChange={e => set('incidentTime', e.target.value)} />
        </label>

        <label className="me-field">
          <span className="me-label"><FileText size={14} /> وصف دقيق للواقعة</span>
          <textarea
            className={`me-textarea ${showErrors && errors.reason ? 'invalid' : ''}`}
            rows={4}
            value={form.reason || ''}
            onChange={e => set('reason', e.target.value)}
          />
        </label>
        {showErrors && errors.reason && <FieldError text="اكتب وصف الواقعة" />}

        <label className="me-field">
          <span className="me-label"><MapPin size={14} /> مكان الواقعة</span>
          <input className="me-input" type="text" value={form.incidentLocation || ''} onChange={e => set('incidentLocation', e.target.value)} />
        </label>

        <label className="me-field">
          <span className="me-label"><BookOpen size={14} /> المادة / القاعدة المخالفة</span>
          <input className="me-input" type="text" value={form.violatedRule || ''} onChange={e => set('violatedRule', e.target.value)} placeholder="مثال: المادة 4 من النظام الداخلي" />
        </label>
      </Step>

      {/* Deadline / hearing */}
      {hasDeadline && (
        <Step title={type === 'طلب توضيح' ? 'أجل الرد' : 'جلسة الاستماع'}>
          <label className="me-field">
            <span className="me-label"><Clock size={14} /> {type === 'طلب توضيح' ? 'آخر أجل للرد' : 'موعد الجلسة'}</span>
            <input
              className="me-input"
              type="date"
              dir="ltr"
              value={form.deadlineOrHearingDate || ''}
              onChange={e => set('deadlineOrHearingDate', e.target.value)}
            />
          </label>
          <div className="mdf-date-row">
            {dateChips('deadlineOrHearingDate', [{ label: 'بعد يومين', days: 2 }, { label: 'بعد 3 أيام', days: 3 }, { label: 'بعد أسبوع', days: 7 }])}
          </div>

          {type === 'استدعاء جلسة' && (
            <label className="me-field">
              <span className="me-label"><Clock size={14} /> ساعة الجلسة</span>
              <input className="me-input" type="time" dir="ltr" value={form.hearingTime || ''} onChange={e => set('hearingTime', e.target.value)} />
            </label>
          )}

          {type === 'استدعاء جلسة' && (
            <label className="me-field">
              <span className="me-label"><MapPin size={14} /> مكان الجلسة</span>
              <input className="me-input" type="text" value={form.hearingLocation || ''} onChange={e => set('hearingLocation', e.target.value)} />
            </label>
          )}

          {type === 'استدعاء جلسة' && (
            <div className="me-field">
              <span className="me-label"><UserRound size={14} /> مسؤول الجلسة</span>
              <button type="button" className={`mdf-member ${form.hearingOfficer ? '' : 'empty'}`} onClick={() => setPicker('officer')}>
                {officer
                  ? <img src={photoOf(officer)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                  : <span className="mdf-member-icon">{form.hearingOfficer ? <UserRound size={22} /> : <UserPlus size={22} />}</span>}
                <span className="mdf-member-text">
                  <strong>{form.hearingOfficer || 'اختر مسؤول الجلسة'}</strong>
                  {officer && memberHint(officer) && <small>{memberHint(officer)}</small>}
                </span>
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </Step>
      )}

      {/* People and attachments */}
      <Step title="الحاضرون والمرفقات">
        <div className="me-field">
          <span className="me-label"><Users size={14} /> الأشخاص الحاضرون وقت الواقعة</span>
          <div className="mdf-people">
            {people.map(name => {
              const m = members.find(x => fullName(x) === name);
              return (
                <span key={name} className="mdf-person">
                  {m
                    ? <img src={photoOf(m)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                    : <UserRound size={16} />}
                  {name}
                  <button
                    type="button"
                    aria-label={`إزالة ${name}`}
                    onClick={() => set('presentPeople', people.filter(p => p !== name).join(PEOPLE_SEPARATOR))}
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })}
            <button type="button" className="mdf-add-person" onClick={() => setPicker('people')}>
              <Plus size={15} /> {people.length ? 'إضافة' : 'اختر الحاضرين'}
            </button>
          </div>
        </div>

        <label className="me-field">
          <span className="me-label"><Paperclip size={14} /> المرفقات</span>
          <input className="me-input" type="text" dir="auto" value={form.attachments || ''} onChange={e => set('attachments', e.target.value)} />
        </label>
      </Step>

      {picker === 'member' && (
        <MemberPicker
          title="اختر العضو"
          members={members}
          isSelected={m => String(m.id) === String(form.memberId)}
          onPick={m => {
            setForm(prev => ({ ...prev, memberId: String(m.id), memberName: fullName(m) }));
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'officer' && (
        <MemberPicker
          title="مسؤول الجلسة"
          members={members}
          isSelected={m => fullName(m) === form.hearingOfficer}
          onPick={m => { set('hearingOfficer', fullName(m)); setPicker(null); }}
          onPickName={name => { set('hearingOfficer', name); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'people' && (
        <MemberPicker
          title="الحاضرون وقت الواقعة"
          members={members}
          multiple
          isSelected={m => people.includes(fullName(m))}
          onPick={togglePerson}
          onClose={() => setPicker(null)}
        />
      )}
    </MobileScreen>
  );
};
