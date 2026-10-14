import React, { useState } from 'react';
import {
  Plus, Eye, Pencil, Trash2, Search, X, Filter, ChevronDown, Wallet, Banknote, Printer, Paperclip, RefreshCw, Calendar,
  CheckCircle2, BookOpen, Clock, HandCoins, ArrowLeftRight, Layers, Repeat,
} from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileSheet } from '../widgets/MobileSheet';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { usePaymentsController } from '../../Screen/Payments/PaymentsController';
import type { PaymentRecord } from '../../Screen/Payments/payment_model';
import { type usePaymentForm, MEMBER_NATURES, EXPENSE_NATURES } from '../../Screen/Payments/usePaymentForm';
import { paymentNatureText, receiptUrl } from '../../Screen/Payments/paymentText';
import { moneyText } from '../MobileContracts/contractUtils';
import {
  type PaymentPermissions, KINDS, kindOf, kindMeta, amountOf, dateOf, methodOf, fundOf, monthKey, monthTitle,
} from './paymentUtils';
import type { DebtsController } from '../../Screen/Debts/useDebtsController';
import { DebtOverlays } from '../../Screen/Debts/parts/DebtOverlays';
import { creditRows, isCredit } from '../../Screen/Payments/creditRows';
import { MobilePaymentDetails } from './MobilePaymentDetails';
import { MobilePaymentForm } from './MobilePaymentForm';
import { MobileReceiptUpload, MobileReceiptView } from './MobileReceipt';
import { TransferPaymentDialog } from '../../Screen/Payments/TransferPaymentDialog';
import { TransferableDialog } from '../../Screen/Payments/TransferableDialog';
import { BulkTransferDialog } from '../../Screen/Payments/BulkTransferDialog';
import './MobilePayments.css';

interface MobilePaymentsProps {
  c: ReturnType<typeof usePaymentsController>;
  form: ReturnType<typeof usePaymentForm>;
  /** Expenses bought on credit */
  credit: DebtsController;
  can: PaymentPermissions;
  onPrint: (payment: PaymentRecord) => void;
  printOpen: boolean;
  onPrintChoose: (options: { includeRegulations: boolean; printReceipt: boolean }) => void;
  onPrintClose: () => void;
}

const NATURE_OPTIONS = [
  { value: 'all', label: 'كل الأنواع' },
  ...MEMBER_NATURES.map(n => ({ value: n, label: n, group: 'مستحقات الأعضاء' })),
  ...EXPENSE_NATURES.filter(n => !MEMBER_NATURES.includes(n)).map(n => ({ value: n, label: n, group: 'المصاريف' })),
];

