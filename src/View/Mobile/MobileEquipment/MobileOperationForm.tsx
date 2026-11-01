import React, { useState } from 'react';
import {
  Save, Loader2, User, UserRound, ChevronDown, Calendar, Trophy, Package, Plus, Minus, Trash2, AlertCircle, ListChecks,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect } from '../widgets/MobileSelect';
import type { useEquipmentOperationController, OperationItem } from '../../Screen/Equipment/EquipmentOperationController';
import { TYPE_LABELS } from '../MobileMembers/memberLabels';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import { HANDOVER_CONDITIONS, availableOf, initials } from './equipmentUtils';
import '../MobileEvaluations/MobileEvaluations.css';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { SeasonPicker, currentSeason } from '../../Screen/Equipment/SeasonPicker';

/* eslint-disable @typescript-eslint/no-explicit-any -- operations come untyped from the API */

interface MobileOperationFormProps {
  c: ReturnType<typeof useEquipmentOperationController>;
  /** null = new operation */
  operation: any | null;
  onClose: () => void;
}

const newItem = (): OperationItem => ({ id: `${Date.now()}${Math.random()}`, equipment_id: '', quantity: '1', condition: 'جيد' });

// Phone version of the handover dialog: same fields, checks and payload
export const MobileOperationForm: React.FC<MobileOperationFormProps> = ({ c, operation, onClose }) => {
  const [member, setMember] = useState(operation?.member_id?.toString() || '');
  const [date, setDate] = useState(
    operation?.operation_date ? new Date(operation.operation_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [season, setSeason] = useState(operation?.sports_season || currentSeason());
  const [items, setItems] = useState<OperationItem[]>(() =>
    operation?.movements?.length
      ? operation.movements.map((mov: any) => ({
        id: mov.id?.toString() || `${Date.now()}${Math.random()}`,
        equipment_id: mov.equipment_id?.toString() || '',
        quantity: mov.quantity?.toString() || '1',
        condition: mov.condition || mov.delivery_condition || 'جيد',
      }))
      : [newItem()],
  );
  // The date left empty: its message under it (the member and the items: a snackbar)
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const person = c.members.find(m => String(m.id) === member);
  const setItem = (id: string, field: keyof OperationItem, value: string) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  const save = async () => {
    setTried(true);
    if (!date) return;
    if (!member) return showSnackbar('خطأ', 'اختر العضو المستلم', '#ef4444');
    if (items.some(i => !i.equipment_id || !i.quantity)) return showSnackbar('خطأ', 'اختر العتاد واكتب كميته', '#ef4444');
    for (const item of items) {
      const eq = c.equipments.find(e => e.id.toString() === item.equipment_id);
      if (eq && Number(item.quantity) > availableOf(eq)) {
        return showSnackbar('خطأ', `الكمية غير متوفرة من «${eq.name}» (المتوفر ${availableOf(eq)})`, '#ef4444');
      }
    }
    setSaving(true);
    const ok = operation
      ? await c.updateOperation(operation.id, member, date, season, items)
      : await c.createOperation(member, date, season, items);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <MobileScreen
      title={operation ? 'تعديل عملية تسليم' : 'عملية تسليم جديدة'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="meq-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : operation ? 'حفظ التعديلات' : 'تأكيد'}
        </button>
      )}
    >

      <section className="me-card">
        <h3 className="me-section-title"><span><User size={16} /></span>العضو المستلم</h3>
        <MobileSelect
          label="العضو المستلم"
          icon={User}
          value={member}
          options={c.members.map(m => ({
            value: m.id.toString(),
            label: `${m.first_name} ${m.last_name}`,
            group: TYPE_LABELS[m.type] || 'أخرى',
          }))}
          onChange={setMember}
          searchable
          renderTrigger={open => (
            <button type="button" className={`meq-pick ${person ? 'has' : ''}`} onClick={open}>
              {person
                ? <span className="meq-avatar">{initials(`${person.first_name} ${person.last_name}`)}</span>
                : <span className="meq-pick-icon"><UserRound size={20} /></span>}
              <span className="meq-pick-text">
                {person && <small>{TYPE_LABELS[person.type] || 'عضو'}</small>}
                <strong>{person ? `${person.first_name} ${person.last_name}` : 'اختر عضواً'}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
          )}
        />

        {/* The date (with «اليوم»), then the season under it: each one the card's full width */}
        <label className="me-field">
          <span className="me-label"><Calendar size={14} /> تاريخ العملية</span>
          <input className={`me-input ${tried && !date ? 'is-missing' : ''}`} type="date" dir="ltr" value={date} onChange={e => setDate(e.target.value)} />
          {tried && !date && <p className="meq-form-error"><AlertCircle size={13} /> حدد التاريخ</p>}
        </label>
        <div className="meq-quick">
          <button type="button" className={date === isoDay(0) ? 'on' : ''} onClick={() => setDate(isoDay(0))}>اليوم</button>
        </div>
        <div className="me-field">
          <span className="me-label"><Trophy size={14} /> الموسم الرياضي</span>
          <SeasonPicker value={season} onChange={setSeason} label="" />
        </div>
      </section>

      <section className="me-card">
        <h3 className="me-section-title"><span><ListChecks size={16} /></span>قائمة العتاد</h3>
        <div className="meq-items">
          {items.map((item, index) => {
            const eq = c.equipments.find(e => e.id.toString() === item.equipment_id);
            const qty = Number(item.quantity) || 0;
            const over = eq && qty > availableOf(eq);
            return (
              <div key={item.id} className={`meq-item ${over ? 'over' : ''}`}>
                <div className="meq-item-head">
                  <span className="meq-item-num">{index + 1}</span>
                  <MobileSelect
                    label="العتاد"
                    icon={Package}
                    value={item.equipment_id}
                    options={c.equipments.map(e => ({ value: e.id.toString(), label: e.name, hint: `متوفر ${availableOf(e)}` }))}
                    onChange={v => setItem(item.id, 'equipment_id', v)}
                    searchable
                    renderTrigger={open => (
                      <button type="button" className={`meq-eq-pick ${eq ? '' : 'empty'}`} onClick={open}>
                        <span><strong>{eq?.name || 'اختر عتاداً'}</strong>{eq && <small>متوفر: {availableOf(eq)}</small>}</span>
                        <ChevronDown size={16} />
                      </button>
                    )}
                  />
                  {items.length > 1 && (
                    <button type="button" className="meq-item-remove" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} aria-label="إزالة">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="meq-item-row">
                  <span className="meq-item-label">الكمية</span>
                  <div className="meq-stepper">
                    <button type="button" onClick={() => setItem(item.id, 'quantity', String(Math.max(1, qty - 1)))} disabled={qty <= 1} aria-label="إنقاص"><Minus size={15} /></button>
                    <strong>{item.quantity || 0}</strong>
                    <button type="button" onClick={() => setItem(item.id, 'quantity', String(qty + 1))} aria-label="زيادة"><Plus size={15} /></button>
                  </div>
                </div>
                <div className="meq-item-conds">
                  <span className="meq-item-label">الحالة</span>
                  <div className="meq-conds small">
                    {HANDOVER_CONDITIONS.map(x => (
                      <button key={x} type="button" className={item.condition === x ? 'on' : ''} onClick={() => setItem(item.id, 'condition', x)}>{x}</button>
                    ))}
                  </div>
                </div>
                {over && <p className="meq-form-error"><AlertCircle size={13} /> المتوفر حالياً: {availableOf(eq)}</p>}
              </div>
            );
          })}
        </div>
        <button type="button" className="meq-add" onClick={() => setItems(prev => [...prev, newItem()])}><Plus size={16} /> إضافة صنف</button>
      </section>
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
