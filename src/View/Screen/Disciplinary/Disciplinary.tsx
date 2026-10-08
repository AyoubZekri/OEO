import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';


import { useAuth } from '../../../core/context/AuthContext';

import { Search, Trash2, Edit2, Plus, Scale, AlertTriangle, MessageSquare, Gavel, Calendar, ChevronDown, Check, Eye, PenLine, Printer, UploadCloud, FileText, Clock } from 'lucide-react';
import { useDisciplinaryController } from './DisciplinaryController';
import type { DisciplinaryModel } from './disciplinary_data';
import { MobileRowMenu, type MobileRowMenuItem } from '../../Mobile/widgets/MobileRowMenu';
import { canPrintNow, hasDecision, memberCanReply } from './clarification';
import { DisciplinaryDialog } from './DisciplinaryDialog';
import { IncidentDecisionDialog } from './Dialogs/IncidentDecisionDialog';
import { ClarificationResponseDialog } from './Dialogs/ClarificationResponseDialog';
import { HearingResponseDialog } from './Dialogs/HearingResponseDialog';
import { DisciplinaryDetailsDialog } from './Dialogs/DisciplinaryDetailsDialog';
import { ViewReplyDialog } from './Dialogs/ViewReplyDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { DisciplinaryPrintSheet } from './Printable/DisciplinaryPrint';
import { printDocsFor, type PrintType } from './Printable/printDocs';
import { UploadSignedDocumentDialog } from './Dialogs/UploadSignedDocumentDialog';
import { ViewSignedDocumentDialog } from './Dialogs/ViewSignedDocumentDialog';
import { MobileDisciplinary } from '../../Mobile/MobileDisciplinary/MobileDisciplinary';
import { useIsMobile } from '../../../core/functions/useIsMobile';


import './Disciplinary.css';
import '../Members/Members.css';