// Phone version of the payments page: totals, search, filters, operations grouped by month; every action on its own page
export const MobilePayments: React.FC<MobilePaymentsProps> = ({
  c, form, credit, can, onPrint, printOpen, onPrintChoose, onPrintClose,
}) => {
  // (?paid=unpaid, from the home page's unpaid in-kind debts card)
  const [kind, setKind] = useState(() => (new URLSearchParams(window.location.search).get('paid') === 'unpaid' ? 'unpaid' : ''));
  const [detailsId, setDetailsId] = useUrlDetails('payment');
  const [viewing, setViewing] = useState<string | null>(null);

  // c.payments is already filtered by search, fund and nature (purchases on credit paid in full included);
  // the purchases not fully paid are expenses too. "unpaid": only those.
  const unpaid = creditRows(credit.debts, { search: c.searchQuery, nature: c.filterNature, fund: c.selectedFundFilter });
  const byStatus = (status: string) => unpaid.filter(r => r.credit.status === status);
  const list = (kind === 'unpaid' ? [...unpaid] : kind === 'open' || kind === 'partial' ? byStatus(kind) : [
    ...(kind && kind !== 'مصروف' ? [] : unpaid),
    ...(kind ? c.payments.filter(p => kindOf(p) === kind) : c.payments),
  ])
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  const groups = list.reduce<{ key: string; items: PaymentRecord[] }[]>((acc, p) => {
    const key = monthKey(p);
    const last = acc[acc.length - 1];
    if (last && last.key === key) last.items.push(p);
    else acc.push({ key, items: [p] });
    return acc;
  }, []);

  // Money paid: an unpaid purchase on credit is not counted
  // Money paid: a purchase on credit counts for what has been paid on it
  const sumOf = (items: PaymentRecord[]) => items.reduce((s, p) => s + (isCredit(p) ? p.credit.repaid : amountOf(p)), 0);
  // Every operation, purchases on credit included (one row each), for the totals
  const everything: PaymentRecord[] = [...unpaid, ...c.payments];
  const details = detailsId ? c.payments.find(p => String(p.id) === detailsId) : undefined;
  const fund = c.funds.find(f => String(f.id) === c.selectedFundFilter);
  // Operation type choices, with how many operations each one has
  const countText = (n: number) => (n ? ` (${n})` : '');
  const kindOptions = [
    { value: 'all', short: 'الكل', label: `الكل${countText(c.payments.length + unpaid.length)}` },
    ...KINDS.map(k => {
      const n = c.payments.filter(p => kindOf(p) === k.value).length + (k.value === 'مصروف' ? unpaid.length : 0);
      return { value: k.value as string, short: k.short, label: `${k.label}${countText(n)}` };
    }),
    { value: 'unpaid', short: 'غير مسددة', label: `مشتريات غير مدفوعة ومدفوعة جزئياً${countText(unpaid.length)}` },
    { value: 'open', short: 'غير مدفوعة', label: `مشتريات غير مدفوعة${countText(byStatus('open').length)}` },
    { value: 'partial', short: 'مدفوعة جزئياً', label: `مشتريات مدفوعة جزئياً${countText(byStatus('partial').length)}` },
  ];
  const personOf = (p: PaymentRecord) => c.getMemberDetails(p.memberId);
  const nameOf = (p: PaymentRecord) => {
    const m = personOf(p);
    return m ? `${m.firstName} ${m.lastName}`.trim() : p.creditor || null;
  };

  const menuItems = (p: PaymentRecord): MobileRowMenuItem[] => {
    const url = receiptUrl(p);
    return [
      { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(p.id) },
      ...(can.print ? [{ key: 'print', label: 'طباعة الوصل', icon: Printer, color: '#ea580c', onClick: () => onPrint(p) }] : []),
      { key: 'upload', label: 'إرفاق وصل العملية', icon: Paperclip, color: '#3b82f6', onClick: () => c.openUploadDialog(p) },
      ...(url ? [{ key: 'receipt', label: 'عرض الوصل', icon: CheckCircle2, color: '#10b981', onClick: () => setViewing(url) }] : []),
      ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => form.handleOpenDialog(p) }] : []),
      ...(can.edit && c.hasTransferable(p) ? [{ key: 'transferable', label: 'تعديل قابلية التحويل', icon: Repeat, color: '#0d9488', onClick: () => c.openTransferable(p) }] : []),
      ...(can.edit && c.canTransfer(p) ? [{ key: 'transfer', label: 'تحويل إلى صندوق آخر', icon: ArrowLeftRight, color: '#0ea5e9', onClick: () => c.openTransfer(p) }] : []),
      ...(can.delete ? [
        { key: 'return', label: 'إرجاع المبلغ للصندوق', icon: RefreshCw, color: '#8b5cf6', onClick: () => c.returnPayment(p.id) },
        { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.deletePayment(p.id) },
      ] : []),
    ];
  };

  return (
    <div className="mpy-page">
      <MobileAppBar title="المصاريف والمدفوعات" />

      {/* Totals */}
      <section className="mpy-hero">
        <div className="mpy-hero-top">
          <span className="mpy-hero-icon"><Banknote size={26} /></span>
          <div>
            <small>مجموع العمليات · {everything.length}</small>
            <strong dir="ltr">{moneyText(sumOf(everything))}</strong>
          </div>
        </div>
        <div className="mpy-stats">
          {KINDS.map(k => (
            <div key={k.value} className={`tone-${k.tone}`}>
              <small><k.icon size={12} /> {k.short}</small>
              <strong dir="ltr">{moneyText(sumOf(everything.filter(p => kindOf(p) === k.value)))}</strong>
            </div>
          ))}
        </div>
      </section>

      {can.edit && c.funds.length > 1 && (
        <button type="button" className="mpy-bulk" onClick={c.openBulk}>
          <Layers size={17} /> تحويل جماعي
        </button>
      )}

      {/* Search and filters: one card */}
      <section className="mpy-filterbar">
        <label className="mpy-search">
          <Search size={17} />
          <input type="search" value={c.searchQuery} onChange={e => c.setSearchQuery(e.target.value)} placeholder="ابحث بالاسم، النوع أو التاريخ..." />
          {c.searchQuery && <button type="button" onClick={() => c.setSearchQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>

        {/* Operation type, fund and nature: each one opens its sheet from the bottom */}
        <div className="mpy-filters three">
          <MobileSelect
            label="تصفية حسب نوع العملية"
            icon={Layers}
            value={kind || 'all'}
            options={kindOptions}
            onChange={v => setKind(v === 'all' ? '' : v)}
            renderTrigger={open => (
              <button type="button" className={`mpy-filter ${kind ? 'active' : ''}`} onClick={open}>
                <span className="mpy-filter-icon"><Layers size={15} /></span>
                <span><small>النوع</small><strong>{kindOptions.find(o => o.value === (kind || 'all'))?.short || 'الكل'}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
          <MobileSelect
            label="تصفية حسب الصندوق"
            icon={Wallet}
            value={c.selectedFundFilter}
            options={[{ value: 'all', label: 'كل الصناديق' }, ...c.funds.map(f => ({ value: String(f.id), label: f.name })), { value: 'none', label: 'صندوق غير محدد' }]}
            onChange={c.setSelectedFundFilter}
            renderTrigger={open => (
              <button type="button" className={`mpy-filter ${fund || c.selectedFundFilter === 'none' ? 'active' : ''}`} onClick={open}>
                <span className="mpy-filter-icon"><Wallet size={15} /></span>
                <span><small>الصندوق</small><strong>{fund?.name || (c.selectedFundFilter === 'none' ? 'غير محدد' : 'الكل')}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
          <MobileSelect
            label="تصفية حسب طبيعة المبلغ"
            icon={Filter}
            value={c.filterNature}
            options={NATURE_OPTIONS}
            onChange={c.setFilterNature}
            searchable
            renderTrigger={open => (
              <button type="button" className={`mpy-filter ${c.filterNature !== 'all' ? 'active' : ''}`} onClick={open}>
                <span className="mpy-filter-icon"><Filter size={15} /></span>
                <span><small>طبيعة المبلغ</small><strong>{c.filterNature === 'all' ? 'الكل' : c.filterNature}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
        </div>

      </section>

      {c.isLoading && !c.payments.length ? (
        <MobileLoader text="جاري تحميل العمليات..." />
      ) : groups.length === 0 ? (
        <div className="mpy-empty">
          <span className="mpy-empty-icon"><Banknote size={36} /></span>
          <strong>لا توجد عمليات</strong>
          <p>{c.searchQuery || kind || fund || c.selectedFundFilter === 'none' || c.filterNature !== 'all' ? 'غيّر البحث أو التصفية.' : can.add ? 'أضف دفعة أو مصروفاً بالزر +' : ''}</p>
        </div>
      ) : (
        <div className="mpy-list">
          {groups.map(g => (
            <section key={g.key} className="mpy-group">
              <header className="mpy-group-head">
                <strong><Calendar size={14} /> {monthTitle(g.key)}</strong>
                <span dir="ltr">{moneyText(sumOf(g.items))}</span>
              </header>
              {g.items.map(p => {
                if (isCredit(p)) {
                  const d = p.credit;
                  const openDebt = () => credit.openDebt(d);
                  return (
                    <article
                      key={p.id}
                      className="mpy-card tone-amber mpy-credit"
                      role="button"
                      tabIndex={0}
                      onClick={openDebt}
                      onKeyDown={e => { if (e.key === 'Enter') openDebt(); }}
                    >
                      <div className="mpy-card-top">
                        <span className="mpy-kind-icon"><Clock size={19} /></span>
                        <span className="mpy-card-text">
                          <strong>{d.creditor}</strong>
                          <small>{paymentNatureText(p)}</small>
                        </span>
                        <MobileRowMenu
                          label="إجراءات الشراء بالدين"
                          items={[
                            ...(can.add ? [{ key: 'pay', label: 'دفع', icon: HandCoins, color: '#10b981', onClick: () => credit.openRepay(d) }] : []),
                            { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: openDebt },
                            ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => credit.openForm(d) }] : []),
                            ...(can.delete ? [{
                              key: 'delete',
                              label: 'حذف',
                              icon: Trash2,
                              danger: true,
                              onClick: () => {
                                if (window.confirm(`هل أنت متأكد من حذف الشراء بالدين من «${d.creditor}»؟${d.repaid > 0 ? ' (تُعاد المبالغ المدفوعة إلى صناديقها)' : ''}`)) credit.remove(d);
                              },
                            }] : []),
                          ]}
                        />
                      </div>
                      <div className="mpy-card-foot">
                        <em className="mpy-chip"><Calendar size={12} /> <span dir="ltr">{dateOf(p) || '—'}</span></em>
                        <em className={`mpy-chip credit ${d.overdue ? 'late' : ''}`}>{d.overdue ? 'غير مدفوع · متأخر' : d.repaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'}</em>
                        <b className="mpy-amount mpy-credit-paid" dir="ltr">
                          {moneyText(d.repaid)}
                          <small> / {moneyText(d.amount)}</small>
                        </b>
                      </div>
                    </article>
                  );
                }
                const meta = kindMeta(p);
                const name = nameOf(p);
                const nature = paymentNatureText(p);
                const open = () => setDetailsId(p.id);
                return (
                  <article
                    key={p.id}
                    className={`mpy-card tone-${meta.tone}`}
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={e => { if (e.key === 'Enter') open(); }}
                  >
                    <div className="mpy-card-top">
                      <span className="mpy-kind-icon"><meta.icon size={19} /></span>
                      <span className="mpy-card-text">
                        <strong>{name || nature || meta.label}</strong>
                        <small>{name ? nature : fundOf(p, c.funds)?.name || meta.label}</small>
                      </span>
                      <MobileRowMenu items={menuItems(p)} label="إجراءات العملية" />
                    </div>
                    <div className="mpy-card-foot">
                      <em className="mpy-chip"><Calendar size={12} /> <span dir="ltr">{dateOf(p) || '—'}</span></em>
                      {methodOf(p) && <em className="mpy-chip">{methodOf(p)}</em>}
                      {receiptUrl(p) && <em className="mpy-chip ok"><Paperclip size={12} /> وصل</em>}
                      {c.isTransferable(p) && <em className="mpy-chip trf"><Repeat size={12} /> قابل للتحويل</em>}
                      <b className="mpy-amount" dir="ltr">{moneyText(amountOf(p))}</b>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {can.add && (
        <button
          type="button"
          className="mpy-fab"
          onClick={() => form.handleOpenDialog()}
          aria-label="إضافة دفعة أو مصروف"
          title="إضافة دفعة أو مصروف"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobilePaymentDetails
          payment={details}
          person={personOf(details)}
          fundName={fundOf(details, c.funds)?.name}
          contract={c.contracts.find(x => String(x.id) === String(details.contract_id))}
          canEdit={can.edit}
          canPrint={can.print}
          onPrint={() => onPrint(details)}
          onEdit={() => form.handleOpenDialog(details)}
          onUpload={() => c.openUploadDialog(details)}
          onViewReceipt={setViewing}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isDialogOpen && <MobilePaymentForm c={c} form={form} />}

      <DebtOverlays c={credit} mobile />

      {c.isUploadDialogOpen && c.paymentForUpload && (
        <MobileReceiptUpload
          key={c.paymentForUpload.id}
          payment={c.paymentForUpload}
          title={nameOf(c.paymentForUpload) || paymentNatureText(c.paymentForUpload)}
          onUpload={c.uploadReceipt}
          onClose={c.closeUploadDialog}
        />
      )}

      {viewing && <MobileReceiptView url={viewing} onClose={() => setViewing(null)} />}

      {c.bulkOpen && (
        <BulkTransferDialog asPage funds={c.funds} payments={c.allPayments} money={moneyText} onConfirm={c.transferAll} onClose={c.closeBulk} />
      )}

      {c.editingTransferable && (() => {
        const p = c.editingTransferable;
        const m = personOf(p);
        return (
          <TransferableDialog
            amountText={moneyText(p.amount)}
            memberName={m ? `${m.firstName} ${m.lastName}`.trim() : p.creditor || undefined}
            current={c.isTransferable(p)}
            onAnswer={c.answerTransferable}
            onCancel={c.closeTransferable}
          />
        );
      })()}

      {c.transferring && (() => {
        const p = c.transferring;
        const m = personOf(p);
        return (
          <TransferPaymentDialog
            amountText={moneyText(p.amount)}
            memberName={m ? `${m.firstName} ${m.lastName}`.trim() : undefined}
            fromFund={c.funds.find(f => String(f.id) === String(p.fund_id))}
            funds={c.funds}
            money={moneyText}
            onConfirm={fundId => c.transferPayment(p.id, fundId)}
            onClose={c.closeTransfer}
          />
        );
      })()}

      {printOpen && (
        <MobileSheet title="خيارات الطباعة" onClose={onPrintClose}>
          <div className="mpy-print">
            <p>ماذا تريد أن تطبع مع هذا الوصل؟</p>
            <button type="button" className="primary" onClick={() => onPrintChoose({ includeRegulations: true, printReceipt: true })}>
              <BookOpen size={19} /> <span><strong>الوصل + النظام الداخلي</strong></span>
            </button>
            <button type="button" onClick={() => onPrintChoose({ includeRegulations: false, printReceipt: true })}>
              <Printer size={19} /> <span><strong>الوصل فقط</strong></span>
            </button>
            <button type="button" onClick={() => onPrintChoose({ includeRegulations: true, printReceipt: false })}>
              <BookOpen size={19} /> <span><strong>النظام الداخلي فقط</strong></span>
            </button>
          </div>
        </MobileSheet>
      )}
    </div>
  );
};
