import React, { useState, useEffect } from 'react';
import { X, Save, Package, ImagePlus } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import './Equipment.css';

export const EquipmentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit?: any; // If passed, it's Edit mode, otherwise Add mode
  onSave: (data: any) => void;
}> = ({ isOpen, onClose, equipmentToEdit, onSave }) => {
  const [name, setName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // The fields left empty: their message under them
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (equipmentToEdit) {
      setName(equipmentToEdit.name || '');
      setTotalQuantity(equipmentToEdit.totalQuantity?.toString() || '');
      setImagePreview(equipmentToEdit.image || null);
    } else {
      setName('');
      setTotalQuantity('');
      setImageFile(null);
      setImagePreview(null);
    }
    setTried(false);
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!equipmentToEdit;
  const nameError = tried && !name.trim() ? 'اكتب اسم العتاد' : null;
  const quantityError = tried && !(Number(totalQuantity) > 0) ? 'اكتب الكمية' : null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(equipmentToEdit?.image || null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || !(Number(totalQuantity) > 0)) return;
    onSave({
      data: {
        name,
        totalQuantity: Number(totalQuantity),
        availableQuantity: equipmentToEdit ? undefined : Number(totalQuantity),
      },
      imageFile
    });
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

        <form onSubmit={handleSubmit} className="eq-dialog-form" noValidate>
          <div className="eq-dialog-body" style={{ padding: '32px 24px' }}>

            <div className="form-group" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <label style={{ alignSelf: 'flex-start' }}>صورة العتاد</label>
               <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed var(--border, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImagePlus size={30} color="var(--text-muted, #94a3b8)" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
               </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <CustomInput
                type="text"
                label="اسم العتاد"
                value={name}
                onChange={e => setName(e.target.value)}
                className={nameError ? 'is-missing' : ''}
                error={nameError}
              />
            </div>

            <div className="form-group">
              <CustomInput
                type="number"
                label="الكمية الإجمالية"
                value={totalQuantity}
                onChange={e => setTotalQuantity(e.target.value)}
                className={quantityError ? 'is-missing' : ''}
                error={quantityError}
              />
            </div>

          </div>

          <div className="eq-dialog-footer">
            <button type="button" className="eq-btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="eq-btn-save">
              <Save size={18} />
              {isEdit ? 'حفظ التعديلات' : 'تأكيد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
