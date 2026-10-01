import React, { useState } from 'react';
import { paymentOccasionText } from '../../Screen/Payments/paymentText';
import { List, SearchX, Calendar, Trash2, ChevronDown, ArrowLeft } from 'lucide-react';
import type { useReportsController } from '../../Screen/Reports/ReportsController';
import { moneyText } from '../MobileContracts/contractUtils';
import { txFund, txTo, txAmount } from '../MobileFunds/fundUtils';

const PAGE = 20;

const Empty: React.FC = () => (
  <div className="mrp-empty">
    <span><SearchX size={32} /></span>
    <strong>لا توجد بيانات متاحة لهذا التقرير</strong>
    <p>غيّر الفترة أو التصفية.</p>
  </div>
);

// Records of the active report as cards, shown 20 at a time
export const ReportRecords: React.FC<{ c: ReturnType<typeof useReportsController>; canDeleteTransaction: boolean }> = ({ c, canDeleteTransaction }) => {
  const [limit, setLimit] = useState(PAGE);
  const cat = c.activeCategory;

  let title: string;
  let count: number;
  let items: React.ReactNode[];

  if (cat === 'individuals') {
    const list = c.getIndividualSummary().payments;
    title = 'سجل المدفوعات';
    count = list.length;
    items = list.slice(0, limit).map(p => {
      const m = c.members.find(x => x.id === p.memberId);
      return (
        <article key={p.id} className="mrp-row tone-green">
          <div className="mrp-row-main">
            <strong>{c.selectedMember ? p.amountNature : m ? `${m.first_name} ${m.last_name}` : '-'}</strong>
            <small>
              {!c.selectedMember && <>{p.amountNature}{p.installmentNumber ? ` (${p.installmentNumber})` : ''} · </>}
              {c.selectedMember && p.installmentNumber ? `(${p.installmentNumber}) · ` : ''}
              {p.paymentMethod}
            </small>
          </div>
          <div className="mrp-row-side">
            <b dir="ltr">{moneyText(Number(p.amount) || 0)}</b>
            <small dir="ltr"><Calendar size={11} /> {p.paymentDate}</small>
          </div>
        </article>
      );
    });
  } else if (cat === 'expenses') {
    const list = c.getExpenseSummary().payments;
    title = 'سجل المصاريف';
    count = list.length;
    items = list.slice(0, limit).map(p => {
      const member = p.memberId ? c.members.find(m => String(m.id) === String(p.memberId)) : undefined;
      return (
        <article key={p.id} className={`mrp-row ${p.isReturn ? 'tone-green' : 'tone-red'}`}>
          <div className="mrp-row-main">
            <strong>{p.amountNature}</strong>
            {paymentOccasionText(p) && <small className="mrp-occasion">{paymentOccasionText(p)}</small>}
            <small>{p.kind}{member ? ` · ${member.first_name} ${member.last_name}` : ''} · {p.paymentMethod}</small>
          </div>
          <div className="mrp-row-side">
            <b dir="ltr">{p.isReturn ? '+ ' : ''}{moneyText(Number(p.amount) || 0)}</b>
            <small dir="ltr"><Calendar size={11} /> {p.day || p.paymentDate || '—'}</small>
          </div>
        </article>
      );
    });
  } else if (cat === 'contracts') {
    const list = c.getContractsSummary().contracts;
    title = 'سجل العقود';
    count = list.length;
    items = list.slice(0, limit).map(x => {
      const pct = x.contractValue > 0 ? Math.max(0, Math.min(100, (x.netPaid / x.contractValue) * 100)) : 0;
      return (
        <article key={x.id} className="mrp-contract">
          <div className="mrp-contract-top">
            <span className="mrp-num" dir="ltr">#{x.contractNumber}</span>
            <strong>{x.beneficiary}</strong>
            <small dir="ltr">{x.startDate}{x.endDate ? ` → ${x.endDate}` : ''}</small>
          </div>
          <div className="mrp-bar"><div style={{ width: `${pct}%` }} /></div>
          <div className="mrp-contract-nums">
            <div><small>القيمة</small><b dir="ltr">{moneyText(x.contractValue)}</b></div>
            <div className="paid"><small>المدفوع</small><b dir="ltr">{moneyText(x.netPaid)}</b></div>
            <div className="left"><small>المتبقي</small><b dir="ltr">{moneyText(x.remaining)}</b></div>
          </div>
        </article>
      );
    });
  } else {
    const list = c.getFundsSummary().transactions;
    title = 'سجلات الصناديق';
    count = list.length;
    const nameOf = (id: string) => c.funds.find(f => String(f.id) === id)?.name;
    items = list.slice(0, limit).map(tx => {
      const from = nameOf(txFund(tx)) || '-';
      const to = tx.type === 'تحويل' ? nameOf(txTo(tx)) : undefined;
      const tone = tx.type === 'إيداع' ? 'green' : tx.type === 'سحب' || tx.type === 'تسديد دين' ? 'red' : 'blue';
      return (
        <article key={tx.id} className={`mrp-row tone-${tone}`}>
          <div className="mrp-row-main">
            <strong className="mrp-fundline">{from}{to && <><ArrowLeft size={13} />{to}</>}</strong>
            <small><em className="mrp-type">{tx.type}</em>{tx.description}</small>
          </div>
          <div className="mrp-row-side">
            <b dir="ltr">{moneyText(txAmount(tx))}</b>
            <small dir="ltr"><Calendar size={11} /> {tx.date}</small>
          </div>
          {canDeleteTransaction && (
            <button type="button" className="mrp-del" onClick={() => c.deleteFundTransaction(tx.id)} aria-label="حذف المعاملة" title="حذف">
              <Trash2 size={15} />
            </button>
          )}
        </article>
      );
    });
  }

  return (
    <section className="mrp-records">
      <header>
        <strong><List size={16} /> {title}</strong>
        <span>{count}</span>
      </header>
      {count === 0 ? <Empty /> : (
        <>
          <div className="mrp-list">{items}</div>
          {count > limit && (
            <button type="button" className="mrp-more" onClick={() => setLimit(l => l + PAGE)}>
              <ChevronDown size={16} /> عرض المزيد ({count - limit})
            </button>
          )}
        </>
      )}
    </section>
  );
};
