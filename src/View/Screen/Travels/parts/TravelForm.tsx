import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, MapPin, Bus, Users, Clock, FileText, Trophy, UserRound, Shirt, Briefcase, Layers } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { AppSelect, UserPicker } from '../../../shared/FormBits';
import { dateText, toApiDate, toInputDate } from '../../../shared/dates';
import type { TravelsController } from '../useTravelsController';
import { SCHEDULE, type Travel, type TravelMatch } from '../travelUtils';
import { MemberMultiPicker } from './MemberMultiPicker';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/** A block of the form: its title, then its fields */
const Section: React.FC<{ icon: typeof Clock; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="tk-sec tv-sec">
    <header>
      <div><h4><Icon size={15} />{title}</h4></div>
    </header>
    <div className="tk-sec-body">{children}</div>
  </section>
);

/** The message under a field left wrong */
const FieldError: React.FC<{ text?: string }> = ({ text }) => (text ? <small className="tk-field-error"><AlertCircle size={13} />{text}</small> : null);

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
  // The fields left wrong: a red edge and their message under them (the match, a choice: a snackbar)
  const [showErrors, setShowErrors] = useState(false);
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

  const errors = {
    destination: !destination.trim() ? 'اكتب وجهة التنقل' : undefined,
    departure: !departureTime ? 'حدد موعد الانطلاق' : undefined,
    return: returnTime && departureTime && returnTime < departureTime ? 'العودة تكون بعد الانطلاق' : undefined,
  };
  const err = (field: keyof typeof errors) => (showErrors ? errors[field] : undefined);
  const missing = (field: keyof typeof errors) => (err(field) ? 'is-missing' : '');

  const save = async () => {
    setShowErrors(true);
    if (linked && !matchId) return showSnackbar('خطأ', 'اختر المباراة', '#ef4444');
    if (Object.values(errors).some(Boolean)) return;
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
      showSnackbar('خطأ', (e as Error).message, '#ef4444');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
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
            {travel ? 'حفظ التعديلات' : 'تأكيد'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <Section icon={MapPin} title="الوجهة">
          <div className="tk-field">
            <div className="tk-seg two">
              <button type="button" className={linked ? 'on' : ''} onClick={() => setLinked(true)}><Trophy size={15} />مباراة</button>
              <button type="button" className={!linked ? 'on' : ''} onClick={() => { setLinked(false); setMatchId(''); }}>تنقل آخر</button>
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
              placeholder=""
            />
          )}
          <label className="tk-field">
            <span className="tk-label">الوجهة</span>
            <input className={`tk-input ${missing('destination')}`} value={destination} onChange={e => setDestination(e.target.value)} />
            <FieldError text={err('destination')} />
          </label>
          <label className="tk-field">
            <span className="tk-label">سبب التنقل</span>
            <input className="tk-input" value={reason} onChange={e => setReason(e.target.value)} />
          </label>
        </Section>

        <Section icon={Bus} title="التنقل">
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">مكان الانطلاق</span>
              <input className="tk-input" value={departureLocation} onChange={e => setDepartureLocation(e.target.value)} />
            </label>
            <label className="tk-field">
              <span className="tk-label">وسيلة النقل</span>
              <input className="tk-input" value={transport} onChange={e => setTransport(e.target.value)} />
            </label>
          </div>
          <div className="tk-grid-2">
            <label className="tk-field">
              <span className="tk-label">موعد الانطلاق</span>
              <input className={`tk-input ${missing('departure')}`} type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
              <FieldError text={err('departure')} />
            </label>
            <label className="tk-field">
              <span className="tk-label">موعد العودة</span>
              <input className={`tk-input ${missing('return')}`} type="datetime-local" value={returnTime} onChange={e => setReturnTime(e.target.value)} />
              <FieldError text={err('return')} />
            </label>
          </div>
          <label className="tk-field">
            <span className="tk-label">الإقامة</span>
            <input className="tk-input" value={accommodation} onChange={e => setAccommodation(e.target.value)} />
          </label>
        </Section>

        <Section icon={Users} title="الوفد">
          <div className="tk-grid-2">
            <UserPicker mobile={mobile} label="رئيس الوفد" icon={UserRound} value={headId} users={staff} onChange={setHeadId} placeholder="" />
            <AppSelect
              mobile={mobile}
              label="الفئة"
              icon={Layers}
              value={teamId}
              options={[{ value: '', label: 'كل الفئات' }, ...c.options.teams.map(t => ({ value: String(t.id), label: t.name }))]}
              onChange={changeTeam}
              placeholder=""
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

        <Section icon={Clock} title="البرنامج الزمني">
          <div className="tk-grid-3">
            {SCHEDULE.map(s => (
              <label key={s.key} className="tk-field">
                <span className="tk-label">{s.label}</span>
                <input className="tk-input" type="time" value={schedule[s.key as string]} onChange={e => setSchedule(x => ({ ...x, [s.key]: e.target.value }))} />
              </label>
            ))}
          </div>
        </Section>

        <Section icon={FileText} title="ملاحظات">
          <textarea className="tk-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </Section>

      </div>
    </SidePanel>
  );
};
