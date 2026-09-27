import React, { useState } from 'react';
import { Save, Loader2, Calendar, Clock, MapPin, Users, AlertCircle, Timer, ChevronDown, Search } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import { durationOf, durationText, isoDay, dayLabel } from './sessionUtils';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileSessionForm.css';

interface MobileSessionFormProps {
  /** Session being edited; null when adding a new one */
  session: TrainingSessionModel | null;
  teams: { id: string | number; name: string }[];
  /** Category chosen in the page filter, preselected for a new session */
  defaultTeamId: string;
  onSave: (session: TrainingSessionModel) => Promise<void>;
  onClose: () => void;
}

const DURATIONS = [60, 90, 120];

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const shortTime = (time?: string) => (time || '').slice(0, 5);

// Phone add / edit page of a training session (same fields as the desktop TrainingSessionDialog)
export const MobileSessionForm: React.FC<MobileSessionFormProps> = ({
  session, teams, defaultTeamId, onSave, onClose,
}) => {
  const [teamId, setTeamId] = useState(session?.team_id ? String(session.team_id) : defaultTeamId);
  const [date, setDate] = useState(session ? (session.date || '').split('T')[0] : isoDay());
  const [start, setStart] = useState(shortTime(session?.start));
  const [end, setEnd] = useState(shortTime(session?.end));
  const [location, setLocation] = useState(session?.location || '');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const minutes = durationOf(start, end);
  const team = teams.find(t => String(t.id) === teamId);
  const errors = {
    date: !date ? 'حدد تاريخ الحصة' : null,
    time: !start || !end ? 'حدد وقت البداية والنهاية' : !minutes ? 'النهاية يجب أن تكون بعد البداية' : null,
    location: !location.trim() ? 'اكتب مكان التدريب' : null,
  };
  const [day, month] = date
    ? [Number(date.split('-')[2]), new Intl.DateTimeFormat('ar-DZ', { month: 'long' }).format(new Date(`${date}T00:00:00`))]
    : ['—', ''];

  const submit = async () => {
    if (errors.date || errors.time || errors.location) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      // The controller closes this page once the session is saved
      await onSave({
        id: session?.id,
        team_id: teamId,
        date,
        location: location.trim(),
        start,
        end,
        status: session?.status || 'مجدولة',
      });
    } finally {
      setSaving(false);
    }
  };

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} type="button" className={active ? 'active' : ''} onClick={onClick}>{label}</button>
  );

  return (
    <MobileScreen
      title={session ? 'تعديل الحصة' : 'حصة جديدة'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={submit} disabled={saving}>
          {saving ? <Loader2 size={18} className="msf-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : session ? 'حفظ التعديلات' : 'إضافة الحصة'}
        </button>
      )}
    >
      {/* Live preview */}
      <section className="msf-hero">
        <span className="msf-cal">
          <small>{month}</small>
          <strong>{day}</strong>
        </span>
        <span className="msf-hero-text">
          <small>{date ? dayLabel(date) : 'بدون تاريخ'}</small>
          <strong>{team?.name || 'اختر الفئة'}</strong>
          <span>
            <Clock size={13} /> <bdi dir="ltr">{start || '--:--'} – {end || '--:--'}</bdi>
            {minutes ? <em>{durationText(minutes)}</em> : null}
          </span>
          <span><MapPin size={13} /> {location.trim() || 'مكان التدريب'}</span>
        </span>
      </section>

      {/* Category: searchable list, fine for any number of categories */}
      <section className="msf-card">
        <h3 className="msf-title"><Users size={16} /> الفئة المعنية</h3>
        {teams.length ? (
          <MobileSelect
            label="اختر الفئة"
            icon={Users}
            value={teamId}
            options={teams.map(t => ({ value: String(t.id), label: t.name }))}
            onChange={setTeamId}
            searchable
            renderTrigger={open => (
              <button type="button" className={`msf-select ${team ? 'has-value' : ''}`} onClick={open}>
                <span className="msf-select-icon"><Users size={18} /></span>
                <span className="msf-select-text">
                  <strong>{team?.name || 'اختر الفئة'}</strong>
                  <small>{team ? 'اضغط للتغيير' : `${teams.length === 1 ? 'فئة واحدة' : teams.length === 2 ? 'فئتان' : `${teams.length} ${teams.length <= 10 ? 'فئات' : 'فئة'}`} · مع البحث`}</small>
                </span>
                {teams.length > 8 && <Search size={16} className="msf-select-search" />}
                <ChevronDown size={18} />
              </button>
            )}
          />
        ) : <p className="msf-help">لا توجد فئات، أضفها من صفحة فئات الفرق.</p>}
      </section>

      {/* Date */}
      <section className={`msf-card ${showErrors && errors.date ? 'has-error' : ''}`}>
        <h3 className="msf-title"><Calendar size={16} /> تاريخ الحصة</h3>
        <input className="me-input" type="date" dir="ltr" value={date} onChange={e => setDate(e.target.value)} />
        <div className="msf-chips">
          {chip('اليوم', date === isoDay(0), () => setDate(isoDay(0)))}
          {chip('غداً', date === isoDay(1), () => setDate(isoDay(1)))}
          {chip('بعد غد', date === isoDay(2), () => setDate(isoDay(2)))}
        </div>
        {showErrors && errors.date && <p className="msf-error"><AlertCircle size={14} /> {errors.date}</p>}
      </section>

      {/* Time */}
      <section className={`msf-card ${showErrors && errors.time ? 'has-error' : ''}`}>
        <h3 className="msf-title">
          <Clock size={16} /> التوقيت
          <em className={`msf-time-gap ${minutes ? 'ok' : ''}`}>{minutes ? durationText(minutes) : '—'}</em>
        </h3>
        {/* Start | end, each with the full half width so the time (also "05:00 PM") shows whole */}
        <div className="msf-times">
          <label className="msf-time">
            <span>البداية</span>
            <input
              type="time"
              dir="ltr"
              value={start}
              onChange={e => {
                const value = e.target.value;
                // Keep the same length when the start moves
                if (value && start && minutes) setEnd(addMinutes(value, minutes));
                setStart(value);
              }}
            />
          </label>
          <label className="msf-time">
            <span>النهاية</span>
            <input type="time" dir="ltr" value={end} onChange={e => setEnd(e.target.value)} />
          </label>
        </div>
        <div className="msf-duration">
          <span><Timer size={14} /> المدة</span>
          <div className="msf-chips">
            {DURATIONS.map(d => chip(durationText(d), minutes === d, () => {
              const from = start || '17:00';
              setStart(from);
              setEnd(addMinutes(from, d));
            }))}
          </div>
        </div>
        {!start && <p className="msf-help">اختيار مدة بدون بداية يجعل البداية 17:00.</p>}
        {showErrors && errors.time && <p className="msf-error"><AlertCircle size={14} /> {errors.time}</p>}
      </section>

      {/* Place */}
      <section className={`msf-card ${showErrors && errors.location ? 'has-error' : ''}`}>
        <h3 className="msf-title"><MapPin size={16} /> مكان التدريب</h3>
        <input className="me-input" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="مثال: الملعب الرئيسي" />
        {showErrors && errors.location && <p className="msf-error"><AlertCircle size={14} /> {errors.location}</p>}
      </section>
    </MobileScreen>
  );
};
