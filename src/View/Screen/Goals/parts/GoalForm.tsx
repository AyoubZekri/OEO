import React, { useLayoutEffect, useRef, useState } from 'react';
import { Save, Loader2, AlertCircle, Target, UserRound, CalendarRange, ChevronRight, ChevronLeft } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { UserPicker } from '../../../shared/FormBits';
import { seasonLabel } from '../../../Mobile/MobileContracts/contractUtils';
import type { GoalsController } from '../useGoals';
import type { Goal } from '../goalUtils';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/** «2026 - 2027», one season back or forward */
const shiftSeason = (season: string, step: number) => {
  const y = Number(season.slice(0, 4)) + step;
  return `${y} - ${y + 1}`;
};

/** The same name once only (a person may have more than one account): the picker lists each name a single time */
const oncePerName = <T extends { id: number; name: string }>(users: T[], keep: string) => {
  const seen = new Set<string>();
  return users.filter(u => {
    const name = u.name.replace(/\s+/g, ' ').trim();
    // The user already chosen (editing) stays, whatever its name
    if (String(u.id) === keep) { seen.add(name); return true; }
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

/**
 * Add or edit a goal: the user responsible for it (each name once), the season (‹ 2026 - 2027 ›) and the goal, its
 * field small at first and growing with its text.
 */
export const GoalForm: React.FC<{ c: GoalsController; goal: Goal | null; mobile: boolean }> = ({ c, goal, mobile }) => {
  const [text, setText] = useState(goal?.goal || '');
  const [user, setUser] = useState(goal?.user ? String(goal.user.id) : '');
  const [season, setSeason] = useState(goal?.season || seasonLabel());
  // The goal left empty: its message right under it (the user, a choice: a snackbar)
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  // The goal's field grows with its text
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [text]);

  const save = async () => {
    setMissing(!text.trim());
    if (!text.trim()) return;
    if (!user) return showSnackbar('خطأ', 'اختر المكلّف', '#ef4444');
    setSaving(true);
    try {
      await c.save({ ...(goal ? { id: goal.id } : {}), goal: text.trim(), user_id: Number(user), season });
    } catch (e) {
      showSnackbar('خطأ', (e as Error).message, '#ef4444');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      mobile={mobile}
      icon={Target}
      title={goal ? 'تعديل الهدف' : 'هدف جديد'}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {goal ? 'حفظ التعديلات' : 'تأكيد'}
          </button>
        </>
      )}
    >
      <div className={`tk-form calm ${mobile ? '' : 'gl-form'}`}>
        {/* The goal: a field that grows with what is written */}
        <label className={`tk-field gl-goal-field ${missing ? 'gl-missing' : ''}`}>
          <span className="tk-label"><Target size={14} />الهدف</span>
          <textarea
            ref={field}
            className="tk-input gl-goal-input"
            rows={1}
            value={text}
            onChange={e => { setText(e.target.value); setMissing(false); }}
            autoFocus={!mobile}
          />
          {missing && <small className="gl-field-error"><AlertCircle size={13} />اكتب الهدف</small>}
        </label>

        <UserPicker mobile={mobile} label="المكلّف" icon={UserRound} value={user} users={oncePerName(c.users, user)} placeholder="" onChange={setUser} />

        {/* The season: one step back or forward */}
        <div className="tk-field">
          <span className="tk-label"><CalendarRange size={14} />الموسم</span>
          <div className="gl-season-pick">
            <button type="button" onClick={() => setSeason(s => shiftSeason(s, -1))} aria-label="الموسم السابق"><ChevronRight size={18} /></button>
            <b dir="ltr">{season}</b>
            <button type="button" onClick={() => setSeason(s => shiftSeason(s, 1))} aria-label="الموسم التالي"><ChevronLeft size={18} /></button>
          </div>
        </div>

      </div>
    </SidePanel>
  );
};
