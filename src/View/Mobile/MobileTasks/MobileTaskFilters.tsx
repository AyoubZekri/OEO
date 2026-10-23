import React from 'react';
import { Search, X, Filter, ChevronDown, Shapes, Layers } from 'lucide-react';
import { MobileSelect } from '../widgets/MobileSelect';
import { KIND_FILTERS, NATURE_FILTERS, STATUS_FILTERS, type Task } from '../../Screen/Tasks/taskUtils';

export interface TaskFilterState {
  query: string;
  status: string;
  kind: string;
  nature: string;
}

// Phones: the search (task, details, who, a date) and three filters on one line — status, kind, nature —
// each a bottom sheet with its counts
export const MobileTaskFilters: React.FC<{
  tasks: Task[];
  value: TaskFilterState;
  onChange: (v: TaskFilterState) => void;
  /** The status choices (all of them by default) */
  statuses?: typeof STATUS_FILTERS;
}> = ({ tasks, value, onChange, statuses = STATUS_FILTERS }) => {
  const set = (patch: Partial<TaskFilterState>) => onChange({ ...value, ...patch });
  const statusCount = (v: string) => tasks.filter(STATUS_FILTERS.find(f => f.value === v)!.test).length;
  const kindCount = (v: string) => tasks.filter(t => !v || t.kind === v).length;

  const sheet = (label: string, icon: typeof Filter, current: string, options: { value: string; label: string; hint?: string }[], pick: (v: string) => void) => (
    <MobileSelect
      label={label}
      icon={icon}
      value={current || 'all'}
      options={options.map(o => ({ ...o, value: o.value || 'all' }))}
      onChange={v => pick(v === 'all' ? '' : v)}
      renderTrigger={open => (
        <button type="button" className={`tk-filter-btn ${current ? 'active' : ''}`} onClick={open}>
          {React.createElement(icon, { size: 15 })}
          <span><small>{label}</small><strong>{current ? options.find(o => o.value === current)?.label : 'الكل'}</strong></span>
          <ChevronDown size={15} />
        </button>
      )}
    />
  );

  return (
    <div className="tk-toolbar">
      <label className="tk-search">
        <Search size={17} />
        <input type="search" value={value.query} onChange={e => set({ query: e.target.value })} placeholder="بحث بالمهمة، المكلّف أو التاريخ..." />
        {value.query && <button type="button" onClick={() => set({ query: '' })} aria-label="مسح البحث"><X size={15} /></button>}
      </label>
      <div className="tk-mfilters tsk-mfilters3">
        {sheet('الحالة', Filter, value.status, statuses.map(f => ({ value: f.value, label: f.label, hint: String(statusCount(f.value)) })), v => set({ status: v }))}
        {sheet('النوع', Layers, value.kind, KIND_FILTERS.map(f => ({ ...f, hint: String(kindCount(f.value)) })), v => set({ kind: v }))}
        {sheet('الطبيعة', Shapes, value.nature, NATURE_FILTERS, v => set({ nature: v }))}
      </div>
    </div>
  );
};
