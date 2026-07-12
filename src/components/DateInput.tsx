import React, { useState, useEffect } from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export default function DateInput({ value, onChange, ...props }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      if (y.length === 4) {
         setDisplayValue(`${d}-${m}-${y}`);
      }
    } else if (!value) {
      setDisplayValue('');
    }
  }, [value]);

  const parseAndFormatDate = (input: string) => {
    let parsed = input.replace(/[\/\.]/g, '-');
    if (!parsed) return;

    if (/^\d+$/.test(parsed)) {
      if (parsed.length === 6) { 
        parsed = `${parsed.substring(0, 2)}-${parsed.substring(2, 4)}-20${parsed.substring(4, 6)}`;
      } else if (parsed.length === 8) { 
        parsed = `${parsed.substring(0, 2)}-${parsed.substring(2, 4)}-${parsed.substring(4, 8)}`;
      } else if (parsed.length === 4) { 
        const cy = new Date().getFullYear();
        parsed = `${parsed.substring(0, 2)}-${parsed.substring(2, 4)}-${cy}`;
      } else if (parsed.length === 1 || parsed.length === 2) {
        const cy = new Date().getFullYear();
        const cm = String(new Date().getMonth() + 1).padStart(2, '0');
        parsed = `${parsed.padStart(2, '0')}-${cm}-${cy}`;
      }
    }

    const parts = parsed.split('-');
    if (parts.length > 0) {
      let d = parts[0] || '';
      let m = parts[1] || '';
      let y = parts[2] || '';

      if (d.length === 1) d = '0' + d;
      if (m.length === 1) m = '0' + m;
      if (y.length === 2) {
        y = '20' + y;
      } else if (!y) {
        y = new Date().getFullYear().toString();
      }
      
      if (!m) {
        m = String(new Date().getMonth() + 1).padStart(2, '0');
      }

      if (d && m && y && y.length === 4) {
        const dNum = parseInt(d, 10);
        const mNum = parseInt(m, 10);
        if (dNum > 0 && dNum <= 31 && mNum > 0 && mNum <= 12) {
           setDisplayValue(`${d}-${m}-${y}`);
           const newVal = `${y}-${m}-${d}`;
           if (newVal !== value) {
             onChange(newVal);
           }
           return;
        }
      }
    }
    
    // Fallback if parsing fails - just reset to value
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      if (y.length === 4) {
         setDisplayValue(`${d}-${m}-${y}`);
      }
    } else {
      setDisplayValue('');
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    parseAndFormatDate(displayValue);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      parseAndFormatDate(displayValue);
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="DD-MM-YYYY"
      {...props}
    />
  );
}
