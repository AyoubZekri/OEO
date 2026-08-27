import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomInput } from '../../widget/CustomInput';
import './EquipmentOperations.css';

const mockEquipmentList = [
  { id: 1, name: 'كاميرا سوني A7III', available: 1, total: 3 },
  { id: 2, name: 'عدسة 85mm', available: 0, total: 2 },
  { id: 3, name: 'مايكروفون Rode', available: 4, total: 5 },
];

const mockMembers = [
  { id: 101, name: 'أحمد محمود' },
  { id: 102, name: 'علي كمال' },
  { id: 103, name: 'سارة خالد' },
];

export const EquipmentOperationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [operationType, setOperationType] = useState<'تسليم' | 'إسترجاع'>('تسليم');
  const [selectedEq, setSelectedEq] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [equipmentStatus, setEquipmentStatus] = useState('جيد');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ operationType, selectedEq, selectedMember, quantity });
    onClose();
  };

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content form-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="eq-dialog-header">
          <div className="eq-dialog-title-wrapper">
            <CheckCircle2 size={24} className="eq-dialog-icon" />
            <h2>عملية عتاد جديدة</h2>
          </div>
          <button className="eq-close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <div className="eq-dialog-body" style={{ padding: '24px' }}>
          <div className="ops-type-toggle">
            <button 
              className={`ops-toggle-btn ${operationType === 'تسليم' ? 'active-handover' : ''}`}
              onClick={() => setOperationType('تسليم')}
            >
              تسليم (إعارة)
            </button>
            <button 
              className={`ops-toggle-btn ${operationType === 'إسترجاع' ? 'active-return' : ''}`}
              onClick={() => setOperationType('إسترجاع')}
            >
              إسترجاع
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ops-form">
            <div className="form-row">
              <CustomDropdown<string>
                label="اختر العتاد"
                value={selectedEq}
                onChange={(val) => setSelectedEq(val)}
                options={mockEquipmentList.map(eq => ({
                  value: eq.id.toString(),
                  label: `${eq.name} ${operationType === 'تسليم' ? `(متاح: ${eq.available})` : ''}`
                }))}
                placeholder="-- اختر عتاداً --"
              />

              <CustomDropdown<string>
                label="العضو المستلم / المرجع"
                value={selectedMember}
                onChange={(val) => setSelectedMember(val)}
                options={mockMembers.map(member => ({
                  value: member.id.toString(),
                  label: member.name
                }))}
                placeholder="-- اختر عضواً --"
              />
            </div>

            <div className="form-row">
              <CustomInput
                type="number"
                label="الكمية"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />

              <CustomInput
                type="date"
                label="التاريخ"
                value={new Date().toISOString().split('T')[0]} // Might need a state for this if it changes
                onChange={() => {}} // Dummy onChange if using state
                required
              />
            </div>

            <div className="form-row">
              <CustomDropdown<string>
                label="حالة العتاد"
                value={equipmentStatus}
                onChange={(val) => setEquipmentStatus(val)}
                options={[
                  { value: 'جيد', label: 'جيد (Good)' },
                  { value: 'متوسط', label: 'متوسط (Average)' },
                  { value: 'يحتاج صيانة', label: 'يحتاج صيانة (Needs Maintenance)' },
                  { value: 'تالف', label: 'تالف (Damaged)' },
                ]}
                placeholder="-- اختر الحالة --"
              />
            </div>

            <div className="eq-dialog-footer" style={{ marginTop: '24px', padding: '0', background: 'transparent', borderTop: 'none' }}>
              <button type="button" className="eq-btn-cancel" onClick={onClose}>إلغاء</button>
              <button type="submit" className="eq-btn-save" style={{ marginTop: 0 }}>
                تأكيد العملية
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
