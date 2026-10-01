import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, MapPin, Bus, Users, Clock, FileText, Trophy, UserRound, Info, Shirt, Briefcase, Layers } from 'lucide-react';
import { TaskPanel } from '../../Tasks/parts/TaskPanel';
import { AppSelect, UserPicker } from '../../Tasks/parts/FormBits';
import { dateText, toApiDate, toInputDate } from '../../Tasks/taskUtils';
import type { TravelsController } from '../useTravelsController';
import { SCHEDULE, type Travel, type TravelMatch } from '../travelUtils';
import { MemberMultiPicker } from './MemberMultiPicker';

/** A numbered block of the form (1 → 5), so the order to fill it is clear */
const Section: React.FC<{ step: number; icon: typeof Clock; title: string; hint?: string; children: React.ReactNode }> = ({ step, icon: Icon, title, hint, children }) => (
  <section className="tk-sec tv-sec">
    <header>
      <span className="tv-step" aria-hidden="true">{step}</span>
      <div><h4><Icon size={15} />{title}</h4>{hint && <small>{hint}</small>}</div>
    </header>
    <div className="tk-sec-body">{children}</div>
  </section>
);

/** "2026-10-04 16:00" → "2026-10-04T08:00" (same day, another hour) */
const dayAt = (at: string | null, hour: string) => (at ? `${at.slice(0, 10)}T${hour}` : '');

type Schedule = Record<string, string>;

/**
 * Add or edit a trip: linked to an upcoming match or not, destination and reason (typed), the trip itself,
 * the category with its chosen players and the accompanying staff, the day's schedule and notes.
 */
