import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Scale, AlertTriangle, MessageSquare, Calendar, Gavel, FileWarning, Eye, Pencil, Trash2,
  Printer, UploadCloud, FileText, SlidersHorizontal, X, Check, PenLine,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { MobileSheet } from '../widgets/MobileSheet';
import type { MobileSelectOption } from '../widgets/MobileSelect';
import { MobileDisciplinaryDetails } from './MobileDisciplinaryDetails';
import { MobileDisciplinaryReplyView, MobileDisciplinaryReplyForm } from './MobileDisciplinaryReply';
import { MobileDisciplinaryUpload, MobileDisciplinaryDocumentView } from './MobileDisciplinaryDocument';
import { DisciplinaryPrintSheet } from '../../Screen/Disciplinary/Printable/DisciplinaryPrint';
import { printDocsFor, type PrintType } from '../../Screen/Disciplinary/Printable/printDocs';
import { MobileDisciplinaryForm } from './MobileDisciplinaryForm';
import type { useDisciplinaryController } from '../../Screen/Disciplinary/DisciplinaryController';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import { canPrintNow, hasDecision, memberCanReply } from '../../Screen/Disciplinary/clarification';
import './MobileDisciplinary.css';

interface MobileDisciplinaryProps {
  controller: ReturnType<typeof useDisciplinaryController>;
  can: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
    viewReply: boolean;
    print: boolean;
    changeStatus: boolean;
    /** View the signed document without being able to replace it (personal space) */
    viewDocument?: boolean;
    /** Edit the reply / decision from its page (default: yes) */
    editReply?: boolean;
    /** The member answers a clarification request (personal space) */
    memberReply?: boolean;
  };
  title?: string;
  /** Open this action's details (an alert pointed to it) */
  openId?: string | null;
}

// Pages opened from an action; each has its own full screen
type ActionPage = 'reply' | 'answer' | 'decision' | 'upload' | 'document';

// Same filters as the desktop page ('الكل' = no filter)
// "واقعة" is no longer created (a clarification request, then the incident file): old ones still show
const TYPE_FILTERS = ['طلب توضيح', 'استدعاء جلسة'];

const STATUS_OPTIONS: MobileSelectOption[] = [
  { value: 'مفتوح', label: 'مفتوح' },
  { value: 'منفذ', label: 'منفذ' },
  { value: 'غير منفذ', label: 'غير منفذ' },
  { value: 'متأخر', label: 'متأخر' },
  { value: 'ملغى', label: 'ملغى' },
];

const STATUS_TONE: Record<string, string> = {
  'مفتوح': 'open',
  'منفذ': 'done',
  'غير منفذ': 'failed',
  'متأخر': 'late',
  'ملغى': 'cancelled',
};

// Type icon; every type uses the app accent colour
const TYPE_STYLE: Record<string, { icon: React.ComponentType<{ size?: number }>; tone: string }> = {
  'تنبيه': { icon: AlertTriangle, tone: 'accent' },
  'إنذار': { icon: FileWarning, tone: 'accent' },
  'طلب توضيح': { icon: MessageSquare, tone: 'accent' },
  'استدعاء جلسة': { icon: Calendar, tone: 'accent' },
  'إحالة على الجهة التأديبية المختصة': { icon: Gavel, tone: 'accent' },
  'واقعة': { icon: Scale, tone: 'accent' },
};
const DEFAULT_TYPE_STYLE = { icon: AlertTriangle, tone: 'accent' };

// Warnings and reminders have no reply or decision (same rule as desktop)
const hasReply = (item: DisciplinaryModel) => !['تنبيه', 'إنذار'].includes(item.actionType);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

