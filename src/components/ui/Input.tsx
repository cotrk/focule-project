import React, { useState } from 'react';
import type { InputHTMLAttributes, ChangeEvent } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    helperText,
    onChange,
    leftIcon,
    rightIcon,
    variant = 'default',
    className = '',
    value,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value, event);
    };

    const baseClasses = 'w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    
    const variantClasses = {
      default: 'bg-[var(--focule-bg-primary)] border-[var(--focule-border)] focus:border-[var(--focule-primary)] focus:ring-[var(--focule-primary)]/20',
      filled: 'bg-[var(--focule-bg-secondary)] border-transparent focus:bg-[var(--focule-bg-primary)] focus:border-[var(--focule-primary)] focus:ring-[var(--focule-primary)]/20',
    };

    const stateClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : focused 
        ? 'border-[var(--focule-primary)]' 
        : 'border-[var(--focule-border)]';

    const classes = [
      baseClasses,
      variantClasses[variant],
      stateClasses,
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[var(--focule-text-primary)]">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--focule-text-muted)]">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={classes}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--focule-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-[var(--focule-text-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
