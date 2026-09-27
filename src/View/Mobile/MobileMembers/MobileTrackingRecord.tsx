import React, { useState } from 'react';
import {
  Wallet, Shirt, Scale, FileSignature, CheckCircle2, Landmark, Calendar, Package, AlertTriangle,
  FileWarning, MessageSquare, Gavel, ArrowDownLeft, ArrowUpRight, CalendarX, Clock, DoorOpen, Plane,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import type { useMembersController } from '../../Screen/Members/MembersController';
import type { MemberModel } from '../../Screen/Members/member_model';
import {
  useMemberRecord, disciplinaryStatus, DISCIPLINARY_STATUS_TONE, absenceStatus, absenceKind, movementName,
  type AbsenceKind,
} from '../../Screen/Members/useMemberRecord';
import type { AbsenceRecord } from '../../Screen/Absence/AbsenceRequestsController';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileTrackingRecord.css';

interface MobileTrackingRecordProps {
  member: MemberModel;
  controller: ReturnType<typeof useMembersController>;
  onClose: () => void;
}

type Tab = 'financial' | 'equipment' | 'disciplinary' | 'absences';

interface PaymentRow {
  id?: string | number;
  amount?: number | string;
  amountNature?: string;
  paymentMethod?: string;
  paymentDate?: string;
  created_at?: string;
}

interface ContractRow {
  id?: string | number;
  contractValue?: number | string;
  Contract_value?: number | string;
  startDate?: string;
  start_date?: string;
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'financial', label: 'الحساب', icon: Wallet },
  { id: 'equipment', label: 'العتاد', icon: Shirt },
  { id: 'disciplinary', label: 'الانضباط', icon: Scale },
  { id: 'absences', label: 'الغياب', icon: CalendarX },
];

const TYPE_LABELS: Record<string, string> = {
  player: 'لاعب',
  coach: 'مدرب',
  assistant_coach: 'مساعد مدرب',
  goalkeeper_coach: 'مدرب حراس',
};

const DISCIPLINARY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  'تنبيه': AlertTriangle,
  'إنذار': FileWarning,
  'طلب توضيح': MessageSquare,
  'إحالة على الجهة التأديبية المختصة': Gavel,
};

const ABSENCE_KIND_ICONS: Record<AbsenceKind, React.ComponentType<{ size?: number }>> = {
  absence: CalendarX,
  late: Clock,
  leave: DoorOpen,
  request: Plane,
};

type AbsenceFilter = 'all' | 'absence' | 'late';

const ABSENCE_FILTERS: { id: AbsenceFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'absence', label: 'الغياب' },
  { id: 'late', label: 'التأخر' },
];

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const isDeduction = (nature?: string) => nature === 'استقطاع' || nature === 'خصم';

