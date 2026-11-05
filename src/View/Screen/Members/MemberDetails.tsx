import React from 'react';
import { UserRound, Phone, Mail, CalendarDays, IdCard, ShieldAlert, Shirt, Users, FileText, Pencil, Landmark } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { SidePanel } from '../../shared/SidePanel';
import { openDocument } from '../../widget/openDocument';
import { Applink } from '../../../LinkApi';
import { TYPE_LABELS, POSITION_LABELS } from '../../Mobile/MobileMembers/memberLabels';
import type { MemberModel } from './member_model';
import '../../shared/kit.css';
import './MemberDetails.css';

const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: 'نشط', tone: 'green' },
  suspended: { label: 'موقوف', tone: 'red' },
  inactive: { label: 'غير نشط', tone: 'red' },
};

const FOOT: Record<string, string> = { right: 'اليمنى', left: 'اليسرى', both: 'الاثنتان' };

const photoOf = (m: MemberModel) => (m.photo && !m.photo.includes('default') && !m.photo.includes('ui-avatars') ? m.photo : defaultAvatar);

/** One line of the details: its label and its value ("—" when empty) */
const Fact: React.FC<{ icon: typeof Phone; label: string; value?: React.ReactNode; ltr?: boolean }> = ({ icon: Icon, label, value, ltr }) => (
  <div className="mdt-fact">
    <span className="mdt-fact-icon"><Icon size={15} /></span>
    <span className="mdt-fact-text">
      <small>{label}</small>
      <b dir={ltr ? 'ltr' : undefined}>{value || '—'}</b>
    </span>
  </div>
);

/** A member's details: photo and name, then their information and documents (computer window, phone page) */
export const MemberDetails: React.FC<{
  member: MemberModel;
  mobile: boolean;
  /** The member is leaving (an open clearance card) */
  leaving?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}> = ({ member: m, mobile, leaving, onEdit, onClose }) => {
  const status = leaving && m.status === 'active' ? { label: 'في طور المغادرة', tone: 'amber' } : STATUS[m.status] || STATUS.inactive;
  const docs = [
    { label: 'بطاقة التعريف', file: m.national_id_document },
    { label: 'الشهادة الطبية', file: m.medical_certificate },
    { label: 'التأمين', file: m.insurance_document },
  ].filter(d => typeof d.file === 'string' && d.file) as { label: string; file: string }[];
  const player = m.type === 'player';

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      icon={UserRound}
      title="تفاصيل العضو"
      onClose={onClose}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={onClose}>إغلاق</button>}
          {onEdit && (
            <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={onEdit}>
              <Pencil size={17} />تعديل
            </button>
          )}
        </>
      )}
    >
      <div className="mdt">
        <section className="mdt-head">
          <img src={photoOf(m)} alt="" onError={e => { if (e.currentTarget.src !== defaultAvatar) e.currentTarget.src = defaultAvatar; }} />
          <div>
            <h3>{m.first_name} {m.last_name}</h3>
            <span className="mdt-tags">
              <em>{TYPE_LABELS[m.type] || m.type}</em>
              {m.team_name && <em>{m.team_name}</em>}
              <em className={`tone-${status.tone}`}>{status.label}</em>
            </span>
          </div>
        </section>

        {player && (
          <section className="mdt-box">
            <Fact icon={Shirt} label="رقم القميص" value={m.Shirt_number ?? undefined} />
            <Fact icon={Users} label="المركز" value={POSITION_LABELS[m.position] || m.position} />
            <Fact icon={UserRound} label="القدم المفضلة" value={FOOT[m.preferred_foot] || m.preferred_foot} />
          </section>
        )}

        <section className="mdt-box">
          <Fact icon={Phone} label="الهاتف" value={m.phone} ltr />
          <Fact icon={Mail} label="البريد الإلكتروني" value={m.email} ltr />
          <Fact icon={CalendarDays} label="تاريخ ومكان الميلاد" value={[m.birth_date, m.place_of_birth].filter(Boolean).join(' · ')} />
          <Fact icon={IdCard} label="رقم التعريف الوطني" value={m.national_id} ltr />
          <Fact icon={Landmark} label="الحساب البنكي" value={m.bank_account_number} ltr />
          <Fact icon={ShieldAlert} label="للطوارئ" value={[m.emergency_contact_name, m.emergency_contact_phone].filter(Boolean).join(' · ')} />
        </section>

        {docs.length > 0 && (
          <section className="mdt-docs">
            {docs.map(d => (
              <button key={d.label} type="button" onClick={() => openDocument(`${Applink.image}/${d.file}`, d.label)}>
                <FileText size={16} />{d.label}
              </button>
            ))}
          </section>
        )}
      </div>
    </SidePanel>
  );
};
