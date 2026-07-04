import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Activity, Bot, ClipboardList, Cpu, FileCheck2, Send, ShieldCheck, Zap } from 'lucide-react';
import { checkAIFabricHealth, createAgentRun, dispatchAIFabric, executeControlPlane, executeRobotCommand } from '../../utils/assistantApi';

const AIWorkforceCommandCenter = lazy(() => import('./AIWorkforceCommandCenter'));
const AIWorkforceRuntimePanel = lazy(() => import('./AIWorkforceRuntimePanel'));
const AICommandCenterHubPanel = lazy(() => import('./AICommandCenterHubPanel'));

const AIWorkforceMissionControl = lazy(() => import('./AIWorkforceMissionControl'));
const AIWorkforcePatchReviewSessions = lazy(() => import('./AIWorkforcePatchReviewSessions'));
const AIWorkforcePatchSafetyRunbook = lazy(() => import('./AIWorkforcePatchSafetyRunbook'));
const AIWorkforcePluginSecurityGuard = lazy(() => import('./AIWorkforcePluginSecurityGuard'));
const AIWorkforceSkillDirectory = lazy(() => import('./AIWorkforceSkillDirectory'));
const AIWorkforceSkillInvocationPlanner = lazy(() => import('./AIWorkforceSkillInvocationPlanner'));
const AIWorkforceRobotAutomationBridge = lazy(() => import('./AIWorkforceRobotAutomationBridge'));
const AIWorkforceStatusBar = lazy(() => import('./AIWorkforceStatusBar'));
const backgroundServices = [
  {
    title: 'Cổng AI',
    detail: 'Gọi mô hình qua backend, giữ khóa API ngoài giao diện.',
    status: 'Đang theo dõi',
    icon: Bot,
  },
  {
    title: 'Bộ chạy Agent',
    detail: 'Nhận nhiệm vụ, chia bước và ghi bằng chứng thực thi.',
    status: 'Đang chạy',
    icon: Cpu,
  },
  {
    title: 'Robot mô phỏng',
    detail: 'Điều khiển robot, mô phỏng lệnh và hỗ trợ dừng khẩn cấp.',
    status: 'An toàn',
    icon: Activity,
  },
  {
    title: 'Tự động hóa',
    detail: 'Theo dõi luật chạy nền, hàng đợi và log vận hành.',
    status: 'Đang theo dõi',
    icon: Zap,
  },
];

const visibleAreas = [
  {
    title: 'Giao việc cho AI',
    detail: 'Nhập yêu cầu ngắn, chọn chế độ chạy và chuyển việc rủi ro sang phê duyệt.',
    status: 'Cần xử lý',
    icon: ClipboardList,
  },
  {
    title: 'Theo dõi nhiệm vụ',
    detail: 'Xem agent đang chạy, hàng đợi, lỗi cần xử lý và kết quả mới nhất.',
    status: 'Đang theo dõi',
    icon: Activity,
  },
  {
    title: 'Phê duyệt & an toàn',
    detail: 'Giữ các thao tác ghi/xóa/gửi/merge/robot sau lớp kiểm soát.',
    status: 'An toàn',
    icon: ShieldCheck,
  },
  {
    title: 'Bằng chứng thực thi',
    detail: 'Lưu nguồn, log, quyết định và kết quả để kiểm tra lại khi cần.',
    status: 'Hoàn tất',
    icon: FileCheck2,
  },
];

const commandTargets = [
  { id: 'auto', label: 'Tự chọn tuyến tốt nhất' },
  { id: 'agent', label: 'Agent Runtime' },
  { id: 'control', label: 'Control Plane A-Z' },
  { id: 'fabric', label: 'AI Fabric' },
  { id: 'robot', label: 'Robot mô phỏng' },
];

const platformTargets = [
  { id: 'auto', label: 'Tự chọn nền tảng' },
  { id: 'openai', label: 'OpenAI API' },
  { id: 'anthropic', label: 'Claude API' },
  { id: 'gemini', label: 'Gemini API' },
  { id: 'groq', label: 'Groq API' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'ollama', label: 'Ollama local' },
  { id: 'chatgpt', label: 'ChatGPT web' },
  { id: 'claude', label: 'Claude web' },
  { id: 'google-ai-studio', label: 'Google AI Studio' },
  { id: 'cursor', label: 'Cursor / IDE' },
  { id: 'github', label: 'GitHub / PR' },
];

