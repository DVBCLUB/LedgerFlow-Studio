import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
  slate: 'border-slate-800 bg-slate-900/70 text-slate-200',
  cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-100',
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
  amber: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
  rose: 'border-rose-500/25 bg-rose-500/10 text-rose-100',
  violet: 'border-violet-500/20 bg-violet-500/5 text-violet-100',
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
    <section className={`rounded-2xl border p-5 text-left shadow-sm shadow-black/10 ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-current">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{eyebrow}</p>
            <h2 className="mt-1 text-sm font-black text-white">{title}</h2>
            <p className="mt-2 text-xs font-semibold leading-5 opacity-75">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide opacity-80">
          {status}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs font-bold leading-5 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
              {action}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
