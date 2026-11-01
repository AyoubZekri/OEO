import React, { useState } from 'react';
import {
  Save, Loader2, Check, Clock, X, Search, MapPin, Stethoscope, MessageSquarePlus, ListChecks, AlertTriangle, Filter as FilterIcon, ChevronDown,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSheet } from '../widgets/MobileSheet';
import { MobileSelect } from '../widgets/MobileSelect';
import { Applink } from '../../../LinkApi';
import { dayLabel } from './sessionUtils';
import { playersText } from '../MobileTeams/teamRoster';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileTakeAttendance.css';
import { StateIcon } from '../../widget/StateIcon';

type AttendanceStatus = 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر' | null;
type Status = NonNullable<AttendanceStatus>;

/** One row of the sheet: a player (training, match) or a member (meeting) */
export interface SheetPerson {
  id: number | string;
  name: string;
  status: AttendanceStatus;
  note: string;
  shirt_number?: string;
  photo?: string;
  /** Shown under the name when there is no shirt number (meetings) */
  role?: string;
  is_injured?: boolean;
  medical_note?: string;
}
type Filter = 'all' | 'none' | Status;

// Three choices on the phone. "غائب" is saved as the server's "غائب غير مبرر";
// an absence already saved as "غائب مبرر" shows as غائب and is kept as it is.
const STATUSES: { key: Status; label: string; icon: React.ComponentType<{ size?: number }>; tone: string }[] = [
  { key: 'حاضر', label: 'حاضر', icon: Check, tone: 'present' },
  { key: 'متأخر', label: 'متأخر', icon: Clock, tone: 'late' },
  { key: 'غائب غير مبرر', label: 'غائب', icon: X, tone: 'absent' },
];
const isAbsent = (status: AttendanceStatus) => status === 'غائب غير مبرر' || status === 'غائب مبرر';
// Status as one of the three choices
const choiceOf = (status: AttendanceStatus): Status | null => (isAbsent(status) ? 'غائب غير مبرر' : status);
const toneOf = (status: AttendanceStatus) => STATUSES.find(s => s.key === choiceOf(status))?.tone || 'none';

const photoUrl = (photo?: string) => {
  if (!photo || photo.includes('default')) return null;
  if (photo.startsWith('http')) return photo;
  return `${Applink.image}/${photo.replace(/^\//, '')}`;
};

/** What the training and match attendance controllers both provide */
export interface AttendanceSheet {
  attendanceList: SheetPerson[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  stats: { present: number; late: number; excused: number; absent: number };
  // Method syntax: each controller takes its own id type (number or string)
  handleStatusChange(id: SheetPerson['id'], status: AttendanceStatus): void;
  handleNoteChange(id: SheetPerson['id'], note: string): void;
  handleSave(): void;
  handleBack(): void;
  markAll(status: AttendanceStatus): void;
}

export interface AttendanceInfo {
  /** Category (training, match) or topic (meeting) */
  title?: string;
  /** Date (and possibly time) of the session or match */
  date?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
}

interface MobileTakeAttendanceProps {
  c: AttendanceSheet;
  info: AttendanceInfo | null;
  /** "حصة تدريبية" or "مباراة", shown when the category is unknown and in the loading text */
  subject?: string;
}

// Phone attendance sheet, shared by training sessions and matches
export const MobileTakeAttendance: React.FC<MobileTakeAttendanceProps> = ({ c, info, subject = 'حصة تدريبية' }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [notesOpen, setNotesOpen] = useState<Set<SheetPerson['id']>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [warn, setWarn] = useState(false);

  const list = c.attendanceList;
  const recorded = list.filter(p => p.status).length;
  const missing = list.length - recorded;

  const q = search.trim().toLowerCase();
  const visible = list.filter(p =>
    (filter === 'all' || (filter === 'none' ? !p.status : choiceOf(p.status) === filter))
    && (!q || p.name.toLowerCase().includes(q) || (p.shirt_number || '').includes(q)));

  // The status filter's choices: all, not recorded yet, then each status
  const filterOptions: { key: Filter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'none', label: 'لم يُسجل' },
    ...STATUSES.map(s => ({ key: s.key as Filter, label: s.label })),
  ];
  const counts: Partial<Record<Filter, number>> = {
    all: list.length,
    none: missing,
    'حاضر': c.stats.present,
    'متأخر': c.stats.late,
    'غائب غير مبرر': c.stats.excused + c.stats.absent,
  };

  // Tapping غائب on a player already absent keeps the saved kind of absence
  const setStatus = (p: SheetPerson, status: Status) => {
    if (status === 'غائب غير مبرر' && isAbsent(p.status)) return;
    c.handleStatusChange(p.id, status);
  };

  const toggleNote = (id: SheetPerson['id']) => setNotesOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const save = () => {
    if (missing > 0) {
      setWarn(true);
      setFilter('none');
      return;
    }
    c.handleSave();
  };

  const markMissing = (status: Status) => {
    list.filter(p => !p.status).forEach(p => c.handleStatusChange(p.id, status));
    setBulkOpen(false);
  };

  if (c.isLoading || c.error) {
    return (
      <MobileScreen title="تسجيل الحضور" onBack={c.handleBack}>
        {c.isLoading ? <MobileLoader text={`جاري تحميل بيانات ${subject === 'مباراة' ? 'المباراة' : subject === 'اجتماع' ? 'الاجتماع' : 'الحصة'}...`} /> : (
          <div className="mta-error">
            <AlertTriangle size={40} />
            <p>{c.error}</p>
          </div>
        )}
      </MobileScreen>
    );
  }

