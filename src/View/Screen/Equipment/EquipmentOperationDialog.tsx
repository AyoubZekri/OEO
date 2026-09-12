import React, { useState } from 'react';
import { X, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomInput } from '../../widget/CustomInput';
import { useEquipmentOperationController } from './EquipmentOperationController';
import type { OperationItem } from './EquipmentOperationController';
import './EquipmentOperations.css';

export const EquipmentOperationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  controller: ReturnType<typeof useEquipmentOperationController>;
  editingOperation?: any;
}> = ({ isOpen, onClose, controller, editingOperation }) => {
  const { equipments, members, createOperation, updateOperation } = controller;
  
  const [selectedMember, setSelectedMember] = useState('');
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0]);
  const [sportsSeason, setSportsSeason] = useState('');
  const [items, setItems] = useState<OperationItem[]>([
    { id: Date.now().toString(), equipment_id: '', quantity: '1', condition: 'جيد' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setTimeout(() => setSnackbarMessage(''), 3000);
  };

  React.useEffect(() => {
    if (isOpen) {
      if (editingOperation) {
        setSelectedMember(editingOperation.member_id?.toString() || '');
        setOperationDate(editingOperation.operation_date ? new Date(editingOperation.operation_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setSportsSeason(editingOperation.sports_season || '');
        if (editingOperation.movements && editingOperation.movements.length > 0) {
          setItems(editingOperation.movements.map((mov: any) => ({
            id: mov.id?.toString() || Date.now().toString() + Math.random(),
            equipment_id: mov.equipment_id?.toString() || '',
            quantity: mov.quantity?.toString() || '1',
            condition: mov.condition || mov.delivery_condition || 'جيد'
          })));
        } else {
          setItems([{ id: Date.now().toString(), equipment_id: '', quantity: '1', condition: 'جيد' }]);
        }
      } else {
        setSelectedMember('');
        setOperationDate(new Date().toISOString().split('T')[0]);
        setSportsSeason('');
        setItems([{ id: Date.now().toString(), equipment_id: '', quantity: '1', condition: 'جيد' }]);
      }
    }
  }, [isOpen, editingOperation]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), equipment_id: '', quantity: '1', condition: 'جيد' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof OperationItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !operationDate || !sportsSeason) {
      showSnackbar('تاريخ العملية، العضو والموسم الرياضي حقول إجبارية');
      return;
    }
    
    if (items.some(i => !i.equipment_id || !i.quantity)) {
      showSnackbar('يرجى تعبئة جميع تفاصيل العتاد المحددة');
      return;
    }

    // Check quantities
    for (const item of items) {
      const eq = equipments.find(e => e.id.toString() === item.equipment_id);
      if (eq) {
        const available = eq.available_quantity ?? eq.availableQuantity ?? 0;
        if (Number(item.quantity) > available) {
          showSnackbar(`الكمية المطلوبة من العتاد "${eq.name}" غير متوفرة! المتوفر حالياً: ${available}`);
          return;
        }
      }
    }
    
    setIsSubmitting(true);
    let success = false;
    if (editingOperation) {
      success = await updateOperation(editingOperation.id, selectedMember, operationDate, sportsSeason, items);
    } else {
      success = await createOperation(selectedMember, operationDate, sportsSeason, items);
    }
    setIsSubmitting(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content form-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="eq-dialog-header">
          <div className="eq-dialog-title-wrapper">
            <CheckCircle2 size={24} className="eq-dialog-icon" />
            <h2>{editingOperation ? 'تعديل عملية تسليم' : 'عملية تسليم عتاد جديدة'}</h2>
          </div>
          <button className="eq-close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <div className="eq-dialog-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
          <form onSubmit={handleSubmit} className="ops-form">
            
            {/* Header section */}
            <div className="form-row" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <CustomDropdown<string>
                label="العضو المستلم"
                value={selectedMember}
                onChange={(val) => setSelectedMember(val)}
                options={members.map(member => ({
                  value: member.id.toString(),
                  label: `${member.first_name} ${member.last_name}`
                }))}
                placeholder="-- اختر عضواً --"
              />

              <CustomInput
                type="date"
                label="تاريخ العملية"
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
                required
              />

              <CustomInput
                type="text"
                label="الموسم الرياضي"
                value={sportsSeason}
                onChange={(e) => setSportsSeason(e.target.value)}
                placeholder="مثال: 2025/2026"
                required
              />
            </div>

            {/* Dynamic Items Section */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, flexShrink: 0 }}>قائمة العتاد</h3>
              <button type="button" onClick={handleAddItem} className="action-pill primary" style={{ padding: '6px 12px', fontSize: '0.9rem', width: 'fit-content' }}>
                <Plus size={16} /> إضافة صنف
              </button>
            </div>

            <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item, index) => (
                <div key={item.id} className="eq-item-row" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, background: '#3b82f6', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {index + 1}
                  </div>
                  
                  <div style={{ flex: 2 }}>
                    <CustomDropdown<string>
                      label="العتاد"
                      value={item.equipment_id}
                      onChange={(val) => handleItemChange(item.id, 'equipment_id', val)}
                      options={equipments.map(eq => ({
                        value: eq.id.toString(),
                        label: `${eq.name} (متوفر: ${eq.available_quantity || eq.availableQuantity || 0})`
                      }))}
                      placeholder="-- اختر عتاداً --"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <CustomInput
                      type="number"
                      label="الكمية"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <CustomDropdown<string>
                      label="الحالة"
                      value={item.condition}
                      onChange={(val) => handleItemChange(item.id, 'condition', val)}
                      options={[
                        { value: 'جيد', label: 'جيد' },
                        { value: 'متوسط', label: 'متوسط' },
                        { value: 'جديد', label: 'جديد' },
                      ]}
                    />
                  </div>

                  {items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ marginTop: '28px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
                      title="إزالة"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="eq-dialog-footer">
              <button type="button" className="eq-btn-cancel" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
              <button type="submit" className="eq-btn-save" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : (editingOperation ? 'حفظ التعديلات' : 'تأكيد العملية')}
              </button>
            </div>
          </form>
        </div>
        {snackbarMessage && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            fontWeight: 500
          }}>
            {snackbarMessage}
          </div>
        )}
      </div>
    </div>
  );
};
