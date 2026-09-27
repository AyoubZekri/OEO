import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Save, Loader2, Trophy, Shield, Calendar, MapPin, Clock, Users, UserCog, Tag, ChevronDown, AlertCircle, Flag,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { Applink } from '../../../LinkApi';
import type { Match } from '../../Screen/Matches/match_model';
import { CLUB_LOGO, CLUB_NAME } from './matchActions';
import { dayText, timeText } from './matchUtils';
import { TeamBadge } from './TeamBadge';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileMatchForm.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- lists come untyped from the API */

interface MobileMatchFormProps {
  /** Match being edited; null when adding a new one */
  match: Match | null;
  onSave: () => void;
  onClose: () => void;
}

// Staff that can lead the team on match day (same list as the desktop dialog)
const STAFF_ROLES = ['مدرب', 'مساعد مدرب', 'مدرب حراس', 'موظف', 'إداري', 'طبيب'];

const idOf = (value: any) => (value?.id ? String(value.id) : value ? String(value) : '');
const listOf = (res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : []);

// Phone add / edit page of a match (same fields and payload as the desktop AddMatchDialog)
export const MobileMatchForm: React.FC<MobileMatchFormProps> = ({ match, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    competition: match?.competition || '',
    opponent: match?.opponent || '',
    match_title: match?.match_title || '',
    match_date: match?.match_date ? match.match_date.replace(' ', 'T').substring(0, 16) : '',
    location: match?.location || '',
    gathering_time: match?.gathering_time ? match.gathering_time.replace(' ', 'T').substring(0, 16) : '',
    gathering_location: match?.gathering_location || '',
    coach_id: idOf(match?.coach_id),
    admin_id: idOf(match?.admin_id),
    team_id: idOf((match as any)?.team_id) || idOf(match?.team),
    match_status: match?.match_status || 'upcoming',
    opponent_club_id: match?.opponent_club_id ? String(match.opponent_club_id) : '',
  }));
  const [clubs, setClubs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const get = (url: string) => axios.get(url, { headers }).catch(() => null);
    Promise.all([get(Applink.clubs), get(Applink.teams), get(Applink.individuals), get(Applink.users)])
      .then(([clubsRes, teamsRes, indRes, usersRes]) => {
        setClubs(listOf(clubsRes));
        setTeams(listOf(teamsRes));
        const people = listOf(indRes);
        const allowed = people.filter((p: any) => p.role?.name && STAFF_ROLES.includes(String(p.role.name).trim()));
        setStaff(allowed.length ? allowed : people);
        setUsers(listOf(usersRes));
      });
  }, []);

  const set = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const club = clubs.find(c => String(c.id) === form.opponent_club_id);
  const opponentLogo = club?.logo || match?.opponentClub?.logo || match?.opponent_club?.logo || '';
  const date = form.match_date ? new Date(form.match_date) : null;

  const errors = {
    opponent: !form.opponent_club_id && !form.opponent ? 'اختر الفريق الخصم' : null,
    competition: !form.competition.trim() ? 'اكتب اسم المنافسة' : null,
    date: !form.match_date ? 'حدد تاريخ وتوقيت المباراة' : null,
    location: !form.location.trim() ? 'اكتب مكان المباراة' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async () => {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      const url = match ? Applink.updateMatch : Applink.createMatch;
      const payload = match ? { ...form, id: match.id } : form;
      const res = await axios.post(url, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء الحفظ\n${serverMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const err = (text: string | null) => showErrors && text ? <p className="mmf-error"><AlertCircle size={14} /> {text}</p> : null;

  // Searchable list, fine for any number of entries
  const picker = (
    label: string, icon: React.ComponentType<{ size?: number }>, field: 'team_id' | 'coach_id' | 'admin_id',
    options: { value: string; label: string; hint?: string }[], empty: string,
  ) => {
    const Icon = icon;
    const chosen = options.find(o => o.value === form[field]);
    return (
      <MobileSelect
        label={label}
        icon={icon}
        value={form[field]}
        options={options}
        onChange={v => set(field, v)}
        searchable
        renderTrigger={open => (
          <button type="button" className={`mmf-pick ${chosen ? 'has-value' : ''}`} onClick={open}>
            <span className="mmf-pick-icon"><Icon size={17} /></span>
            <span className="mmf-pick-text">
              <small>{label}</small>
              <strong>{chosen?.label || empty}</strong>
            </span>
            <ChevronDown size={18} />
          </button>
        )}
      />
    );
  };

  return (
    <MobileScreen
      title={match ? 'تعديل المباراة' : 'مباراة جديدة'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={submit} disabled={saving}>
          {saving ? <Loader2 size={18} className="mmf-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : match ? 'حفظ التعديلات' : 'إضافة المباراة'}
        </button>
      )}
    >
      {/* Live preview */}
      <section className="mmf-hero">
        <span className="mmf-comp"><Trophy size={13} /> {form.competition.trim() || 'المنافسة'}</span>
        <div className="mmf-board">
          <span className="mmf-team">
            <TeamBadge logo={CLUB_LOGO} short="OL" className="big" />
            <small>{CLUB_NAME}</small>
          </span>
          <span className="mmf-center">
            <strong dir="ltr">{date ? timeText(date) : '--:--'}</strong>
            <small>{date ? dayText(date) : 'بدون موعد'}</small>
          </span>
          <span className="mmf-team">
            {form.opponent
              ? <TeamBadge logo={opponentLogo} short={(form.match_title || form.opponent).slice(0, 4)} className="big" />
              : <span className="mmf-team-empty"><Shield size={24} /></span>}
            <small>{form.opponent || 'الخصم'}</small>
          </span>
        </div>
        {form.location.trim() && <span className="mmf-place"><MapPin size={13} /> {form.location.trim()}</span>}
      </section>

      {/* Opponent + competition */}
      <section className={`mmf-card ${showErrors && (errors.opponent || errors.competition) ? 'has-error' : ''}`}>
        <h3 className="mmf-title"><span>1</span> المواجهة</h3>
        <MobileSelect
          label="الفريق الخصم"
          icon={Shield}
          value={form.opponent_club_id}
          options={clubs.map(c => ({ value: String(c.id), label: c.name, hint: c.symbol || undefined }))}
          onChange={v => {
            const selected = clubs.find(c => String(c.id) === v);
            setForm(prev => ({ ...prev, opponent_club_id: v, opponent: selected?.name || '', match_title: selected?.symbol || '' }));
          }}
          searchable
          renderTrigger={open => (
            <button type="button" className={`mmf-opponent ${form.opponent ? 'has-value' : ''}`} onClick={open}>
              {form.opponent
                ? <TeamBadge logo={opponentLogo} short={(form.match_title || form.opponent).slice(0, 4)} />
                : <span className="mmf-pick-icon big"><Shield size={20} /></span>}
              <span className="mmf-pick-text">
                <small>الفريق الخصم</small>
                <strong>{form.opponent || 'اختر المنافس'}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
          )}
        />
        {err(errors.opponent)}

        <label className="me-field">
          <span className="me-label"><Trophy size={14} /> المنافسة</span>
          <input className="me-input" type="text" value={form.competition} onChange={e => set('competition', e.target.value)} placeholder="مثال: البطولة الجهوية" />
        </label>
        {err(errors.competition)}
      </section>

      {/* Date + place */}
      <section className={`mmf-card ${showErrors && (errors.date || errors.location) ? 'has-error' : ''}`}>
        <h3 className="mmf-title"><span>2</span> الموعد والملعب</h3>
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> تاريخ وتوقيت المباراة</span>
          <input className="me-input" type="datetime-local" dir="ltr" value={form.match_date} onChange={e => set('match_date', e.target.value)} />
        </label>
        {err(errors.date)}
        <label className="me-field">
          <span className="me-label"><MapPin size={14} /> المكان / الملعب</span>
          <input className="me-input" type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="مثال: ملعب 8 ماي" />
        </label>
        {err(errors.location)}
      </section>

      {/* Gathering */}
      <section className="mmf-card">
        <h3 className="mmf-title"><span>3</span> التجمع <em>اختياري</em></h3>
        <label className="me-field">
          <span className="me-label"><Clock size={14} /> موعد التجمع</span>
          <input className="me-input" type="datetime-local" dir="ltr" value={form.gathering_time} onChange={e => set('gathering_time', e.target.value)} />
        </label>
        <label className="me-field">
          <span className="me-label"><Flag size={14} /> مكان التجمع</span>
          <input className="me-input" type="text" value={form.gathering_location} onChange={e => set('gathering_location', e.target.value)} placeholder="مثال: مقر النادي" />
        </label>
      </section>

      {/* Category + staff */}
      <section className="mmf-card">
        <h3 className="mmf-title"><span>4</span> الفئة والطاقم</h3>
        {picker('الفئة / الفريق', Tag, 'team_id', teams.map(t => ({ value: String(t.id), label: t.name })), 'اختر الفئة')}
        {picker('المدرب / الإداري', Users, 'coach_id',
          staff.map(p => ({ value: String(p.id), label: `${p.first_name} ${p.last_name}`, hint: p.role?.name })), 'اختر المدرب')}
        {picker('المسؤول الإداري', UserCog, 'admin_id', users.map(u => ({ value: String(u.id), label: u.name })), 'اختر المسؤول')}
      </section>
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
