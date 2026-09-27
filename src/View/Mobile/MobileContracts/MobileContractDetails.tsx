import React from 'react';
import {
  Pencil, CalendarClock, Wallet, Banknote, Trophy, Goal, Bus, StickyNote, CheckCircle2, AlertTriangle, Hash, CalendarRange,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import type { ContractModel } from '../../Screen/Contracts/contract_model';
import type { MemberModel } from '../../Screen/Members/member_model';
import { moneyText, contractNumber, seasonText, STATUS_LABEL, installmentsTotal, photoOf, paymentsText } from './contractUtils';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileContractDetailsProps {
  contract: ContractModel;
  person?: MemberModel;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}

// One contract (phone): value, payment schedule, salary and bonuses, notes
export const MobileContractDetails: React.FC<MobileContractDetailsProps> = ({ contract: x, person, canEdit, onEdit, onClose }) => {
  const installments = x.installments || [];
  const sum = installmentsTotal(installments);
  const diff = x.contractValue - sum;

  const extras = [
    { label: 'الراتب الشهري', value: x.monthlySalary, icon: Banknote },
    { label: 'منحة المقابلات', value: x.winBonus, icon: Trophy },
    { label: 'منحة الأهداف', value: x.goalsBonus, icon: Goal },
    { label: 'مصاريف النقل', value: x.transportationExpenses, icon: Bus },
  ];

  return (
    <MobileScreen
      title="تفاصيل العقد"
      onBack={onClose}
      footer={canEdit ? <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> تعديل العقد</button> : undefined}
    >
      <section className="mct-hero">
        <div className="mct-person">
          <img src={photoOf(person)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
          <div>
            <strong>{x.beneficiary}</strong>
            <span>{x.contractType}</span>
          </div>
          <em className={`mct-status on-dark ${x.status}`}><i />{STATUS_LABEL[x.status] || x.status}</em>
        </div>
        <div className="mct-total">
          <small><Wallet size={13} /> قيمة العقد</small>
          <strong dir="ltr">{moneyText(x.contractValue)}</strong>
        </div>
        <div className="mct-hero-facts">
          <span><Hash size={14} /> عقد رقم <b dir="ltr">{contractNumber(x)}</b></span>
          <span><CalendarRange size={14} /> موسم <b dir="ltr">{seasonText(x)}</b></span>
        </div>
      </section>

      {/* Payment schedule */}
      <section className="me-card">
        <h3 className="me-section-title"><span><CalendarClock size={16} /></span>جدول الدفعات</h3>
        {installments.length === 0 ? (
          <p className="mct-none">لا توجد دفعات مخصصة</p>
        ) : (
          <>
            <ol className="mct-schedule">
              {installments.map((inst, i) => {
                const share = x.contractValue > 0 ? Math.min(100, (inst.amount / x.contractValue) * 100) : 0;
                return (
                  <li key={i}>
                    <span className="mct-schedule-num">{i + 1}</span>
                    <div className="mct-schedule-body">
                      <div className="mct-schedule-row">
                        <strong>الدفعة {inst.installment_number}</strong>
                        <b dir="ltr">{moneyText(inst.amount)}</b>
                      </div>
                      <div className="mct-bar"><div style={{ width: `${share}%` }} /></div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className={`mct-sum ${Math.abs(diff) > 0.01 ? 'warn' : 'ok'}`}>
              {Math.abs(diff) > 0.01 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>
                <small>مجموع {paymentsText(installments.length)}</small>
                <strong dir="ltr">{moneyText(sum)}</strong>
              </span>
              <em>{Math.abs(diff) > 0.01 ? `${diff > 0 ? 'ينقص' : 'يزيد'} ${moneyText(Math.abs(diff))}` : 'يطابق قيمة العقد'}</em>
            </div>
          </>
        )}
      </section>

      {/* Salary and bonuses */}
      <section className="me-card">
        <h3 className="me-section-title"><span><Banknote size={16} /></span>الراتب والمنح</h3>
        <div className="mct-extras">
          {extras.map(e => (
            <div key={e.label} className={e.value ? '' : 'empty'}>
              <span className="mct-extra-icon"><e.icon size={16} /></span>
              <small>{e.label}</small>
              <strong dir="ltr">{e.value ? moneyText(e.value) : '—'}</strong>
            </div>
          ))}
        </div>
      </section>

      {x.notes && (
        <section className="me-card">
          <h3 className="me-section-title"><span><StickyNote size={16} /></span>ملاحظات</h3>
          <p className="me-text mct-notes">{x.notes}</p>
        </section>
      )}
    </MobileScreen>
  );
};
