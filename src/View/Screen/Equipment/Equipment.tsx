import React, { useState } from 'react';
import { Package, History, ImageIcon, Edit2, Trash2, Plus, MapPin } from 'lucide-react';
import { MovementDialog } from './MovementDialog';
import { LocationsDialog } from './LocationsDialog';
import { EquipmentDialog } from './EquipmentDialog';
import { useAuth } from '../../../core/context/AuthContext';
import './Equipment.css';

// Mock Data for Design
const mockEquipment = [
  { 
    id: 1, name: 'كاميرا سوني A7III', totalQuantity: 3, availableQuantity: 1, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=300', 
    holders: [{ name: 'أحمد محمود', qty: 1, date: '2026-08-20' }, { name: 'علي كمال', qty: 1, date: '2026-08-22' }] 
  },
  { 
    id: 2, name: 'عدسة 24-70mm', totalQuantity: 2, availableQuantity: 1, image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=300', 
    holders: [{ name: 'سارة خالد', qty: 1, date: '2026-08-25' }] 
  },
  { 
    id: 3, name: 'ميكروفون لاسلكي', totalQuantity: 4, availableQuantity: 4, image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300', 
    holders: [] 
  },
  { 
    id: 4, name: 'حامل كاميرا (Tripod)', totalQuantity: 3, availableQuantity: 2, image: null, 
    holders: [{ name: 'محمد أمين', qty: 1, date: '2026-08-26' }] 
  },
  { 
    id: 5, name: 'إضاءة LED', totalQuantity: 2, availableQuantity: 2, image: 'https://images.unsplash.com/photo-1588666324838-510006325985?auto=format&fit=crop&q=80&w=300', 
    holders: [] 
  },
];

export const Equipment: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const [selectedEq, setSelectedEq] = useState<any>(null);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<any>(null);

  const openMovement = (eq: any) => {
    setSelectedEq(eq);
    setIsMovementOpen(true);
  };

  const openLocations = (eq: any) => {
    setSelectedEq(eq);
    setIsLocationsOpen(true);
  };

  const openAddDialog = () => {
    setEquipmentToEdit(null);
    setIsEquipmentDialogOpen(true);
  };

  const openEditDialog = (eq: any) => {
    setEquipmentToEdit(eq);
    setIsEquipmentDialogOpen(true);
  };

  return (
    <div className="equipment-page-wrapper">
      {/* Header Section */}
      <div className="equipment-header">
        <h1>معدات الفريق</h1>
        {hasAccess(permissions.equipment.add) && (
          <button className="add-eq-btn" onClick={openAddDialog}>
            <Plus size={20} />
            إضافة عتاد
          </button>
        )}
      </div>

      {/* Grid Section */}
      <div className="equipment-premium-grid">
        {mockEquipment.map((eq) => {
          const borrowed = eq.totalQuantity - eq.availableQuantity;
          
          return (
            <div key={eq.id} className="premium-card">
              {/* Image & Badges */}
              <div className="card-image-box">
                {eq.image ? (
                  <img src={eq.image} alt={eq.name} className="card-img" />
                ) : (
                  <div className="card-placeholder">
                    <ImageIcon size={48} strokeWidth={1.5} />
                  </div>
                )}
                <div className="card-image-overlay"></div>
                
                {/* Floating Badges */}
                <div className="card-badges">
                  {eq.availableQuantity > 0 && (
                    <span className="premium-badge available">
                      متوفر {eq.availableQuantity}
                    </span>
                  )}
                  {borrowed > 0 && (
                    <span className="premium-badge borrowed">
                      معار {borrowed}
                    </span>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="card-admin-actions">
                  {hasAccess(permissions.equipment.edit) && (
                    <button className="icon-btn edit" title="تعديل" onClick={() => openEditDialog(eq)}>
                      <Edit2 size={16} />
                    </button>
                  )}
                  {hasAccess(permissions.equipment.delete) && (
                    <button className="icon-btn delete" title="حذف">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="card-content-box">
                <div className="card-title-area">
                  <h3 className="card-title">{eq.name}</h3>
                  <div className="card-total-qty">
                    <Package size={14} />
                    <span>العدد الكلي: {eq.totalQuantity}</span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="card-primary-actions">
                  <button 
                    className="action-pill primary" 
                    onClick={() => openLocations(eq)} 
                    disabled={eq.holders.length === 0}
                  >
                    <MapPin size={16} />
                    <span>أماكن التواجد</span>
                  </button>
                  
                  <button 
                    className="action-pill secondary" 
                    onClick={() => openMovement(eq)}
                    title="حركة العتاد"
                  >
                    <History size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      {isMovementOpen && (
        <MovementDialog 
          equipment={selectedEq} 
          isOpen={isMovementOpen} 
          onClose={() => setIsMovementOpen(false)} 
        />
      )}

      {isLocationsOpen && (
        <LocationsDialog 
          equipment={selectedEq} 
          isOpen={isLocationsOpen} 
          onClose={() => setIsLocationsOpen(false)} 
        />
      )}

      {isEquipmentDialogOpen && (
        <EquipmentDialog 
          isOpen={isEquipmentDialogOpen}
          onClose={() => setIsEquipmentDialogOpen(false)}
          equipmentToEdit={equipmentToEdit}
        />
      )}
    </div>
  );
};
