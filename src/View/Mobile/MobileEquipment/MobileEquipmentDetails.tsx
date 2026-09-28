import React from 'react';
import { Pencil, History, Users, Calendar, ImageIcon, ArrowUpFromLine, ArrowDownToLine, PackageCheck, User } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { EquipmentModel } from '../../Screen/Equipment/equipment_model';
import { shortDate, initials } from './equipmentUtils';
import { arCount } from '../MobileTeams/teamRoster';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- holders and movements come untyped from the API */

interface MobileEquipmentDetailsProps {
  equipment: EquipmentModel;
  canEdit: boolean;
  canViewMovements: boolean;
  onMovements: () => void;
  onEdit: () => void;
  onClose: () => void;
}

// One equipment item (phone): picture, stock and who holds it now (the desktop "أماكن التواجد" dialog)
export const MobileEquipmentDetails: React.FC<MobileEquipmentDetailsProps> = ({
  equipment: e, canEdit, canViewMovements, onMovements, onEdit, onClose,
}) => {
  const lent = e.totalQuantity - e.availableQuantity;
  const pct = e.totalQuantity > 0 ? (e.availableQuantity / e.totalQuantity) * 100 : 0;

  return (
    <MobileScreen
      title="تفاصيل العتاد"
      onBack={onClose}
      footer={(canViewMovements || canEdit) ? (
        <>
          {canViewMovements && <button type="button" className="me-btn" onClick={onMovements}><History size={18} /> حركة العتاد</button>}
          {canEdit && <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> تعديل</button>}
        </>
      ) : undefined}
    >
      <section className="meq-photo">
        {e.image ? <img src={e.image} alt={e.name} /> : <span><ImageIcon size={48} strokeWidth={1.4} /></span>}
        <div className="meq-photo-shade" />
        <strong>{e.name}</strong>
      </section>

      <section className="meq-stats">
        <div><small>إجمالي الكمية</small><strong>{e.totalQuantity}</strong></div>
        <div className="in"><small>متوفر بالمخزن</small><strong>{e.availableQuantity}</strong></div>
        <div className="out"><small>معار للأعضاء</small><strong>{lent}</strong></div>
      </section>
      <div className="meq-stock-bar light"><div style={{ width: `${pct}%` }} /></div>

      <section className="me-card">
        <h3 className="me-section-title"><span><Users size={16} /></span>الأعضاء الذين بحوزتهم العتاد حالياً</h3>
        {e.holders.length === 0 ? (
          <p className="meq-none"><PackageCheck size={20} /> جميع الكميات متوفرة حالياً في المخزن</p>
        ) : (
          <ul className="meq-holders">
            {e.holders.map((h: any, i: number) => (
              <li key={h.id || i}>
                {h.photo ? <img src={h.photo} alt="" /> : <span className="meq-avatar">{initials(h.name)}</span>}
                <span className="meq-holder-text">
                  <strong>{h.name}</strong>
                  <small><Calendar size={11} /> <span dir="ltr">{shortDate(h.last_date)}</span></small>
                </span>
                <b>{h.quantity}<small>قطعة</small></b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
};

// Movement history of one equipment item (the desktop "حركة العتاد" dialog)
export const MobileEquipmentMovements: React.FC<{ equipment: EquipmentModel; onClose: () => void }> = ({ equipment, onClose }) => {
  const movements = [...(equipment.movements || [])].sort((a: any, b: any) => {
    const dateA = new Date(a.return_date || a.delivery_date || 0).getTime();
    const dateB = new Date(b.return_date || b.delivery_date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <MobileScreen title="حركة العتاد" onBack={onClose} layer={2}>
      <section className="meq-mini">
        {equipment.image ? <img src={equipment.image} alt="" /> : <span><ImageIcon size={22} strokeWidth={1.5} /></span>}
        <div>
          <strong>{equipment.name}</strong>
          <small>{movements.length ? arCount(movements.length, 'حركة واحدة', 'حركتان', 'حركات', 'حركة') : 'لا توجد حركات'}</small>
        </div>
      </section>
      {movements.length === 0 ? (
        <div className="meq-empty">
          <span className="meq-empty-icon"><History size={34} /></span>
          <strong>لا توجد حركات مسجلة لهذا العتاد حتى الآن</strong>
        </div>
      ) : (
        <ol className="meq-timeline">
          {movements.map((mov: any) => {
            const back = mov.movement_status === 'إرجاع';
            const date = back ? mov.return_date : mov.delivery_date;
            const member = mov.operation?.member;
            return (
              <li key={mov.id} className={back ? 'in' : 'out'}>
                <span className="meq-tl-dot">{back ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />}</span>
                <div className="meq-tl-card">
                  <div className="meq-tl-head">
                    <strong><User size={14} /> {member ? `${member.first_name} ${member.last_name}` : 'غير معروف'}</strong>
                    <em>{mov.movement_status}</em>
                  </div>
                  <div className="meq-tl-meta">
                    <span>الكمية <b>{mov.quantity}</b></span>
                    <span><Calendar size={12} /> <span dir="ltr">{shortDate(date)}</span></span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
