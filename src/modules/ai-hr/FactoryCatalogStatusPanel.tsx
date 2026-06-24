import { Database, GitBranch, Layers, PlayCircle, ShieldCheck, Terminal } from 'lucide-react';
import { FACTORY_RUNTIME_LANES, countFactoryLaneStatuses } from './factoryRuntimeCatalog';
import { FACTORY_APPROVAL_GATES, pendingApprovalCount } from './factoryApprovalCatalog';
import { FACTORY_QUEUE_ITEMS, getFactoryQueueSummary, getNextFactoryQueueItem } from './factoryJobQueueCatalog';
import { FACTORY_PROVIDER_PROFILES, listFactoryProviderHealth } from './factoryProviderCatalog';
import { FACTORY_ASSET_RECORDS, countFactoryAssets } from './factoryAssetCatalog';
import { FACTORY_IDE_RUNNER_STEPS, getFactoryRunnerProgress } from './factoryIdeRunnerCatalog';
import { FACTORY_LAUNCH_ASSETS, getFactoryLaunchReadiness } from './factoryLaunchCatalog';
import { FACTORY_WORKFLOW_NODES, getActiveFactoryWorkflow } from './factoryWorkflowCatalog';

function MiniCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{note}</p>
  </div>;
}

function Row({ title, detail, badge }: { title: string; detail: string; badge: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-black text-white">{title}</p>
      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">{badge}</span>
    </div>
    <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p>
  </div>;
}

export default function FactoryCatalogStatusPanel() {
  const laneSummary = countFactoryLaneStatuses();
  const queueSummary = getFactoryQueueSummary();
  const nextQueueItem = getNextFactoryQueueItem();
  const runnerProgress = getFactoryRunnerProgress();
  const launchReadiness = getFactoryLaunchReadiness();
  const activeWorkflow = getActiveFactoryWorkflow();
  const providerHealth = listFactoryProviderHealth();

  return <section className="space-y-4 rounded-[2rem] border border-cyan-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200"><Layers className="mr-2 inline h-4 w-4" />Factory runtime catalogs</p>
        <h3 className="mt-2 text-xl font-black text-white">Catalog đã được nối vào UI để theo dõi trạng thái factory</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Bảng này đọc dữ liệu từ các catalog mới: runtime lanes, approval gates, queue, provider profiles, asset records, IDE runner, launch kit và workflow nodes.</p>
      </div>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-5 text-amber-100">
        Next item: {nextQueueItem ? `${nextQueueItem.title} / ${nextQueueItem.owner}` : 'No queued item'}
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      <MiniCard label="runtime" value={FACTORY_RUNTIME_LANES.length} note={`${laneSummary.queued} queued / ${laneSummary.review} review`} />
      <MiniCard label="approval" value={pendingApprovalCount()} note={`${FACTORY_APPROVAL_GATES.length} gates tracked`} />
      <MiniCard label="queue" value={FACTORY_QUEUE_ITEMS.length} note={`${queueSummary.running} running / ${queueSummary.review} review`} />
      <MiniCard label="providers" value={FACTORY_PROVIDER_PROFILES.length} note="routing profiles" />
      <MiniCard label="assets" value={countFactoryAssets()} note="records captured" />
      <MiniCard label="runner" value={`${runnerProgress.percent}%`} note={`${runnerProgress.complete}/${runnerProgress.total} complete`} />
      <MiniCard label="launch" value={`${launchReadiness.percent}%`} note={`${launchReadiness.ready}/${launchReadiness.total} ready`} />
      <MiniCard label="workflow" value={FACTORY_WORKFLOW_NODES.length} note={`${activeWorkflow.length} active/review`} />
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><Database className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Provider health</p></div>
        {providerHealth.map((profile) => <Row key={profile.id} title={profile.label} detail={`Priority ${profile.priority}`} badge={profile.health} />)}
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><Terminal className="h-5 w-5 text-cyan-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Runner steps</p></div>
        {FACTORY_IDE_RUNNER_STEPS.slice(0, 4).map((step) => <Row key={step.id} title={step.title} detail={`${step.target} → ${step.output}`} badge={step.status} />)}
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-violet-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Launch assets</p></div>
        {FACTORY_LAUNCH_ASSETS.slice(0, 4).map((asset) => <Row key={asset.id} title={asset.title} detail={`${asset.channel} → ${asset.deliverable}`} badge={asset.status} />)}
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {FACTORY_WORKFLOW_NODES.slice(0, 4).map((node) => <div key={node.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-cyan-300" /><p className="text-xs font-black text-white">{node.label}</p></div>
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{node.input} → {node.output}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{node.status}</p>
      </div>)}
    </div>

    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs font-bold leading-6 text-violet-100">
      <ShieldCheck className="mr-2 inline h-4 w-4" />Catalog layer sẵn sàng để nối tiếp sang backend API skeleton và runtime execution service.
    </div>
  </section>;
}
