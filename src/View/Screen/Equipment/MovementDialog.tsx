import React from 'react';
import { X, User, Calendar, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import './Equipment.css';

// Mock Movement Data
const mockMovements = {
  1: [
    { id: 101, memberName: 'أحمد محمود', date: '2026-08-20', status: 'استلام', type: 'out' },
    { id: 102, memberName: 'علي كمال', date: '2026-08-15', status: 'إرجاع', type: 'in' },
    { id: 103, memberName: 'علي كمال', date: '2026-08-10', status: 'استلام', type: 'out' },
  ],
  2: [
    { id: 201, memberName: 'سارة خالد', date: '2026-08-25', status: 'استلام', type: 'out' },
  ],
  3: [],
  4: [
    { id: 401, memberName: 'محمد أمين', date: '2026-08-26', status: 'استلام', type: 'out' },
    { id: 402, memberName: 'محمد أمين', date: '2026-08-27', status: 'إرجاع', type: 'in' },
  ],
  5: [
    { id: 501, memberName: 'طارق زياد', date: '2026-08-01', status: 'إرجاع', type: 'in' }
  ]
};

export const MovementDialog: React.FC<{
  equipment: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ equipment, isOpen, onClose }) => {
  if (!isOpen || !equipment) return null;

  const movements = mockMovements[equipment.id as keyof typeof mockMovements] || [];

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
              {movements.map((mov) => (
                <div key={mov.id} className={`eq-timeline-item ${mov.type}`}>
                  <div className="eq-timeline-icon-wrapper">
                    {mov.type === 'out' ? <ArrowUpFromLine size={16} /> : <ArrowDownToLine size={16} />}
                  </div>
                  <div className="eq-timeline-content">
                    <div className="eq-timeline-header">
                      <span className="eq-member-name">
                        <User size={16} /> {mov.memberName}
                      </span>
                      <span className={`eq-status-badge ${mov.type}`}>
                        {mov.status}
                      </span>
                    </div>
                    <div className="eq-timeline-date">
                      <Calendar size={14} /> {mov.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
