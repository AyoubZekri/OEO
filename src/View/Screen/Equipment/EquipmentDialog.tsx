import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import './Equipment.css';

export const EquipmentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit?: any; // If passed, it's Edit mode, otherwise Add mode
}> = ({ isOpen, onClose, equipmentToEdit }) => {
  const [name, setName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');

  useEffect(() => {
    if (equipmentToEdit) {
      setName(equipmentToEdit.name || '');
      setTotalQuantity(equipmentToEdit.totalQuantity?.toString() || '');
    } else {
      setName('');
      setTotalQuantity('');
    }
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!equipmentToEdit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically call an API or update state
    console.log('Submitted:', { name, totalQuantity });
    onClose();
  };

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content form-dialog" onClick={e => e.stopPropagation()}>
        <div className="eq-dialog-header">
          <div className="eq-dialog-title-wrapper">
            <Package size={24} className="eq-dialog-icon" />
            <h2>{isEdit ? 'تعديل بيانات العتاد' : 'إضافة عتاد جديد'}</h2>
          </div>
          <button className="eq-close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="eq-dialog-form">
          <div className="eq-dialog-body" style={{ padding: '32px 24px' }}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <CustomInput
                type="text" 
                label="اسم العتاد"
                value={name}
                onChange={e => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <CustomInput
                type="number" 
                label="الكمية الإجمالية"
                value={totalQuantity}
                onChange={e => setTotalQuantity(e.target.value)}
                required 
              />
            </div>
            
            {/* Can add more fields like Image URL if needed */}
          </div>

          <div className="eq-dialog-footer">
            <button type="button" className="eq-btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="eq-btn-save">
              <Save size={18} />
              {isEdit ? 'حفظ التعديلات' : 'إضافة العتاد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
