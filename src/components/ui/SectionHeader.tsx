import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: LucideIcon;
  iconClassName?: string;
}

export function SectionHeader({
  className,
  icon: Icon,
  iconClassName,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <h2
      className={twMerge(
        'flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-primary',
        className
      )}
      {...props}
    >
      {Icon && <Icon className={twMerge('h-4 w-4 text-text-muted', iconClassName)} />}
      {children}
    </h2>
  );
}
