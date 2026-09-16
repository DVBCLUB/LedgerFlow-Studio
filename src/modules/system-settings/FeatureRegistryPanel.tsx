import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY, type CapabilityPack, type FeatureStatus, type WiringStatus } from '../../app/featureRegistry';
import FeatureFlagMatrixPanel from './FeatureFlagMatrixPanel';

const statusLabel: Record<FeatureStatus, string> = {
  active: 'Đang hiển thị',
  internal: 'Nội bộ',
  planned: 'Đã lên kế hoạch',
};

const statusClass: Record<FeatureStatus, string> = {
  active: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  internal: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  planned: 'border-slate-400/30 bg-slate-500/10 text-slate-200',
};

const workspaceLabel: Record<string, string> = {
  ai_factory: 'AI Nhân sự',
  ceo_command: 'CEO Command',
  marketing_growth: 'Marketing & Growth',
  analytics: 'Analytics & Sandbox',
  system_settings: 'System Settings',
};

const packLabel: Record<CapabilityPack, string> = {
  'founder-control': 'Founder Control',
  'ai-workforce': 'AI Workforce',
  'finance-intelligence': 'Finance Intelligence',
  'growth-sales': 'Growth & Sales',
  'product-delivery': 'Product & Delivery',
  'integration-devops': 'Integration & DevOps',
  'platform-governance': 'Platform Governance',
};

const wiringLabel: Record<WiringStatus, string> = {
  wired: 'Đã nối đủ',
  'daemon-only': 'Daemon nền',
  'dormant-approved': 'Đang tắt có chủ đích',
  'test-only': 'Chỉ kiểm thử',
};

export default function FeatureRegistryPanel() {
  const [filter, setFilter] = useState<FeatureStatus | 'all'>('all');
  const [pack, setPack] = useState<CapabilityPack | 'all'>('all');
  const counts = useMemo(() => FEATURE_REGISTRY.reduce<Record<FeatureStatus, number>>(
    (summary, feature) => ({ ...summary, [feature.status]: summary[feature.status] + 1 }),
    { active: 0, internal: 0, planned: 0 },
  ), []);
  const visibleFeatures = FEATURE_REGISTRY.filter((feature) =>
    (filter === 'all' || feature.status === filter) && (pack === 'all' || feature.capabilityPack === pack),
  );
  const wiringCounts = useMemo(() => FEATURE_REGISTRY.reduce<Record<WiringStatus, number>>(
    (summary, feature) => ({ ...summary, [feature.wiring]: summary[feature.wiring] + 1 }),
    { wired: 0, 'daemon-only': 0, 'dormant-approved': 0, 'test-only': 0 },
  ), []);

  return (
    <div className="space-y-6">
      <FeatureFlagMatrixPanel />
      <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/25 via-slate-950 to-slate-950 p-5 shadow-xl shadow-cyan-950/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">System Settings · Read only</p>
          <h2 className="mt-1 text-lg font-black text-white">Module Health &amp; Feature Registry</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Bản đồ module theo capability pack, rủi ro và trạng thái wiring. Đây là nguồn quản trị read-only; bật/tắt thực thi vẫn phải đi qua approval gate.</p>
        </div>
        <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">{FEATURE_REGISTRY.length} mục theo dõi</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(statusLabel) as FeatureStatus[]).map((status) => (
          <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-2xl border p-4 text-left transition hover:border-white/30 ${filter === status ? statusClass[status] : 'border-white/10 bg-slate-900/70 text-slate-300'}`}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{statusLabel[status]}</p>
            <p className="mt-1 text-2xl font-black text-white">{counts[status]}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {(Object.keys(wiringLabel) as WiringStatus[]).map((state) => (
          <div key={state} className="rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2">
            <p className="text-[10px] font-bold text-slate-400">{wiringLabel[state]}</p>
            <p className="mt-1 text-lg font-black text-white">{wiringCounts[state]}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === 'all' ? 'bg-cyan-500 text-slate-950' : 'border border-white/10 bg-slate-900 text-slate-300'}`}>Tất cả</button>
        {(Object.keys(statusLabel) as FeatureStatus[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === status ? 'bg-cyan-500 text-slate-950' : 'border border-white/10 bg-slate-900 text-slate-300'}`}>{statusLabel[status]}</button>)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setPack('all')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${pack === 'all' ? 'bg-violet-500 text-white' : 'border border-white/10 bg-slate-900 text-slate-300'}`}>Tất cả pack</button>
        {(Object.keys(packLabel) as CapabilityPack[]).map((item) => <button key={item} type="button" onClick={() => setPack(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${pack === item ? 'bg-violet-500 text-white' : 'border border-white/10 bg-slate-900 text-slate-300'}`}>{packLabel[item]}</button>)}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="hidden grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_auto] gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 md:grid"><span>Tính năng</span><span>Capability pack</span><span>Workspace</span><span>Wiring / Rủi ro</span><span>Trạng thái</span></div>
        {visibleFeatures.map((feature) => (
          <div key={feature.id} className="grid gap-2 border-b border-white/5 bg-slate-950/70 px-4 py-3 last:border-0 md:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_auto] md:items-center md:gap-3">
            <div><p className="text-sm font-bold text-white">{feature.component}</p><p className="mt-0.5 text-[11px] text-slate-500">{feature.source}</p></div>
            <p className="text-xs font-semibold text-violet-200">{packLabel[feature.capabilityPack]}</p>
            <p className="text-xs font-semibold text-slate-300">{workspaceLabel[feature.workspace] ?? feature.workspace}</p>
            <div><p className="text-xs text-slate-300">{wiringLabel[feature.wiring]}</p><p className="text-[10px] text-slate-500">{feature.risk} · {feature.featureFlag}</p></div>
            <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass[feature.status]}`}>{statusLabel[feature.status]}</span>
          </div>
        ))}
      </div>
    </section>
    </div>
  );
}
