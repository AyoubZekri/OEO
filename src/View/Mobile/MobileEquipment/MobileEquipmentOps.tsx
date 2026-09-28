import React, { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, Printer, ArrowLeftRight, Search, X, Calendar, Package, CheckCircle2 } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useEquipmentOperationController } from '../../Screen/Equipment/EquipmentOperationController';
import {
  type OperationPermissions, memberNameOf, initials, movementsOf, returnedCount, shortDate,
} from './equipmentUtils';
import { MobileOperationDetails } from './MobileOperationDetails';
import { MobileOperationForm } from './MobileOperationForm';
import { MobileEquipmentPrint } from './MobileEquipmentPrint';
import './MobileEquipment.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- operations come untyped from the API */

interface MobileEquipmentOpsProps {
  c: ReturnType<typeof useEquipmentOperationController>;
  can: OperationPermissions;
}

const TABS = [
  { value: '', label: 'الكل' },
  { value: 'held', label: 'بحوزة العضو' },
  { value: 'back', label: 'مسترجعة' },
];

// Phone version of the equipment operations page: handovers, returns and receipts
export const MobileEquipmentOps: React.FC<MobileEquipmentOpsProps> = ({ c, can }) => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('operation');
  // undefined = form closed, null = new operation
  const [editing, setEditing] = useState<any | null | undefined>(undefined);
  const [printing, setPrinting] = useState<any | null>(null);

  const isBack = (op: any) => movementsOf(op).length > 0 && returnedCount(op) === movementsOf(op).length;
  const list = c.operations
    .filter(op => memberNameOf(op).toLowerCase().includes(query.trim().toLowerCase()) || String(op.id).includes(query.trim()))
    .filter(op => (tab === 'held' ? !isBack(op) : tab === 'back' ? isBack(op) : true));
  const details = detailsId ? c.operations.find(op => String(op.id) === detailsId) : undefined;

  const out = c.operations.reduce((s, op) => s + movementsOf(op).filter(m => !m.return_date).reduce((q: number, m: any) => q + (Number(m.quantity) || 0), 0), 0);

  const remove = async (op: any) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العملية؟ سيتم استرجاع جميع العتاد المرتبط بها.')) {
      await c.deleteOperation(op.id);
    }
  };

  const menuItems = (op: any): MobileRowMenuItem[] => [
    { key: 'view', label: 'إظهار كامل العتاد', icon: Eye, color: '#10b981', onClick: () => setDetailsId(op.id) },
    ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f59e0b', onClick: () => setEditing(op) }] : []),
    ...(can.print ? [{ key: 'print', label: 'طباعة محضر', icon: Printer, color: '#3b82f6', onClick: () => setPrinting(op) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => remove(op) }] : []),
  ];

  return (
    <div className="meq-page">
      <MobileAppBar title="حركة العتاد" />

      <section className="meq-hero">
        <div className="meq-hero-top">
          <span className="meq-hero-icon teal"><ArrowLeftRight size={26} /></span>
          <div>
            <small>عمليات التسليم</small>
            <strong>{c.operations.length}</strong>
          </div>
        </div>
        <div className="meq-hero-stats">
          <div className="out"><strong>{out}</strong><small>قطعة بحوزة الأعضاء</small></div>
          <div className="in"><strong>{c.operations.filter(isBack).length}</strong><small>عمليات مسترجعة بالكامل</small></div>
        </div>
      </section>

      <label className="meq-search">
        <Search size={17} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العضو أو رقم العملية..." />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
      </label>

      <div className="meq-tabs">
        {TABS.map(t => (
          <button key={t.value || 'all'} type="button" className={tab === t.value ? 'on' : ''} onClick={() => setTab(t.value)}>{t.label}</button>
        ))}
      </div>

      {c.isLoading && !c.operations.length ? (
        <MobileLoader text="جاري تحميل العمليات..." />
      ) : list.length === 0 ? (
        <div className="meq-empty">
          <span className="meq-empty-icon"><ArrowLeftRight size={36} /></span>
          <strong>{c.operations.length ? 'لا توجد نتائج' : 'لا توجد عمليات مسجلة حالياً'}</strong>
          {!c.operations.length && can.create && <p>سجّل عملية تسليم بالزر +</p>}
        </div>
      ) : (
        <div className="meq-list">
          {list.map(op => {
            const name = memberNameOf(op);
            const moves = movementsOf(op);
            const back = returnedCount(op);
            const open = () => setDetailsId(op.id);
            return (
              <article
                key={op.id}
                className={`meq-op ${isBack(op) ? 'done' : ''}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="meq-op-top">
                  <span className="meq-avatar">{initials(name)}</span>
                  <span className="meq-op-text">
                    <strong>{name}</strong>
                    <small><span dir="ltr">#{op.id}</span> · <Calendar size={11} /> <span dir="ltr">{shortDate(op.operation_date)}</span>{op.sports_season ? ` · ${op.sports_season}` : ''}</small>
                  </span>
                  <MobileRowMenu items={menuItems(op)} label="إجراءات العملية" />
                </div>
                <div className="meq-op-items">
                  {moves.slice(0, 3).map((m: any) => (
                    <em key={m.id} className={m.return_date ? 'back' : ''}>
                      {m.return_date ? <CheckCircle2 size={11} /> : <Package size={11} />} {m.equipment?.name || 'عتاد'} ×{m.quantity}
                    </em>
                  ))}
                  {moves.length > 3 && <em className="more">+{moves.length - 3}</em>}
                </div>
                {moves.length > 0 && (
                  <div className="meq-op-foot">
                    <div className="meq-mini-bar"><div style={{ width: `${(back / moves.length) * 100}%` }} /></div>
                    <small>أُرجع {back} من {moves.length}</small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {can.create && (
        <button type="button" className="meq-fab" onClick={() => setEditing(null)} aria-label="عملية جديدة" title="عملية جديدة">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileOperationDetails
          operation={details}
          can={can}
          onReturn={c.returnEquipment}
          onUndoReturn={c.undoReturnEquipment}
          onEdit={() => setEditing(details)}
          onPrint={() => setPrinting(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {editing !== undefined && (
        <MobileOperationForm
          key={editing?.id ?? 'new'}
          c={c}
          operation={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      {printing && <MobileEquipmentPrint operation={printing} members={c.members} onClose={() => setPrinting(null)} />}
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
