import React from 'react';
import { X, User, Calendar, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import './Equipment.css';

export const MovementDialog: React.FC<{
  equipment: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ equipment, isOpen, onClose }) => {
  if (!isOpen || !equipment) return null;

  // Use real movements from the equipment object
  // Sort by delivery/return date descending
  const movements = [...(equipment.movements || [])].sort((a, b) => {
    const dateA = new Date(a.return_date || a.delivery_date || 0).getTime();
    const dateB = new Date(b.return_date || b.delivery_date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="eq-dialog-header">
          <div className="eq-dialog-title-wrapper">
            <ArrowRightLeft size={24} className="eq-dialog-icon" />
            <h2>حركة العتاد: <span>{equipment.name}</span></h2>
          </div>
          <button className="eq-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="eq-dialog-body">
          {movements.length === 0 ? (
            <div className="eq-empty-state">
              <ArrowRightLeft size={48} />
              <p>لا توجد حركات مسجلة لهذا العتاد حتى الآن</p>
            </div>
          ) : (
            <div className="eq-timeline">
              {movements.map((mov: any) => {
                const isReturned = mov.movement_status === 'إرجاع';
                const type = isReturned ? 'in' : 'out';
                const date = isReturned ? mov.return_date : mov.delivery_date;
                const memberName = mov.operation?.member 
                  ? `${mov.operation.member.first_name} ${mov.operation.member.last_name}` 
                  : 'غير معروف';

                return (
                  <div key={mov.id} className={`eq-timeline-item ${type}`}>
                    <div className="eq-timeline-icon-wrapper">
                      {type === 'out' ? <ArrowUpFromLine size={16} /> : <ArrowDownToLine size={16} />}
                    </div>
                    <div className="eq-timeline-content">
                      <div className="eq-timeline-header">
                        <span className="eq-member-name">
                          <User size={16} /> {memberName}
                        </span>
                        <span className={`eq-status-badge ${type}`}>
                          {mov.movement_status} (الكمية: {mov.quantity})
                        </span>
                      </div>
                      <div className="eq-timeline-date">
                        <Calendar size={14} /> {date ? new Date(date).toLocaleDateString('en-GB') : 'غير متوفر'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
