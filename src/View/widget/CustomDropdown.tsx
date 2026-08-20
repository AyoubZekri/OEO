import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string> {
  label?: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string | null;
}

export const CustomDropdown = <T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  error
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
      {label && <label>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', 
          border: '1px solid var(--border, #d1d5db)', borderRadius: '8px', 
          cursor: 'pointer', background: 'var(--bg, #fff)', color: 'var(--text-h, #111827)' 
        }}
      >
        {selectedOption?.icon}
        <span>{selectedOption?.label || placeholder}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>
      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, width: '100%', 
          background: 'var(--bg, #fff)', border: '1px solid var(--border, #d1d5db)', 
          borderRadius: '8px', zIndex: 50, marginTop: '4px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowY: 'auto', overflowX: 'hidden', maxHeight: '250px' 
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{ 
                padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', 
                cursor: 'pointer', 
                background: value === opt.value ? 'var(--bg-hover, #f3f4f6)' : 'transparent', 
                color: 'var(--text-h, #111827)' 
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = value === opt.value ? 'rgba(0,0,0,0.05)' : 'transparent'}
            >
              {opt.icon}
              {opt.label}
            </div>
          ))}
        </div>
      )}
      {error && <span style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};
