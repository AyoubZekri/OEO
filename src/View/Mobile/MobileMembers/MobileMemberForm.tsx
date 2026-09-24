import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Camera, RefreshCw, User, IdCard, Phone, Shirt, Users, MapPin, CalendarDays,
  Mail, HeartHandshake, Landmark, UploadCloud, CheckCircle2, Eye, Trophy, FileText, Save,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { Applink } from '../../../LinkApi';
import { processImage } from '../../../core/functions/processImage';
import { MobileSelect } from '../widgets/MobileSelect';
import type { MobileSelectOption } from '../widgets/MobileSelect';
import type { useMembersController } from '../../Screen/Members/MembersController';
import './MobileMemberForm.css';

interface MobileMemberFormProps {
  controller: ReturnType<typeof useMembersController>;
}

const TYPE_OPTIONS = [
  { value: 'player', label: 'لاعب' },
  { value: 'coach', label: 'مدرب' },
  { value: 'assistant_coach', label: 'مساعد مدرب' },
  { value: 'goalkeeper_coach', label: 'مدرب حراس' },
  { value: 'physical_trainer', label: 'محضر بدني' },
  { value: 'employee', label: 'موظف' },
  { value: 'admin', label: 'إداري' },
  { value: 'doctor', label: 'طبيب' },
];

const POSITION_OPTIONS: MobileSelectOption[] = [
  { value: '', label: 'بدون مركز' },
  { value: 'GK', label: 'حارس مرمى', hint: 'GK', group: 'حراسة المرمى' },
  { value: 'CB', label: 'قلب دفاع', hint: 'CB', group: 'الدفاع' },
  { value: 'SW', label: 'ليبرو (قشاش)', hint: 'SW', group: 'الدفاع' },
  { value: 'RB', label: 'ظهير أيمن', hint: 'RB', group: 'الدفاع' },
  { value: 'LB', label: 'ظهير أيسر', hint: 'LB', group: 'الدفاع' },
  { value: 'RWB', label: 'ظهير جناح أيمن', hint: 'RWB', group: 'الدفاع' },
  { value: 'LWB', label: 'ظهير جناح أيسر', hint: 'LWB', group: 'الدفاع' },
  { value: 'CDM', label: 'وسط دفاعي (ارتكاز)', hint: 'CDM', group: 'الوسط' },
  { value: 'CM', label: 'وسط محوري', hint: 'CM', group: 'الوسط' },
  { value: 'CAM', label: 'صانع ألعاب', hint: 'CAM', group: 'الوسط' },
  { value: 'RM', label: 'وسط أيمن', hint: 'RM', group: 'الوسط' },
  { value: 'LM', label: 'وسط أيسر', hint: 'LM', group: 'الوسط' },
  { value: 'RW', label: 'جناح أيمن', hint: 'RW', group: 'الهجوم' },
  { value: 'LW', label: 'جناح أيسر', hint: 'LW', group: 'الهجوم' },
  { value: 'SS', label: 'مهاجم ثانٍ', hint: 'SS', group: 'الهجوم' },
  { value: 'CF', label: 'قلب هجوم', hint: 'CF', group: 'الهجوم' },
  { value: 'ST', label: 'رأس حربة', hint: 'ST', group: 'الهجوم' },
];

const FOOT_OPTIONS = ['يمين', 'يسار', 'كلتاهما'];

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'suspended', label: 'موقوف' },
];

type IconType = React.ComponentType<{ size?: number }>;

const Field: React.FC<{ label: string; icon: IconType; required?: boolean; children: React.ReactNode }> = ({ label, icon: Icon, required, children }) => (
  <label className="mf-field">
    <span className="mf-label">{label}{required && <em> *</em>}</span>
    <span className="mf-control">
      <Icon size={18} />
      {children}
    </span>
  </label>
);

const Section: React.FC<{ title: string; icon: IconType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="mf-section">
    <h3 className="mf-section-title">
      <span className="mf-section-icon"><Icon size={16} /></span>
      {title}
    </h3>
    <div className="mf-section-body">{children}</div>
  </section>
);

