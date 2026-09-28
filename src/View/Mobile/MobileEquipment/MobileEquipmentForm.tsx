import React, { useEffect, useState } from 'react';
import { Save, Loader2, Camera, Type, Hash, Minus, Plus, AlertCircle, ImageIcon } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { EquipmentModel } from '../../Screen/Equipment/equipment_model';
import '../MobileEvaluations/MobileEvaluations.css';

interface MobileEquipmentFormProps {
  equipment: EquipmentModel | null;
  saving: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same argument as the desktop dialog's onSave
  onSave: (args: { data: any; imageFile: File | null }) => void;
  onClose: () => void;
}

// Phone version of the add / edit equipment dialog (same fields and payload)
export const MobileEquipmentForm: React.FC<MobileEquipmentFormProps> = ({ equipment, saving, onSave, onClose }) => {
  const [name, setName] = useState(equipment?.name || '');
  const [total, setTotal] = useState(equipment ? String(equipment.totalQuantity) : '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(equipment?.image || null);
  const [checked, setChecked] = useState(false);

  // Free a local preview when it is replaced or the page closes
  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const count = Number(total) || 0;
  const errors = {
    name: !name.trim() ? 'اكتب اسم العتاد' : null,
    total: total === '' ? 'حدد الكمية الإجمالية' : null,
  };
  const show = (text: string | null) => (checked && text ? <p className="meq-form-error"><AlertCircle size={14} /> {text}</p> : null);

  const save = () => {
    setChecked(true);
    if (errors.name || errors.total) return;
    onSave({
      data: {
        name,
        totalQuantity: Number(total),
        availableQuantity: equipment ? undefined : Number(total),
      },
      imageFile,
    });
  };

  return (
    <MobileScreen
      title={equipment ? 'تعديل بيانات العتاد' : 'عتاد جديد'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="meq-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : equipment ? 'حفظ التعديلات' : 'إضافة العتاد'}
        </button>
      )}
    >
      <label className={`meq-image-pick ${preview ? 'has' : ''}`}>
        <input type="file" accept="image/*" onChange={pick} />
        {preview ? <img src={preview} alt="صورة العتاد" /> : <span className="meq-image-empty"><ImageIcon size={40} strokeWidth={1.4} /></span>}
        <em><Camera size={15} /> {preview ? 'تغيير الصورة' : 'اختر صورة العتاد'}</em>
      </label>

      <section className="me-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> اسم العتاد</span>
          <input className="me-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كرات تدريب" />
        </label>
        {show(errors.name)}

        <div className="me-field">
          <span className="me-label"><Hash size={14} /> الكمية الإجمالية</span>
          <div className="meq-qty">
            <button type="button" onClick={() => setTotal(String(Math.max(0, count - 1)))} disabled={count <= 0} aria-label="إنقاص"><Minus size={18} /></button>
            <input className="me-input" type="number" inputMode="numeric" dir="ltr" min={0} value={total} onChange={e => setTotal(e.target.value)} />
            <button type="button" onClick={() => setTotal(String(count + 1))} aria-label="زيادة"><Plus size={18} /></button>
          </div>
        </div>
        {show(errors.total)}
        {equipment && (
          <p className="meq-note">المتوفر حالياً بالمخزن: <b>{equipment.availableQuantity}</b> من {equipment.totalQuantity}</p>
        )}
      </section>
    </MobileScreen>
  );
};
