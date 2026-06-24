import type { ReactNode } from 'react';
import { Bot, Cable, Database, PlayCircle, Rocket, Terminal, Zap } from 'lucide-react';
import FactoryCatalogStatusPanel from './FactoryCatalogStatusPanel';
import FactoryHealthSummaryPanel from './FactoryHealthSummaryPanel';
import FactoryConnectorMatrixPanel from './FactoryConnectorMatrixPanel';
import FactoryBackendRuntimePanel from './FactoryBackendRuntimePanel';
import FactoryExecutionDecisionPanel from './FactoryExecutionDecisionPanel';
import FactoryCommandRunnerPanel from './FactoryCommandRunnerPanel';
import FactoryAuditLogPanel from './FactoryAuditLogPanel';
import FactoryOperatorGuidePanel from './FactoryOperatorGuidePanel';
import AutomationRobotControlHubPanel from './AutomationRobotControlHubPanel';
import AutomationBridgeHubPanel from './AutomationBridgeHubPanel';

function Pill({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'cyan' | 'violet' | 'emerald' | 'amber' }) {
  const cls = tone === 'cyan'
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
    : tone === 'violet'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-100'
      : tone === 'emerald'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : tone === 'amber'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{children}</span>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-800 bg-slate-950/65 p-4 text-left shadow-xl shadow-slate-950/20 ${className}`}>{children}</div>;
}

const factoryPipeline = [
  ['Idea intake', 'Nhận ý tưởng, tạo brief, scope, platform và tiêu chí hoàn tất.'],
  ['Agent planning', 'Chia việc cho product, code, QA, media và release cells.'],
  ['Provider routing', 'Chọn provider profile phù hợp và lưu quyết định vào execution.'],
  ['Workspace run', 'Chạy code, test, build, asset write và Git review flow.'],
  ['Review loop', 'Ghi command result, audit log, health signal và review note.'],
  ['Release kit', 'Chuẩn bị checklist, landing copy, demo notes và package handoff.'],
];

const intakeFields = [
  ['Product idea', 'Mô tả app, game, tool, extension, mobile app hoặc video workflow.'],
  ['Target platform', 'PC, web, Android, iOS, desktop hoặc browser extension.'],
  ['Success criteria', 'Điều kiện hoàn tất: chạy được, có build, có demo note hoặc release kit.'],
  ['Style constraints', 'Phong cách UI, gameplay, tech stack, brand voice và giới hạn cần giữ.'],
  ['Output package', 'Chọn code only, prototype, release build, creative pack hoặc full kit.'],
  ['Review policy', 'Chọn bước AI được chạy và bước nào cần founder duyệt.'],
];

const runQueue = [
  ['Draft PRD', 'Product Architect', 'ready'],
  ['Generate repo plan', 'Coding Swarm', 'ready'],
  ['Build prototype', 'GitHub IDE Runner', 'queued'],
  ['Create demo script', 'Growth Automation', 'ready'],
  ['Prepare release checklist', 'QA and Release', 'review'],
];

const routes = [
  ['Primary profile', 'Nguồn xử lý mặc định cho planning, coding, QA và content generation.', 'primary'],
  ['Connector profiles', 'Các connector được founder bật, có log nguồn và giới hạn hành động.', 'controlled'],
  ['IDE capacity pool', 'Cursor, Claude Code, Antigravity, VS Code extension và Google AI Studio.', 'dev'],
  ['Capacity balancer', 'Nếu nguồn chính tạm đầy, chuyển sang profile đã cấu hình; nếu không còn nguồn thì đưa vào Approval Inbox.', 'safe'],
];

const artifactBoard = [
  ['Generated code', 'Source tree, patch set, README, install guide và test note.'],
  ['Build package', 'Web bundle, desktop package, mobile build hoặc game export.'],
  ['Media assets', 'Image prompts, thumbnails, short video scripts và demo storyboard.'],
  ['Release assets', 'Landing copy, store listing, creative variants và release notes.'],
];

const reviewBoard = [
  ['Spec match', 'So sánh output với PRD, platform, style và success criteria.'],
  ['Build health', 'Tóm tắt install, test, build log và lỗi còn lại.'],
  ['Release readiness', 'Kiểm tra demo, pricing, landing page và creative pack.'],
  ['Founder gate', 'Các bước rủi ro cao được chuyển sang Approval Inbox.'],
];

const commercializationLanes = [
  ['Landing page', 'Hero, pricing, FAQ, screenshots, demo GIF, CTA và tracking checklist.'],
  ['Short video pack', 'Script, shot list, voiceover, caption và thumbnail prompt.'],
  ['Store listing', 'Tên sản phẩm, mô tả, keywords, icon prompt và screenshot checklist.'],
  ['Creative kit', 'Hook, angle, audience, variants và experiment guardrail.'],
  ['Launch QA', 'Checklist bản build, links, analytics, privacy, support và rollback note.'],
  ['Revenue review', 'Gói giá, offer, funnel, CAC/LTV giả lập và next experiment.'],
];

const outputs = ['Source code', 'Build artifacts', 'Game assets', 'AI images/video', 'Docs & prompts', 'GitHub PR/diff', 'Landing page', 'Creative pack'];

function SoftwareFactoryAutomationBrief() {
  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/25 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200"><Rocket className="mr-2 inline h-4 w-4" />AI Software Factory</p>
          <h2 className="mt-2 text-2xl font-black text-white">Factory runtime cho app, game, tool và video workflow</h2>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-400">Workspace này gom intake, provider routing, execution, command runner, asset store, release kit, audit log, health summary và connector matrix vào một luồng có review gate.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Pill tone="emerald">API first</Pill><Pill tone="violet">Connector matrix</Pill><Pill tone="cyan">GitHub + IDE</Pill><Pill tone="amber">Review gated</Pill></div>
      </div>
    </section>

    <FactoryCatalogStatusPanel />
    <FactoryHealthSummaryPanel />
    <FactoryConnectorMatrixPanel />
    <FactoryBackendRuntimePanel />
    <FactoryExecutionDecisionPanel />
    <FactoryCommandRunnerPanel />
    <FactoryAuditLogPanel />
    <FactoryOperatorGuidePanel />

    <section className="grid gap-3 md:grid-cols-4">
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Goal</p><p className="mt-2 text-2xl font-black text-white">Idea to release</p><p className="mt-1 text-[11px] font-bold text-slate-500">Tập trung tạo sản phẩm có thể review và đóng gói.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Routing</p><p className="mt-2 text-2xl font-black text-white">18 connectors</p><p className="mt-1 text-[11px] font-bold text-slate-500">AI platforms, agents, IDEs, repo, local runtime.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Control</p><p className="mt-2 text-2xl font-black text-white">Human gated</p><p className="mt-1 text-[11px] font-bold text-slate-500">High-impact actions cần duyệt.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Outputs</p><p className="mt-2 text-2xl font-black text-white">Code + media</p><p className="mt-1 text-[11px] font-bold text-slate-500">App/game/tool/video/assets.</p></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Factory intake console</h3></div><div className="grid gap-3 md:grid-cols-2">{intakeFields.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Run queue preview</h3></div><div className="space-y-2">{runQueue.map(([task, owner, status]) => <div key={task} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-white">{task}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{owner}</p></div><Pill tone={status === 'review' ? 'amber' : status === 'queued' ? 'cyan' : 'emerald'}>{status}</Pill></div></div>)}</div></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card><div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Factory pipeline</h3></div><div className="grid gap-3 lg:grid-cols-2">{factoryPipeline.map(([title, detail], index) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-100">{index + 1}</span><p className="text-xs font-black text-white">{title}</p></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Cable className="h-5 w-5 text-violet-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Provider and capacity router</h3></div><div className="space-y-3">{routes.map(([name, detail, mode]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-white">{name}</p><Pill tone={mode === 'primary' ? 'emerald' : mode === 'controlled' ? 'violet' : mode === 'dev' ? 'cyan' : 'amber'}>{mode}</Pill></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Artifact board</h3></div><div className="grid gap-3 md:grid-cols-2">{artifactBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Review board</h3></div><div className="grid gap-3 md:grid-cols-2">{reviewBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
    </section>

    <Card><div className="mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Release lanes</h3></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{commercializationLanes.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>

    <section className="grid gap-4 xl:grid-cols-3">
      <Card><div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">AI work cells</h3></div><div className="space-y-2">{['Product Architect', 'Coding Swarm', 'Game and Media Cell', 'QA and Release', 'Growth Automation', 'Monetization Analyst'].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3 text-xs font-bold text-slate-300">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Dev platform bridge</h3></div><div className="space-y-2">{['GitHub branch / PR / CI loop', 'VS Code workspace runner', 'Cursor / Claude Code / Antigravity bridge', 'Google AI Studio route', 'Build, test, package, asset capture', 'PC, mobile, web and game export checklist'].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3 text-xs font-bold text-slate-300">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Standard outputs</h3></div><div className="flex flex-wrap gap-2">{outputs.map((item) => <Pill key={item} tone="slate">{item}</Pill>)}</div><p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">High-impact actions stay in Approval Inbox.</p></Card>
    </section>

    <Card className="border-cyan-500/20 bg-cyan-500/5"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><PlayCircle className="mr-2 inline h-4 w-4" />Background services</p><p className="mt-2 text-sm font-black text-white">provider-router, capacity-balancer, connector-runner, asset-writer, github-ide-runner, approval-queue và release-kit-manager.</p></Card>
  </div>;
}

export default function AutomationRulesPanel() {
  return (
    <div className="space-y-6">
      <SoftwareFactoryAutomationBrief />
      <AutomationRobotControlHubPanel />
      <AutomationBridgeHubPanel />
    </div>
  );
}
