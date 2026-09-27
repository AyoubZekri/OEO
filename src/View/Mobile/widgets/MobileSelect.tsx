import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import './MobileSelect.css';

export interface MobileSelectOption {
  value: string;
  label: string;
  hint?: string;   // small badge, e.g. a position code
  group?: string;  // options with the same group are listed under one heading
}

interface MobileSelectProps {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  value: string;
  options: MobileSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  /** Custom element that opens the sheet, in place of the default labelled field */
  renderTrigger?: (open: () => void) => React.ReactNode;
}

// Field that opens a bottom sheet with the options (phone-friendly dropdown)
export const MobileSelect: React.FC<MobileSelectProps> = ({
  label, icon: Icon, value, options, onChange, placeholder = 'اختر', searchable, renderTrigger,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, MobileSelectOption[]>();
    options
      .filter(o => !q || o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q))
      .forEach(o => map.set(o.group || '', [...(map.get(o.group || '') || []), o]));
    return [...map.entries()];
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <div className={renderTrigger ? 'ms-custom' : 'ms-field'}>
      {renderTrigger ? renderTrigger(() => setOpen(true)) : (
        <>
          <span className="ms-label">{label}</span>
          <button type="button" className={`ms-trigger ${selected?.value ? 'has-value' : ''}`} onClick={() => setOpen(true)}>
            <Icon size={18} />
            <span className="ms-value">{selected?.label || placeholder}</span>
            {selected?.hint && <span className="ms-hint">{selected.hint}</span>}
            <ChevronDown size={18} className="ms-chevron" />
          </button>
        </>
      )}

      {open && (
        <div className="ms-backdrop" onClick={close}>
          <div className="ms-sheet" role="listbox" aria-label={label} onClick={e => e.stopPropagation()}>
            <span className="ms-grabber" aria-hidden="true" />
            <div className="ms-sheet-head">
              <h3>{label}</h3>
              <button type="button" className="ms-close" onClick={close} aria-label="إغلاق"><X size={18} /></button>
            </div>

            {searchable && (
              <label className="ms-search">
                <Search size={16} />
                <input type="search" placeholder="ابحث..." value={query} onChange={e => setQuery(e.target.value)} />
              </label>
            )}

            <div className="ms-options">
              {groups.length === 0 && <p className="ms-empty">لا توجد نتائج</p>}
              {groups.map(([group, items]) => (
                <div key={group || 'default'} className="ms-group">
                  {group && <span className="ms-group-title">{group}</span>}
                  {items.map(o => (
                    <button
                      key={o.value || 'none'}
                      type="button"
                      role="option"
                      aria-selected={o.value === value}
                      className={`ms-option ${o.value === value ? 'selected' : ''}`}
                      onClick={() => pick(o.value)}
                    >
                      {o.hint && <span className="ms-option-hint">{o.hint}</span>}
                      <span className="ms-option-label">{o.label}</span>
                      {o.value === value && <Check size={18} className="ms-check" />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
