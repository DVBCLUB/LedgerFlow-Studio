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
  slate: 'border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 text-slate-300 shadow-lg shadow-black/20',
  cyan: 'border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-slate-950 text-cyan-300 shadow-lg shadow-cyan-950/20',
  emerald: 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950 text-emerald-300 shadow-lg shadow-emerald-950/20',
  amber: 'border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 text-amber-300 shadow-lg shadow-amber-950/20',
  rose: 'border-rose-500/20 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-950 text-rose-300 shadow-lg shadow-rose-950/20',
  violet: 'border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 via-slate-900/90 to-slate-950 text-indigo-300 shadow-lg shadow-indigo-950/20',
};

const SimplePanelCard = React.memo(function SimplePanelCard({
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
    <Card className={`${toneClass[tone]} backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20`} padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-current shadow-inner">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">{eyebrow}</p>
            <h2 className="mt-1 text-sm font-black tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300/80">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300 shadow-sm">
          {status}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/60 px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              {action}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
});

export default SimplePanelCard;
