import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

type SimplePanelCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  status?: string;
  items?: string[];
  actions?: string[];
  tone?: 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
};

const toneClass: Record<NonNullable<SimplePanelCardProps['tone']>, string> = {
  slate: 'border-border-primary bg-bg-surface text-text-secondary',
  cyan: 'border-info/20 bg-info-bg text-info',
  emerald: 'border-success/20 bg-success-bg text-success',
  amber: 'border-warning/20 bg-warning-bg text-warning',
  rose: 'border-error/20 bg-error-bg text-error',
  violet: 'border-brand/20 bg-brand-light text-brand',
};


export default function SimplePanelCard({
  eyebrow = 'LedgerFlow control',
  title,
  description,
  icon: Icon,
  status = 'Sẵn sàng',
  items = [],
  actions = [],
  tone = 'slate',
}: SimplePanelCardProps) {
  return (
    <Card className={toneClass[tone]} padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border-secondary bg-bg-elevated text-current">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{eyebrow}</p>
            <h2 className="mt-1 text-sm font-semibold text-text-primary">{title}</h2>
            <p className="mt-2 text-xs font-semibold leading-5 opacity-90">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border-secondary bg-bg-elevated px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide opacity-90">
          {status}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-xl border border-border-secondary bg-bg-elevated px-3 py-2 text-xs font-semibold leading-5 opacity-90">
              {item}
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="rounded-full border border-border-secondary bg-bg-elevated px-3 py-1 text-[10px] font-bold uppercase tracking-wide opacity-90">
              {action}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
