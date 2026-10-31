import React, { useState } from 'react';
import {
  Save, Loader2, Briefcase, Calendar, Clock, MapPin, ListChecks, Plus, X, Search, Check, AlertCircle, UserPlus,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSheet } from '../widgets/MobileSheet';
import type { useMeetingsController } from '../../Screen/Meetings/MeetingsController';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { pointText } from './meetingUtils';
import '../MobileEvaluations/MobileEvaluations.css';

// Phone add / edit page of a meeting; the fields live in the meetings controller (as on desktop)
export const MobileMeetingForm: React.FC<{ c: ReturnType<typeof useMeetingsController> }> = ({ c }) => {
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');

  const errors = {
    topic: !c.topic.trim() ? 'اكتب سبب الاجتماع' : null,
    date: !c.date ? 'حدد التاريخ' : null,
    time: !c.time ? 'حدد الوقت' : null,
    location: !c.location.trim() ? 'اكتب مكان الاجتماع' : null,
  };

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      // The controller saves, reloads and closes this page
      await c.handleSave({ preventDefault: () => {} } as React.FormEvent);
    } finally {
      setSaving(false);
    }
  };

  const err = (text: string | null) => (showErrors && text ? <p className="mmg-error"><AlertCircle size={14} /> {text}</p> : null);
  const missing = (text: string | null) => (showErrors && text ? 'is-missing' : '');

  const q = query.trim().toLowerCase();
  const members = q ? c.appMembers.filter(m => m.name.toLowerCase().includes(q)) : c.appMembers;
  const chosen = new Set(c.attendees.map(a => a.id));

  return (
    <MobileScreen
      title={c.editingId ? 'تعديل الاجتماع' : 'اجتماع جديد'}
      onBack={c.closeEditor}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mmg-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : c.editingId ? 'حفظ التعديلات' : 'تأكيد'}
        </button>
      )}
    >
      {/* Basics */}
      <section className={`mmg-form-card ${showErrors && (errors.topic || errors.date || errors.time || errors.location) ? 'has-error' : ''}`}>
        <h3 className="mmg-form-title">المعلومات الأساسية</h3>
        <label className="me-field">
          <span className="me-label"><Briefcase size={14} /> سبب الاجتماع</span>
          <input className={`me-input ${missing(errors.topic)}`} type="text" value={c.topic} onChange={e => c.setTopic(e.target.value)} />
        </label>
        {err(errors.topic)}
        <div className="mmg-two">
          <label className="me-field">
            <span className="me-label"><Calendar size={14} /> التاريخ</span>
            <input className={`me-input ${missing(errors.date)}`} type="date" dir="ltr" value={c.date} onChange={e => c.setDate(e.target.value)} />
          </label>
          <label className="me-field">
            <span className="me-label"><Clock size={14} /> الوقت</span>
            <input className={`me-input ${missing(errors.time)}`} type="time" dir="ltr" value={c.time} onChange={e => c.setTime(e.target.value)} />
          </label>
        </div>
        <div className="mmg-chips-row">
          {[['اليوم', 0], ['غداً', 1], ['بعد غد', 2]].map(([label, d]) => (
            <button key={label} type="button" className={c.date === isoDay(d as number) ? 'active' : ''} onClick={() => c.setDate(isoDay(d as number))}>{label}</button>
          ))}
        </div>
        {err(errors.date || errors.time)}
        <label className="me-field">
          <span className="me-label"><MapPin size={14} /> مكان الاجتماع</span>
          <input className={`me-input ${missing(errors.location)}`} type="text" value={c.location} onChange={e => c.setLocation(e.target.value)} />
        </label>
        {err(errors.location)}
      </section>

      {/* Agenda */}
      <section className="mmg-form-card">
        <h3 className="mmg-form-title">نقاط الاجتماع <em>{c.points.length}</em></h3>
        <div className="mmg-add-point">
          <input
            className="me-input"
            type="text"
            value={c.newPoint}
            onChange={e => c.setNewPoint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); c.handleAddPoint(); } }}
            placeholder="نقطة جديدة"
          />
          <button type="button" onClick={c.handleAddPoint} disabled={!c.newPoint.trim()} aria-label="إضافة النقطة"><Plus size={20} /></button>
        </div>
        {c.points.length ? (
          <ol className="mmg-points editable">
            {c.points.map((p, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <p>{pointText(p)}{typeof p !== 'string' && <small className="mmg-point-by">{p.author}</small>}</p>
                <button type="button" onClick={() => c.handleRemovePoint(i)} aria-label="حذف النقطة"><X size={15} /></button>
              </li>
            ))}
          </ol>
        ) : <p className="mmg-hint"><ListChecks size={14} /> لا توجد نقاط</p>}
      </section>

      {/* Invited members */}
      <section className="mmg-form-card">
        <h3 className="mmg-form-title">المدعوون <em>{c.attendees.length}</em></h3>
        <div className="mmg-invited">
          {c.attendees.map(a => (
            <span key={a.id} className="mmg-chip">
              <b>{a.name.charAt(0)}</b>
              {a.name}
              <button type="button" onClick={() => c.handleRemoveAttendee(a.id)} aria-label={`إزالة ${a.name}`}><X size={13} /></button>
            </span>
          ))}
          <button type="button" className="mmg-add-person" onClick={() => setPicker(true)}>
            <UserPlus size={15} /> {c.attendees.length ? 'إضافة' : 'اختر المدعوين'}
          </button>
        </div>
      </section>

      {picker && (
        <MobileSheet
          title="المدعوون للاجتماع"
          onClose={() => { setPicker(false); setQuery(''); }}
          footer={(
            <button type="button" className="mmg-sheet-done" onClick={() => { setPicker(false); setQuery(''); }}>
              <Check size={18} /> تم{chosen.size ? ` (${chosen.size})` : ''}
            </button>
          )}
        >
          <div className="mmg-sheet-search">
            <label className="mmg-search">
              <Search size={17} />
              <input type="search" placeholder="ابحث بالاسم" value={query} onChange={e => setQuery(e.target.value)} />
            </label>
          </div>
          <div className="mmg-member-list">
            {members.length === 0 && <p className="mmg-hint">لا توجد نتائج</p>}
            {members.map(m => {
              const on = chosen.has(m.id);
              return (
                <button key={m.id} type="button" className={`mmg-member ${on ? 'on' : ''}`} onClick={() => c.toggleEmployee(m.id, m.name)}>
                  <b>{m.name.charAt(0)}</b>
                  <span>
                    <strong>{m.name}</strong>
                    <small>{TYPE_LABELS[m.role] || m.role}</small>
                  </span>
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
