import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const CustomInput: React.FC<CustomInputProps> = ({ label, type, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type={inputType} 
          {...props} 
          style={{ width: '100%', ...(isPassword ? { paddingLeft: '40px' } : {}) }} 
        />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ 
              position: 'absolute', 
              left: '10px',
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: 'var(--text-muted, #6b7280)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};
