import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS,
  CT1_MODEL_VERSION_REGISTRY,
  CT1_PROTECTED_TABS,
  CT1_PROTECTION_META,
  CT1_RELEASE_AUDIT_CHECKLIST
} from '../data/ct1ProtectionRules';

type CT1GuardPanelProps = {
  setTab?: (tab: string) => void;
};

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((x) => <p key={x} className={`text-xs font-semibold leading-6 ${className}`}>• {x}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>{children}</div>
);

export default function CT1GuardPanel({ setTab }: CT1GuardPanelProps) {
  return (
    <section className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{CT1_PROTECTION_META.code}</p>
            <h2 className="mt-2 text-lg font-black text-white">{CT1_PROTECTION_META.name}</h2>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{CT1_PROTECTION_META.purpose}</p>
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">{CT1_PROTECTION_META.rule}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-black text-white">Pinned model shortcuts</h3>
        <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Các mô hình lõi phải luôn có đường truy cập rõ, tránh bị ẩn khi phần mềm có nhiều tab.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS.map((item) => (
            <button
              key={item.tab}
              onClick={() => setTab?.(item.tab)}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-left hover:border-cyan-400/70"
            >
              <p className="text-xs font-black text-white">{item.label}</p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">{item.reason}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-black text-white">Protected tabs</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {CT1_PROTECTED_TABS.map((item) => (
              <button key={item} onClick={() => setTab?.(item)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-200">
                {item}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-black text-white">Release audit checklist</h3>
          <div className="mt-4">
            <BulletList items={CT1_RELEASE_AUDIT_CHECKLIST} className="text-emerald-100" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CT1_MODEL_VERSION_REGISTRY.map((item) => (
          <Card key={item.model}>
            <p className="text-[10px] font-black uppercase text-cyan-300">{item.currentVersion} • {item.status}</p>
            <h3 className="mt-2 text-sm font-black text-white">{item.model}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.changePolicy}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
