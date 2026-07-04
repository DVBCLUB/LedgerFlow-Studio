import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition cursor-pointer';
  
  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
    secondary: 'bg-bg-elevated border border-border-secondary text-text-primary hover:bg-bg-tertiary',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
    danger: 'bg-error-bg text-error hover:bg-error-bg/80 border border-error/20',
  };

  const sizeClasses = {
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
