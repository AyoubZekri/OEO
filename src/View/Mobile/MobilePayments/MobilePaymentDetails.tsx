import React from 'react';
import {
  Pencil, Printer, Calendar, CreditCard, Wallet, FileSignature, StickyNote, Paperclip, UploadCloud, FileText, Phone, IdCard, Hash,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { PaymentRecord, PaymentMember } from '../../Screen/Payments/payment_model';
import type { ContractModel } from '../../Screen/Contracts/contract_model';
import { paymentNatureText, receiptUrl } from '../../Screen/Payments/paymentText';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { longDate } from '../MobileTrainingSessions/sessionUtils';
import { moneyText } from '../MobileContracts/contractUtils';
import { kindMeta, amountOf, dateOf, methodOf, notesOf, initials } from './paymentUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobilePaymentDetailsProps {
  payment: PaymentRecord;
  person?: PaymentMember;
  fundName?: string;
  contract?: ContractModel;
  canEdit: boolean;
  canPrint: boolean;
  onPrint: () => void;
  onEdit: () => void;
  onUpload: () => void;
  onViewReceipt: (url: string) => void;
  onClose: () => void;
}

const Field: React.FC<{ icon: React.ComponentType<{ size?: number }>; label: string; value?: React.ReactNode; wide?: boolean }> = ({ icon: Icon, label, value, wide }) => (
  <div className={`mpy-field ${wide ? 'wide' : ''}`}>
    <small><Icon size={12} /> {label}</small>
    {value ? <strong>{value}</strong> : <em>غير محدد</em>}
  </div>
);

// One payment or expense (phone): amount, who, how, and its receipt
export const MobilePaymentDetails: React.FC<MobilePaymentDetailsProps> = ({
  payment: p, person, fundName, contract, canEdit, canPrint, onPrint, onEdit, onUpload, onViewReceipt, onClose,
}) => {
  const meta = kindMeta(p);
  const url = receiptUrl(p);
  const isPdf = url?.toLowerCase().endsWith('.pdf');
  const date = dateOf(p);
  const check = p.postal_check || p.checkNumber;

  return (
    <MobileScreen
      title="تفاصيل العملية"
      onBack={onClose}
      footer={(canPrint || canEdit) ? (
        <>
          {canPrint && <button type="button" className="me-btn" onClick={onPrint}><Printer size={18} /> طباعة</button>}
          {canEdit && <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> تعديل</button>}
        </>
      ) : undefined}
    >
      <section className={`mpy-hero tone-${meta.tone}`}>
        <div className="mpy-hero-top">
          <span className="mpy-hero-icon"><meta.icon size={24} /></span>
          <div>
            <small>{meta.label}</small>
            <strong dir="ltr">{moneyText(amountOf(p))}</strong>
          </div>
        </div>
        <p className="mpy-hero-nature">{paymentNatureText(p) || '—'}</p>
        {person && (
          <div className="mpy-person">
            <span className="mpy-avatar">{initials(person.firstName, person.lastName)}</span>
            <div>
              <strong>{`${person.firstName} ${person.lastName}`.trim()}</strong>
              <small>{TYPE_LABELS[person.memberRole] || person.memberRole}</small>
            </div>
          </div>
        )}
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><CreditCard size={16} /></span>العملية</h3>
        <div className="mpy-fields">
          <Field icon={Calendar} label="تاريخ الدفع" value={date ? longDate(date.slice(0, 10)) : null} wide />
          <Field icon={CreditCard} label="طريقة الدفع" value={methodOf(p)} />
          <Field icon={Wallet} label="الصندوق" value={fundName} />
          {check && <Field icon={Hash} label="رقم الصك" value={<span dir="ltr">{check}</span>} wide />}
          {contract && <Field icon={FileSignature} label="العقد" value={<>موسم <span dir="ltr">{contract.startDate}</span></>} wide />}
          {notesOf(p) && <Field icon={StickyNote} label="ملاحظات" value={notesOf(p)} wide />}
        </div>
      </section>

      {person && (person.phoneNumber || person.nationalId) && (
        <section className="me-card">
          <h3 className="me-section-title"><span><IdCard size={16} /></span>المستفيد</h3>
          <div className="mpy-fields">
            <Field icon={Phone} label="رقم الهاتف" value={person.phoneNumber && <span dir="ltr">{person.phoneNumber}</span>} />
            <Field icon={IdCard} label="رقم الهوية" value={person.nationalId && <span dir="ltr">{person.nationalId}</span>} />
          </div>
        </section>
      )}

      {/* Receipt */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Paperclip size={16} /></span>وصل العملية</h3>
        {url ? (
          <>
            <button type="button" className="mpy-receipt" onClick={() => onViewReceipt(url)}>
              {isPdf
                ? <span className="mpy-receipt-pdf"><FileText size={34} /> ملف PDF</span>
                : <img src={url} alt="صورة الوصل" />}
              <em>اضغط للعرض</em>
            </button>
            <button type="button" className="mpy-upload-btn subtle" onClick={onUpload}><UploadCloud size={17} /> تغيير الوصل</button>
          </>
        ) : (
          <button type="button" className="mpy-upload-btn" onClick={onUpload}>
            <UploadCloud size={22} />
            <span><strong>إرفاق وصل العملية</strong><small>صورة أو ملف PDF للوصل الموقّع</small></span>
          </button>
        )}
      </section>
    </MobileScreen>
  );
};
