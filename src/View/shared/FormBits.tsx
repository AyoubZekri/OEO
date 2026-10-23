import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { MobileSelect } from '../Mobile/widgets/MobileSelect';
import { CustomDropdown } from '../widget/CustomDropdown';

/** A user offered in a picker */
export interface PickUser { id: number | string; name: string }

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

/** A user picker, with the app's dropdown */
export const UserPicker: React.FC<{
  mobile: boolean;
  label: string;
  icon: LucideIcon;
  value: string;
  users: PickUser[];
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
