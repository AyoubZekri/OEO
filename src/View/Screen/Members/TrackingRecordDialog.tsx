import React, { useState } from 'react';
import {
  X, Wallet, Shirt, Scale, CalendarX, FileSignature, Landmark, Package, AlertTriangle, FileWarning,
  MessageSquare, Gavel, Calendar, Clock, CheckCircle2, ArrowDownLeft, ArrowUpRight, DoorOpen, Plane,
} from 'lucide-react';
import type { useMembersController } from './MembersController';
import type { MemberModel } from './member_model';
import {
  useMemberRecord, disciplinaryStatus, DISCIPLINARY_STATUS_TONE, absenceStatus, absenceKind, movementName,
  type AbsenceKind,
} from './useMemberRecord';
import './TrackingRecordDialog.css';

interface TrackingRecordDialogProps {
  member: MemberModel;
  controller: ReturnType<typeof useMembersController>;
  onClose: () => void;
}

type Tab = 'financial' | 'equipment' | 'disciplinary' | 'absences';
type AbsenceFilter = 'all' | 'absence' | 'late';

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

const TYPE_LABELS: Record<string, string> = {
  player: 'لاعب',
  coach: 'مدرب',
  assistant_coach: 'مساعد مدرب',
  goalkeeper_coach: 'مدرب حراس',
  physical_trainer: 'محضر بدني',
  employee: 'موظف',
  admin: 'إداري',
  doctor: 'طبيب',
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

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const isDeduction = (nature?: string) => nature === 'استقطاع' || nature === 'خصم';

// Desktop tracking record of a member: account statement, equipment, disciplinary actions and absences
export const TrackingRecordDialog: React.FC<TrackingRecordDialogProps> = ({ member, controller, onClose }) => {
  const [tab, setTab] = useState<Tab>('financial');
  const [absenceFilter, setAbsenceFilter] = useState<AbsenceFilter>('all');
  const record = useMemberRecord(member.id);
  const { formatCurrency } = controller;

  const contracts = controller.getContractsForMember(member.id) as ContractRow[];
  const payments = controller.getMemberPayments(member.id) as PaymentRow[];
  const inPossession = record.movements.filter(m => !m.return_date).length;
  const absenceCount = record.absences.filter(a => absenceKind(a).kind === 'absence').length;
  const lateCount = record.absences.filter(a => absenceKind(a).kind === 'late').length;
  const shownAbsences = absenceFilter === 'all'
    ? record.absences
    : record.absences.filter(a => absenceKind(a).kind === absenceFilter);
  const photo = member.photo && !member.photo.includes('ui-avatars.com') ? member.photo : null;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }>; count?: number }[] = [
    { id: 'financial', label: 'كشف الحساب', icon: Wallet, count: payments.length },
    { id: 'equipment', label: 'سجل المعدات', icon: Shirt, count: record.movements.length },
    { id: 'disciplinary', label: 'الإجراءات التأديبية', icon: Scale, count: record.disciplinary.length },
    { id: 'absences', label: 'الغياب والتأخر', icon: CalendarX, count: record.absences.length },
  ];

  const loadingRow = (cols: number, text = 'جاري التحميل...') => (
    <tr><td colSpan={cols} className="trd-empty-cell">{text}</td></tr>
  );

  return (
    <div className="trd-overlay" onClick={onClose}>
      <div className="trd-dialog" role="dialog" aria-modal="true" aria-label="سجل متابعة اللاعب" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="trd-header">
          <div className="trd-identity">
            {photo
              ? <img src={photo} alt="" className="trd-avatar" />
              : <span className="trd-avatar placeholder">{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>}
            <div>
              <span className="trd-kicker">سجل متابعة اللاعب</span>
              <h2>{member.first_name} {member.last_name}</h2>
              <div className="trd-tags">
                <span>{TYPE_LABELS[member.type] || 'عضو فريق'}</span>
                {member.team_name && <span>{member.team_name}</span>}
                {member.Shirt_number && <span>#{member.Shirt_number}</span>}
              </div>
            </div>
          </div>
          <button type="button" className="trd-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        {/* Summary */}
        <div className="trd-kpis">
          <div className="trd-kpi accent">
            <span className="trd-kpi-icon"><Wallet size={18} /></span>
            <small>الرصيد المتبقي</small>
            <strong>{formatCurrency(controller.getRemainingAmount(member.id))}</strong>
          </div>
          <div className="trd-kpi">
            <span className="trd-kpi-icon"><FileSignature size={18} /></span>
            <small>إجمالي العقود</small>
            <strong>{formatCurrency(controller.getContractValue(member.id))}</strong>
          </div>
          <div className="trd-kpi red">
            <span className="trd-kpi-icon"><Landmark size={18} /></span>
            <small>إجمالي السلف</small>
            <strong>{formatCurrency(controller.getAdvances(member.id))}</strong>
          </div>
          <div className={`trd-kpi ${inPossession > 0 ? 'amber' : 'green'}`}>
            <span className="trd-kpi-icon"><Package size={18} /></span>
            <small>عتاد بحوزته</small>
            <strong>{record.isLoading ? '…' : inPossession}</strong>
          </div>
          <div className={`trd-kpi ${record.disciplinary.length > 0 ? 'red' : 'green'}`}>
            <span className="trd-kpi-icon"><Scale size={18} /></span>
            <small>إجراءات تأديبية</small>
            <strong>{record.isLoading ? '…' : record.disciplinary.length}</strong>
          </div>
          <div className="trd-kpi">
            <span className="trd-kpi-icon"><CalendarX size={18} /></span>
            <small>غياب / تأخر</small>
            <strong>{record.isLoading ? '…' : `${absenceCount} / ${lateCount}`}</strong>
          </div>
        </div>

        {/* Tabs */}
        <nav className="trd-tabs" role="tablist">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <Icon size={17} />
              {label}
              {count !== undefined && !(record.isLoading && id !== 'financial') && <span className="trd-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="trd-body">
          {tab === 'financial' && (
            <>
              {contracts.length > 0 && (
                <div className="trd-contracts">
                  {contracts.map((contract, i) => {
                    const value = Number(contract.contractValue) || Number(contract.Contract_value) || 0;
                    const paid = controller.getPaidForContract(member.id, contract);
                    const percent = value > 0 ? Math.min(100, Math.round((paid / value) * 100)) : 0;
                    return (
                      <section key={contract.id || i} className="trd-card trd-contract">
                        <div className="trd-card-title">
                          <FileSignature size={17} />
                          عقد موسم {contract.startDate || contract.start_date || 'غير محدد'}
                          <span className="trd-percent">{percent}%</span>
                        </div>
                        <div className="trd-contract-values">
                          <div><small>قيمة العقد</small><b>{formatCurrency(value)}</b></div>
                          <div><small>المدفوع</small><b className="pos">{formatCurrency(paid)}</b></div>
                          <div><small>المتبقي</small><b className="accent">{formatCurrency(value - paid)}</b></div>
                        </div>
                        <div className="trd-progress"><div style={{ width: `${percent}%` }} /></div>
                      </section>
                    );
                  })}
                </div>
              )}

              <section className="trd-card">
                <div className="trd-card-title"><Landmark size={17} /> سجل العمليات والمدفوعات</div>
                <table className="trd-table">
                  <thead>
                    <tr><th>التاريخ</th><th>النوع</th><th>طريقة الدفع</th><th>المبلغ</th></tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? loadingRow(4, 'لا توجد عمليات مسجلة حالياً') : payments.map((p, i) => {
                      const deduction = isDeduction(p.amountNature);
                      return (
                        <tr key={p.id || i}>
                          <td>{formatDate(p.paymentDate || p.created_at)}</td>
                          <td>
                            <span className={`trd-pill ${deduction ? 'neg' : p.amountNature === 'سلفة' ? 'info' : 'pos'}`}>
                              {deduction ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                              {p.amountNature || 'دفع'}
                            </span>
                          </td>
                          <td>{p.paymentMethod || '—'}</td>
                          <td className={`trd-amount ${deduction ? 'neg' : 'pos'}`}>{formatCurrency(Number(p.amount) || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {tab === 'equipment' && (
            <section className="trd-card">
              <div className="trd-card-title"><Package size={17} /> حركة المعدات الخاصة باللاعب</div>
              <table className="trd-table">
                <thead>
                  <tr><th>العتاد</th><th>الكمية</th><th>تاريخ التسليم</th><th>تاريخ الإرجاع</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {record.isLoading ? loadingRow(5) : record.movements.length === 0 ? loadingRow(5, 'لا توجد حركة معدات لهذا العضو') : record.movements.map((m, i) => (
                    <tr key={i}>
                      <td className="trd-strong"><Shirt size={15} /> {movementName(m, i)}</td>
                      <td><span className="trd-qty">×{m.quantity || 1}</span></td>
                      <td>{formatDate(m.delivery_date)}</td>
                      <td>{m.return_date ? formatDate(m.return_date) : '—'}</td>
                      <td><span className={`trd-pill ${m.return_date ? 'pos' : 'warn'}`}>{m.return_date ? 'مُرجع' : 'بحوزته'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === 'disciplinary' && (record.isLoading ? (
            <div className="trd-empty">جاري التحميل...</div>
          ) : record.disciplinary.length === 0 ? (
            <div className="trd-empty good"><CheckCircle2 size={40} /><strong>سجل نظيف</strong><span>لا توجد أي إجراءات تأديبية مسجلة لهذا العضو.</span></div>
          ) : (
            <div className="trd-disc-grid">
              {record.disciplinary.map(d => {
                const Icon = DISCIPLINARY_ICONS[d.actionType] || AlertTriangle;
                const status = disciplinaryStatus(d);
                return (
                  <section key={d.id} className="trd-card trd-disc">
                    <div className="trd-disc-head">
                      <span className="trd-disc-type"><Icon size={15} /> {d.actionType}</span>
                      <span className={`trd-pill ${DISCIPLINARY_STATUS_TONE[status] || 'muted'}`}>{status}</span>
                    </div>
                    <div className="trd-meta"><Calendar size={14} /> {formatDate(d.incidentDate)}</div>
                    <p className="trd-text">{d.reason}</p>
                    {d.decision_outcome && <div className="trd-decision"><Gavel size={15} /> {d.decision_outcome}</div>}
                  </section>
                );
              })}
            </div>
          ))}

          {tab === 'absences' && (
            <section className="trd-card">
              <div className="trd-card-title">
                <CalendarX size={17} /> سجل الغياب والتأخر
                <div className="trd-filter" role="tablist" aria-label="نوع السجل">
                  {([['all', 'الكل'], ['absence', `الغياب (${absenceCount})`], ['late', `التأخر (${lateCount})`]] as [AbsenceFilter, string][]).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={absenceFilter === id} className={absenceFilter === id ? 'active' : ''} onClick={() => setAbsenceFilter(id)}>{label}</button>
                  ))}
                </div>
              </div>
              <table className="trd-table">
                <thead>
                  <tr><th>التاريخ</th><th>النوع</th><th>النشاط</th><th>التبرير</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {record.isLoading ? loadingRow(5) : shownAbsences.length === 0 ? loadingRow(5, 'لا توجد سجلات') : shownAbsences.map(a => {
                    const kind = absenceKind(a);
                    const status = absenceStatus(a);
                    const Icon = ABSENCE_KIND_ICONS[kind.kind];
                    return (
                      <tr key={a.id}>
                        <td>{formatDate(a.event_date)}</td>
                        <td><span className={`trd-kind kind-${kind.kind}`}><Icon size={13} /> {kind.label}</span></td>
                        <td>
                          {a.event_category || '—'}{a.meeting_topic ? ` - ${a.meeting_topic}` : ''}
                          {kind.kind === 'late' && a.duration && <div className="trd-sub"><Clock size={12} /> مدة التأخر: {a.duration}</div>}
                        </td>
                        <td>{a.reason || '—'}</td>
                        <td><span className={`trd-pill ${status.tone}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
