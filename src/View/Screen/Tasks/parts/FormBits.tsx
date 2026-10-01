import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { MobileSelect } from '../../../Mobile/widgets/MobileSelect';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { PRIORITIES, type TaskUser } from '../taskUtils';

/** The app's dropdown: CustomDropdown (searchable) on desktop, a bottom sheet on phones */
export const AppSelect: React.FC<{
  mobile: boolean;
  label: string;
  icon: LucideIcon;
  value: string;
  options: { value: string; label: string; hint?: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ mobile, label, icon, value, options, onChange, placeholder = 'اختر' }) => {
  if (mobile) {
    return <MobileSelect label={label} icon={icon} value={value} options={options} onChange={onChange} placeholder={placeholder} searchable={options.length > 6} />;
  }
  return (
    <div className="tk-field">
      <span className="tk-label">{React.createElement(icon, { size: 14 })}{label}</span>
      <CustomDropdown<string> value={value} options={options} onChange={onChange} placeholder={placeholder} />
    </div>
  );
};

/** Assignee / reviewer / member picker, with the app's dropdown */
export const UserPicker: React.FC<{
  mobile: boolean;
  label: string;
  icon: LucideIcon;
  value: string;
  users: TaskUser[];
  onChange: (v: string) => void;
  exclude?: string;
  placeholder?: string;
}> = ({ mobile, label, icon, value, users, onChange, exclude, placeholder = 'اختر مستخدماً' }) => (
  <AppSelect
    mobile={mobile}
    label={label}
    icon={icon}
    value={value}
    options={users.filter(u => String(u.id) !== exclude).map(u => ({ value: String(u.id), label: u.name }))}
    onChange={onChange}
    placeholder={users.length ? placeholder : 'جاري التحميل...'}
  />
);

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
