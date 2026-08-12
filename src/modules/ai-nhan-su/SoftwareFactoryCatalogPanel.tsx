import { FACTORY_APPROVAL_GATES, pendingApprovalCount } from './factoryApprovalCatalog';
import { FACTORY_LAUNCH_ASSETS, getFactoryLaunchReadiness } from './factoryLaunchCatalog';
import { FACTORY_PROVIDER_PROFILES, chooseFactoryProvider } from './factoryProviderCatalog';
import { FACTORY_RUNTIME_LANES, countFactoryLaneStatuses } from './factoryRuntimeCatalog';
import { FACTORY_WORKFLOW_NODES } from './factoryWorkflowCatalog';

const statusClass: Record<string, string> = {
  active: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/25', ready: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25', review: 'bg-amber-500/15 text-amber-200 border-amber-400/25', queued: 'bg-violet-500/15 text-violet-200 border-violet-400/25', idle: 'bg-slate-500/15 text-slate-300 border-slate-400/25', healthy: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25', limited: 'bg-amber-500/15 text-amber-200 border-amber-400/25', pending: 'bg-amber-500/15 text-amber-200 border-amber-400/25', draft: 'bg-slate-500/15 text-slate-300 border-slate-400/25',
};
const badge = (status: string) => statusClass[status] ?? statusClass.idle;

export default function SoftwareFactoryCatalogPanel() {
  const laneCounts = countFactoryLaneStatuses();
  const launchReadiness = getFactoryLaunchReadiness();
  const pendingApprovals = pendingApprovalCount();

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950/25 via-slate-950 to-slate-950 p-5 shadow-xl shadow-violet-950/10">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">AI Nhân sự · Catalog</p><h2 className="mt-1 text-lg font-black text-white">Software Factory</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Góc nhìn chỉ đọc về luồng tạo sản phẩm, năng lực nhà cung cấp và các điểm cần phê duyệt. Các thao tác chạy việc vẫn thuộc các workspace chuyên dụng.</p></div><span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-200">Read only · No execution</span></div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Lane đang xếp hàng" value={laneCounts.queued} note={`${laneCounts.review} lane đang review`} /><Metric label="Launch sẵn sàng" value={`${launchReadiness.percent}%`} note={`${launchReadiness.ready}/${launchReadiness.total} tài sản đạt trạng thái ready`} /><Metric label="Chờ phê duyệt" value={pendingApprovals} note="Các tác động rủi ro cao cần xác nhận" /></div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2"><CatalogBlock title="Luồng công việc" items={FACTORY_WORKFLOW_NODES.map((node) => ({ title: node.label, meta: `${node.input} → ${node.output}`, status: node.status }))} /><CatalogBlock title="Runtime lanes" items={FACTORY_RUNTIME_LANES.map((lane) => ({ title: lane.label, meta: `${lane.owner} · ${lane.output}`, status: lane.status }))} /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2"><CatalogBlock title="Provider profiles" items={FACTORY_PROVIDER_PROFILES.map((profile) => { const decision = chooseFactoryProvider(profile.supportedWork[0]); return { title: profile.label, meta: `${profile.kind} · ưu tiên ${profile.priority} · ${decision.selectedId === profile.id ? 'tuyến mặc định' : profile.note}`, status: profile.health }; })} /><CatalogBlock title="Launch assets & approval gates" items={[...FACTORY_LAUNCH_ASSETS.map((asset) => ({ title: asset.title, meta: `${asset.owner} · ${asset.deliverable}`, status: asset.status })), ...FACTORY_APPROVAL_GATES.map((gate) => ({ title: gate.title, meta: `${gate.risk} risk · ${gate.reason}`, status: gate.status }))]} /></div>
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p><p className="mt-1 text-xs leading-5 text-slate-400">{note}</p></div>; }
function CatalogBlock({ title, items }: { title: string; items: Array<{ title: string; meta: string; status: string }> }) { return <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4"><h3 className="text-sm font-black text-white">{title}</h3><div className="mt-3 space-y-2">{items.map((item) => <div key={`${title}-${item.title}`} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/65 px-3 py-2.5"><div className="min-w-0"><p className="text-xs font-bold text-slate-100">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{item.meta}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${badge(item.status)}`}>{item.status}</span></div>)}</div></div>; }
