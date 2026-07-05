import type { ReactNode } from 'react';
import { Bot, Cable, Database, PlayCircle, Rocket, Terminal, Zap } from 'lucide-react';

import FactoryBackendRuntimePanel from './FactoryBackendRuntimePanel';
import FactoryCommandRunnerPanel from './FactoryCommandRunnerPanel';
import { FACTORY_APPROVAL_GATES, pendingApprovalCount } from './factoryApprovalCatalog';
import { FACTORY_ASSET_RECORDS, countFactoryAssets } from './factoryAssetCatalog';
import { FACTORY_IDE_RUNNER_STEPS, getFactoryRunnerProgress } from './factoryIdeRunnerCatalog';
import { FACTORY_QUEUE_ITEMS, getFactoryQueueSummary, getNextFactoryQueueItem } from './factoryJobQueueCatalog';
import { FACTORY_LAUNCH_ASSETS, getFactoryLaunchReadiness } from './factoryLaunchCatalog';
import { FACTORY_PROVIDER_PROFILES, chooseFactoryProvider, listFactoryProviderHealth } from './factoryProviderCatalog';
import { FACTORY_RUNTIME_LANES, countFactoryLaneStatuses } from './factoryRuntimeCatalog';
import { FACTORY_WORKFLOW_NODES, getActiveFactoryWorkflow, getFactoryWorkflowFlow } from './factoryWorkflowCatalog';



