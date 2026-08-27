import React from 'react';
import { X, User, MapPin, Calendar, Package } from 'lucide-react';
import './Equipment.css';

export const LocationsDialog: React.FC<{
  equipment: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ equipment, isOpen, onClose }) => {
  if (!isOpen || !equipment) return null;

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="eq-dialog-header">
          <div className="eq-dialog-title-wrapper">
            <MapPin size={24} className="eq-dialog-icon" />
            <h2>أماكن التواجد: <span>{equipment.name}</span></h2>
          </div>
          <button className="eq-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="eq-dialog-body">
          <div className="eq-summary-cards">
            <div className="eq-summary-card">
              <span className="eq-summary-label">إجمالي الكمية</span>
              <span className="eq-summary-value">{equipment.totalQuantity}</span>
            </div>
            <div className="eq-summary-card green">
              <span className="eq-summary-label">متوفر بالمخزن</span>
              <span className="eq-summary-value">{equipment.availableQuantity}</span>
            </div>
            <div className="eq-summary-card red">
              <span className="eq-summary-label">معار للأعضاء</span>
              <span className="eq-summary-value">{equipment.totalQuantity - equipment.availableQuantity}</span>
            </div>
          </div>

          <h3 className="eq-section-title">الأعضاء الذين بحوزتهم العتاد حالياً</h3>
          
          {(!equipment.holders || equipment.holders.length === 0) ? (
            <div className="eq-empty-state">
              <Package size={48} />
              <p>جميع الكميات متوفرة حالياً في المخزن</p>
            </div>
          ) : (
            <div className="eq-holders-list">
              {equipment.holders.map((holder: any, idx: number) => (
                <div key={idx} className="eq-holder-item">
                  <div className="eq-holder-info">
                    <div className="eq-holder-avatar">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="eq-holder-name">{holder.name}</div>
                      <div className="eq-holder-date">
                        <Calendar size={12} /> تاريخ الاستلام: {holder.date}
                      </div>
                    </div>
                  </div>
                  <div className="eq-holder-qty">
                    <span className="qty-badge">
                      الكمية: {holder.qty}
                    </span>
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
