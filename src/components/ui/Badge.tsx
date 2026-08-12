import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'cyan' | 'purple' | 'danger';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-bg-elevated text-text-secondary border border-border-secondary',
    success: 'bg-success-bg text-success border border-success/20',
    warning: 'bg-warning-bg text-warning border border-warning/20',
    error: 'bg-error-bg text-error border border-error/20',
    info: 'bg-info-bg text-info border border-info/20',
    brand: 'bg-brand-light text-brand border border-brand/20',
    cyan: 'bg-cyan-500/10 text-cyan-200 border border-cyan-400/20',
    purple: 'bg-violet-500/10 text-violet-200 border border-violet-400/20',
    danger: 'bg-error-bg text-error border border-error/20',
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
