import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Save, Loader2, Activity, Stethoscope, ClipboardCheck, Flag, User, Calendar, MapPin, FileText, Lock, AlertCircle, ChevronDown, UserRound,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import { Applink } from '../../../LinkApi';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { type MedicalMode, personName, personPhoto, dayOnly } from './medicalUtils';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- people come untyped from the API */

interface MobileMedicalFormProps {
  /** Record being edited; null when adding a new injury */
  record: PlayerMedicalRecord | null;
  mode: MedicalMode;
  onSave: () => void;
  onClose: () => void;
}

const TITLES: Record<MedicalMode, { title: string; icon: React.ComponentType<{ size?: number }>; hint: string }> = {
  injury: { title: 'الإصابة', icon: Activity, hint: 'بيانات الإصابة ومن يتابعها' },
  initial_exam: { title: 'الفحص الأولي والتشخيص', icon: Stethoscope, hint: 'تنتقل الحالة إلى: بانتظار الفحص النهائي' },
  final_exam: { title: 'الفحص النهائي', icon: ClipboardCheck, hint: 'تنتقل الحالة إلى: بانتظار قرار العودة' },
  return_decision: { title: 'قرار العودة للنشاط', icon: Flag, hint: 'تنتقل الحالة إلى: مغلق / متعافي' },
};

