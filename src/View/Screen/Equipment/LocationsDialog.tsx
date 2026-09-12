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
              {equipment.holders.map((holder: any, idx: number) => {
                return (
                  <div key={idx} className="premium-holder-card">
                    <div className="holder-card-main">
                      {holder.photo ? (
                        <img src={holder.photo} alt={holder.name} className="holder-avatar-img" />
                      ) : (
                        <div className="holder-avatar-placeholder">
                          <User size={24} strokeWidth={2.5} />
                        </div>
                      )}
                      
                      <div className="holder-details">
                        <h4 className="holder-name">{holder.name}</h4>
                        <div className="holder-meta">
                          <span className="meta-item">
                            <Calendar size={12} />
                            {holder.last_date ? new Date(holder.last_date).toLocaleDateString('en-GB') : 'غير متوفر'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="holder-card-action">
                      <div className="holder-qty-box">
                        <span className="qty-label">الكمية</span>
                        <span className="qty-value">{holder.quantity}</span>
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
