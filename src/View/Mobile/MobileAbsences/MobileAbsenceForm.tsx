import React, { useState } from 'react';
import { Save, Loader2, User, UserRound, ChevronDown, Calendar, Clock, Search, Check, AlertCircle, Briefcase, Users } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { membersText } from '../MobileTeams/teamRoster';
import { ABSENCE_TYPES, EVENT_CATEGORIES, memberName, memberTeam, initials } from '../../Screen/Absence/absenceUtils';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- members and meetings come untyped from the API */

type Mode = 'record' | 'late' | 'request' | 'leave';

interface MobileAbsenceFormProps {
  members: any[];
  meetings: any[];
  defaultPlayerId?: number | null;
  multi: boolean;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

// Phone version of the add-absence dialog: same fields and the same data sent
export const MobileAbsenceForm: React.FC<MobileAbsenceFormProps> = ({ members, meetings, defaultPlayerId, multi, onSubmit, onClose }) => {
  // Same people as the desktop dialog: players, or everybody when no player is found
  const allPlayers = members.filter(m => m.type === 'لاعب' || m.type === 'player' || !m.type);
  const people = allPlayers.length > 0 ? allPlayers : members;

  const [mode, setMode] = useState<Mode>('record');
  const [ids, setIds] = useState<string[]>(defaultPlayerId ? [String(defaultPlayerId)] : []);
  const [category, setCategory] = useState('تدريب');
  const [customCategory, setCustomCategory] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const modes = ABSENCE_TYPES.filter(t => !(multi && t.mode === 'request'));
  const current = ABSENCE_TYPES.find(t => t.mode === mode) || ABSENCE_TYPES[0];
  const chosen = people.find(p => String(p.id) === ids[0]);
  const q = query.trim().toLowerCase();
  const visible = people.filter(p => !q || memberName(p).toLowerCase().includes(q));

  const toggle = (id: string) => setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const save = async () => {
    if (ids.length === 0) {
      setError(multi ? 'اختر الأعضاء' : 'اختر العضو');
      return;
    }
    if (!date) {
      setError('اختر التاريخ');
      return;
    }
    if (category === 'أخرى' && !customCategory.trim()) {
      setError('حدد نوع الفعالية');
      return;
    }
    setError('');
    setSaving(true);
    try {
      // Same fields as AddAbsenceDialog
      await onSubmit({
        player_ids: ids,
        absence_type: current.value,
        event_category: category === 'أخرى' && customCategory.trim() !== '' ? customCategory : category,
        event_date: date,
        duration,
        reason: '',
        record_source: 'يدوي',
        meeting_id: meetingId,
        mode,
        member_reasons: {},
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'request' ? 'طلب عطلة' : mode === 'late' ? 'تسجيل تأخر' : mode === 'leave' ? 'تسجيل مغادرة' : multi ? 'غياب جماعي' : 'تسجيل غياب';

  return (
    <MobileScreen
      title={title}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mab-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : multi && ids.length > 1 ? `حفظ (${membersText(ids.length)})` : 'حفظ'}
        </button>
      )}
    >
      {error && <p className="mab-banner"><AlertCircle size={16} /> {error}</p>}

      <section className="me-card">
        <div className={`mab-modes n${modes.length}`}>
          {modes.map(m => (
            <button key={m.mode} type="button" className={`tone-${m.tone} ${mode === m.mode ? 'on' : ''}`} onClick={() => setMode(m.mode)}>
              <span><m.icon size={19} /></span>
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span>{multi ? <Users size={16} /> : <User size={16} />}</span>{multi ? 'الأعضاء' : 'العضو'}</h3>
        {multi ? (
          <>
            <label className="mab-search in-form">
              <Search size={16} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث..." />
            </label>
            <div className="mab-pick-bar">
              <span>{ids.length} محدد</span>
              <button type="button" onClick={() => setIds(visible.map(p => String(p.id)))}>تحديد الكل</button>
              {ids.length > 0 && <button type="button" onClick={() => setIds([])}>إلغاء التحديد</button>}
            </div>
            <div className="mab-checklist">
              {visible.map(p => {
                const on = ids.includes(String(p.id));
                return (
                  <button key={p.id} type="button" className={on ? 'on' : ''} onClick={() => toggle(String(p.id))}>
                    <span className="mab-avatar sm">{initials(memberName(p))}</span>
                    <span className="mab-card-text"><strong>{memberName(p)}</strong>{memberTeam(p) && <small>{memberTeam(p)}</small>}</span>
                    <span className="mab-check">{on && <Check size={13} strokeWidth={3} />}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <MobileSelect
            label="العضو"
            icon={User}
            value={ids[0] || ''}
            options={people.map(p => ({ value: String(p.id), label: memberName(p) }))}
            onChange={v => setIds([v])}
            searchable
            renderTrigger={open => (
              <button type="button" className={`mab-pick ${chosen ? 'has' : ''}`} onClick={open}>
                {chosen ? <span className="mab-avatar">{initials(memberName(chosen))}</span> : <span className="mab-pick-icon"><UserRound size={20} /></span>}
                <span className="mab-card-text">
                  <small>العضو</small>
                  <strong>{chosen ? memberName(chosen) : 'اختر العضو'}</strong>
                </span>
                <ChevronDown size={18} />
              </button>
            )}
          />
        )}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><Briefcase size={16} /></span>الفعالية</h3>
        <div className="mab-cats">
          {EVENT_CATEGORIES.map(cat => (
            <button key={cat.value} type="button" className={category === cat.value ? 'on' : ''} onClick={() => setCategory(cat.value)}>
              <cat.icon size={16} /> {cat.value}
            </button>
          ))}
        </div>
        {category === 'أخرى' && (
          <input className="me-input" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="أدخل نوع الفعالية" />
        )}
        {category === 'اجتماع' && meetings.length > 0 && (
          <MobileSelect
            label="الاجتماع"
            icon={Briefcase}
            value={meetingId}
            options={[{ value: '', label: 'بدون تحديد' }, ...meetings.map((m: any) => ({ value: String(m.id), label: m.topic, hint: m.date }))]}
            onChange={setMeetingId}
            searchable
            renderTrigger={open => (
              <button type="button" className="mab-select" onClick={open}>
                <span><small>الاجتماع (اختياري)</small><strong>{meetings.find((m: any) => String(m.id) === meetingId)?.topic || 'بدون تحديد'}</strong></span>
                <ChevronDown size={17} />
              </button>
            )}
          />
        )}
      </section>

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> التاريخ</span>
          <input className="me-input" type="date" dir="ltr" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div className="mab-dates">
          {([['اليوم', 0], ['أمس', -1]] as const).map(([l, d]) => (
            <button key={l} type="button" className={date === isoDay(d) ? 'on' : ''} onClick={() => setDate(isoDay(d))}>{l}</button>
          ))}
        </div>
        {(mode === 'request' || mode === 'late') && (
          <label className="me-field">
            <span className="me-label"><Clock size={14} /> {mode === 'late' ? 'مدة التأخر (اختياري)' : 'المدة (اختياري)'}</span>
            <input className="me-input" value={duration} onChange={e => setDuration(e.target.value)} placeholder={mode === 'late' ? 'مثال: 15 دقيقة' : 'مثال: يومان'} />
          </label>
        )}
      </section>
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