export const TravelForm: React.FC<{ c: TravelsController; travel: Travel | null; mobile: boolean }> = ({ c, travel, mobile }) => {
  const [linked, setLinked] = useState(Boolean(travel?.match_id));
  const [matchId, setMatchId] = useState(travel?.match_id ? String(travel.match_id) : '');
  const [destination, setDestination] = useState(travel?.destination || '');
  const [reason, setReason] = useState(travel?.travel_reason || '');
  const [departureLocation, setDepartureLocation] = useState(travel?.departure_location || 'مقر النادي');
  const [departureTime, setDepartureTime] = useState(toInputDate(travel?.departure_time));
  const [returnTime, setReturnTime] = useState(toInputDate(travel?.return_time));
  const [transport, setTransport] = useState(travel?.transport_method || '');
  const [accommodation, setAccommodation] = useState(travel?.accommodation_place || '');
  const [headId, setHeadId] = useState(travel?.head_of_delegation_id ? String(travel.head_of_delegation_id) : '');
  const [teamId, setTeamId] = useState(travel?.team_id ? String(travel.team_id) : '');
  const [playerIds, setPlayerIds] = useState<number[]>(travel?.player_ids || []);
  const [staffIds, setStaffIds] = useState<number[]>(travel?.staff_ids || []);
  const [notes, setNotes] = useState(travel?.special_notes || '');
  const [schedule, setSchedule] = useState<Schedule>(() =>
    Object.fromEntries(SCHEDULE.map(s => [s.key, (travel?.[s.key] as string | null) || ''])));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Upcoming matches; a past match already linked to this trip stays selectable
  const matches: TravelMatch[] = travel?.match && !c.options.matches.some(m => m.id === travel.match!.id)
    ? [travel.match, ...c.options.matches]
    : c.options.matches;
  const players = c.options.members.filter(m => m.type === 'player' && (!teamId || String(m.team_id ?? '') === teamId));
  // Head of delegation and staff: members who are not players
  const staff = c.options.members.filter(m => m.type !== 'player');

  /** Picking a match fills what is still empty: category, destination, departure / return day and the match time */
  const pickMatch = (id: string) => {
    setMatchId(id);
    const m = matches.find(x => String(x.id) === id);
    if (!m) return;
    if (!teamId && m.team_id) changeTeam(String(m.team_id));
    if (!destination.trim() && m.place) setDestination(m.place);
    if (!reason.trim()) setReason(m.title);
    if (!departureTime && m.at) setDepartureTime(dayAt(m.at, '08:00'));
    if (!returnTime && m.at) setReturnTime(dayAt(m.at, '23:00'));
    if (!schedule.schedule_match && m.at) setSchedule(s => ({ ...s, schedule_match: m.at!.slice(11, 16) }));
  };

  /** Another category: keep only the chosen players who belong to it */
  const changeTeam = (id: string) => {
    setTeamId(id);
    if (id) {
      const inTeam = new Set(c.options.members.filter(m => String(m.team_id ?? '') === id).map(m => m.id));
      setPlayerIds(ids => ids.filter(x => inTeam.has(x)));
    }
  };

  const save = async () => {
    if (linked && !matchId) return setError('اختر المباراة، أو اختر «غير مرتبط بمباراة»');
    if (!destination.trim()) return setError('اكتب وجهة التنقل');
    if (!departureTime) return setError('حدد موعد الانطلاق');
    if (returnTime && returnTime < departureTime) return setError('موعد العودة يجب أن يكون بعد موعد الانطلاق');
    setError('');
    setSaving(true);
    try {
      await c.save({
        ...(travel ? { id: travel.id } : {}),
        match_id: linked && matchId ? Number(matchId) : null,
        team_id: teamId ? Number(teamId) : null,
        player_ids: playerIds,
        staff_ids: staffIds,
        destination: destination.trim(),
        travel_reason: reason.trim() || null,
        departure_location: departureLocation.trim() || null,
        departure_time: toApiDate(departureTime),
        return_time: returnTime ? toApiDate(returnTime) : null,
        transport_method: transport.trim() || null,
        accommodation_place: accommodation.trim() || null,
        head_of_delegation_id: headId ? Number(headId) : null,
        special_notes: notes.trim() || null,
        ...Object.fromEntries(SCHEDULE.map(s => [s.key, schedule[s.key as string] || null])),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskPanel
      mobile={mobile}
      layer={2}
      icon={MapPin}
      title={travel ? 'تعديل التنقل' : 'تنقل جديد'}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {travel ? 'حفظ التعديلات' : 'إضافة التنقل'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <Section step={1} icon={MapPin} title="الوجهة" hint="إلى أين ولماذا">
          <div className="tk-field">
            <span className="tk-label"><Trophy size={14} />هل التنقل مرتبط بمباراة؟</span>
            <div className="tk-seg two">
              <button type="button" className={linked ? 'on' : ''} onClick={() => setLinked(true)}><Trophy size={15} />نعم، مباراة</button>
              <button type="button" className={!linked ? 'on' : ''} onClick={() => { setLinked(false); setMatchId(''); }}>لا، تنقل آخر</button>
            </div>
          </div>
          {linked && (
            <AppSelect
              mobile={mobile}
              label="المباراة"
              icon={Trophy}
              value={matchId}
              options={matches.map(m => ({ value: String(m.id), label: `${m.title} — ${dateText(m.at)}`, hint: m.team || undefined }))}
              onChange={pickMatch}
              placeholder={matches.length ? 'اختر من المباريات القادمة' : 'لا توجد مباريات قادمة'}
            />
          )}
          <label className="tk-field">
            <span className="tk-label">الوجهة</span>
            <input className="tk-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="مثال: الجزائر العاصمة - ملعب 5 جويلية" />
          </label>
          <label className="tk-field">
            <span className="tk-label">سبب التنقل</span>
            <input className="tk-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: مباراة البطولة، تربص تحضيري..." />
          </label>
        </Section>

        <Section step={2} icon={Bus} title="التنقل" hint="الانطلاق والعودة والإقامة">
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">مكان الانطلاق</span>
              <input className="tk-input" value={departureLocation} onChange={e => setDepartureLocation(e.target.value)} />
            </label>
            <label className="tk-field">
              <span className="tk-label">وسيلة النقل</span>
              <input className="tk-input" value={transport} onChange={e => setTransport(e.target.value)} placeholder="مثال: حافلة النادي" />
            </label>
          </div>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">موعد الانطلاق</span>
              <input className="tk-input" type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
            </label>
            <label className="tk-field">
              <span className="tk-label">موعد العودة <em>اختياري</em></span>
              <input className="tk-input" type="datetime-local" value={returnTime} onChange={e => setReturnTime(e.target.value)} />
            </label>
          </div>
          <label className="tk-field">
            <span className="tk-label">الإقامة <em>اختياري</em></span>
            <input className="tk-input" value={accommodation} onChange={e => setAccommodation(e.target.value)} placeholder="مثال: فندق ..." />
          </label>
        </Section>

        <Section step={3} icon={Users} title="الوفد" hint="رئيس الوفد، الفئة واللاعبون، والطاقم المرافق">
          <div className="tk-grid-2">
            <UserPicker mobile={mobile} label="رئيس الوفد" icon={UserRound} value={headId} users={staff} onChange={setHeadId} placeholder="اختر عضواً" />
            <AppSelect
              mobile={mobile}
              label="الفئة"
              icon={Layers}
              value={teamId}
              options={[{ value: '', label: 'كل الفئات' }, ...c.options.teams.map(t => ({ value: String(t.id), label: t.name }))]}
              onChange={changeTeam}
              placeholder="اختر الفئة"
            />
          </div>
          <MemberMultiPicker
            label={teamId ? `لاعبو ${c.options.teams.find(t => String(t.id) === teamId)?.name || 'الفئة'}` : 'اللاعبون'}
            icon={Shirt}
            people={players}
            value={playerIds}
            onChange={setPlayerIds}
            empty={teamId ? 'لا يوجد لاعبون في هذه الفئة' : 'لا يوجد لاعبون'}
          />
          <MemberMultiPicker label="الطاقم المرافق" icon={Briefcase} people={staff} value={staffIds} onChange={setStaffIds} empty="لا يوجد أعضاء في الطاقم" showType />
        </Section>

        <Section step={4} icon={Clock} title="البرنامج الزمني" hint="أوقات يوم التنقل، املأ ما تعرفه">
          <div className="tk-grid-3">
            {SCHEDULE.map(s => (
              <label key={s.key} className="tk-field">
                <span className="tk-label">{s.label}</span>
                <input className="tk-input" type="time" value={schedule[s.key as string]} onChange={e => setSchedule(x => ({ ...x, [s.key]: e.target.value }))} />
              </label>
            ))}
          </div>
          {linked && matchId && <small className="tk-hint"><Info size={12} />وقت المباراة يُملأ من المباراة المختارة إذا كان فارغاً</small>}
        </Section>

        <Section step={5} icon={FileText} title="ملاحظات خاصة">
          <textarea className="tk-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="تعليمات للوفد، وثائق مطلوبة..." />
        </Section>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </TaskPanel>
  );
};
