import React, { useState } from 'react';
import { Search, X, Check, CheckCheck, Eraser } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TYPE_LABELS } from '../../../Mobile/MobileMembers/memberLabels';
import type { TravelPerson } from '../travelUtils';

interface MemberMultiPickerProps {
  label: string;
  icon: LucideIcon;
  people: TravelPerson[];
  value: number[];
  onChange: (ids: number[]) => void;
  empty: string;
  /** Show each person's position (staff), not needed for players */
  showType?: boolean;
}

/** Choose several members: search, select all / none, and a list of check rows */
export const MemberMultiPicker: React.FC<MemberMultiPickerProps> = ({ label, icon: Icon, people, value, onChange, empty, showType }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = people.filter(p => !q || p.name.toLowerCase().includes(q));
  const chosen = new Set(value);

  const toggle = (id: number) => onChange(chosen.has(id) ? value.filter(v => v !== id) : [...value, id]);
  const allVisible = visible.length > 0 && visible.every(p => chosen.has(p.id));
  const selectVisible = () => onChange(allVisible
    ? value.filter(id => !visible.some(p => p.id === id))
    : [...value, ...visible.filter(p => !chosen.has(p.id)).map(p => p.id)]);

  return (
    <div className="tk-field tv-multi">
      <div className="tv-multi-head">
        <span className="tk-label"><Icon size={14} />{label}<b>{value.length}</b></span>
        {people.length > 0 && (
          <span className="tv-multi-actions">
            <button type="button" onClick={selectVisible}><CheckCheck size={14} />{allVisible ? 'إلغاء الكل' : 'تحديد الكل'}</button>
            {value.length > 0 && <button type="button" onClick={() => onChange([])}><Eraser size={14} />مسح</button>}
          </span>
        )}
      </div>

      {people.length > 6 && (
        <label className="tk-search tv-multi-search">
          <Search size={15} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={14} /></button>}
        </label>
      )}

      {people.length === 0 ? <p className="tk-muted tv-multi-empty">{empty}</p> : (
        <div className="tv-multi-list" role="listbox" aria-multiselectable="true" aria-label={label}>
          {visible.map(p => {
            const on = chosen.has(p.id);
            return (
              <button key={p.id} type="button" role="option" aria-selected={on} className={on ? 'on' : ''} onClick={() => toggle(p.id)}>
                <span className="tv-check" aria-hidden="true">{on && <Check size={13} strokeWidth={3} />}</span>
                <span className="tv-multi-name">{p.name}</span>
                {showType && p.type && <small>{TYPE_LABELS[p.type] || p.type}</small>}
              </button>
            );
          })}
          {visible.length === 0 && <p className="tk-muted tv-multi-empty">لا توجد نتائج</p>}
        </div>
      )}
    </div>
  );
};
