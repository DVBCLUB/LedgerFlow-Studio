import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { formatLiveInputVN, parseMoneyVN } from '../../utils/excelFormatters';

export interface ExcelNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number | string;
  onValueChange?: (val: number) => void;
  suffix?: string;
  className?: string;
}

export const ExcelNumberInput = React.forwardRef<HTMLInputElement, ExcelNumberInputProps>(
  ({ value = '', onValueChange, suffix, className, placeholder = '0', ...props }, ref) => {
    const [displayVal, setDisplayVal] = useState<string>('');

    useEffect(() => {
      if (value === '' || value === null || value === undefined) {
        setDisplayVal('');
      } else if (typeof value === 'number') {
        setDisplayVal(formatLiveInputVN(String(value)));
      } else {
        setDisplayVal(formatLiveInputVN(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const formatted = formatLiveInputVN(rawInput);
      setDisplayVal(formatted);
      const parsedNum = parseMoneyVN(formatted);
      if (onValueChange) {
        onValueChange(parsedNum);
      }
    };

    return (
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayVal}
          onChange={handleChange}
          placeholder={placeholder}
          className={twMerge(
            'flex w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-all',
            suffix ? 'pr-12' : '',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-xs font-mono font-bold text-slate-400 pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

ExcelNumberInput.displayName = 'ExcelNumberInput';
