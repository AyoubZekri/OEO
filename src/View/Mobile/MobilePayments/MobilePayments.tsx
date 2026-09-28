import React, { useState } from 'react';
import {
  Plus, Eye, Pencil, Trash2, Search, X, Filter, ChevronDown, Wallet, Banknote, Printer, Paperclip, RefreshCw, Calendar,
  CheckCircle2, BookOpen,
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
  type PaymentPermissions, KINDS, kindOf, kindMeta, amountOf, dateOf, methodOf, fundOf, monthKey, monthTitle, compactMoney,
} from './paymentUtils';
import { MobilePaymentDetails } from './MobilePaymentDetails';
import { MobilePaymentForm } from './MobilePaymentForm';
import { MobileReceiptUpload, MobileReceiptView } from './MobileReceipt';
import './MobilePayments.css';

interface MobilePaymentsProps {
  c: ReturnType<typeof usePaymentsController>;
  form: ReturnType<typeof usePaymentForm>;
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
  c, form, can, onPrint, printOpen, onPrintChoose, onPrintClose,
}) => {
  const [kind, setKind] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('payment');
  const [viewing, setViewing] = useState<string | null>(null);

  // c.payments is already filtered by search, fund and nature
  const list = (kind ? c.payments.filter(p => kindOf(p) === kind) : c.payments)
    .slice()
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  const groups = list.reduce<{ key: string; items: PaymentRecord[] }[]>((acc, p) => {
    const key = monthKey(p);
    const last = acc[acc.length - 1];
    if (last && last.key === key) last.items.push(p);
    else acc.push({ key, items: [p] });
    return acc;
  }, []);

  const sumOf = (items: PaymentRecord[]) => items.reduce((s, p) => s + amountOf(p), 0);
  const details = detailsId ? c.payments.find(p => String(p.id) === detailsId) : undefined;
  const fund = c.funds.find(f => String(f.id) === c.selectedFundFilter);
  const personOf = (p: PaymentRecord) => c.getMemberDetails(p.memberId);
  const nameOf = (p: PaymentRecord) => {
    const m = personOf(p);
    return m ? `${m.firstName} ${m.lastName}`.trim() : null;
  };

  const menuItems = (p: PaymentRecord): MobileRowMenuItem[] => {
    const url = receiptUrl(p);
    return [
      { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(p.id) },
      ...(can.print ? [{ key: 'print', label: 'طباعة الوصل', icon: Printer, color: '#ea580c', onClick: () => onPrint(p) }] : []),
      { key: 'upload', label: 'إرفاق وصل العملية', icon: Paperclip, color: '#3b82f6', onClick: () => c.openUploadDialog(p) },
      ...(url ? [{ key: 'receipt', label: 'عرض الوصل', icon: CheckCircle2, color: '#10b981', onClick: () => setViewing(url) }] : []),
      ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => form.handleOpenDialog(p) }] : []),
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
            <small>مجموع العمليات · {c.payments.length}</small>
            <strong dir="ltr">{moneyText(sumOf(c.payments))}</strong>
          </div>
        </div>
        <div className="mpy-stats">
          {KINDS.map(k => (
            <div key={k.value} className={`tone-${k.tone}`}>
              <small><k.icon size={12} /> {k.short}</small>
              <strong>{compactMoney(sumOf(c.payments.filter(p => kindOf(p) === k.value)))}</strong>
            </div>
          ))}
        </div>
      </section>

      <label className="mpy-search">
        <Search size={17} />
        <input type="search" value={c.searchQuery} onChange={e => c.setSearchQuery(e.target.value)} placeholder="ابحث بالاسم، النوع أو التاريخ..." />
        {c.searchQuery && <button type="button" onClick={() => c.setSearchQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
      </label>

      {/* Operation type */}
      <div className="mpy-tabs" role="tablist">
        {[{ value: '', short: 'الكل' }, ...KINDS].map(k => (
          <button key={k.value || 'all'} type="button" role="tab" aria-selected={kind === k.value} className={kind === k.value ? 'active' : ''} onClick={() => setKind(k.value)}>
            {k.short}
          </button>
        ))}
      </div>

      {/* Fund and nature filters: bottom sheets */}
      <div className="mpy-filters">
        <MobileSelect
          label="تصفية حسب الصندوق"
          icon={Wallet}
          value={c.selectedFundFilter}
          options={[{ value: 'all', label: 'كل الصناديق' }, ...c.funds.map(f => ({ value: String(f.id), label: f.name }))]}
          onChange={c.setSelectedFundFilter}
          renderTrigger={open => (
            <button type="button" className={`mpy-filter ${fund ? 'active' : ''}`} onClick={open}>
              <Wallet size={16} />
              <span><small>الصندوق</small><strong>{fund?.name || 'الكل'}</strong></span>
              <ChevronDown size={16} />
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
              <Filter size={16} />
              <span><small>طبيعة المبلغ</small><strong>{c.filterNature === 'all' ? 'الكل' : c.filterNature}</strong></span>
              <ChevronDown size={16} />
            </button>
          )}
        />
      </div>

      {c.isLoading && !c.payments.length ? (
        <MobileLoader text="جاري تحميل العمليات..." />
      ) : groups.length === 0 ? (
        <div className="mpy-empty">
          <span className="mpy-empty-icon"><Banknote size={36} /></span>
          <strong>لا توجد عمليات</strong>
          <p>{c.searchQuery || kind || fund || c.filterNature !== 'all' ? 'غيّر البحث أو التصفية.' : can.add ? 'أضف دفعة أو مصروفاً بالزر +' : ''}</p>
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
        <button type="button" className="mpy-fab" onClick={() => form.handleOpenDialog()} aria-label="إضافة دفعة أو مصروف" title="إضافة دفعة أو مصروف">
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
