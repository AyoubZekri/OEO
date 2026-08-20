import React from 'react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  name?: string;
  value: string | number;
  onChangeValue: (value: string) => void;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ name, value, onChangeValue, className, ...props }) => {
  const displayValue = React.useMemo(() => {
    if (value === '' || value === null || value === undefined) return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    const enStr = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return enStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
  }, [value]);

  const setCursorPosition = (input: HTMLInputElement) => {
    window.requestAnimationFrame(() => {
      if (input.value.indexOf(',') > -1) {
        const commaIndex = input.value.indexOf(',');
        input.setSelectionRange(commaIndex, commaIndex);
      } else {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let val = input.value;
    
    // Int part only (split by comma since comma is the decimal separator now)
    let intPart = val.split(',')[0].replace(/\D/g, '');
    
    onChangeValue(intPart);
    setCursorPosition(input);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget);
    if (props.onFocus) props.onFocus(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget);
    if (props.onClick) props.onClick(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent moving cursor past the comma
    if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.value.indexOf(',') > -1 && input.selectionStart === input.value.indexOf(',')) {
        e.preventDefault();
      }
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <input
      type="text"
      name={name}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={className}
      dir="ltr"
      style={{ textAlign: 'right' }}
      {...props}
    />
  );
};