function Pill({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'cyan' | 'violet' | 'emerald' | 'amber' }) {
  const cls = tone === 'cyan'
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
    : tone === 'violet'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-100'
      : tone === 'emerald'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : tone === 'amber'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          : 'border-border-secondary bg-bg-primary text-text-secondary';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{children}</span>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-border-primary bg-slate-950/65 p-4 text-left shadow-xl shadow-slate-950/20 ${className}`}>{children}</div>;
}

const factoryPipeline = [
  ['Nhận ý tưởng', 'Nhận ý tưởng, tạo tóm tắt, phạm vi, nền tảng và tiêu chí hoàn tất.'],
  ['Lập kế hoạch AI', 'Chia việc cho sản phẩm, code, kiểm thử, media và phát hành.'],
  ['Chọn tuyến xử lý', 'Chọn hồ sơ xử lý phù hợp và lưu quyết định thực thi.'],
  ['Chạy trong workspace', 'Chạy code, kiểm thử, build, ghi asset và duyệt Git.'],
  ['Vòng duyệt', 'Ghi kết quả lệnh, nhật ký kiểm soát, tín hiệu sức khỏe và ghi chú duyệt.'],
  ['Bộ phát hành', 'Chuẩn bị danh sách kiểm tra, nội dung trang giới thiệu, ghi chú demo và bàn giao.'],
];

const intakeFields = [
  ['Ý tưởng sản phẩm', 'Mô tả app, game, công cụ, extension, mobile app hoặc video.'],
  ['Nền tảng mục tiêu', 'PC, web, Android, iOS, desktop hoặc browser extension.'],
  ['Tiêu chí thành công', 'Điều kiện hoàn tất: chạy được, có build, có ghi chú demo hoặc bộ phát hành.'],
  ['Ràng buộc phong cách', 'Phong cách UI, gameplay, công nghệ, giọng thương hiệu và giới hạn cần giữ.'],
  ['Gói đầu ra', 'Chọn chỉ code, prototype, bản phát hành, gói sáng tạo hoặc bộ đầy đủ.'],
  ['Quy tắc phê duyệt', 'Chọn bước AI được chạy và bước nào cần founder duyệt.'],
];

const runQueue = [
  ['Viết mô tả sản phẩm', 'Agent sản phẩm', 'ready'],
  ['Lập kế hoạch mã nguồn', 'Agent kỹ thuật', 'ready'],
  ['Dựng bản thử nghiệm', 'Robot workspace', 'queued'],
  ['Soạn kịch bản demo', 'Agent tăng trưởng', 'ready'],
  ['Chuẩn bị checklist phát hành', 'Agent kiểm thử', 'review'],
];

const routes = [
  ['Nguồn xử lý chính', 'Nguồn mặc định cho lập kế hoạch, viết mã, kiểm thử và tạo nội dung.', 'primary'],
  ['Kết nối đã duyệt', 'Các kết nối được bật, có log nguồn và giới hạn hành động.', 'controlled'],
  ['Bộ công cụ phát triển', 'Cursor, Claude Code, Antigravity, VS Code extension và Google AI Studio.', 'dev'],
  ['Bộ cân bằng tải', 'Nếu nguồn chính tạm đầy, chuyển sang nguồn đã cấu hình; nếu không còn nguồn thì đưa vào hộp phê duyệt.', 'safe'],
];

const artifactBoard = [
  ['Mã nguồn tạo mới', 'Cây mã nguồn, bộ thay đổi, README, hướng dẫn cài đặt và ghi chú kiểm thử.'],
  ['Gói build', 'Gói web, desktop, mobile hoặc bản export game.'],
  ['Tài sản media', 'Prompt hình ảnh, thumbnail, kịch bản video ngắn và storyboard demo.'],
  ['Tài sản phát hành', 'Nội dung trang giới thiệu, mô tả cửa hàng, biến thể sáng tạo và ghi chú phát hành.'],
];

const reviewBoard = [
  ['Khớp yêu cầu', 'So sánh đầu ra với mô tả sản phẩm, nền tảng, phong cách và tiêu chí hoàn tất.'],
  ['Sức khỏe build', 'Tóm tắt cài đặt, kiểm thử, log build và lỗi còn lại.'],
  ['Sẵn sàng phát hành', 'Kiểm tra demo, giá bán, trang giới thiệu và bộ nội dung sáng tạo.'],
  ['Cổng phê duyệt', 'Các bước rủi ro cao được chuyển sang hộp phê duyệt.'],
];

const commercializationLanes = [
  ['Trang giới thiệu', 'Thông điệp chính, giá bán, FAQ, ảnh chụp, demo GIF và checklist đo lường.'],
  ['Gói video ngắn', 'Kịch bản, cảnh quay, voiceover, caption và prompt thumbnail.'],
  ['Mô tả cửa hàng', 'Tên sản phẩm, mô tả, từ khóa, prompt icon và checklist ảnh chụp.'],
  ['Bộ nội dung sáng tạo', 'Hook, góc tiếp cận, tệp khách hàng, biến thể và giới hạn thử nghiệm.'],
  ['Kiểm thử ra mắt', 'Checklist bản build, link, analytics, riêng tư, hỗ trợ và ghi chú khôi phục.'],
  ['Rà soát doanh thu', 'Gói giá, ưu đãi, phễu bán hàng, CAC/LTV giả lập và thử nghiệm tiếp theo.'],
];

const outputs = ['Mã nguồn', 'Gói build', 'Tài sản game', 'Hình/video AI', 'Tài liệu & prompt', 'GitHub PR/diff', 'Trang giới thiệu', 'Bộ nội dung sáng tạo'];

const automationFrontAreas = [
  { title: 'Robot điều khiển', detail: 'Theo dõi trạng thái robot, gửi lệnh mô phỏng và dừng khẩn cấp khi cần.', status: 'An toàn', icon: Bot },
  { title: 'Luật chạy nền', detail: 'Các tác vụ định kỳ và automation rule chạy qua backend, không dàn log lên màn chính.', status: 'Đang theo dõi', icon: Zap },
  { title: 'Hàng đợi nhiệm vụ', detail: 'Việc đang chạy, việc chờ duyệt và lỗi cần xử lý được gom lại một nơi.', status: 'Đang chạy', icon: Terminal },
  { title: 'Kết nối vận hành', detail: 'Các bridge, connector và audit log giữ trong phần chi tiết để kiểm tra khi cần.', status: 'Cần cấu hình', icon: Cable },
];

function FactoryOperatingCatalog() {
  const laneStats = countFactoryLaneStatuses();
  const queueStats = getFactoryQueueSummary();
  const nextJob = getNextFactoryQueueItem();
  const runnerProgress = getFactoryRunnerProgress();
  const launchReadiness = getFactoryLaunchReadiness();
  const planningDecision = chooseFactoryProvider('planning');
  const codingDecision = chooseFactoryProvider('coding');
  const activeWorkflow = getActiveFactoryWorkflow();
  const workflowFlow = getFactoryWorkflowFlow();
  const providerHealth = listFactoryProviderHealth();

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
            Software Factory operating catalog
          </p>
          <h3 className="mt-2 text-sm font-black text-text-primary">Catalog chay nen cho AI, IDE, connector, asset va launch kit</h3>
          <p className="mt-2 max-w-4xl text-xs font-semibold leading-5 text-text-secondary">
            Cac file catalog duoc giu lam du lieu dieu phoi chuan cho xuong phan mem hybrid, thay vi de roi trong thu muc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="emerald">{`${FACTORY_RUNTIME_LANES.length} lanes`}</Pill>
          <Pill tone="cyan">{`${FACTORY_PROVIDER_PROFILES.length} providers`}</Pill>
          <Pill tone="amber">{`${pendingApprovalCount()} approvals`}</Pill>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Runtime lanes</p>
          <p className="mt-2 text-2xl font-black text-text-primary">{laneStats.queued + laneStats.running + laneStats.review}</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-text-tertiary">queued/running/review across planning, coding, QA, media and launch.</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Next job</p>
          <p className="mt-2 text-sm font-black text-text-primary">{nextJob?.title || 'No active job'}</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-text-tertiary">{queueStats.running} running / {queueStats.review} review / {queueStats.queued} queued.</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">IDE progress</p>
          <p className="mt-2 text-2xl font-black text-text-primary">{runnerProgress.percent}%</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-text-tertiary">{FACTORY_IDE_RUNNER_STEPS.length} handoff steps for GitHub, VS Code and Cursor.</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Launch readiness</p>
          <p className="mt-2 text-2xl font-black text-text-primary">{launchReadiness.percent}%</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-text-tertiary">{launchReadiness.ready}/{launchReadiness.total} launch assets ready.</p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-xs font-black text-text-primary">Provider routing</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{planningDecision.reason}</p>
          <p className="text-[11px] font-semibold leading-5 text-text-tertiary">{codingDecision.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {providerHealth.map((provider) => <Pill key={provider.id} tone={provider.health === 'healthy' ? 'emerald' : provider.health === 'limited' ? 'amber' : 'slate'}>{provider.label}</Pill>)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-xs font-black text-text-primary">Active workflow</p>
          <div className="mt-3 space-y-2">
            {activeWorkflow.map((node) => (
              <div key={node.id} className="rounded-xl border border-border-primary bg-bg-surface/70 p-2">
                <p className="text-[11px] font-black text-slate-200">{node.label}</p>
                <p className="mt-1 text-[10px] font-semibold text-text-tertiary">{node.input} -&gt; {node.output}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border-primary bg-slate-950/75 p-3">
          <p className="text-xs font-black text-text-primary">Control surface</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Pill tone="violet">{`${laneStats.review} pending approvals`}</Pill>
                  <Pill tone="emerald">{`${queueStats.running} running jobs`}</Pill>
                  <Pill tone="cyan">{`${queueStats.review} jobs in review`}</Pill>
                  <Pill tone="amber">{`${queueStats.queued} jobs queued`}</Pill>
                  <Pill tone="slate">{`${FACTORY_ASSET_RECORDS.length} records`}</Pill>
                </div>
        </div>
      </section>
    </Card>
  );
}

function SoftwareFactoryAutomationBrief() {
  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/25 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200"><Rocket className="mr-2 inline h-4 w-4" />Xưởng phần mềm AI</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Luồng tạo app, game, công cụ và video</h2>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-text-secondary">Khu vực này gom nhận ý tưởng, chọn tuyến xử lý, thực thi, lưu tài sản, bộ phát hành, nhật ký kiểm soát và phê duyệt.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Pill tone="emerald">Cần cấu hình</Pill><Pill tone="violet">Tích hợp</Pill><Pill tone="cyan">GitHub + IDE</Pill><Pill tone="amber">Chờ phê duyệt</Pill></div>
      </div>
    </section>





    <section className="grid gap-3 md:grid-cols-4">
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-tertiary">Mục tiêu</p><p className="mt-2 text-2xl font-black text-text-primary">Từ ý tưởng đến phát hành</p><p className="mt-1 text-[11px] font-bold text-text-tertiary">Tập trung tạo sản phẩm có thể duyệt và đóng gói.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-tertiary">Tích hợp</p><p className="mt-2 text-2xl font-black text-text-primary">18 kết nối</p><p className="mt-1 text-[11px] font-bold text-text-tertiary">Nền tảng AI, agent, IDE, repo và runtime local.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-tertiary">Kiểm soát</p><p className="mt-2 text-2xl font-black text-text-primary">Có người duyệt</p><p className="mt-1 text-[11px] font-bold text-text-tertiary">Hành động ảnh hưởng lớn cần phê duyệt.</p></Card>
      <Card><p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-tertiary">Đầu ra</p><p className="mt-2 text-2xl font-black text-text-primary">Code + media</p><p className="mt-1 text-[11px] font-bold text-text-tertiary">App, game, công cụ, video và asset.</p></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Nhận ý tưởng</h3></div><div className="grid gap-3 md:grid-cols-2">{intakeFields.map(([name, detail]) => <div key={name} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><p className="text-xs font-black text-text-primary">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Hàng đợi nhiệm vụ</h3></div><div className="space-y-2">{runQueue.map(([task, owner, status]) => <div key={task} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-text-primary">{task}</p><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{owner}</p></div><Pill tone={status === 'review' ? 'amber' : status === 'queued' ? 'cyan' : 'emerald'}>{status === 'review' ? 'Chờ phê duyệt' : status === 'queued' ? 'Đang chạy' : 'Sẵn sàng'}</Pill></div></div>)}</div></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card><div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Luồng thực thi</h3></div><div className="grid gap-3 lg:grid-cols-2">{factoryPipeline.map(([title, detail], index) => <div key={title} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-100">{index + 1}</span><p className="text-xs font-black text-text-primary">{title}</p></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Cable className="h-5 w-5 text-violet-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Bộ chọn tuyến xử lý</h3></div><div className="space-y-3">{routes.map(([name, detail, mode]) => <div key={name} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-text-primary">{name}</p><Pill tone={mode === 'primary' ? 'emerald' : mode === 'controlled' ? 'violet' : mode === 'dev' ? 'cyan' : 'amber'}>{mode}</Pill></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Artifact board</h3></div><div className="grid gap-3 md:grid-cols-2">{artifactBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><p className="text-xs font-black text-text-primary">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Review board</h3></div><div className="grid gap-3 md:grid-cols-2">{reviewBoard.map(([name, detail]) => <div key={name} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><p className="text-xs font-black text-text-primary">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>
    </section>

    <Card><div className="mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Release lanes</h3></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{commercializationLanes.map(([name, detail]) => <div key={name} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3"><p className="text-xs font-black text-text-primary">{name}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{detail}</p></div>)}</div></Card>

    <section className="grid gap-4 xl:grid-cols-3">
      <Card><div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-emerald-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">AI work cells</h3></div><div className="space-y-2">{['Product Architect', 'Coding Swarm', 'Game and Media Cell', 'QA and Release', 'Growth Automation', 'Monetization Analyst'].map((item) => <p key={item} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3 text-xs font-bold text-text-secondary">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Dev platform bridge</h3></div><div className="space-y-2">{['GitHub branch / PR / CI loop', 'VS Code workspace runner', 'Cursor / Claude Code / Antigravity bridge', 'Google AI Studio route', 'Build, test, package, asset capture', 'PC, mobile, web and game export checklist'].map((item) => <p key={item} className="rounded-2xl border border-border-primary bg-slate-950/75 p-3 text-xs font-bold text-text-secondary">• {item}</p>)}</div></Card>
      <Card><div className="mb-4 flex items-center gap-2"><Database className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black uppercase tracking-[0.22em] text-text-primary">Standard outputs</h3></div><div className="flex flex-wrap gap-2">{outputs.map((item) => <Pill key={item} tone="slate">{item}</Pill>)}</div><p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">High-impact actions stay in Approval Inbox.</p></Card>
    </section>

    <Card className="border-cyan-500/20 bg-cyan-500/5"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><PlayCircle className="mr-2 inline h-4 w-4" />Background services</p><p className="mt-2 text-sm font-black text-text-primary">provider-router, capacity-balancer, connector-runner, asset-writer, github-ide-runner, approval-queue và release-kit-manager.</p></Card>
    <FactoryOperatingCatalog />
  </div>;
}

export default function AutomationRulesPanel() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-primary bg-bg-primary/55 p-5 text-left">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Đội ngũ AI</p>
            <h2 className="mt-2 text-xl font-black text-text-primary">Robot và tự động hóa</h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-text-secondary">
              Màn chính chỉ giữ robot, hàng đợi và trạng thái chạy nền; cấu hình sâu nằm trong phần chi tiết.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="emerald">An toàn</Pill>
            <Pill tone="cyan">Đang theo dõi</Pill>
            <Pill tone="amber">Chờ phê duyệt</Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {automationFrontAreas.map(({ title, detail, status, icon: Icon }) => (
          <Card key={title}>
            <div className="flex items-start justify-between gap-3">
              <Icon className="h-5 w-5 text-cyan-200" />
              <Pill tone={status === 'An toàn' ? 'emerald' : status === 'Cần cấu hình' ? 'amber' : 'cyan'}>{status}</Pill>
            </div>
            <p className="mt-4 text-sm font-black text-text-primary">{title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-text-tertiary">{detail}</p>
          </Card>
        ))}
      </section>
      <details className="rounded-2xl border border-border-primary bg-bg-primary/25 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black text-text-secondary hover:text-text-primary">
          Mở cấu hình tự động hóa chi tiết
        </summary>
        <div className="mt-4 space-y-6">
          <SoftwareFactoryAutomationBrief />
        </div>
      </details>
    </div>
  );
}