const StatusDropdown = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'مفتوح', label: 'مفتوح', colorClass: 'pending' },
    { value: 'منفذ', label: 'منفذ', colorClass: 'delivered' },
    { value: 'غير منفذ', label: 'غير منفذ', colorClass: 'not-delivered' },
    { value: 'متأخر', label: 'متأخر', colorClass: 'late' },
    { value: 'ملغى', label: 'ملغى', colorClass: 'closed' }
  ];

  const currentOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="status-dropdown-container" ref={ref}>
      <div 
        className={`status-select-modern ${currentOption.colorClass}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentOption.label}</span>
        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>

      {isOpen && (
        <div className="status-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`status-dropdown-item ${opt.colorClass} ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Disciplinary actions. personal: the personal space's "my actions": the same page, with only my actions and read only
 * (details, reply and decision, signed document; no add / edit / delete / status / print / upload).
 */
export const Disciplinary: React.FC<{ personal?: boolean }> = ({ personal = false }) => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const PERSONAL_ACTIONS = ['view', 'viewReply'];
  const canDo = (action: string) => (personal
    ? PERSONAL_ACTIONS.includes(action)
    : hasAccess((permissions.disciplinary as unknown as Record<string, boolean>)[action] === true));

  const controller = useDisciplinaryController({ personal });
  // ?action=<id> (from an alert): open that action's details once the list is loaded
  const [params, setParams] = useSearchParams();
  const requestedId = params.get('action');
  const [openOnPhone, setOpenOnPhone] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingReplyItem, setViewingReplyItem] = useState<any>(null);
  // "Now" for the overdue deadlines, taken when the page opens
  const [nowMs] = useState(() => Date.now());
  // Clarification requests: which part is open ("reply" or "decision"); other types show both together
  const [replySection, setReplySection] = useState<'reply' | 'decision' | undefined>(undefined);
  const openReply = (item: any, section?: 'reply' | 'decision') => { setReplySection(section); setViewingReplyItem(item); };
  // The document being printed: the browser's print sheet opens at once (no choice dialog)
  const [printing, setPrinting] = useState<{ item: DisciplinaryModel; type: PrintType } | null>(null);
  const [uploadingSignedDocItem, setUploadingSignedDocItem] = useState<any>(null);
  const [viewingSignedDocItem, setViewingSignedDocItem] = useState<any>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- opening the action an alert pointed to */
  useEffect(() => {
    if (!requestedId || controller.isLoading) return;
    const item = controller.disciplinaryList.find(d => d.id === requestedId);
    if (item) {
      if (isMobile) setOpenOnPhone(item.id);
      else setViewingItem(item);
    }
    setParams(prev => {
      const p = new URLSearchParams(prev);
      p.delete('action');
      return p;
    }, { replace: true });
  }, [requestedId, controller.isLoading, controller.disciplinaryList, isMobile, setParams]);
  /* eslint-enable react-hooks/set-state-in-effect */
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'طلب توضيح': return <MessageSquare size={14} />;
      case 'استدعاء جلسة': return <Calendar size={14} />;
      case 'إحالة على الجهة التأديبية المختصة': return <AlertTriangle size={14} />;
      case 'واقعة': return <Scale size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  // const getStatusBadge = (status: string) => {
  //   if (status === 'مفتوح') return <span className="badge badge-purple">{status}</span>;
  //   if (status === 'منفذ') return <span className="badge badge-green">{status}</span>;
  //   if (status === 'ملغى') return <span className="badge badge-red">{status}</span>;
  //   return <span>{status}</span>;
  // };

  const statusOptions = [
    { value: 'الكل', label: 'جميع الحالات' },
    { value: 'مفتوح', label: 'مفتوح' },
    { value: 'منفذ', label: 'منفذ' },
    { value: 'غير منفذ', label: 'غير منفذ' },
    { value: 'متأخر', label: 'متأخر' },
    { value: 'ملغى', label: 'ملغى' }
  ];

  const typeOptions = [
    { value: 'الكل', label: 'جميع الأنواع' },
    { value: 'طلب توضيح', label: 'طلب توضيح' },
    { value: 'استدعاء جلسة', label: 'استدعاء جلسة' },
  ];

  /** "2 أكتوبر 2026" */
  const dayText = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  };
  const initialsOf = (name?: string) => (name || '؟').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
  /** The deadline / hearing date has passed on an action still open */
  const deadlineLate = (c: DisciplinaryModel) => {
    if (!c.deadlineOrHearingDate || !['مفتوح', 'متأخر'].includes(c.status)) return false;
    const d = new Date(c.deadlineOrHearingDate);
    d.setHours(23, 59, 59);
    return d.getTime() < nowMs;
  };
  /** Where the action stands: the member's reply and the decision (when the type has them), then the signed document */
  const stepsOf = (c: DisciplinaryModel) => [
    ...(!['تنبيه', 'إنذار'].includes(c.actionType) ? [
      { label: 'رد العضو', done: Boolean(c.player_statements?.trim()) },
      { label: 'القرار', done: Boolean(c.admin_notes?.trim() || c.decision_outcome?.trim()) },
    ] : []),
    { label: 'الوثيقة الممضاة', done: Boolean(c.signed_document) },
  ];

  /** A card's actions, in its ⋮ menu (same as the phone) */
  const menuItems = (c: DisciplinaryModel): MobileRowMenuItem[] => {
    const clarification = c.actionType === 'طلب توضيح';
    const withReply = !['تنبيه', 'إنذار'].includes(c.actionType);
    return [
      ...(canDo('view') ? [{ key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#3b82f6', onClick: () => setViewingItem(c) }] : []),
      ...(personal && memberCanReply(c)
        ? [{ key: 'answer', label: c.player_statements ? 'تعديل ردي' : 'الرد على الطلب', icon: PenLine, color: '#10b981', onClick: () => controller.openResponseDialog(c) }]
        : []),
      // The member: their reply (a clarification request), and the decision once written
      ...(personal ? [
        ...(clarification && c.player_statements?.trim() ? [{ key: 'reply', label: 'ردي', icon: MessageSquare, color: '#f97316', onClick: () => openReply(c, 'reply') }] : []),
        ...(hasDecision(c) ? [{ key: 'decision', label: 'عرض القرار', icon: Gavel, color: '#f97316', onClick: () => openReply(c, 'decision') }] : []),
      ] : canDo('viewReply') && clarification ? [
        { key: 'reply', label: 'رد العضو', icon: MessageSquare, color: '#f97316', onClick: () => openReply(c, 'reply') },
        { key: 'decision', label: 'القرار', icon: Gavel, color: '#f97316', onClick: () => openReply(c, 'decision') },
      ] : canDo('viewReply') && withReply ? [
        { key: 'reply', label: 'الرد والقرارات', icon: MessageSquare, color: '#f97316', onClick: () => openReply(c) },
      ] : []),
      ...(canDo('print') && canPrintNow(c)
        ? printDocsFor(c).map(doc => ({ key: `print-${doc.type}`, label: doc.label, icon: Printer, color: '#f97316', onClick: () => setPrinting({ item: c, type: doc.type }) }))
        : []),
      ...(c.signed_document && (canDo('edit') || personal)
        ? [{ key: 'doc', label: 'عرض الوثيقة الممضاة', icon: FileText, color: '#f97316', onClick: () => setViewingSignedDocItem(c) }]
        : canDo('edit') ? [{ key: 'doc', label: 'رفع الوثيقة الممضاة', icon: UploadCloud, color: '#f97316', onClick: () => setUploadingSignedDocItem(c) }] : []),
      ...(canDo('edit') ? [{ key: 'edit', label: 'تعديل', icon: Edit2, color: '#f97316', onClick: () => controller.openEditDialog(c) }] : []),
      ...(canDo('delete') ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => controller.handleDelete(c.id) }] : []),
    ];
  };

  return (
    <div className="members-container">
      {isMobile ? (
        // Phone layout; it opens its own pages instead of the dialogs below
        <MobileDisciplinary
          controller={controller}
          can={{
            add: canDo('add'),
            edit: canDo('edit'),
            delete: canDo('delete'),
            view: canDo('view'),
            viewReply: canDo('viewReply'),
            print: canDo('print'),
            changeStatus: canDo('changeStatus'),
            viewDocument: personal,
            editReply: !personal,
            memberReply: personal,
          }}
          title={personal ? 'إجراءات تأديبية' : undefined}
          openId={openOnPhone}
        />
      ) : (
      <>
      {/* Header section */}
      <div className="members-header">

          
          <div className="members-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="ابحث باسم العضو أو السبب..."
                className="search-input"
                value={controller.searchQuery}
                onChange={(e) => controller.setSearchQuery(e.target.value)}
              />
            </div>
          
          <CustomDropdown<string>
            value={controller.filterType}
            options={typeOptions}
            onChange={(val) => controller.setFilterType(val)}
            placeholder="جميع الأنواع"
          />

          <CustomDropdown<string>
            value={controller.filterStatus}
            options={statusOptions}
            onChange={(val) => controller.setFilterStatus(val)}
            placeholder="جميع الحالات"
          />

          {canDo('add') && (
            <button className="btn-primary" onClick={controller.openAddDialog}>
              <Plus size={18} />
              إضافة إجراء
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ marginTop: '20px' }}>
        {controller.isLoading ? (
          <div className="loading-container" style={{ gridColumn: '1 / -1' }}>
            <div className="premium-loader">
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-dot"></div>
            </div>
            <p className="loading-text">جاري تحميل الإجراءات...</p>
          </div>
        ) : (
          <div className="disciplinary-grid">
            {controller.disciplinaryList.map(c => (
            <article key={c.id} className="dc-card">
              <header className="dc-head">
                <div className="status-control-modern dc-status" style={{ opacity: canDo('changeStatus') ? 1 : 0.85, pointerEvents: canDo('changeStatus') ? 'auto' : 'none' }}>
                  <StatusDropdown 
                    value={c.status} 
                    onChange={(val) => controller.handleUpdateStatus(c.id, val as any)} 
                  />
                </div>
                <MobileRowMenu items={menuItems(c)} label="إجراءات الإجراء التأديبي" />
              </header>

              <div className="dc-body">
                <h3 className="dc-title">{c.reason || 'بدون وصف'}</h3>
                <p className="dc-sub">
                  <span className="dc-type">{getTypeIcon(c.actionType)}{c.actionType}</span>
                  <span className="dc-dot" aria-hidden="true" />
                  <span>{dayText(c.incidentDate)}</span>
                </p>
              </div>

              {(() => {
                const steps = stepsOf(c);
                const done = steps.filter(st => st.done).length;
                const current = steps.find(st => !st.done);
                return (
                  <div className="dc-progress">
                    <div className="dc-progress-bar" aria-hidden="true">
                      {steps.map(st => <i key={st.label} className={st.done ? 'done' : ''} />)}
                    </div>
                    <span className="dc-progress-text">
                      {current ? <span>المرحلة: <b>{current.label}</b></span> : <b className="dc-complete"><Check size={12} strokeWidth={3} />مكتمل</b>}
                      <em>{done}/{steps.length}</em>
                    </span>
                  </div>
                );
              })()}

              <footer className="dc-foot">
                <span className="dc-member">
                  <span className="dc-avatar">{initialsOf(c.memberName)}</span>
                  <span className="dc-member-name">{c.memberName}</span>
                </span>
                {c.deadlineOrHearingDate && (
                  <span className={`dc-deadline ${deadlineLate(c) ? 'late' : ''}`} title={c.actionType === 'استدعاء جلسة' ? 'موعد الجلسة' : 'آخر أجل للرد'}>
                    <Clock size={13} />{dayText(c.deadlineOrHearingDate)}
                  </span>
                )}
              </footer>
            </article>
          ))}
          {controller.disciplinaryList.length === 0 && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
               <Scale size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
               <h3>لا توجد إجراءات تأديبية</h3>
               <p>لم يتم العثور على أي إجراءات تأديبية تطابق بحثك.</p>
             </div>
          )}
          </div>
        )}
      </div>
      </>
      )}

      {!isMobile && (
        <DisciplinaryDialog
          isOpen={controller.isAddDialogOpen}
          onClose={controller.closeDialog}
          onSave={controller.handleSave}
          editingItem={controller.editingItem}
          members={controller.members}
          isSubmitting={controller.isSubmitting}
        />
      )}

      {/* Desktop dialogs; the phone layout has its own pages */}
      {!isMobile && (
        <>
        <IncidentDecisionDialog
          isOpen={controller.isResponseDialogOpen && controller.editingItem?.actionType === 'واقعة'}
          onClose={controller.closeDialog}
          onSave={controller.handleSave}
          editingItem={controller.editingItem}
        />
      
        <ClarificationResponseDialog
          isOpen={controller.isResponseDialogOpen && controller.editingItem?.actionType === 'طلب توضيح'}
          onClose={controller.closeDialog}
          onSave={personal ? controller.handleMemberReply : controller.handleSave}
          editingItem={controller.editingItem}
          mode={personal ? 'member' : 'admin'}
        />

        <HearingResponseDialog
          isOpen={controller.isResponseDialogOpen && ['استدعاء جلسة', 'إحالة على الجهة التأديبية المختصة'].includes(controller.editingItem?.actionType || '')}
          onClose={controller.closeDialog}
          onSave={controller.handleSave}
          editingItem={controller.editingItem}
        />

        <DisciplinaryDetailsDialog
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          item={viewingItem}
        />

        <ViewReplyDialog
          isOpen={!!viewingReplyItem}
          onClose={() => setViewingReplyItem(null)}
          item={viewingReplyItem}
          section={replySection}
          onEdit={personal ? undefined : (item) => {
            setViewingReplyItem(null);
            controller.openResponseDialog(item);
          }}
        />

        {printing && (
          <DisciplinaryPrintSheet
            key={`${printing.item.id}-${printing.type}`}
            item={printing.item}
            type={printing.type}
            onDone={() => setPrinting(null)}
          />
        )}

        <UploadSignedDocumentDialog
          isOpen={!!uploadingSignedDocItem}
          onClose={() => setUploadingSignedDocItem(null)}
          onSave={controller.handleUploadSignedDocument}
          item={uploadingSignedDocItem}
        />

        <ViewSignedDocumentDialog
          isOpen={!!viewingSignedDocItem}
          onClose={() => setViewingSignedDocItem(null)}
          imageUrl={viewingSignedDocItem?.signed_document || ''}
          onEdit={canDo('edit') ? () => {
            setUploadingSignedDocItem(viewingSignedDocItem);
            setViewingSignedDocItem(null);
          } : undefined}
        />
        </>
      )}
    </div>
  );
};