const backgroundRoutes = [
  'OpenAI API',
  'Claude API',
  'Gemini API',
  'Groq API',
  'OpenRouter',
  'Ollama local',
  'ChatGPT web',
  'Claude web',
  'Google AI Studio',
  'Cursor / IDE',
  'Claude Code',
  'Antigravity',
  'VS Code',
  'GitHub / PR',
  'Agent Runtime',
  'Control Plane',
  'Robot mô phỏng',
];

function inferSafePlan(goal: string) {
  const lower = goal.toLowerCase();
  const needsCode = /code|ui|bug|build|github|ide|repo|sửa|lỗi|giao diện|module/.test(lower);
  const needsRobot = /robot|thiết bị|điều khiển|mô phỏng/.test(lower);
  const needsContent = /nội dung|marketing|bài viết|video|sales|khách hàng/.test(lower);
  return [
    'Hiểu mục tiêu và gom ngữ cảnh doanh nghiệp liên quan.',
    needsCode ? 'Chuyển việc code/UI/build sang Agent Runtime, IDE hoặc GitHub khi đã có cấu hình.' : 'Chọn tuyến AI phù hợp qua AI Fabric hoặc agent nội bộ.',
    needsRobot ? 'Kiểm tra robot mô phỏng ở chế độ an toàn trước khi gửi lệnh.' : 'Chạy nền các bước an toàn, không phơi log kỹ thuật lên màn chính.',
    needsContent ? 'Tạo bản nháp nội dung/kịch bản và lưu kết quả để duyệt.' : 'Tạo kết quả hoặc kế hoạch hành động có thể kiểm tra lại.',
    'Đưa thao tác ghi/xóa/gửi/merge/robot rủi ro vào hộp phê duyệt.',
  ];
}

