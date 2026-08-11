import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  glow = true,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    primary: [
      'bg-brand text-white hover:bg-brand-hover',
      glow ? 'shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_20px_rgba(99,102,241,0.35)]' : 'shadow-sm',
    ].join(' '),
    secondary: 'bg-bg-elevated border border-border-secondary text-text-primary hover:bg-bg-tertiary hover:border-border-primary shadow-sm',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
    danger: [
      'bg-error-bg text-error hover:bg-error/15 border border-error/20',
      glow ? 'hover:shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_4px_12px_rgba(239,68,68,0.15)]' : '',
    ].join(' '),
    success: [
      'bg-success-bg text-success hover:bg-success/15 border border-success/20',
      glow ? 'hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_4px_12px_rgba(16,185,129,0.15)]' : '',
    ].join(' '),
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  return (
    <button
      className={twMerge(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
