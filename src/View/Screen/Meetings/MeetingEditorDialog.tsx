import React, { useMemo, useState } from 'react';
import {
  X, Plus, Pencil, CalendarDays, MapPin, Type, ListChecks, Users, Search, Check, Trash2, Building2, UserRound, Save,
} from 'lucide-react';
import type { useMeetingsController } from './MeetingsController';
import { pointText } from '../../Mobile/MobileMeetings/meetingUtils';
import { isoDay } from '../../Mobile/MobileTrainingSessions/sessionUtils';
import { MEMBER_ROLES } from '../Absence/absenceUtils';
import './MeetingEditorDialog.css';

type Controller = ReturnType<typeof useMeetingsController>;

/** Groups of members for the filter (the member's type) */
const GROUPS: { key: string; label: string; match: (type: string) => boolean }[] = [
  { key: 'all', label: 'الكل', match: () => true },
  { key: 'players', label: 'اللاعبون', match: t => t === 'player' || t === 'لاعب' },
  { key: 'staff', label: 'الطاقم الفني', match: t => ['coach', 'assistant_coach', 'goalkeeper_coach', 'physical_trainer', 'doctor', 'equipment_manager'].includes(t) },
  { key: 'admin', label: 'الإدارة', match: t => ['employee', 'admin'].includes(t) },
];

const DAYS = [{ label: 'اليوم', offset: 0 }, { label: 'غداً', offset: 1 }, { label: 'بعد غد', offset: 2 }];

const roleLabel = (type: string) => MEMBER_ROLES[type] || type || 'عضو';

/**
 * Adding / editing a meeting: when and where, its points (a point sent by a member keeps who sent it),
 * and the invited members (search, group filter, select all).
 */
