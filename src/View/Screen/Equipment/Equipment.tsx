import React, { useState } from 'react';
import { Package, History, ImageIcon, Edit2, Trash2, Plus, MapPin } from 'lucide-react';
import { MovementDialog } from './MovementDialog';
import { LocationsDialog } from './LocationsDialog';
import { EquipmentDialog } from './EquipmentDialog';
import { useAuth } from '../../../core/context/AuthContext';
import './Equipment.css';

import { useEquipmentController } from './EquipmentController';

export const Equipment: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const [selectedEq, setSelectedEq] = useState<any>(null);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);

  const {
    equipments,
    isEquipmentDialogOpen,
    equipmentToEdit,
    isLoading,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveEquipment,
    handleDeleteEquipment,
  } = useEquipmentController();

  const openMovement = (eq: any) => {
    setSelectedEq(eq);
    setIsMovementOpen(true);
  };

  const openLocations = (eq: any) => {
    setSelectedEq(eq);
    setIsLocationsOpen(true);
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
        {isLoading ? (
          <div className="loading-container">
            <div className="premium-loader">
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-dot"></div>
            </div>
            <p className="loading-text">جاري تحضير العتاد...</p>
          </div>
        ) : (
          equipments.map((eq) => {
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
                    <button className="icon-btn delete" title="حذف" onClick={() => handleDeleteEquipment(eq.id)}>
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
                  
                  {hasAccess(permissions.equipmentOperations.view) && (
                    <button 
                      className="action-pill secondary" 
                      onClick={() => openMovement(eq)}
                      title="حركة العتاد"
                    >
                      <History size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }))}
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
          onClose={closeDialog}
          equipmentToEdit={equipmentToEdit}
          onSave={handleSaveEquipment}
        />
      )}
    </div>
  );
};