  return (
    <MobileScreen
      title="تسجيل الحضور"
      onBack={c.handleBack}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={c.isSaving}>
          {c.isSaving ? <Loader2 size={18} className="mta-spin" /> : <Save size={18} />}
          {c.isSaving ? 'جاري الحفظ...' : `حفظ الكشف (${recorded}/${list.length})`}
        </button>
      )}
    >
      {/* The session (or match, meeting): what, when and where */}
      <section className="mta-hero">
        <div className="mta-hero-top">
          <div className="mta-hero-text">
            <strong>{info?.title || subject}</strong>
            {info && (
              <>
                <span>
                  {dayLabel((info.date || '').split(/[T ]/)[0])}
                  {info.start_time && <> · <bdi dir="ltr">{info.start_time.slice(0, 5)}{info.end_time ? ` – ${info.end_time.slice(0, 5)}` : ''}</bdi></>}
                </span>
                {info.location && <span><MapPin size={12} /> {info.location}</span>}
              </>
            )}
          </div>
        </div>
      </section>

      {warn && missing > 0 && (
        <p className="mta-warn"><AlertTriangle size={16} /> حدد حالة {playersText(missing)} قبل الحفظ</p>
      )}

      {/* The search, the status filter (a sheet from the bottom, like the other pages) and the marking of all */}
      <div className="mta-toolbar">
        <label className="mta-search">
          <Search size={17} />
          <input type="search" placeholder="ابحث بالاسم" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <MobileSelect
          label="الحالة"
          icon={FilterIcon}
          value={filter}
          options={filterOptions.map(o => ({ value: o.key, label: o.label, hint: String(counts[o.key] ?? 0) }))}
          onChange={v => setFilter(v as Filter)}
          renderTrigger={open => (
            <button type="button" className={`mta-filter ${filter !== 'all' ? 'active' : ''}`} onClick={open}>
              <FilterIcon size={15} />
              <span><small>الحالة</small><strong>{filterOptions.find(o => o.key === filter)?.label}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
        <button type="button" className="mta-bulk" onClick={() => setBulkOpen(true)} aria-label="تحديد الكل">
          <ListChecks size={20} />
        </button>
      </div>

      {visible.length === 0 ? (
        <StateIcon />
      ) : (
        <div className="mta-list">
          {visible.map((p, idx) => {
            const photo = photoUrl(p.photo);
            const noteShown = notesOpen.has(p.id) || !!p.note || p.is_injured;
            return (
              <article key={p.id} className={`mta-player tone-${toneOf(p.status)} ${p.is_injured ? 'injured' : ''}`}>
                <div className="mta-player-top">
                  <span className="mta-avatar">
                    {photo ? <img src={photo} alt="" /> : <span>{p.shirt_number || idx + 1}</span>}
                  </span>
                  <span className="mta-player-text">
                    <strong>{p.name}</strong>
                    <small>
                      {/* The shirt number once: here only when the photo takes its place */}
                      {p.shirt_number && photo && <b>#{p.shirt_number}</b>}
                      {p.is_injured && <em><Stethoscope size={12} /> مصاب</em>}
                      {(!p.shirt_number || !photo) && !p.is_injured && p.role}
                    </small>
                  </span>
                  {!p.is_injured && (
                    <button
                      type="button"
                      className={`mta-note-btn ${noteShown ? 'on' : ''}`}
                      onClick={() => toggleNote(p.id)}
                      aria-label="ملاحظة"
                    >
                      <MessageSquarePlus size={18} />
                    </button>
                  )}
                </div>

                <div className="mta-choices" role="radiogroup" aria-label={`حالة ${p.name}`}>
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      role="radio"
                      aria-checked={choiceOf(p.status) === s.key}
                      className={`tone-${s.tone} ${choiceOf(p.status) === s.key ? 'active' : ''}`}
                      onClick={() => setStatus(p, s.key)}
                    >
                      <s.icon size={16} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                {noteShown && (
                  <input
                    className="mta-note"
                    type="text"
                    placeholder={p.is_injured ? 'ملاحظة الطبيب' : 'ملاحظة (اختياري)...'}
                    value={p.is_injured ? p.medical_note || 'مصاب' : p.note || ''}
                    disabled={p.is_injured}
                    onChange={e => c.handleNoteChange(p.id, e.target.value)}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      {bulkOpen && (
        <MobileSheet title="تحديد جماعي" onClose={() => setBulkOpen(false)}>
          {missing > 0 && (
            <>
              <h4 className="mta-sheet-title">اللاعبون غير المسجلين فقط ({missing})</h4>
              <div className="mta-sheet-grid">
                {STATUSES.map(s => (
                  <button key={s.key} type="button" className={`tone-${s.tone}`} onClick={() => markMissing(s.key)}>
                    <s.icon size={18} /> {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <h4 className="mta-sheet-title">جميع اللاعبين ({list.length})</h4>
          <div className="mta-sheet-grid">
            {STATUSES.map(s => (
              <button key={s.key} type="button" className={`tone-${s.tone}`} onClick={() => { c.markAll(s.key); setBulkOpen(false); }}>
                <s.icon size={18} /> الكل {s.label}
              </button>
            ))}
          </div>
        </MobileSheet>
      )}
    </MobileScreen>
  );
};
