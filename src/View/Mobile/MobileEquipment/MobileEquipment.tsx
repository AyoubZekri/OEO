import React, { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, History, Package, Search, X, ImageIcon } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useEquipmentController } from '../../Screen/Equipment/EquipmentController';
import type { EquipmentModel } from '../../Screen/Equipment/equipment_model';
import type { EquipmentPermissions } from './equipmentUtils';
import { arCount } from '../MobileTeams/teamRoster';
import { MobileEquipmentDetails, MobileEquipmentMovements } from './MobileEquipmentDetails';
import { MobileEquipmentForm } from './MobileEquipmentForm';
import './MobileEquipment.css';

interface MobileEquipmentProps {
  c: ReturnType<typeof useEquipmentController>;
  can: EquipmentPermissions;
}

// Phone version of the equipment page: stock summary, search, picture cards, details / movements / form on their own pages
export const MobileEquipment: React.FC<MobileEquipmentProps> = ({ c, can }) => {
  const [query, setQuery] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('equipment');
  const [movementsOf, setMovementsOf] = useState<EquipmentModel | null>(null);

  const list = c.equipments.filter(e => e.name.toLowerCase().includes(query.trim().toLowerCase()));
  const details = detailsId ? c.equipments.find(e => String(e.id) === detailsId) : undefined;
  const total = c.equipments.reduce((s, e) => s + e.totalQuantity, 0);
  const available = c.equipments.reduce((s, e) => s + e.availableQuantity, 0);
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;

  const menuItems = (e: EquipmentModel): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(e.id) },
    ...(can.viewMovements ? [{ key: 'moves', label: 'حركة العتاد', icon: History, color: '#14b8a6', onClick: () => setMovementsOf(e) }] : []),
    ...(can.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => c.openEditDialog(e) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.handleDeleteEquipment(e.id) }] : []),
  ];

  return (
    <div className="meq-page">
      <MobileAppBar title="العتاد" />

      <section className="meq-hero">
        <div className="meq-hero-top">
          <span className="meq-hero-icon"><Package size={26} /></span>
          <div>
            <small>مخزن العتاد · {arCount(c.equipments.length, 'صنف واحد', 'صنفان', 'أصناف', 'صنفاً')}</small>
            <strong>{total} <span>قطعة</span></strong>
          </div>
        </div>
        <div className="meq-stock">
          <div className="meq-stock-bar"><div style={{ width: `${pct}%` }} /></div>
          <div className="meq-stock-legend">
            <span className="in"><i /> متوفر بالمخزن <b>{available}</b></span>
            <span className="out"><i /> معار للأعضاء <b>{total - available}</b></span>
          </div>
        </div>
      </section>

      <label className="meq-search">
        <Search size={17} />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العتاد..." />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
      </label>

      {c.isLoading && !c.equipments.length ? (
        <MobileLoader text="جاري تحضير العتاد..." />
      ) : list.length === 0 ? (
        <div className="meq-empty">
          <span className="meq-empty-icon"><Package size={36} /></span>
          <strong>{query ? 'لا يوجد عتاد بهذا الاسم' : 'لا يوجد عتاد مسجل'}</strong>
          {!query && can.add && <p>أضف عتاداً جديداً بالزر +</p>}
        </div>
      ) : (
        <div className="meq-grid">
          {list.map(e => {
            const lent = e.totalQuantity - e.availableQuantity;
            const ratio = e.totalQuantity > 0 ? (e.availableQuantity / e.totalQuantity) * 100 : 0;
            const open = () => setDetailsId(e.id);
            return (
              <article
                key={e.id}
                className="meq-card"
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={ev => { if (ev.key === 'Enter') open(); }}
              >
                <div className="meq-card-img">
                  {e.image ? <img src={e.image} alt="" /> : <span><ImageIcon size={30} strokeWidth={1.5} /></span>}
                  {lent > 0 && <em>معار {lent}</em>}
                  <MobileRowMenu items={menuItems(e)} label="إجراءات العتاد" />
                </div>
                <div className="meq-card-body">
                  <strong>{e.name}</strong>
                  <div className="meq-mini-bar"><div style={{ width: `${ratio}%` }} /></div>
                  <small><b className={e.availableQuantity ? 'ok' : 'none'}>{e.availableQuantity}</b> متوفر من {e.totalQuantity}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {can.add && (
        <button type="button" className="meq-fab" onClick={c.openAddDialog} aria-label="إضافة عتاد" title="إضافة عتاد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {details && (
        <MobileEquipmentDetails
          equipment={details}
          canEdit={can.edit}
          canViewMovements={can.viewMovements}
          onMovements={() => setMovementsOf(details)}
          onEdit={() => c.openEditDialog(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {movementsOf && <MobileEquipmentMovements equipment={movementsOf} onClose={() => setMovementsOf(null)} />}

      {c.isEquipmentDialogOpen && (
        <MobileEquipmentForm
          key={c.equipmentToEdit?.id || 'new'}
          equipment={c.equipmentToEdit}
          saving={c.isLoading}
          onSave={c.handleSaveEquipment}
          onClose={c.closeDialog}
        />
      )}
    </div>
  );
};
