import React, { useState } from 'react';
import {
  Landmark, Pencil, Trash2, HandCoins, Wallet, Tag, CalendarDays, CalendarClock, Phone, FileText, History, X, CreditCard, Scale, CircleCheck,
} from 'lucide-react';
import { TaskPanel } from '../../Tasks/parts/TaskPanel';
import { moneyText } from '../../../Mobile/MobileContracts/contractUtils';
import { parseDate } from '../../Tasks/taskUtils';
import type { DebtsController } from '../useDebtsController';
import { dayText, dueText, KIND_META, toneOf, type Debt, type DebtRepayment } from '../debtUtils';
import { CreditorAvatar, DebtBar, PaidRing, StatusPill } from './DebtCard';

const MONTHS_SHORT = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** Day and month of a repayment, as a small calendar tile */
const DayTile: React.FC<{ date: string | null }> = ({ date }) => {
  const d = parseDate(date);
  return (
    <span className="db-day" aria-hidden="true">
      <b>{d ? String(d.getDate()).padStart(2, '0') : '--'}</b>
      <small>{d ? MONTHS_SHORT[d.getMonth()] : ''}</small>
    </span>
  );
};

/** A debt: who and what (head), the three amounts with the paid ring, every repayment, and the debt's facts */
export const DebtDetails: React.FC<{ c: DebtsController; debt: Debt; mobile: boolean }> = ({ c, debt: d, mobile }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancelling, setCancelling] = useState<DebtRepayment | null>(null);
  const tone = toneOf(d);
  const due = dueText(d);
  const paid = d.status === 'paid';

  const footer = (
    <div className="tk-actions">
      {c.can('repay') && !paid && (
        <button type="button" className="tk-btn primary" onClick={() => c.openRepay(d)}><HandCoins size={16} />تسديد</button>
      )}
      {c.can('edit') && <button type="button" className="tk-btn ghost" onClick={() => c.openForm(d)}><Pencil size={16} />تعديل</button>}
      {c.can('delete') && <button type="button" className="tk-btn ghost danger-text" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />حذف</button>}
      {!mobile && <button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={c.closeDebt}>إغلاق</button>}
    </div>
  );
  const hasFooter = !mobile || c.can('repay') || c.can('edit') || c.can('delete');

  const facts = [
    d.kind === 'loan'
      ? { icon: Wallet, label: 'الصندوق المستلم', value: d.fund_name || '—' }
      : { icon: Tag, label: 'طبيعة المصروف', value: d.expense_nature || 'اخرى' },
    { icon: CalendarDays, label: d.kind === 'loan' ? 'تاريخ الاستلاف' : 'تاريخ الشراء', value: dayText(d.debt_date) },
    { icon: CalendarClock, label: 'آخر أجل', value: d.due_date ? dayText(d.due_date) : 'غير محدد', late: d.overdue },
    ...(d.creditor_phone ? [{ icon: Phone, label: 'الهاتف', value: d.creditor_phone, phone: true }] : []),
  ];

  return (
    <TaskPanel mobile={mobile} size="lg" icon={Landmark} title={d.kind === 'loan' ? 'تفاصيل الدين' : 'تفاصيل الشراء بالدين'} onClose={c.closeDebt} footer={hasFooter ? footer : undefined}>
      <div className="tk-view db-view">
        {/* Head: who and what, then the amounts */}
        <section className={`db-sheet tone-${tone}`}>
          <div className="db-sheet-head">
            <CreditorAvatar debt={d} big />
            <div className="db-sheet-title">
              <span className="db-kind-label">{KIND_META[d.kind].label}</span>
              <h2>{d.creditor}</h2>
              {d.title && <p>{d.title}</p>}
            </div>
            <div className="db-sheet-status">
              <StatusPill debt={d} />
              {due && <small className={d.overdue ? 'late' : ''}><CalendarClock size={12} />{due}</small>}
            </div>
          </div>

          <div className="db-figures">
            <div>
              <small><Scale size={13} />قيمة الدين</small>
              <b>{moneyText(d.amount)}</b>
            </div>
            <div>
              <small><CircleCheck size={13} />المسدد</small>
              <b className="db-paid">{moneyText(d.repaid)}</b>
            </div>
            <div>
              <small><HandCoins size={13} />الباقي</small>
              <b className={d.remaining > 0 ? 'db-left' : 'db-paid'}>{moneyText(d.remaining)}</b>
            </div>
            <PaidRing debt={d} size={mobile ? 54 : 64} />
          </div>
          <DebtBar debt={d} />
        </section>

        <div className="tk-view-grid">
          <div className="tk-view-main">
            <section className="tk-card-box">
              <h3><History size={16} />سجل التسديدات <b>{d.repayments.length}</b></h3>
              {d.repayments.length === 0 ? (
                <div className="db-empty">
                  <HandCoins size={26} />
                  <p>لم يُسدد أي مبلغ بعد</p>
                  {c.can('repay') && !paid && <button type="button" className="tk-btn ghost sm" onClick={() => c.openRepay(d)}><HandCoins size={15} />تسديد الآن</button>}
                </div>
              ) : (
                <ol className="db-timeline">
                  {d.repayments.map(r => (
                    <li key={r.id}>
                      <DayTile date={r.paid_on} />
                      <div className="db-tl-text">
                        <b>{moneyText(r.amount)}</b>
                        <span>
                          <Wallet size={12} />{r.fund_name || 'خارج الصناديق'}
                          {r.payment_method && <><i />{r.payment_method}</>}
                        </span>
                        {r.notes && <em>{r.notes}</em>}
                      </div>
                      {c.can('repay') && (
                        <button type="button" className="tk-icon-btn sm db-tl-cancel" title="إلغاء التسديد" aria-label="إلغاء التسديد" onClick={() => setCancelling(r)}>
                          <X size={15} />
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside className="tk-view-side">
            <section className="tk-card-box">
              <h3><FileText size={16} />معلومات</h3>
              <dl className="db-facts">
                {[...facts, { icon: CreditCard, label: 'عدد التسديدات', value: String(d.repayments.length) }].map(f => (
                  <div key={f.label} className={'late' in f && f.late ? 'late' : ''}>
                    <span className="db-fact-icon"><f.icon size={15} /></span>
                    <span className="db-fact-text">
                      <dt>{f.label}</dt>
                      <dd>{'phone' in f && f.phone ? <a href={`tel:${f.value}`} dir="ltr">{f.value}</a> : f.value}</dd>
                    </span>
                  </div>
                ))}
              </dl>
            </section>

            {d.notes && (
              <section className="tk-card-box">
                <h3><FileText size={16} />ملاحظات</h3>
                <p className="tk-text">{d.notes}</p>
              </section>
            )}

          </aside>
        </div>
      </div>

      {confirmDelete && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title="حذف الدين"
          onClose={() => setConfirmDelete(false)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setConfirmDelete(false)}>إلغاء</button>
              <button type="button" className="tk-btn danger" onClick={() => { setConfirmDelete(false); c.remove(d); }}><Trash2 size={17} />حذف</button>
            </>
          )}
        >
          <p className="tk-text">
            يُحذف دين «{d.creditor}» نهائياً مع كل تسديداته
            {d.kind === 'loan' ? '، ويُسحب مبلغه من رصيد الصندوق وتُعاد مبالغ التسديدات إلى صناديقها.' : '، وتُحذف مصاريف تسديداته وتُعاد مبالغها إلى صناديقها.'}
          </p>
        </TaskPanel>
      )}

      {cancelling && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title="إلغاء التسديد"
          onClose={() => setCancelling(null)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setCancelling(null)}>رجوع</button>
              <button type="button" className="tk-btn danger" onClick={() => { const r = cancelling; setCancelling(null); c.removeRepayment(r.id); }}><X size={17} />إلغاء التسديد</button>
            </>
          )}
        >
          <p className="tk-text">
            يُلغى تسديد {moneyText(cancelling.amount)} بتاريخ {dayText(cancelling.paid_on)}
            {cancelling.fund_name ? ` ويُعاد المبلغ إلى «${cancelling.fund_name}»` : ''}
            {d.kind === 'purchase' ? '، ويُحذف من المصاريف.' : '.'}
          </p>
        </TaskPanel>
      )}
    </TaskPanel>
  );
};
