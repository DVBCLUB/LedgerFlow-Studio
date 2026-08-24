import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'cyan' | 'purple' | 'danger';
  /** Backward-compatible color tone (emerald, cyan, amber, rose, violet, slate, …). */
  tone?: string;
}

const variantClasses: Record<string, string> = {
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

const toneClasses: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20',
  green: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20',
  cyan: 'bg-cyan-500/10 text-cyan-200 border border-cyan-400/20',
  amber: 'bg-amber-500/10 text-amber-200 border border-amber-400/20',
  rose: 'bg-rose-500/10 text-rose-200 border border-rose-400/20',
  violet: 'bg-violet-500/10 text-violet-200 border border-violet-400/20',
  purple: 'bg-violet-500/10 text-violet-200 border border-violet-400/20',
  slate: 'bg-slate-500/10 text-slate-300 border border-slate-400/20',
  primary: 'bg-brand-light text-brand border border-brand/20',
  success: 'bg-success-bg text-success border border-success/20',
  warning: 'bg-warning-bg text-warning border border-warning/20',
  error: 'bg-error-bg text-error border border-error/20',
  danger: 'bg-error-bg text-error border border-error/20',
  info: 'bg-info-bg text-info border border-info/20',
};

export function Badge({
  className,
  variant = 'default',
  tone,
  children,
  ...props
}: BadgeProps) {
  const colorClass = tone
    ? (toneClasses[tone] || variantClasses[tone] || variantClasses.default)
    : variantClasses[variant];

  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        colorClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
