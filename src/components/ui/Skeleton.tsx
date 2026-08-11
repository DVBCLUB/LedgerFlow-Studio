import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export default function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  let baseClass = 'animate-pulse bg-slate-800/50';
  
  if (variant === 'circular') {
    baseClass += ' rounded-full';
  } else if (variant === 'text') {
    baseClass += ' rounded-md h-4';
  } else {
    baseClass += ' rounded-xl';
  }

  return <div className={`${baseClass} ${className}`} />;
}