// Phone version of AddMedicalRecordDialog (same fields per stage and same payload)
export const MobileMedicalForm: React.FC<MobileMedicalFormProps> = ({ record, mode, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    player_id: record?.player_id?.toString() || '',
    doctor_id: record?.doctor_id?.toString() || '',
    injury_date: dayOnly(record?.injury_date),
    incident_location: record?.incident_location || '',
    injury_nature: record?.injury_nature || '',
    diagnosis: record?.diagnosis || '',
    initial_recommendation: record?.initial_recommendation || '',
    last_exam_date: dayOnly(record?.last_exam_date),
    medical_decision: record?.medical_decision || '',
    absence_from: dayOnly(record?.absence_from),
    absence_to: dayOnly(record?.absence_to),
    restrictions: record?.restrictions || '',
    next_exam_date: dayOnly(record?.next_exam_date),
    record_status: record?.record_status || 'مفتوح/مصاب',
  }));
  const [players, setPlayers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Same player / doctor lists as the desktop dialog
  useEffect(() => {
    if (mode !== 'injury') return;
    axios.get(Applink.individuals, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const playerList = all.filter((i: any) => i.type === 'لاعب' || i.type === 'player' || !i.type || i.role?.name?.trim() === 'لاعب');
        const doctorList = all.filter((i: any) => {
          const type = i.type?.trim();
          const role = i.role?.name?.trim();
          return type === 'طبيب' || type === 'doctor' || role === 'طبيب' || role === 'طبيب الفريق'
            || (role && role.includes('طبيب')) || (type && type.includes('طبيب'));
        });
        if (record?.player && !playerList.some((p: any) => p.id == record.player_id)) playerList.push(record.player);
        if (record?.doctor && !doctorList.some((d: any) => d.id == record.doctor_id)) doctorList.push(record.doctor);
        setPlayers(playerList);
        setDoctors(doctorList);
      })
      .catch(err => console.error('Error fetching individuals for medical', err));
  }, [mode, record]);

  const set = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const errors = mode === 'injury' ? {
    player: !form.player_id ? 'اختر اللاعب المصاب' : null,
    doctor: !form.doctor_id ? 'اختر الطبيب المشرف' : null,
    date: !form.injury_date ? 'حدد تاريخ الإصابة' : null,
  } : {};

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      const url = record ? Applink.updateMedicalRecord(record.id) : Applink.createMedicalRecord;
      const payload: any = { ...form };
      // The status moves forward with the stage being filled (desktop rule)
      if (!record) payload.record_status = 'مفتوح/مصاب';
      else if (mode === 'initial_exam') payload.record_status = 'بانتظار الفحص النهائي';
      else if (mode === 'final_exam') payload.record_status = 'بانتظار قرار العودة';
      else if (mode === 'return_decision') payload.record_status = 'مغلق/متعافي';
      if (payload.player_id) payload.player_id = Number(payload.player_id);
      if (payload.doctor_id) payload.doctor_id = Number(payload.doctor_id);
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });

      const res = await axios.post(url, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      let msg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      if (error.response?.data?.errors) msg += '\nتفاصيل الخطأ:\n' + Object.values(error.response.data.errors).flat().join('\n');
      alert(`حدث خطأ أثناء الحفظ: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const err = (text?: string | null) => (showErrors && text ? <p className="mmd2-form-error"><AlertCircle size={14} /> {text}</p> : null);

  const personPick = (label: string, field: 'player_id' | 'doctor_id', list: any[], empty: string, withRole = false) => {
    const chosen = list.find(p => String(p.id) === form[field]);
    return (
      <MobileSelect
        label={label}
        icon={User}
        value={form[field]}
        options={list.map(p => ({ value: String(p.id), label: personName(p, `عضو ${p.id}`), hint: withRole ? (p.role?.name || TYPE_LABELS[p.type] || p.type) : undefined }))}
        onChange={v => set(field, v)}
        searchable
        renderTrigger={open => (
          <button type="button" className={`mmd2-pick ${chosen ? 'has-value' : ''}`} onClick={open}>
            {chosen
              ? <img src={personPhoto(chosen) || defaultAvatar} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
              : <span className="mmd2-pick-icon"><UserRound size={20} /></span>}
            <span className="mmd2-pick-text">
              <small>{label}</small>
              <strong>{chosen ? personName(chosen) : empty}</strong>
            </span>
            <ChevronDown size={18} />
          </button>
        )}
      />
    );
  };

  const dateInput = (label: string, field: keyof typeof form, icon = Calendar) => {
    const Icon = icon;
    return (
      <label className="me-field">
        <span className="me-label"><Icon size={14} /> {label}</span>
        <input className="me-input" type="date" dir="ltr" value={form[field]} onChange={e => set(field, e.target.value)} />
      </label>
    );
  };

  const head = TITLES[mode];

  return (
    <MobileScreen
      title={mode === 'injury' ? (record ? 'تعديل الإصابة' : 'إصابة جديدة') : head.title}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="mmd2-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ الملف'}
        </button>
      )}
    >
      <section className="mmd2-hero">
        <div className="mmd2-hero-top">
          <span className="mmd2-hero-icon"><head.icon size={24} /></span>
          <div>
            <small>{record ? personName(record.player, 'لاعب') : 'ملف إصابة جديد'}</small>
            <strong className="title">{head.title}</strong>
          </div>
        </div>
        <p className="mmd2-hero-note">{head.hint}</p>
      </section>

      <section className="mmd2-form-card">
        {mode === 'injury' && (
          <>
            {personPick('اللاعب المصاب', 'player_id', players, 'اختر اللاعب')}
            {err(errors.player)}
            {personPick('الطبيب / المختص المشرف', 'doctor_id', doctors, 'اختر الطبيب', true)}
            {err(errors.doctor)}
            {dateInput('تاريخ الإصابة', 'injury_date')}
            <div className="mmd2-quick">
              {[['اليوم', 0], ['أمس', -1]].map(([l, d]) => (
                <button key={l} type="button" className={form.injury_date === isoDay(d as number) ? 'active' : ''} onClick={() => set('injury_date', isoDay(d as number))}>{l}</button>
              ))}
            </div>
            {err(errors.date)}
            <label className="me-field">
              <span className="me-label"><MapPin size={14} /> مكان حدوثها</span>
              <input className="me-input" type="text" value={form.incident_location} onChange={e => set('incident_location', e.target.value)} placeholder="تدريب، مباراة، خارج النشاط" />
            </label>
            <label className="me-field">
              <span className="me-label"><Activity size={14} /> طبيعة الإصابة</span>
              <input className="me-input" type="text" value={form.injury_nature} onChange={e => set('injury_nature', e.target.value)} placeholder="كدمة، تمزق، كسر..." />
            </label>
          </>
        )}

        {mode === 'initial_exam' && (
          <>
            <label className="me-field">
              <span className="me-label"><FileText size={14} /> التوصية الأولية</span>
              <input className="me-input" type="text" value={form.initial_recommendation} onChange={e => set('initial_recommendation', e.target.value)} />
            </label>
            {dateInput('موعد الفحص القادم', 'next_exam_date')}
            <label className="me-field">
              <span className="me-label"><Lock size={14} /> التشخيص الطبي الدقيق (سري)</span>
              <textarea className="me-textarea" rows={5} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="وصف طبي دقيق لحالة اللاعب..." />
            </label>
          </>
        )}

        {mode === 'final_exam' && (
          <>
            {dateInput('تاريخ الفحص النهائي', 'last_exam_date', ClipboardCheck)}
            <label className="me-field">
              <span className="me-label"><FileText size={14} /> القرار الطبي / النتيجة</span>
              <input className="me-input" type="text" value={form.medical_decision} onChange={e => set('medical_decision', e.target.value)} />
            </label>
            {dateInput('تاريخ انتهاء الغياب (المتوقع)', 'absence_to')}
          </>
        )}

        {mode === 'return_decision' && (
          <>
            {dateInput('تاريخ نهاية مرحلة العلاج', 'absence_from', Flag)}
            <label className="me-field">
              <span className="me-label"><FileText size={14} /> القيود والتعليمات للطاقم الفني</span>
              <textarea className="me-textarea" rows={4} value={form.restrictions} onChange={e => set('restrictions', e.target.value)} placeholder="مثال: تجنب الاحتكاك البدني، المشاركة 30 دقيقة فقط..." />
            </label>
          </>
        )}
      </section>
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