export const MobileMemberForm: React.FC<MobileMemberFormProps> = ({ controller }) => {
  const {
    memberToEdit, formData, setFormData, handleFormDataChange, handleSaveMember, closeAddMemberDialog,
    photoFile, setPhotoFile, nationalIdFile, setNationalIdFile, medicalFile, setMedicalFile,
    insuranceFile, setInsuranceFile, teams, isLoading,
  } = controller;

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [hideCurrentPhoto, setHideCurrentPhoto] = useState(false);

  // Object URL for the picked photo, released when it changes
  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const currentPhoto = memberToEdit?.photo && !memberToEdit.photo.includes('ui-avatars.com') && !hideCurrentPhoto
    ? memberToEdit.photo
    : null;
  const shownPhoto = photoPreview || currentPhoto;

  const setField = (name: string, value: string) => setFormData((prev: Record<string, unknown>) => ({ ...prev, [name]: value }));

  const onPhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      setPhotoFile(await processImage(file, 5000));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setHideCurrentPhoto(true);
  };

  const teamOptions: MobileSelectOption[] = [
    { value: '', label: 'بدون فريق' },
    ...teams.map(team => ({ value: team.id.toString(), label: team.name })),
  ];

  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
  const typeLabel = TYPE_OPTIONS.find(o => o.value === formData.type)?.label;

  const documents: { label: string; file: File | null; setFile: (f: File | null) => void; existing?: string | File | null }[] = [
    { label: 'البطاقة الوطنية', file: nationalIdFile, setFile: setNationalIdFile, existing: memberToEdit?.national_id_document },
    { label: 'الشهادة الطبية', file: medicalFile, setFile: setMedicalFile, existing: memberToEdit?.medical_certificate },
    { label: 'شهادة التأمين', file: insuranceFile, setFile: setInsuranceFile, existing: memberToEdit?.insurance_document },
  ];

  return (
    <div className="mf-screen" role="dialog" aria-modal="true" aria-label={memberToEdit ? 'تعديل العضو' : 'إضافة عضو'}>
      <header className="mf-appbar">
        <button type="button" className="mf-back" onClick={closeAddMemberDialog} aria-label="رجوع">
          <ArrowRight size={22} />
        </button>
        <h1>{memberToEdit ? 'تعديل العضو' : 'إضافة عضو'}</h1>
        <span className="mf-appbar-spacer" aria-hidden="true" />
      </header>

      <form id="mobileMemberForm" className="mf-body" onSubmit={handleSaveMember}>
        {/* Photo + live preview of the name */}
        <div className="mf-hero">
          <label className="mf-photo">
            <input
              type="file"
              accept="image/*,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF"
              onChange={onPhotoPicked}
              hidden
            />
            {isProcessingImage ? (
              <span className="mf-photo-busy"><RefreshCw size={26} /></span>
            ) : (
              <img src={shownPhoto || defaultAvatar} alt="صورة العضو" />
            )}
            <span className="mf-photo-badge"><Camera size={16} /></span>
          </label>
          <div className="mf-hero-text">
            <strong>{fullName || 'عضو جديد'}</strong>
            {typeLabel && <span>{typeLabel}</span>}
          </div>
          {shownPhoto && (
            <button type="button" className="mf-remove-photo" onClick={removePhoto}>إزالة الصورة</button>
          )}
        </div>

        <Section title="المعلومات الأساسية" icon={User}>
          <div className="mf-row">
            <Field label="الاسم" icon={User} required>
              <input type="text" name="first_name" required value={formData.first_name || ''} onChange={handleFormDataChange} />
            </Field>
            <Field label="اللقب" icon={User} required>
              <input type="text" name="last_name" required value={formData.last_name || ''} onChange={handleFormDataChange} />
            </Field>
          </div>
          <Field label="رقم الهوية الوطنية" icon={IdCard}>
            <input type="text" name="national_id" inputMode="numeric" value={formData.national_id || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
          <Field label="رقم الهاتف" icon={Phone}>
            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
        </Section>

        <Section title="المعلومات الرياضية" icon={Trophy}>
          <Field label="المنصب" icon={Users} required>
            <select name="type" value={formData.type || 'player'} onChange={handleFormDataChange}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <MobileSelect
            label="المركز"
            icon={MapPin}
            value={formData.position || ''}
            options={POSITION_OPTIONS}
            onChange={v => setField('position', v)}
            placeholder="بدون مركز"
            searchable
          />
          <Field label="رقم القميص" icon={Shirt}>
            <input type="number" name="Shirt_number" inputMode="numeric" min={0} value={formData.Shirt_number || ''} onChange={handleFormDataChange} />
          </Field>
          <MobileSelect
            label="الفريق"
            icon={Users}
            value={formData.team_id?.toString() || ''}
            options={teamOptions}
            onChange={v => setField('team_id', v)}
            placeholder="بدون فريق"
            searchable={teams.length > 6}
          />

          <div className="mf-field">
            <span className="mf-label">القدم المفضلة</span>
            <div className="mf-segment">
              {FOOT_OPTIONS.map(foot => (
                <button
                  key={foot}
                  type="button"
                  className={formData.preferred_foot === foot ? 'active' : ''}
                  onClick={() => setField('preferred_foot', formData.preferred_foot === foot ? '' : foot)}
                >
                  {foot}
                </button>
              ))}
            </div>
          </div>

          <div className="mf-field">
            <span className="mf-label">الحالة<em> *</em></span>
            <div className="mf-segment status">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={`st-${s.value} ${formData.status === s.value ? 'active' : ''}`}
                  onClick={() => setField('status', s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="معلومات شخصية وطوارئ" icon={HeartHandshake}>
          <Field label="تاريخ الميلاد" icon={CalendarDays}>
            <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
          <Field label="مكان الميلاد" icon={MapPin}>
            <input type="text" name="place_of_birth" value={formData.place_of_birth || ''} onChange={handleFormDataChange} />
          </Field>
          <Field label="البريد الإلكتروني" icon={Mail}>
            <input type="email" name="email" value={formData.email || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
          <Field label="شخص للاتصال عند الضرورة" icon={HeartHandshake}>
            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleFormDataChange} />
          </Field>
          <Field label="هاتف حالة الطوارئ" icon={Phone}>
            <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
          <Field label="رقم الحساب الجاري (CCP)" icon={Landmark}>
            <input type="text" name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleFormDataChange} dir="ltr" />
          </Field>
        </Section>

        <Section title="المستندات والوثائق" icon={FileText}>
          {documents.map(doc => {
            const hasExisting = !!doc.existing && !doc.file && typeof doc.existing === 'string';
            return (
              <div key={doc.label} className={`mf-doc ${doc.file || hasExisting ? 'done' : ''}`}>
                <span className="mf-doc-icon">
                  {doc.file || hasExisting ? <CheckCircle2 size={20} /> : <UploadCloud size={20} />}
                </span>
                <span className="mf-doc-text">
                  <strong>{doc.label}</strong>
                  <small>{doc.file ? doc.file.name : hasExisting ? 'ملف مرفق مسبقاً' : 'PDF أو صورة'}</small>
                </span>
                {hasExisting && (
                  <a className="mf-doc-view" href={`${Applink.image}/${doc.existing}`} target="_blank" rel="noreferrer" aria-label="عرض الملف">
                    <Eye size={16} />
                  </a>
                )}
                <label className="mf-doc-pick">
                  {doc.file || hasExisting ? 'تغيير' : 'رفع'}
                  <input type="file" accept="image/*,.pdf" hidden onChange={e => doc.setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            );
          })}
        </Section>
      </form>

      <footer className="mf-footer">
        <button type="submit" form="mobileMemberForm" className="mf-save" disabled={isLoading || isProcessingImage}>
          <Save size={18} />
          {isLoading ? 'جاري الحفظ...' : memberToEdit ? 'حفظ التعديلات' : 'إضافة العضو'}
        </button>
      </footer>
    </div>
  );
};
