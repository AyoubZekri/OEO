import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string> {
  label?: React.ReactNode;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
}

export const CustomDropdown = <T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  required
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-form-group" style={{ position: 'relative', zIndex: isOpen ? 999 : 1 }} ref={dropdownRef}>
      {label && (
        <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: 'var(--text-h, #1f2937)' }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginInlineStart: '4px' }}>*</span>}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', 
          border: isOpen ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent', borderRadius: '14px', 
          cursor: 'pointer', background: isOpen ? '#fff' : 'rgba(0,0,0,0.03)', color: 'var(--text-h)',
          minHeight: '52px', boxSizing: 'border-box', fontSize: '0.95rem',
          boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'inset 0 2px 5px rgba(0,0,0,0.01)',
          transition: 'all 0.2s ease'
        }}
      >
        {selectedOption?.icon && <span style={{ opacity: 0.9 }}>{selectedOption.icon}</span>}
        <span style={{ fontWeight: selectedOption ? 500 : 400, color: selectedOption ? 'inherit' : '#94a3b8' }}>
          {selectedOption?.label || placeholder || 'اختر...'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
          background: 'var(--bg, #fff)', border: '1px solid #e2e8f0', 
          borderRadius: '16px', zIndex: 1000, 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          {options.length > 5 && (
            <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', right: '12px', color: '#94a3b8', display: 'flex' }}>
                  <Search size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="بحث..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                    paddingRight: '36px',
                    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem',
                    boxSizing: 'border-box', background: '#fff',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent, #3b82f6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
                />
              </div>
            </div>
          )}
          <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '8px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>لا توجد نتائج</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <div 
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                    style={{ 
                      padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', 
                      cursor: 'pointer', borderRadius: '10px',
                      background: isSelected ? '#eff6ff' : 'transparent', 
                      color: isSelected ? '#1e3a8a' : 'var(--text-h, #1f2937)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = isSelected ? '#dbeafe' : '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'}
                  >
                    <div style={{ 
                      width: '20px', height: '20px', borderRadius: '50%', 
                      border: isSelected ? 'none' : '2px solid #cbd5e1',
                      background: isSelected ? 'var(--accent, #3b82f6)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>}
                    </div>
                    {opt.icon && <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? 'var(--accent, #3b82f6)' : '#64748b' }}>{opt.icon}</span>}
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {error && <span style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '6px', display: 'block', fontWeight: 500 }}>{error}</span>}
    </div>
  );
};