export const MeetingEditorDialog: React.FC<{ c: Controller }> = ({ c }) => {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const editing = Boolean(c.editingId);

  const q = query.trim().toLowerCase();
  const filter = GROUPS.find(g => g.key === group) || GROUPS[0];
  const visible = useMemo(
    () => c.appMembers.filter(m => filter.match(m.role) && (!q || m.name.toLowerCase().includes(q))),
    [c.appMembers, filter, q],
  );
  const selected = new Set(c.attendees.map(a => a.id));
  const allVisibleSelected = visible.length > 0 && visible.every(m => selected.has(m.id));

  const selectVisible = () => {
    const missing = visible.filter(m => !selected.has(m.id)).map(m => ({ id: m.id, name: m.name, status: 'pending' as const }));
    c.setAttendees([...c.attendees, ...missing]);
  };
  const clearVisible = () => {
    const ids = new Set(visible.map(m => m.id));
    c.setAttendees(c.attendees.filter(a => !ids.has(a.id)));
  };

  const ready = c.topic.trim() && c.date && c.time && c.location.trim();

  return (
    <div className="med-overlay" onClick={c.closeEditor}>
      <form className="med" onClick={e => e.stopPropagation()} onSubmit={c.handleSave} role="dialog" aria-modal="true" aria-label={editing ? 'تعديل الاجتماع' : 'إضافة اجتماع'}>
        <header className="med-head">
          <span className="med-head-icon">{editing ? <Pencil size={22} /> : <Plus size={22} />}</span>
          <div>
            <h2>{editing ? 'تعديل الاجتماع' : 'اجتماع جديد'}</h2>
            <p>{editing ? 'عدّل الموعد أو النقاط أو المدعوين' : 'حدد الموعد والمكان، ثم النقاط والمدعوين'}</p>
          </div>
          <button type="button" className="med-close" onClick={c.closeEditor} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="med-body">
          {/* When and where */}
          <section className="med-section">
            <h3><span className="i-blue"><CalendarDays size={17} /></span> الموعد والمكان</h3>

            <label className="med-field">
              <span>موضوع الاجتماع *</span>
              <div className="med-input"><Type size={17} /><input value={c.topic} onChange={e => c.setTopic(e.target.value)} placeholder="مثال: التحضير للموسم الجديد" required /></div>
            </label>

            <div className="med-row">
              <div className="med-field">
                <span>التاريخ *</span>
                <div className="med-input"><input type="date" dir="ltr" value={c.date} onChange={e => c.setDate(e.target.value)} required /></div>
                <div className="med-quick">
                  {DAYS.map(d => (
                    <button key={d.label} type="button" className={c.date === isoDay(d.offset) ? 'on' : ''} onClick={() => c.setDate(isoDay(d.offset))}>{d.label}</button>
                  ))}
                </div>
              </div>
              <label className="med-field">
                <span>الوقت *</span>
                <div className="med-input"><input type="time" dir="ltr" value={c.time} onChange={e => c.setTime(e.target.value)} required /></div>
              </label>
            </div>

            <label className="med-field">
              <span>المكان *</span>
              <div className="med-input"><MapPin size={17} /><input value={c.location} onChange={e => c.setLocation(e.target.value)} placeholder="مثال: مقر النادي، قاعة الاجتماعات" required /></div>
            </label>
          </section>

          {/* Points */}
          <section className="med-section">
            <h3><span className="i-violet"><ListChecks size={17} /></span> نقاط الاجتماع <em>{c.points.length}</em></h3>
            <div className="med-add">
              <input
                value={c.newPoint}
                onChange={e => c.setNewPoint(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); c.handleAddPoint(); } }}
                placeholder="اكتب نقطة للمناقشة ثم اضغط إضافة..."
              />
              <button type="button" onClick={c.handleAddPoint} disabled={!c.newPoint.trim()}><Plus size={16} /> إضافة</button>
            </div>
            {c.points.length ? (
              <ol className="med-points">
                {c.points.map((p, i) => (
                  <li key={i}>
                    <span className="num">{i + 1}</span>
                    <div>
                      <p>{pointText(p)}</p>
                      {typeof p === 'string'
                        ? <small className="org"><Building2 size={12} /> من الإدارة</small>
                        : <small><UserRound size={12} /> أرسلها {p.author}</small>}
                    </div>
                    <button type="button" onClick={() => c.handleRemovePoint(i)} aria-label="حذف النقطة" title="حذف النقطة"><Trash2 size={15} /></button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="med-empty">لا توجد نقاط بعد. يمكن للمدعوين أيضاً إرسال نقاطهم قبل بداية الاجتماع.</p>
            )}
          </section>

          {/* Invited */}
          <section className="med-section">
            <h3><span className="i-green"><Users size={17} /></span> المدعوون <em>{c.attendees.length}</em></h3>

            <div className="med-tools">
              <div className="med-input search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العضو..." /></div>
              <div className="med-groups">
                {GROUPS.map(g => (
                  <button key={g.key} type="button" className={group === g.key ? 'on' : ''} onClick={() => setGroup(g.key)}>{g.label}</button>
                ))}
              </div>
            </div>

            <div className="med-bulk">
              <span>{visible.length} عضو</span>
              {allVisibleSelected
                ? <button type="button" onClick={clearVisible}>إلغاء تحديد الظاهرين</button>
                : <button type="button" onClick={selectVisible} disabled={!visible.length}>تحديد الظاهرين</button>}
            </div>

            {visible.length ? (
              <div className="med-people">
                {visible.map(m => {
                  const on = selected.has(m.id);
                  return (
                    <button key={m.id} type="button" className={`med-person ${on ? 'on' : ''}`} onClick={() => c.toggleEmployee(m.id, m.name)} aria-pressed={on}>
                      <span className="av">{m.name.charAt(0)}{on && <i><Check size={10} strokeWidth={4} /></i>}</span>
                      <span className="txt"><strong>{m.name}</strong><small>{roleLabel(m.role)}</small></span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="med-empty">{c.appMembers.length ? 'لا يوجد أعضاء بهذا البحث' : 'جاري تحميل الأعضاء...'}</p>
            )}
          </section>
        </div>

        <footer className="med-foot">
          <span className="med-summary">
            <Users size={14} /> {c.attendees.length} مدعو
            <ListChecks size={14} /> {c.points.length} نقاط
          </span>
          <button type="button" className="med-btn" onClick={c.closeEditor}>إلغاء</button>
          <button type="submit" className="med-btn primary" disabled={!ready}><Save size={16} /> {editing ? 'حفظ التعديلات' : 'حفظ الاجتماع'}</button>
        </footer>
      </form>
    </div>
  );
};
