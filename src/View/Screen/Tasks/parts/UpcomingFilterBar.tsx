import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { MobileSelect } from '../../../Mobile/widgets/MobileSelect';
import { filterUpcoming, UPCOMING_FILTERS, type Task, type UpcomingFilterKey, type UpcomingFilters } from '../taskUtils';

/**
 * The filters of the appointments' tasks still to come (only the keys given), as on the other pages: a dropdown each on
 * the computer (inside the page's actions row), a bottom sheet each on phones; every choice with how many it would
 * show (the other filters applied).
 */
export const UpcomingFilterBar: React.FC<{
  tasks: Task[];
  value: UpcomingFilters;
  onChange: (v: UpcomingFilters) => void;
  keys: UpcomingFilterKey[];
  mobile: boolean;
}> = ({ tasks, value, onChange, keys, mobile }) => {
  const filters = UPCOMING_FILTERS.filter(f => keys.includes(f.key));
  const count = (key: UpcomingFilterKey, v: string) => filterUpcoming(tasks, { ...value, [key]: v }).length;
  const set = (key: UpcomingFilterKey, v: string) => onChange({ ...value, [key]: v === 'all' ? '' : v });

  if (!mobile) {
    return (
      <>
        {filters.map(f => (
          <CustomDropdown
            key={f.key}
            options={f.options.map(o => ({ value: o.value || 'all', label: `${o.label} (${count(f.key, o.value)})` }))}
            value={value[f.key] || 'all'}
            onChange={v => set(f.key, v)}
          />
        ))}
      </>
    );
  }

  return (
    <div className={`tk-mfilters ${filters.length > 2 ? 'tsk-mfilters3' : ''}`}>
      {filters.map(f => (
        <MobileSelect
          key={f.key}
          label={f.label}
          icon={f.icon}
          value={value[f.key] || 'all'}
          options={f.options.map(o => ({ value: o.value || 'all', label: o.label, hint: String(count(f.key, o.value)) }))}
          onChange={v => set(f.key, v)}
          renderTrigger={open => (
            <button type="button" className={`tk-filter-btn ${value[f.key] ? 'active' : ''}`} onClick={open}>
              <f.icon size={15} />
              <span><small>{f.label}</small><strong>{value[f.key] ? f.options.find(o => o.value === value[f.key])?.label : 'الكل'}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
      ))}
    </div>
  );
};
