import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
}

export function Card({
  className,
  padding = 'lg',
  elevated = false,
  children,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div
      className={twMerge(
        'rounded-2xl border border-border-primary bg-bg-surface',
        paddingClasses[padding],
        elevated && 'shadow-erp-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
