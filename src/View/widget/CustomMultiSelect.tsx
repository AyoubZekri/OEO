import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomMultiSelectProps {
  label?: React.ReactNode;
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string | null;
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  label,
  values,
  options,
  onChange,
  placeholder,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const removeValue = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== val));
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
      {label && <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: 'var(--text-h, #1f2937)' }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', 
          border: isOpen ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent', borderRadius: '14px', 
          cursor: 'pointer', background: isOpen ? '#fff' : 'rgba(0,0,0,0.03)', color: 'var(--text-h)',
          minHeight: '52px', boxSizing: 'border-box', flexWrap: 'wrap',
          boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'inset 0 2px 5px rgba(0,0,0,0.01)',
          transition: 'all 0.2s ease'
        }}
      >
        {values.length === 0 ? (
          <span style={{ color: '#94a3b8' }}>{placeholder || 'اختر...'}</span>
        ) : (
          values.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <span key={val} style={{ 
                background: 'var(--accent, #3b82f6)', color: 'white', 
                padding: '6px 12px', borderRadius: '20px', 
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 500, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}>
                {opt?.icon && <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>{opt.icon}</span>}
                {opt?.label || val}
                <div 
                  onClick={(e) => removeValue(e, val)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '2px',
                    marginLeft: '4px', cursor: 'pointer', transition: 'background 0.2s' 
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <X size={14} />
                </div>
              </span>
            );
          })
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
          background: 'var(--bg, #fff)', border: '1px solid #e2e8f0', 
          borderRadius: '16px', zIndex: 50, 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', right: '12px', color: '#94a3b8', display: 'flex' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="بحث عن عضو..." 
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
          <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '8px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>لا توجد نتائج</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <div 
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
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
                      width: '20px', height: '20px', borderRadius: '6px', 
                      border: isSelected ? 'none' : '2px solid #cbd5e1',
                      background: isSelected ? 'var(--accent, #3b82f6)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
