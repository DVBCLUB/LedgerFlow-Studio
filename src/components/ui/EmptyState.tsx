import React from 'react';
import { FileQuestion, Plus, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed rounded-2xl ${className}`}
         style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
           style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
        <Icon className="w-8 h-8 text-indigo-400 opacity-80" />
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