// Phone version of the disciplinary actions page: short cards, filters in a sheet, details on their own page
export const MobileDisciplinary: React.FC<MobileDisciplinaryProps> = ({ controller, can, title, openId }) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the action an alert pointed to
  useEffect(() => { if (openId) setDetailsId(openId); }, [openId]);
  const [page, setPage] = useState<{ kind: ActionPage; id: string } | null>(null);

  const list = controller.disciplinaryList;
  // Looked up by id so status changes show immediately; closes by itself if the item is deleted
  const detailsItem = detailsId ? list.find(d => d.id === detailsId) : undefined;
  const pageItem = page ? list.find(d => d.id === page.id) : undefined;
  const replyItem = controller.isResponseDialogOpen ? controller.editingItem : null;
  const open = (kind: ActionPage, item: DisciplinaryModel) => () => setPage({ kind, id: item.id });
  const [printing, setPrinting] = useState<{ item: DisciplinaryModel; type: PrintType } | null>(null);
  const activeFilters = (controller.filterType !== 'الكل' ? 1 : 0) + (controller.filterStatus !== 'الكل' ? 1 : 0);

  const photoOf = (item: DisciplinaryModel) => {
    const member = controller.members.find(m => String(m.id) === String(item.memberId));
    return member?.photo && !member.photo.includes('ui-avatars.com') ? member.photo : defaultAvatar;
  };

  const menuItems = (item: DisciplinaryModel): MobileRowMenuItem[] => [
    ...(can.view ? [{ key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(item.id) }] : []),
    // The member: their reply (a clarification request), and the decision once written
    ...(can.memberReply ? [
      ...(item.actionType === 'طلب توضيح' && item.player_statements?.trim() ? [{ key: 'reply', label: 'ردي', icon: MessageSquare, color: '#f97316', onClick: open('answer', item) }] : []),
      ...(hasDecision(item) ? [{ key: 'decision', label: 'عرض القرار', icon: Gavel, color: '#f97316', onClick: open('decision', item) }] : []),
    ] : hasReply(item) && can.viewReply
      ? item.actionType === 'طلب توضيح'
        ? [
          { key: 'reply', label: 'رد العضو', icon: MessageSquare, color: '#f97316', onClick: open('answer', item) },
          { key: 'decision', label: 'القرار', icon: Gavel, color: '#f97316', onClick: open('decision', item) },
        ]
        : [{ key: 'reply', label: 'الرد والقرارات', icon: MessageSquare, color: '#f97316', onClick: open('reply', item) }]
      : []),
    ...(can.edit ? [item.signed_document
      ? { key: 'doc', label: 'عرض الوثيقة الممضاة', icon: FileText, color: '#f97316', onClick: open('document', item) }
      : { key: 'doc', label: 'رفع الوثيقة الممضاة', icon: UploadCloud, color: '#f97316', onClick: open('upload', item) }]
      : can.viewDocument && item.signed_document
        ? [{ key: 'doc', label: 'عرض الوثيقة الممضاة', icon: FileText, color: '#f97316', onClick: open('document', item) }]
        : []),
    ...(can.memberReply && memberCanReply(item)
      ? [{ key: 'answer', label: item.player_statements ? 'تعديل ردي' : 'الرد على الطلب', icon: PenLine, color: '#10b981', onClick: () => controller.openResponseDialog(item) }]
      : []),
    ...(can.print && canPrintNow(item)
      ? printDocsFor(item).map(doc => ({ key: `print-${doc.type}`, label: doc.label, icon: Printer, color: '#f97316', onClick: () => setPrinting({ item, type: doc.type }) }))
      : []),
    ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => controller.openEditDialog(item) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => controller.handleDelete(item.id) }] : []),
  ];

  const filterOption = (label: string, active: boolean, onClick: () => void, tone?: string) => (
    <button key={label} type="button" className={`md-option ${tone || ''} ${active ? 'active' : ''}`} onClick={onClick}>
      {active && <Check size={15} />}
      {label}
    </button>
  );

  return (
    <div className="md-page">
      <MobileAppBar title={title || 'الإجراءات التأديبية'} />

      {/* Search + filter button */}
      <div className="md-toolbar">
        <label className="md-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="ابحث باسم العضو أو السبب..."
            value={controller.searchQuery}
            onChange={e => controller.setSearchQuery(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`md-filter-btn ${activeFilters ? 'active' : ''}`}
          onClick={() => setFiltersOpen(true)}
          aria-label="الفلاتر"
        >
          <SlidersHorizontal size={19} />
          {activeFilters > 0 && <span className="md-filter-count">{activeFilters}</span>}
        </button>
      </div>

      {/* Active filters, each removable */}
      {activeFilters > 0 && (
        <div className="md-active-filters">
          {controller.filterType !== 'الكل' && (
            <button type="button" onClick={() => controller.setFilterType('الكل')}>
              {controller.filterType} <X size={13} />
            </button>
          )}
          {controller.filterStatus !== 'الكل' && (
            <button type="button" className={STATUS_TONE[controller.filterStatus]} onClick={() => controller.setFilterStatus('الكل')}>
              {controller.filterStatus} <X size={13} />
            </button>
          )}
        </div>
      )}

      {controller.isLoading ? (
        <MobileLoader text="جاري تحميل الإجراءات..." />
      ) : list.length === 0 ? (
        <div className="md-empty">
          <Scale size={44} />
          <strong>لا توجد إجراءات تأديبية</strong>
          <p>لم يتم العثور على أي إجراء يطابق بحثك.</p>
        </div>
      ) : (
        <div className="md-list">
          {list.map(item => {
            const type = TYPE_STYLE[item.actionType] || DEFAULT_TYPE_STYLE;
            const TypeIcon = type.icon;
            return (
              <article
                key={item.id}
                className={`md-row tone-${type.tone} ${controller.deletingId === item.id ? 'deleting' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setDetailsId(item.id)}
                onKeyDown={e => { if (e.key === 'Enter') setDetailsId(item.id); }}
              >
                <span className="md-row-icon"><TypeIcon size={19} /></span>
                <span className="md-row-text">
                  <strong>{item.memberName}</strong>
                  <small>{item.actionType} · {formatDate(item.incidentDate)}</small>
                </span>
                <span className={`md-status ${STATUS_TONE[item.status] || 'open'}`}>{item.status}</span>
                <MobileRowMenu items={menuItems(item)} label="إجراءات" />
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="md-fab" onClick={controller.openAddDialog} aria-label="إضافة إجراء" title="إضافة إجراء">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {/* Filters sheet */}
      {filtersOpen && (
        <MobileSheet
          title="الفلاتر"
          onClose={() => setFiltersOpen(false)}
          footer={(
            <>
              <button
                type="button"
                className="md-sheet-btn"
                onClick={() => { controller.setFilterType('الكل'); controller.setFilterStatus('الكل'); }}
              >
                إعادة ضبط
              </button>
              <button type="button" className="md-sheet-btn primary" onClick={() => setFiltersOpen(false)}>
                عرض النتائج ({list.length})
              </button>
            </>
          )}
        >
          <h4 className="md-sheet-title">نوع الإجراء</h4>
          <div className="md-options">
            {filterOption('الكل', controller.filterType === 'الكل', () => controller.setFilterType('الكل'))}
            {TYPE_FILTERS.map(type => filterOption(type, controller.filterType === type, () => controller.setFilterType(type)))}
          </div>

          <h4 className="md-sheet-title">الحالة</h4>
          <div className="md-options">
            {filterOption('الكل', controller.filterStatus === 'الكل', () => controller.setFilterStatus('الكل'))}
            {STATUS_OPTIONS.map(o => filterOption(o.label, controller.filterStatus === o.value, () => controller.setFilterStatus(o.value), STATUS_TONE[o.value]))}
          </div>
        </MobileSheet>
      )}

      {/* Details page */}
      {detailsItem && (
        <MobileDisciplinaryDetails
          item={detailsItem}
          photo={photoOf(detailsItem)}
          typeTone={(TYPE_STYLE[detailsItem.actionType] || DEFAULT_TYPE_STYLE).tone}
          typeIcon={(TYPE_STYLE[detailsItem.actionType] || DEFAULT_TYPE_STYLE).icon}
          statusOptions={STATUS_OPTIONS}
          statusTone={STATUS_TONE}
          canChangeStatus={can.changeStatus}
          onChangeStatus={status => controller.handleUpdateStatus(detailsItem.id, status)}
          onViewReply={can.memberReply
            ? (hasDecision(detailsItem) ? open('decision', detailsItem) : undefined)
            : hasReply(detailsItem) && can.viewReply ? open(detailsItem.actionType === 'طلب توضيح' ? 'decision' : 'reply', detailsItem) : undefined}
          decisionOnly={can.memberReply}
          onViewMemberReply={detailsItem.actionType === 'طلب توضيح' && can.viewReply ? open('answer', detailsItem) : undefined}
          onEdit={can.edit ? () => controller.openEditDialog(detailsItem) : undefined}
          onViewDocument={(can.edit || can.viewDocument) && detailsItem.signed_document ? open('document', detailsItem) : undefined}
          onUploadDocument={can.edit && !detailsItem.signed_document ? open('upload', detailsItem) : undefined}
          onPrint={can.print && canPrintNow(detailsItem) && printDocsFor(detailsItem).length ? () => setPrinting({ item: detailsItem, type: printDocsFor(detailsItem)[0].type }) : undefined}
          onClose={() => setDetailsId(null)}
        />
      )}

      {/* Action pages, above the details page */}
      {pageItem && (page?.kind === 'reply' || page?.kind === 'answer' || page?.kind === 'decision') && (
        <MobileDisciplinaryReplyView
          item={pageItem}
          section={page.kind === 'answer' ? 'reply' : page.kind === 'decision' ? 'decision' : undefined}
          onEdit={can.editReply === false ? undefined : () => controller.openResponseDialog(pageItem)}
          onClose={() => setPage(null)}
        />
      )}
      {pageItem && page?.kind === 'document' && (
        <MobileDisciplinaryDocumentView
          item={pageItem}
          onReplace={can.edit ? open('upload', pageItem) : undefined}
          onClose={() => setPage(null)}
        />
      )}
      {pageItem && page?.kind === 'upload' && (
        <MobileDisciplinaryUpload
          item={pageItem}
          onSave={controller.handleUploadSignedDocument}
          onClose={() => setPage(null)}
        />
      )}
      {/* The browser's print sheet opens at once with the document */}
      {printing && (
        <DisciplinaryPrintSheet
          key={`${printing.item.id}-${printing.type}`}
          item={printing.item}
          type={printing.type}
          onDone={() => setPrinting(null)}
        />
      )}

      {/* Add / edit form: opened by the controller (same flow as the desktop dialog) */}
      {controller.isAddDialogOpen && (
        <MobileDisciplinaryForm
          key={controller.editingItem?.id || 'new'}
          item={controller.editingItem}
          members={controller.members}
          isSubmitting={controller.isSubmitting}
          onSave={controller.handleSave}
          onClose={controller.closeDialog}
        />
      )}

      {/* Reply form: opened by the controller (same flow as the desktop response dialogs) */}
      {replyItem && (
        <MobileDisciplinaryReplyForm
          key={replyItem.id}
          item={replyItem}
          isSubmitting={controller.isSubmitting}
          onSave={can.memberReply ? controller.handleMemberReply : controller.handleSave}
          onClose={controller.closeDialog}
          mode={can.memberReply ? 'member' : 'admin'}
        />
      )}
    </div>
  );
};
