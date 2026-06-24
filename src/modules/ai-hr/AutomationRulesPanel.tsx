import { Bot, Cable, Database, PlayCircle, Rocket, Terminal, Zap } from 'lucide-react';
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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-800 bg-slate-950/65 p-4 text-left shadow-xl shadow-slate-950/20 ${className}`}>{children}</div>;
}

const factoryPipeline = [
  ['Idea Intake', 'Nhận ý tưởng app, game, tool, video AI; tạo PRD, scope, nền tảng mục tiêu và tiêu chí thương mại hóa.'],
  ['Agent Planning', 'Chia việc cho Product, Code, Game, QA, Marketing, Monetization và Release agents.'],
  ['Provider Routing', 'Ưu tiên API chính thức; khi nguồn xử lý tạm đầy thì chuyển sang provider profile đã được cấu hình hợp lệ.'],
  ['Dev Execution', 'Kết nối GitHub, VS Code, Cursor, Claude Code, Antigravity và Google AI Studio để chạy code, test, build.'],
  ['Fix Loop', 'Đọc lỗi, sinh patch, tạo diff, chạy lại test, mở PR và giữ lịch sử quyết định.'],
  ['Go-to-market', 'Tạo landing page, video ngắn, nội dung YouTube/TikTok/Facebook, quảng cáo, pricing và release checklist.'],
];

const intakeFields = [
  ['Product idea', 'Mô tả sản phẩm cần tạo: app, game, tool, extension, mobile app hoặc video AI.'],
  ['Target platform', 'PC, web, Android, iOS, desktop, browser extension, YouTube, TikTok hoặc Facebook.'],
  ['Success criteria', 'Điều kiện hoàn tất: chạy được, có build, có video demo, có landing page hoặc có bản release.'],
  ['Style constraints', 'Phong cách UI, gameplay, công nghệ, ngôn ngữ, brand voice và giới hạn không được vượt.'],
  ['Output package', 'Chọn gói đầu ra: code only, prototype, release build, marketing pack hoặc full launch kit.'],
  ['Review policy', 'Chọn bước nào AI được tự chạy và bước nào cần founder duyệt trước khi tiếp tục.'],
];

const runQueue = [
  ['Draft PRD', 'Product Architect', 'ready'],
  ['Generate repo plan', 'Coding Swarm', 'ready'],
  ['Build prototype', 'GitHub IDE Runner', 'queued'],
  ['Create demo script', 'Growth Automation', 'ready'],
  ['Prepare release checklist', 'QA and Release', 'review'],
];

const routes = [
  ['Official API Pool', 'OpenAI, Gemini, Anthropic, Grok, DeepSeek và các AI agent API.', 'primary'],
  ['Approved Assisted Connectors', 'Các connector được bật trong phạm vi hợp lệ, có log nguồn và giới hạn hành động.', 'controlled'],
  ['IDE Capacity Pool', 'Cursor, Claude Code, Antigravity, VS Code extension và Google AI Studio.', 'dev'],
  ['Capacity Balancer', 'Nếu nguồn A tạm đầy, chuyển sang nguồn B/C đã được founder cấu hình; nếu không còn nguồn thì đưa vào Approval Inbox.', 'safe'],
];

const artifactBoard = [
  ['Generated code', 'Source tree, patch set, README, install guide và test note.'],
  ['Build package', 'Web bundle, desktop package, mobile build hoặc game export.'],
  ['Media assets', 'Image prompts, thumbnails, short video scripts và demo storyboard.'],
  ['Launch assets', 'Landing copy, store listing, ad variants và release notes.'],
];

const reviewBoard = [
  ['Spec match', 'So sánh output với PRD, platform, style và success criteria.'],
  ['Build health', 'Tóm tắt install, test, build log và lỗi còn lại.'],
  ['Market readiness', 'Kiểm tra demo, pricing, landing page và creative pack.'],
  ['Founder gate', 'Các bước rủi ro cao được chuyển sang Approval Inbox.'],
];

const commercializationLanes = [
  ['Landing Page', 'Hero, pricing, FAQ, screenshots, demo GIF, CTA và tracking checklist.'],
  ['Short Video Pack', 'Script 15s/30s/60s, shot list, voiceover, caption, thumbnail prompt.'],
  ['Store Listing', 'Tên sản phẩm, mô tả, keywords, icon prompt, screenshot checklist.'],
  ['Ad Kit', 'Hook, angle, audience, creative variants, UTM và budget guardrail.'],
  ['Launch QA', 'Checklist bản build, links, analytics, privacy, support và rollback note.'],
  ['Revenue Review', 'Gói giá, offer, funnel, CAC/LTV giả lập và next experiment.'],
];

const outputs = ['Source code', 'Build artifacts', 'Game assets', 'AI images/video', 'Docs & prompts', 'GitHub PR/diff', 'Landing page', 'Ad creatives'];

function SoftwareFactoryAutomationBrief() {
  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/25 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200"><Rocket className="mr-2 inline h-4 w-4" />AI Software Factory Automation</p>
          <h2 className="mt-2 text-2xl font-black text-white">Tự động hóa tạo phần mềm, game, tool và video AI đến mức có thể thương mại hóa</h2>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-400">Automation được định hướng lại thành dây chuyền sản xuất: nhận ý tưởng, điều phối nhiều AI/agent, kết nối GitHub/IDE, sinh code và media, sửa lỗi, đóng gói, rồi chuẩn bị bán hàng. Các bước rủi ro cao vẫn đi qua founder approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="emerald">API first</Pill>
          <Pill tone="violet">Assisted connector</Pill>
          <Pill tone="cyan">GitHub + IDE</Pill>
          <Pill tone="amber">Capacity balancer</Pill>
        </div>
      </div>
    </section>

    <section className="grid gap-3 md:grid-cols-4">
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Goal</p><p className="mt-2 text-2xl font-black text-white">Idea to revenue</p><p className="mt-1 text-[11px] font-bold text-slate-500">Tập trung tạo sản phẩm có khả năng bán.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Routing</p><p className="mt-2 text-2xl font-black text-white">Hybrid</p><p className="mt-1 text-[11px] font-bold text-slate-500">API, assisted connector, IDE capacity, agent API.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Control</p><p className="mt-2 text-2xl font-black text-white">Human gated</p><p className="mt-1 text-[11px] font-bold text-slate-500">Publish, payment, merge main cần duyệt.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Outputs</p><p className="mt-2 text-2xl font-black text-white">Code + media</p><p className="mt-1 text-[11px] font-bold text-slate-500">App/game/tool/video/ads/assets.</p></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Factory intake console</h3></div>
        <div className="grid gap-3 md:grid-cols-2">{intakeFields.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Run queue preview</h3></div>
        <div className="space-y-2">{runQueue.map(([task, owner, status]) => <div key={task} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-white">{task}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{owner}</p></div><Pill tone={status === 'review' ? 'amber' : status === 'queued' ? 'cyan' : 'emerald'}>{status}</Pill></div></div>)}</div>
      </Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Factory pipeline</h3></div>
        <div className="grid gap-3 lg:grid-cols-2">{factoryPipeline.map(([title, detail], index) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-100">{index + 1}</span><p className="text-xs font-black text-white">{title}</p></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center gap-2"><Cable className="h-5 w-5 text-violet-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Provider and capacity router</h3></div>
        <div className="space-y-3">{routes.map(([name, detail, mode]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-white">{name}</p><Pill tone={mode === 'primary' ? 'emerald' : mode === 'controlled' ? 'violet' : mode === 'dev' ? 'cyan' : 'amber'}>{mode}</Pill></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div>
      </Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Artifact board</h3></div><div className="grid gap-3 md:grid-cols-2">{artifactBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Review board</h3></div><div className="grid gap-3 md:grid-cols-2">{reviewBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div></Card>
    </section>

    <Card>
      <div className="mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Commercialization lanes</h3></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{commercializationLanes.map(([name, detail]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"><p className="text-xs font-black text-white">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>)}</div>
    </Card>

    <section className="grid gap-4 xl:grid-cols-3">
      <Card><div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">AI work cells</h3></div><div className="space-y-2">{['Product Architect', 'Coding Swarm', 'Game and Media Cell', 'QA and Release', 'Growth Automation', 'Monetization Analyst'].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3 text-xs font-bold text-slate-300">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Dev platform bridge</h3></div><div className="space-y-2">{['GitHub branch / PR / CI loop', 'VS Code workspace runner', 'Cursor / Claude Code / Antigravity bridge', 'Google AI Studio route', 'Build, test, package, artifact capture', 'PC, mobile, web and game export checklist'].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3 text-xs font-bold text-slate-300">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">Standard outputs</h3></div><div className="flex flex-wrap gap-2">{outputs.map((item) => <Pill key={item} tone="slate">{item}</Pill>)}</div><p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">Các hành động như publish, thanh toán, gửi email thật, xóa dữ liệu hoặc merge main được đưa vào Approval Inbox.</p></Card>
    </section>

    <Card className="border-cyan-500/20 bg-cyan-500/5">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><PlayCircle className="mr-2 inline h-4 w-4" />Background services</p>
      <p className="mt-2 text-sm font-black text-white">provider-router, capacity-balancer, connector-runner, artifact-ingestor, github-ide-runner, approval-queue và commercialization-publisher.</p>
    </Card>
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
