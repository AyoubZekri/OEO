import React from 'react';
import {
  Activity, Calendar, Stethoscope, FileText, ClipboardCheck, Flag, ShieldCheck, Pencil, Trash2, Plus, Check, Clock, Lock,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';
import { longDate } from '../MobileTrainingSessions/sessionUtils';
import {
  type MedicalMode, initialDone, finalDone, recovered, stageOf, toneOf, personName, personPhoto, dayOnly, daysSince, daysText,
} from './medicalUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileMedicalDetailsProps {
  record: PlayerMedicalRecord;
  onEdit: (mode: MedicalMode) => void;
  onDeleteInitial: () => void;
  onDeleteFinal: () => void;
  onDeleteTreatment: () => void;
  onClose: () => void;
}

type IconType = React.ComponentType<{ size?: number }>;

const dateText = (value?: string | null) => (value ? longDate(dayOnly(value)) : null);

const Field: React.FC<{ label: string; value?: string | null; wide?: boolean; secret?: boolean }> = ({ label, value, wide, secret }) => (
  <div className={`mmd2-field ${wide ? 'wide' : ''}`}>
    <small>{secret && <Lock size={11} />} {label}</small>
    {value ? <strong>{value}</strong> : <em>غير محدد</em>}
  </div>
);

// Full medical file of one player (phone): the injury and the three recovery stages, each with its own actions
export const MobileMedicalDetails: React.FC<MobileMedicalDetailsProps> = ({
  record, onEdit, onDeleteInitial, onDeleteFinal, onDeleteTreatment, onClose,
}) => {
  const stage = stageOf(record);
  const since = daysSince(record.injury_date);
  const photo = personPhoto(record.player);
  const returnIn = record.absence_to && !recovered(record) ? -(daysSince(record.absence_to) ?? 0) : null;

  const steps: {
    key: MedicalMode;
    icon: IconType;
    title: string;
    done: boolean;
    available: boolean;
    body: React.ReactNode;
    onDelete?: () => void;
    addLabel: string;
  }[] = [
    {
      key: 'initial_exam',
      icon: Stethoscope,
      title: 'الفحص الأولي والتشخيص',
      done: initialDone(record),
      available: true,
      addLabel: 'إضافة الفحص الأولي',
      onDelete: onDeleteInitial,
      body: (
        <div className="mmd2-fields">
          <Field label="التوصية الأولية" value={record.initial_recommendation} wide />
          <Field label="التشخيص الطبي (سري)" value={record.diagnosis} wide secret />
          <Field label="موعد الفحص القادم" value={dateText(record.next_exam_date)} wide />
        </div>
      ),
    },
    {
      key: 'final_exam',
      icon: ClipboardCheck,
      title: 'الفحص النهائي والقرار',
      done: finalDone(record),
      available: initialDone(record),
      addLabel: 'إضافة القرار النهائي',
      onDelete: onDeleteFinal,
      body: (
        <div className="mmd2-fields">
          <Field label="تاريخ الفحص النهائي" value={dateText(record.last_exam_date)} />
          <Field label="نهاية الغياب المتوقعة" value={dateText(record.absence_to)} />
          <Field label="القرار الطبي / النتيجة" value={record.medical_decision} wide />
        </div>
      ),
    },
    {
      key: 'return_decision',
      icon: Flag,
      title: 'مرحلة العلاج والعودة',
      done: recovered(record),
      available: finalDone(record),
      addLabel: 'تسجيل العودة للنشاط',
      onDelete: onDeleteTreatment,
      body: (
        <div className="mmd2-fields">
          <Field label="نهاية مرحلة العلاج" value={dateText(record.absence_from)} wide />
          <Field label="القيود والتعليمات للطاقم الفني" value={record.restrictions} wide />
        </div>
      ),
    },
  ];

  return (
    <MobileScreen
      title="الملف الطبي"
      onBack={onClose}
      footer={<button type="button" className="me-btn primary" onClick={() => onEdit('injury')}><Pencil size={18} /> تعديل الإصابة</button>}
    >
      <section className={`mmd2-hero tone-${toneOf(record)}`}>
        <div className="mmd2-player">
          <img src={photo || defaultAvatar} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
          <div>
            <strong>{personName(record.player, 'لاعب غير معروف')}</strong>
            <span><Activity size={13} /> {record.injury_nature || 'إصابة غير محددة'}</span>
          </div>
        </div>
        <div className="mmd2-hero-row">
          <em className={`mmd2-status tone-${toneOf(record)}`}>{record.record_status}</em>
          <span className="mmd2-steps big">
            {[1, 2, 3, 4].map(s => <i key={s} className={s <= stage ? 'on' : ''} />)}
          </span>
        </div>
        {!recovered(record) && (
          <p className="mmd2-hero-note">
            {since !== null && <><Clock size={13} /> مصاب منذ {since ? daysText(since) : 'اليوم'}</>}
            {returnIn !== null && returnIn >= 0 && <> · العودة المتوقعة {returnIn ? `بعد ${daysText(returnIn)}` : 'اليوم'}</>}
          </p>
        )}
        {recovered(record) && <p className="mmd2-hero-note ok"><ShieldCheck size={14} /> تعافى وعاد إلى النشاط</p>}
      </section>

      {/* The injury */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Activity size={16} /></span>الإصابة</h3>
        <div className="mmd2-fields">
          <Field label="تاريخ الإصابة" value={dateText(record.injury_date)} />
          <Field label="الطبيب المشرف" value={personName(record.doctor, '')} />
          <Field label="مكان حدوثها" value={record.incident_location} wide />
        </div>
      </section>

      {/* Recovery path */}
      <section className="me-card">
        <h3 className="me-section-title"><span><FileText size={16} /></span>مسار العلاج والتعافي</h3>
        <ol className="mmd2-path">
          {steps.map(st => (
            <li key={st.key} className={st.done ? 'done' : st.available ? 'next' : 'locked'}>
              <span className="mmd2-dot">{st.done ? <Check size={16} strokeWidth={3} /> : <st.icon size={15} />}</span>
              <div className="mmd2-step">
                <div className="mmd2-step-head">
                  <strong>{st.title}</strong>
                  <em>{st.done ? 'مكتمل' : st.available ? 'بانتظار' : 'لاحقاً'}</em>
                </div>
                {st.done && st.body}
                {st.done ? (
                  <div className="mmd2-step-actions">
                    <button type="button" onClick={() => onEdit(st.key)}><Pencil size={14} /> تعديل</button>
                    {st.onDelete && <button type="button" className="danger" onClick={st.onDelete}><Trash2 size={14} /> حذف</button>}
                  </div>
                ) : st.available ? (
                  <button type="button" className="mmd2-add" onClick={() => onEdit(st.key)}><Plus size={15} /> {st.addLabel}</button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mmd2-meta"><Calendar size={12} /> أُنشئ الملف {dateText(record.created_at) || '—'}</p>
    </MobileScreen>
  );
};