// Absences and lateness of the member, with an absence / lateness filter
const AbsenceList: React.FC<{ absences: AbsenceRecord[] }> = ({ absences }) => {
  const [filter, setFilter] = useState<AbsenceFilter>('all');
  const absenceCount = absences.filter(a => absenceKind(a).kind === 'absence').length;
  const lateCount = absences.filter(a => absenceKind(a).kind === 'late').length;
  const shown = filter === 'all' ? absences : absences.filter(a => absenceKind(a).kind === filter);

  return (
    <>
      <div className="tr-tiles">
        <div className="bad"><strong>{absenceCount}</strong><span>غياب</span></div>
        <div className="late"><strong>{lateCount}</strong><span>تأخر</span></div>
        <div className="good"><strong>{absences.filter(a => absenceStatus(a).tone === 'pos').length}</strong><span>مبرر</span></div>
      </div>

      <div className="tr-filter" role="tablist" aria-label="نوع السجل">
        {ABSENCE_FILTERS.map(f => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <section className="me-card">
        {shown.length === 0 ? (
          <p className="me-text empty">لا توجد سجلات من هذا النوع</p>
        ) : (
          <ul className="tr-list">
            {shown.map(a => {
              const status = absenceStatus(a);
              const kind = absenceKind(a);
              const Icon = ABSENCE_KIND_ICONS[kind.kind];
              return (
                <li key={a.id}>
                  <span className={`tr-op-icon kind-${kind.kind}`}><Icon size={17} /></span>
                  <span className="tr-op-body">
                    <strong>
                      <span className={`tr-kind kind-${kind.kind}`}>{kind.label}</span>
                      {a.event_category || ''}
                    </strong>
                    <small>
                      <Calendar size={11} /> {formatDate(a.event_date)}
                      {a.meeting_topic ? ` · ${a.meeting_topic}` : ''}
                    </small>
                    {kind.kind === 'late' && a.duration && <small><Clock size={11} /> مدة التأخر: {a.duration}</small>}
                    {a.reason && <small>التبرير: {a.reason}</small>}
                  </span>
                  <span className={`tr-badge ${status.tone}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
};

// Phone version of the member's tracking record: account, equipment, disciplinary actions and absences
export const MobileTrackingRecord: React.FC<MobileTrackingRecordProps> = ({ member, controller, onClose }) => {
  const [tab, setTab] = useState<Tab>('financial');
  // Equipment, disciplinary actions and absences; the account comes from the members controller
  const record = useMemberRecord(member.id);
  const loadingExtra = record.isLoading;
  const { movements, disciplinary, absences } = record;

  const { formatCurrency } = controller;
  // Amount on one line with the currency under it, so narrow boxes never split the number
  const stackedAmount = (value: number) => {
    const text = formatCurrency(value);
    const cut = text.lastIndexOf(' ');
    return <>{text.slice(0, cut)}<small className="tr-cur">{text.slice(cut + 1)}</small></>;
  };
  const contracts = controller.getContractsForMember(member.id) as ContractRow[];
  const payments = controller.getMemberPayments(member.id) as PaymentRow[];
  const unreturned = movements.filter(m => !m.return_date).length;
  const photo = member.photo && !member.photo.includes('ui-avatars.com') ? member.photo : defaultAvatar;

  return (
    <MobileScreen title="سجل المتابعة" onBack={onClose}>
      {/* Member */}
      <section className="me-card tr-member">
        <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
        <div>
          <strong>{member.first_name} {member.last_name}</strong>
          <span>{TYPE_LABELS[member.type] || 'عضو فريق'}</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="tr-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'financial' && (
        <>
          {/* Final balance */}
          <section className="tr-balance">
            <span>الرصيد النهائي المتبقي</span>
            <strong>{formatCurrency(controller.getRemainingAmount(member.id))}</strong>
            <div className="tr-balance-row">
              <div><small>إجمالي العقود</small><b>{formatCurrency(controller.getContractValue(member.id))}</b></div>
              <div><small>إجمالي السلف</small><b className="neg">{formatCurrency(controller.getAdvances(member.id))}</b></div>
            </div>
          </section>

          {/* Contracts */}
          {contracts.map((contract, i) => {
            const value = Number(contract.contractValue) || Number(contract.Contract_value) || 0;
            const paid = controller.getPaidForContract(member.id, contract);
            const percent = value > 0 ? Math.min(100, Math.round((paid / value) * 100)) : 0;
            return (
              <section key={contract.id || i} className="me-card">
                <h3 className="me-section-title">
                  <span><FileSignature size={16} /></span>
                  عقد موسم {contract.startDate || contract.start_date || 'غير محدد'}
                </h3>
                <div className="tr-contract">
                  <div><small>قيمة العقد</small><b>{stackedAmount(value)}</b></div>
                  <div><small>المدفوع</small><b className="pos">{stackedAmount(paid)}</b></div>
                  <div><small>المتبقي</small><b>{stackedAmount(value - paid)}</b></div>
                </div>
                <div className="tr-paid-track"><div style={{ width: `${percent}%` }} /></div>
                <small className="tr-paid-note">تم دفع {percent}% من العقد</small>
              </section>
            );
          })}

          {/* Operations */}
          <section className="me-card">
            <h3 className="me-section-title"><span><Landmark size={16} /></span>سجل العمليات والمدفوعات</h3>
            {payments.length === 0 ? (
              <p className="me-text empty">لا توجد عمليات مسجلة حالياً</p>
            ) : (
              <ul className="tr-list">
                {payments.map((p, i) => {
                  const deduction = isDeduction(p.amountNature);
                  return (
                    <li key={p.id || i}>
                      <span className={`tr-op-icon ${deduction ? 'neg' : 'pos'}`}>
                        {deduction ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                      </span>
                      <span className="tr-op-body">
                        <strong>{p.amountNature || 'دفع'}</strong>
                        <small>{formatDate(p.paymentDate || p.created_at)}{p.paymentMethod ? ` · ${p.paymentMethod}` : ''}</small>
                      </span>
                      <b className={deduction ? 'neg' : 'pos'}>{formatCurrency(Number(p.amount) || 0)}</b>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === 'equipment' && (loadingExtra ? (
        <MobileLoader text="جاري تحميل العتاد..." />
      ) : (
        <>
          <div className="tr-tiles">
            <div><strong>{movements.length}</strong><span>المستلم</span></div>
            <div className="good"><strong>{movements.length - unreturned}</strong><span>تم إرجاعه</span></div>
            <div className={unreturned > 0 ? 'bad' : 'good'}><strong>{unreturned}</strong><span>بحوزته</span></div>
          </div>
          <section className="me-card">
            <h3 className="me-section-title"><span><Package size={16} /></span>حركة المعدات</h3>
            {movements.length === 0 ? (
              <p className="me-text empty">لا توجد حركة معدات لهذا العضو</p>
            ) : (
              <ul className="tr-list">
                {movements.map((m, i) => (
                  <li key={i}>
                    <span className={`tr-op-icon ${m.return_date ? 'pos' : 'warn'}`}><Shirt size={17} /></span>
                    <span className="tr-op-body">
                      <strong>{movementName(m, i)}</strong>
                      <small>
                        <Calendar size={11} /> تسليم {formatDate(m.delivery_date)}
                        {m.return_date ? ` · إرجاع ${formatDate(m.return_date)}` : ''}
                      </small>
                    </span>
                    <span className="tr-qty" dir="ltr">×{m.quantity || 1}</span>
                    <span className={`tr-badge ${m.return_date ? 'pos' : 'warn'}`}>{m.return_date ? 'مُرجع' : 'بحوزته'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ))}

      {tab === 'disciplinary' && (loadingExtra ? (
        <MobileLoader text="جاري تحميل السجل التأديبي..." />
      ) : disciplinary.length === 0 ? (
        <div className="me-empty">
          <CheckCircle2 size={44} />
          <strong>سجل نظيف</strong>
          <p>لا توجد أي إجراءات تأديبية مسجلة لهذا العضو.</p>
        </div>
      ) : (
        disciplinary.map(d => {
          const Icon = DISCIPLINARY_ICONS[d.actionType] || AlertTriangle;
          const status = disciplinaryStatus(d);
          return (
            <section key={d.id} className="me-card tr-disc">
              <div className="tr-disc-head">
                <span className="tr-disc-type"><Icon size={15} /> {d.actionType}</span>
                <span className={`tr-badge ${DISCIPLINARY_STATUS_TONE[status] || 'muted'}`}>{status}</span>
              </div>
              <div className="tr-disc-date"><Calendar size={13} /> {formatDate(d.incidentDate)}</div>
              <p className="me-text">{d.reason}</p>
              {d.decision_outcome && <div className="tr-disc-decision"><Gavel size={14} /> {d.decision_outcome}</div>}
            </section>
          );
        })
      ))}

      {tab === 'absences' && (loadingExtra ? (
        <MobileLoader text="جاري تحميل الغيابات..." />
      ) : absences.length === 0 ? (
        <div className="me-empty">
          <CheckCircle2 size={44} />
          <strong>لا توجد غيابات ولا تأخرات</strong>
          <p>لم يُسجل أي غياب أو تأخر لهذا العضو.</p>
        </div>
      ) : (
        <AbsenceList absences={absences} />
      ))}
    </MobileScreen>
  );
};
