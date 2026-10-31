import React from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { MobileSelect } from '../widgets/MobileSelect';
import { ABSENCE_TYPES } from '../../Screen/Absence/absenceUtils';

const OPTIONS = [{ value: '', label: 'كل الأنواع' }, ...ABSENCE_TYPES.map(t => ({ value: t.value, label: t.label }))];

// The kind filter (absence, late, leave, holiday) as a dropdown, like the page's other filters
export const MobileTypeFilter: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <MobileSelect
    label="النوع"
    icon={Layers}
    value={value}
    options={OPTIONS}
    onChange={onChange}
    renderTrigger={open => (
      <button type="button" className={`mab-filter ${value ? 'active' : ''}`} onClick={open}>
        <Layers size={15} />
        <span><small>النوع</small><strong>{OPTIONS.find(o => o.value === value)?.label}</strong></span>
        <ChevronDown size={15} />
      </button>
    )}
  />
);
