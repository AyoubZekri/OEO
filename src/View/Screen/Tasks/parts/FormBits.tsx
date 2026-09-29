import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { MobileSelect } from '../../../Mobile/widgets/MobileSelect';
import { PRIORITIES, type TaskUser } from '../taskUtils';

/** Assignee / reviewer picker: a searchable bottom sheet on phones, a select on desktop */
export const UserPicker: React.FC<{
  mobile: boolean;
  label: string;
  icon: LucideIcon;
  value: string;
  users: TaskUser[];
  onChange: (v: string) => void;
  exclude?: string;
  placeholder?: string;
}> = ({ mobile, label, icon, value, users, onChange, exclude, placeholder = 'اختر مستخدماً' }) => {
  const options = users.filter(u => String(u.id) !== exclude).map(u => ({ value: String(u.id), label: u.name }));
  if (mobile) {
    return <MobileSelect label={label} icon={icon} value={value} options={options} onChange={onChange} placeholder={placeholder} searchable />;
  }
  return (
    <label className="tk-field">
      <span className="tk-label">{React.createElement(icon, { size: 14 })}{label}</span>
      <select className="tk-input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{users.length ? placeholder : 'جاري تحميل المستخدمين...'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
};

export const PriorityPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="tk-field">
    <span className="tk-label">الأولوية</span>
    <div className="tk-seg four">
      {PRIORITIES.map(p => (
        <button key={p.value} type="button" className={`tone-${p.tone} ${value === p.value ? 'on' : ''}`} onClick={() => onChange(p.value)}>
          <i className="tk-prio-dot" aria-hidden="true" />{p.label}
        </button>
      ))}
    </div>
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; title: string; hint: string; icon: LucideIcon }> = ({ checked, onChange, title, hint, icon }) => (
  <button type="button" className={`tk-toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
    <span className="tk-toggle-icon">{React.createElement(icon, { size: 17 })}</span>
    <span className="tk-toggle-text"><strong>{title}</strong><small>{hint}</small></span>
    <span className="tk-switch" aria-hidden="true"><i /></span>
  </button>
);