function AICommandLauncher() {
  const [goal, setGoal] = useState('Tạo kế hoạch từ A-Z để cải thiện module Đội ngũ AI, chia việc cho agent, kiểm tra rủi ro và đề xuất bước cần phê duyệt.');
  const [target, setTarget] = useState('auto');
  const [platform, setPlatform] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<string[]>([]);
  const [planReady, setPlanReady] = useState(false);
  const [lastRun, setLastRun] = useState<{ id: string; status: string; route: string } | null>(null);
  const [fabricHealth, setFabricHealth] = useState<{ ok: boolean; apiKeys: number; webProfiles: number; localAvailable: boolean; message: string } | null>(null);

  useEffect(() => {
    checkAIFabricHealth().then(setFabricHealth).catch(() => setFabricHealth(null));
  }, []);

  const runCommand = async () => {
    if (!goal.trim()) return;
    if (!planReady) {
      setPlan(inferSafePlan(goal.trim()));
      setPlanReady(true);
      setLastRun(null);
      setMessage('Đã lập kế hoạch an toàn. Xem nhanh các bước rồi bấm Duyệt chạy.');
      setError('');
      return;
    }
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const selectedPlatform = platform === 'auto' ? undefined : platform;
      if (target === 'fabric') {
        const run = await dispatchAIFabric({
          text: goal.trim(),
          domain: 'operations',
          webPlatform: selectedPlatform,
          localFallback: true,
          task: 'founder-command',
          agentRole: 'operator',
        });
        setLastRun({ id: run.id, status: run.status || 'Đang chạy', route: run.winner?.route || run.modelUsed || 'AI Fabric' });
        setMessage(`Đã gửi vào AI Fabric. Run: ${run.id}. Tuyến thắng: ${run.winner?.route || run.modelUsed || 'đang xử lý'}.`);
        return;
      }
      if (target === 'agent') {
        const run = await createAgentRun(goal.trim(), { maxSteps: 6, plannerMode: 'auto' });
        setLastRun({ id: run.id, status: run.status, route: 'Agent Runtime' });
        setMessage(`Đã tạo nhiệm vụ cho Agent Runtime. Run: ${run.id}. Trạng thái: ${run.status}.`);
        return;
      }
      if (target === 'robot') {
        const robot = await executeRobotCommand('inspect');
        const run = await createAgentRun(`Robot mô phỏng nhận mục tiêu: ${goal.trim()}`, { maxSteps: 4, plannerMode: 'auto', requestedTools: ['robot-simulation'] });
        setLastRun({ id: run.id, status: run.status, route: `Robot mô phỏng (${robot.commandId})` });
        setMessage(`Robot đã nhận lệnh kiểm tra an toàn (${robot.commandId}). Agent run: ${run.id}.`);
        return;
      }
      const run = await executeControlPlane({
        goal: goal.trim(),
        domain: 'operations',
        webPlatform: selectedPlatform,
        autoHandoff: true,
        handoffTarget: ['cursor', 'github'].includes(platform) ? platform : undefined,
      });
      setLastRun({ id: run.id, status: run.status, route: 'Control Plane A-Z' });
      setMessage(`Đã gửi vào Control Plane để xử lý A-Z. Run: ${run.id}. Trạng thái: ${run.status}.`);
    } catch (err: any) {
      setError(err?.message || 'Không gửi được lệnh cho Đội ngũ AI.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 p-5 text-left shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Ra lệnh cho Đội ngũ AI</p>
          <h2 className="mt-2 text-xl font-black text-text-primary">Nhắn một câu, hệ thống tự chọn AI, agent, robot hoặc IDE để xử lý</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-text-secondary">
            Câu lệnh được đưa vào tuyến điều phối. Việc an toàn có thể chạy nền; việc ghi/xóa/gửi/merge/robot rủi ro sẽ chuyển sang phê duyệt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['AI', 'Agent', 'Robot', 'Tự động hóa', 'IDE'].map((item) => (
            <span key={item} className="rounded-full border border-border-secondary bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-text-secondary">{item}</span>
          ))}
        </div>
      </div>

      <textarea
        value={goal}
        onChange={(event) => { setGoal(event.target.value); setPlan([]); setPlanReady(false); setLastRun(null); }}
        className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-border-primary bg-slate-950/85 p-4 text-sm font-semibold leading-6 text-text-primary outline-none placeholder:text-text-tertiary focus:border-cyan-400/60"
        placeholder="Ví dụ: Tự rà soát app, tìm lỗi UI trong Đội ngũ AI, tạo kế hoạch sửa, chạy kiểm tra và đưa phần nguy hiểm vào phê duyệt."
      />

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-2xl border border-border-primary bg-slate-950/60 px-3 py-2 text-[11px] font-semibold leading-5 text-text-secondary">
          Mặc định: hệ thống tự chọn tuyến AI, agent, robot, IDE hoặc GitHub phù hợp nhất.
        </div>
        <button
          type="button"
          disabled={busy || !goal.trim()}
          onClick={() => void runCommand()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-5 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {busy ? 'Đang gửi...' : planReady ? 'Duyệt chạy' : 'Lập kế hoạch'}
        </button>
      </div>

      {plan.length > 0 && (
        <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
          <p className="text-xs font-black text-cyan-100">Kế hoạch trước khi chạy</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {plan.map((step, index) => (
              <p key={step} className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-[11px] font-semibold leading-5 text-text-secondary">
                <span className="mr-2 font-black text-cyan-200">{index + 1}.</span>{step}
              </p>
            ))}
          </div>
        </div>
      )}

      {lastRun && (
        <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs font-black text-emerald-100">Đang theo dõi lệnh vừa gửi</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <p className="text-[11px] font-semibold text-emerald-50">Run: {lastRun.id}</p>
            <p className="text-[11px] font-semibold text-emerald-50">Tuyến: {lastRun.route}</p>
            <p className="text-[11px] font-semibold text-emerald-50">Trạng thái: {lastRun.status}</p>
          </div>
        </div>
      )}

      <details className="mt-3 rounded-2xl border border-border-primary bg-slate-950/45 p-3">
        <summary className="cursor-pointer select-none text-xs font-black text-text-secondary hover:text-text-primary">
          Tuyến xử lý nâng cao và nền tảng chạy ngầm
        </summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <select value={target} onChange={(event) => setTarget(event.target.value)} className="rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-black text-text-primary outline-none focus:border-cyan-400">
            {commandTargets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-black text-text-primary outline-none focus:border-cyan-400">
            {platformTargets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {backgroundRoutes.map((route) => (
            <span key={route} className="rounded-full border border-border-secondary bg-bg-primary px-2.5 py-1 text-[10px] font-black text-text-secondary">
              {route}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <span className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-[11px] font-bold text-text-secondary">Khóa API: {fabricHealth?.apiKeys ?? 'chưa rõ'}</span>
          <span className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-[11px] font-bold text-text-secondary">Web profile: {fabricHealth?.webProfiles ?? 'chưa rõ'}</span>
          <span className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-[11px] font-bold text-text-secondary">Local AI: {fabricHealth?.localAvailable ? 'sẵn sàng' : 'cần cấu hình'}</span>
          <span className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-[11px] font-bold text-text-secondary">Tuyến AI: {fabricHealth?.ok ? 'an toàn' : 'cần kiểm tra'}</span>
        </div>
        <p className="mt-3 text-[11px] font-semibold leading-5 text-text-tertiary">
          Nền tảng chưa có khóa API, profile web hoặc connector IDE sẽ báo cần cấu hình. LedgerFlow không tự chạy hành động nguy hiểm nếu chưa có phê duyệt.
        </p>
      </details>
      {message && <p className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100">{message}</p>}
      {error && <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>
  );
}

export default function AIOperationsCenter() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-text-secondary font-semibold animate-pulse">Đang tải Trung tâm Điều hành AI...</div>}>
      <div className="space-y-6">
      {/* AI Status Bar — cập nhật tự động từ background context */}
      <AIWorkforceStatusBar />

      <div className="rounded-2xl border border-border-primary bg-bg-primary/50 p-5 text-left">
        <h2 className="text-sm font-black text-text-primary">Đội ngũ AI đang vận hành</h2>
        <p className="mt-1 text-xs text-text-secondary">
          AI, agent, robot và tự động hóa chạy nền qua backend, mọi hành động rủi ro vẫn cần phê duyệt.
        </p>
      </div>

      <AICommandLauncher />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {backgroundServices.map(({ title, detail, status, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-border-primary bg-slate-950/65 p-4 text-left shadow-xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-100">
                {status}
              </span>
            </div>
            <p className="mt-4 text-sm font-black text-text-primary">{title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-text-tertiary">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleAreas.map(({ title, detail, status, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-border-primary bg-bg-primary/45 p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <Icon className="h-5 w-5 text-cyan-200" />
              <span className="rounded-full border border-border-secondary bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-text-secondary">
                {status}
              </span>
            </div>
            <p className="mt-4 text-sm font-black text-text-primary">{title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-text-tertiary">{detail}</p>
          </div>
        ))}
      </section>

      <details className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black text-cyan-100 hover:text-text-primary">
          Mở bảng điều phối AI chi tiết
        </summary>
        <div className="mt-4 space-y-6">
          <AIWorkforceCommandCenter />
          <AICommandCenterHubPanel />
          <AIWorkforceRuntimePanel />
        </div>
      </details>

      <details className="rounded-2xl border border-border-primary bg-bg-primary/20 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black text-text-secondary hover:text-slate-200">
          Mở chẩn đoán nâng cao
        </summary>
        <div className="mt-4 space-y-6">

          <AIWorkforceMissionControl />
          <AIWorkforcePatchReviewSessions />
          <AIWorkforcePatchSafetyRunbook />
          <AIWorkforcePluginSecurityGuard />
          <AIWorkforceRobotAutomationBridge />
          <AIWorkforceSkillDirectory />
          <AIWorkforceSkillInvocationPlanner />
        </div>
      </details>
      </div>
    </Suspense>
  );
}
