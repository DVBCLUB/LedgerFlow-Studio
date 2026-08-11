import React from 'react';
import { Activity, ArrowRight, Bot, KeyRound, Loader2, Lock, PlayCircle, Power, RefreshCw, ShieldCheck, Unlock, UserCog, Zap } from 'lucide-react';
import {
  claimPlatformAccountLease,
  fetchPlatformAccountResources,
  releasePlatformAccountLease,
  updateWebAIProfile,
  dispatchAIFabric,
  checkAIFabricHealth,
  executeControlPlane,
  type PlatformAccountLease,
  type PlatformAccountResource,
  type FabricRun,
} from '../../../utils/assistantApi';
import UnifiedDashboard from './UnifiedDashboard';

interface ControlPlaneTabProps {
  selectedProfileId: string;
  setSelectedProfileId: (value: string) => void;
  setWebPlatform: (value: string) => void;
  loadWebAIProfiles: (silent?: boolean) => Promise<void>;
  pushNotice: (kind: 'success' | 'error', text: string) => void;
}

const PLATFORM_OPTIONS = ['all', 'chatgpt', 'gemini', 'claude', 'deepseek', 'grok', 'copilot', 'openai', 'anthropic', 'ollama', 'groq', 'openrouter'] as const;

const statusClasses: Record<string, string> = {
  ready: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
  active: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
  quota: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
  login_required: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
  error: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
  disabled: 'border-border-secondary bg-bg-primary text-text-tertiary',
  untested: 'border-border-secondary bg-bg-primary text-text-secondary',
};

function formatTime(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
}

function countBy(resources: PlatformAccountResource[], predicate: (resource: PlatformAccountResource) => boolean) {
  return resources.filter(predicate).length;
}

function SummaryCard({ title, value, tone }: { title: string; value: string | number; tone?: 'primary' | 'success' | 'info' | 'warning' | 'error' }) {
  const classes = {
    primary: 'border-violet-500/40 bg-violet-950/20 text-violet-200',
    success: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200',
    info: 'border-cyan-900/60 bg-cyan-950/20 text-cyan-200',
    warning: 'border-amber-900/60 bg-amber-950/20 text-amber-200',
    error: 'border-rose-900/60 bg-rose-950/20 text-rose-200',
  };
  return (
    <div className={`rounded-xl border p-3 ${classes[tone || 'primary']}`}>
      <div className="text-[10px] uppercase tracking-widest font-black text-text-tertiary">{title}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

export default function ControlPlaneTab({
  selectedProfileId,
  setSelectedProfileId,
  setWebPlatform,
  loadWebAIProfiles,
  pushNotice,
}: ControlPlaneTabProps) {
  const [platformFilter, setPlatformFilter] = React.useState<string>('all');
  const [resources, setResources] = React.useState<PlatformAccountResource[]>([]);
  const [leases, setLeases] = React.useState<PlatformAccountLease[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [leaseOwner, setLeaseOwner] = React.useState('founder-console');
  const [leasePurpose, setLeasePurpose] = React.useState('Điều phối profile Web AI');
  const [ttlMinutes, setTtlMinutes] = React.useState(90);

  // AI Fabric state
  const [fabricInput, setFabricInput] = React.useState('');
  const [fabricLoading, setFabricLoading] = React.useState(false);
  const [fabricResult, setFabricResult] = React.useState<FabricRun | null>(null);

  // Control Plane state
  const [cpGoal, setCpGoal] = React.useState('');
  const [cpDomain, setCpDomain] = React.useState('coding');
  const [cpAutoHandoff, setCpAutoHandoff] = React.useState(false);
  const [cpLoading, setCpLoading] = React.useState(false);
  const [cpRun, setCpRun] = React.useState<any>(null);
  const [cpError, setCpError] = React.useState<string | null>(null);

  const loadSnapshot = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchPlatformAccountResources(platformFilter === 'all' ? undefined : platformFilter);
      setResources(result.resources);
      setLeases(result.leases);
    } catch (err: any) {
      pushNotice('error', `Không tải được control plane: ${err.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [platformFilter, pushNotice]);

  React.useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const handleToggleEnabled = async (resource: PlatformAccountResource) => {
    if (resource.kind !== 'web_profile') return;
    setBusyKey(`toggle:${resource.id}`);
    try {
      await updateWebAIProfile(resource.id, { enabled: !resource.enabled });
      pushNotice('success', `${resource.label}: ${resource.enabled ? 'đã tắt' : 'đã bật'} profile.`);
      await Promise.all([loadSnapshot(true), loadWebAIProfiles(true)]);
    } catch (err: any) {
      pushNotice('error', `Không cập nhật được profile: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleMarkReady = async (resource: PlatformAccountResource) => {
    if (resource.kind !== 'web_profile') return;
    setBusyKey(`ready:${resource.id}`);
    try {
      await updateWebAIProfile(resource.id, { status: 'ready', lastError: '' });
      pushNotice('success', `${resource.label} đã được đánh dấu sẵn sàng.`);
      await Promise.all([loadSnapshot(true), loadWebAIProfiles(true)]);
    } catch (err: any) {
      pushNotice('error', `Không cập nhật được trạng thái: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleMarkLoginRequired = async (resource: PlatformAccountResource) => {
    if (resource.kind !== 'web_profile') return;
    setBusyKey(`login:${resource.id}`);
    try {
      await updateWebAIProfile(resource.id, { status: 'login_required', lastError: 'Manual review required.' });
      pushNotice('success', `${resource.label} đã được đưa về trạng thái cần đăng nhập.`);
      await Promise.all([loadSnapshot(true), loadWebAIProfiles(true)]);
    } catch (err: any) {
      pushNotice('error', `Không cập nhật được trạng thái: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaim = async (resourceId?: string) => {
    const targetPlatform = platformFilter !== 'all'
      ? platformFilter
      : resources.find((item) => item.id === resourceId)?.platform;

    if (!targetPlatform) {
      pushNotice('error', 'Hãy chọn một nền tảng hoặc claim trực tiếp trên card resource.');
      return;
    }

    setBusyKey(`claim:${resourceId || targetPlatform}`);
    try {
      const result = await claimPlatformAccountLease({
        platform: targetPlatform,
        resourceId,
        leaseOwner,
        purpose: leasePurpose,
        ttlMinutes,
      });
      if (result.resource.kind === 'web_profile') {
        setSelectedProfileId(result.resource.id);
        setWebPlatform(result.resource.platform);
      }
      pushNotice('success', `Đã claim "${result.resource.label}" cho ${leaseOwner}.`);
      await Promise.all([loadSnapshot(true), loadWebAIProfiles(true)]);
    } catch (err: any) {
      pushNotice('error', `Claim lease thất bại: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleRelease = async (lease: PlatformAccountLease) => {
    setBusyKey(`release:${lease.id}`);
    try {
      await releasePlatformAccountLease(lease.id, leaseOwner);
      pushNotice('success', `Đã release lease cho ${lease.resourceId}.`);
      await Promise.all([loadSnapshot(true), loadWebAIProfiles(true)]);
    } catch (err: any) {
      pushNotice('error', `Release lease thất bại: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleFabricDispatch = async () => {
    if (!fabricInput.trim()) return;
    setFabricLoading(true);
    setFabricResult(null);
    try {
      const run = await dispatchAIFabric({ text: fabricInput });
      setFabricResult(run);
      pushNotice(run.status === 'completed' ? 'success' : 'error', `Fabric: ${run.modelUsed || 'all exhausted'} (${run.totalLatencyMs}ms)`);
    } catch (err: any) {
      pushNotice('error', `Fabric dispatch thất bại: ${err.message}`);
    } finally {
      setFabricLoading(false);
    }
  };

  const handleControlPlaneRun = async () => {
    if (!cpGoal.trim()) return;
    setCpLoading(true);
    setCpRun(null);
    setCpError(null);
    try {
      const run = await executeControlPlane({
        goal: cpGoal,
        domain: cpDomain,
        autoHandoff: cpAutoHandoff,
        handoffTarget: cpAutoHandoff ? 'vscode' : undefined,
      });
      setCpRun(run);
      pushNotice(run.status === 'completed' ? 'success' : run.status === 'waiting_handoff' ? 'success' : 'error', `Control Plane: ${run.status} (${run.steps?.length || 0} steps)`);
    } catch (err: any) {
      setCpError(err.message);
      pushNotice('error', `Control Plane thất bại: ${err.message}`);
    } finally {
      setCpLoading(false);
    }
  };

  const webProfiles = resources.filter((resource) => resource.kind === 'web_profile');
  const apiKeys = resources.filter((resource) => resource.kind === 'api_key');

  return (
    <div className="p-4 space-y-4">
      {/* Unified Dashboard */}
      <UnifiedDashboard />

      <div className="rounded-xl border border-border-primary bg-bg-primary/40 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" /> AI Control Plane
            </h3>
            <p className="mt-2 text-xs text-text-secondary max-w-3xl">
              Tầng điều phối này biến Web AI profiles và API keys thành các tài nguyên có trạng thái, có lease và có thể chọn làm account đang hoạt động cho các tác vụ kế tiếp.
            </p>
          </div>
          <button
            onClick={() => void loadSnapshot()}
            className="px-3 py-2 rounded-xl border border-border-secondary bg-slate-950 text-xs font-bold text-text-secondary hover:bg-bg-primary flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard title="Tổng tài nguyên" value={resources.length} tone="primary" />
          <SummaryCard title="Ready" value={countBy(resources, (item) => item.status === 'ready')} tone="success" />
          <SummaryCard title="Leased" value={leases.filter((lease) => lease.status === 'active').length} tone="info" />
          <SummaryCard title="Login / Error" value={countBy(resources, (item) => ['login_required', 'error'].includes(item.status))} tone="error" />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr,1fr,1fr,120px,160px]">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Nền tảng</label>
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Tất cả nền tảng' : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Lease owner</label>
            <input
              value={leaseOwner}
              onChange={(event) => setLeaseOwner(event.target.value)}
              className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Mục đích</label>
            <input
              value={leasePurpose}
              onChange={(event) => setLeasePurpose(event.target.value)}
              className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">TTL</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={ttlMinutes}
              onChange={(event) => setTtlMinutes(Number(event.target.value) || 90)}
              className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void handleClaim()}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-black text-text-primary flex items-center justify-center gap-2"
            >
              <Lock className="h-3.5 w-3.5" /> Auto claim
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-primary/40 p-8 text-xs text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Đang tải control plane...
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border-primary bg-bg-primary/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary">
              <Bot className="h-4 w-4 text-violet-400" /> Web profiles
            </div>
            {webProfiles.length === 0 ? (
              <div className="text-xs text-text-tertiary py-4">Chưa có Web AI profile nào trong phạm vi lọc hiện tại.</div>
            ) : (
              <div className="space-y-3">
                {webProfiles.map((resource) => {
                  const lease = resource.activeLease ?? null;
                  const isBusy = busyKey && busyKey.includes(resource.id);
                  return (
                    <div key={resource.id} className="rounded-xl border border-border-primary bg-slate-950/60 p-3 space-y-3">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-black text-text-primary">{resource.label}</div>
                            <span className="rounded-full border border-violet-500/20 bg-violet-950/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-300">
                              {resource.platform}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusClasses[resource.status] || statusClasses.untested}`}>
                              {resource.status}
                            </span>
                            {selectedProfileId === resource.id && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                                active selection
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-tertiary font-mono">
                            {(resource.detail.profileDir as string) || resource.id}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            Lần dùng cuối: {formatTime(resource.lastUsedAt)} · Failures: {resource.consecutiveFailures ?? 0}
                          </div>
                          {resource.lastError && (
                            <div className="text-[11px] text-rose-400 break-words">{resource.lastError}</div>
                          )}
                          {lease && (
                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-200">
                              Lease: <strong>{lease.leaseOwner}</strong> · {lease.purpose} · hết hạn {formatTime(lease.expiresAt)}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProfileId(resource.id);
                              setWebPlatform(resource.platform);
                              pushNotice('success', `Đã chọn "${resource.label}" làm profile hoạt động.`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${
                              selectedProfileId === resource.id
                                ? 'border-emerald-500/40 bg-emerald-600 text-text-primary'
                                : 'border-border-primary bg-bg-primary text-text-secondary hover:bg-bg-surface'
                            }`}
                          >
                            <UserCog className="h-3 w-3 inline mr-1" />
                            {selectedProfileId === resource.id ? 'Đang dùng' : 'Kích hoạt'}
                          </button>
                          <button
                            onClick={() => void handleToggleEnabled(resource)}
                            disabled={Boolean(isBusy)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-border-primary bg-bg-primary text-text-secondary hover:bg-bg-surface disabled:opacity-50"
                          >
                            <Power className="h-3 w-3 inline mr-1" />
                            {resource.enabled ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            onClick={() => void handleMarkReady(resource)}
                            disabled={Boolean(isBusy)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-emerald-800/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3 w-3 inline mr-1" /> Ready
                          </button>
                          <button
                            onClick={() => void handleMarkLoginRequired(resource)}
                            disabled={Boolean(isBusy)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-rose-800/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 disabled:opacity-50"
                          >
                            <Activity className="h-3 w-3 inline mr-1" /> Login
                          </button>
                          {!lease ? (
                            <button
                              onClick={() => void handleClaim(resource.id)}
                              disabled={!resource.enabled || Boolean(isBusy)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-cyan-600 text-text-primary hover:bg-cyan-500 disabled:opacity-50"
                            >
                              <Lock className="h-3 w-3 inline mr-1" /> Claim
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleRelease(lease)}
                              disabled={Boolean(isBusy)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-amber-700/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30 disabled:opacity-50"
                            >
                              <Unlock className="h-3 w-3 inline mr-1" /> Release
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border-primary bg-bg-primary/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary">
              <KeyRound className="h-4 w-4 text-amber-400" /> API resources
            </div>
            {apiKeys.length === 0 ? (
              <div className="text-xs text-text-tertiary py-3">AI Vault chưa có key khả dụng hoặc đang khóa.</div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {apiKeys.map((resource) => (
                  <div key={resource.id} className="rounded-xl border border-border-primary bg-slate-950/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-text-primary">{resource.label}</div>
                        <div className="text-[11px] text-text-tertiary">{resource.platform}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusClasses[resource.status] || statusClasses.untested}`}>
                        {resource.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      Model: {(resource.detail.model as string) || 'default'} · Mode: API shared
                    </div>
                    {resource.lastError && (
                      <div className="text-[11px] text-rose-400 break-words">{resource.lastError}</div>
                    )}
                    <div className="text-[11px] text-text-tertiary flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      Tài nguyên kiểu shared, không cần lease độc quyền.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── AI Fabric Test ────────────────────────────────────── */}
      <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/15 p-4 mt-3 space-y-3">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-indigo-400" /> AI Fabric Dispatcher (API → Web → Local)
        </h3>
        <p className="text-[11px] text-text-tertiary">Dùng AI Fabric để dispatch prompt tuần tự: thử API key trước, nếu hết thì qua Web profile, cuối cùng qua Ollama local.</p>
        <div className="flex gap-2">
          <input
            value={fabricInput}
            onChange={e => setFabricInput(e.target.value)}
            placeholder="Nhập prompt test cho AI Fabric..."
            className="flex-1 bg-slate-950 border border-border-primary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-indigo-500/60"
            onKeyDown={e => e.key === 'Enter' && handleFabricDispatch()}
          />
          <button
            onClick={handleFabricDispatch}
            disabled={fabricLoading || !fabricInput.trim()}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            {fabricLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Dispatch
          </button>
        </div>
        {fabricResult && (
          <div className="rounded-xl border border-border-primary bg-slate-950 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text-primary">{fabricResult.status === 'completed' ? '✅' : '❌'} {fabricResult.modelUsed || 'N/A'}</span>
              <span className="text-[10px] text-text-tertiary">{fabricResult.totalLatencyMs}ms · {(fabricResult.steps?.length || 0)} step(s)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(fabricResult.steps || []).map((step, i) => (
                <span key={i} className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${step.status === 'success' ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200' : 'border-rose-500/30 bg-rose-950/30 text-rose-200'}`}>
                  {step.route}: {step.status}
                </span>
              ))}
            </div>
            {fabricResult.steps.some(s => s.status === 'success') && (
              <div className="text-[11px] text-text-secondary max-h-32 overflow-auto whitespace-pre-wrap">
                {fabricResult.steps.find(s => s.status === 'success')?.contentPreview?.slice(0, 300)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Agent Control Plane ────────────────────────────────────── */}
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-4 mt-3 space-y-3">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <PlayCircle className="h-4 w-4 text-emerald-400" /> Agent Control Plane (AI → IDE → Review)
        </h3>
        <p className="text-[11px] text-text-tertiary">Điều phối toàn bộ workflow: AI phân tích → handoff sang IDE → review kết quả.</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={cpGoal}
              onChange={e => setCpGoal(e.target.value)}
              placeholder="VD: Sửa lỗi type trong AIAssistantPanel.tsx"
              className="flex-1 bg-slate-950 border border-border-primary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-emerald-500/60"
              onKeyDown={e => e.key === 'Enter' && handleControlPlaneRun()}
            />
            <select
              value={cpDomain}
              onChange={e => setCpDomain(e.target.value)}
              className="bg-slate-950 border border-border-primary rounded-xl px-2 py-2 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/60"
            >
              <option value="coding">Coding</option>
              <option value="finance">Finance</option>
              <option value="marketing">Marketing</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary cursor-pointer">
              <input type="checkbox" checked={cpAutoHandoff} onChange={e => setCpAutoHandoff(e.target.checked)} className="accent-emerald-500" />
              Tự động handoff sang IDE
            </label>
            <button
              onClick={handleControlPlaneRun}
              disabled={cpLoading || !cpGoal.trim()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ml-auto"
            >
              {cpLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              Run Control Plane
            </button>
          </div>
        </div>
        {cpRun && (
          <div className="rounded-xl border border-border-primary bg-slate-950 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text-primary">
                {cpRun.status === 'completed' ? '✅' : cpRun.status === 'waiting_handoff' ? '🔄' : '❌'} {cpRun.status}
              </span>
              <span className="text-[10px] text-text-tertiary">{cpRun.steps?.length || 0} step(s)</span>
            </div>
            {cpRun.summary && <div className="text-[11px] text-text-secondary max-h-20 overflow-auto">{cpRun.summary}</div>}
            <div className="space-y-1">
              {cpRun.steps?.map((step: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${step.status === 'completed' ? 'text-emerald-300' : step.status === 'failed' ? 'text-rose-300' : 'text-text-tertiary'}`}>
                    {step.phase}: {step.status}
                  </span>
                  {step.evidence?.modelUsed && <span className="text-text-tertiary">{step.evidence.modelUsed}</span>}
                </div>
              ))}
            </div>
            {cpRun.steps?.some((s: any) => s.handoffPrompt) && (
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/30 p-2">
                <div className="text-[10px] font-black text-emerald-300 mb-1">Handoff Prompt đã sẵn sàng:</div>
                <pre className="text-[9px] text-emerald-200 max-h-24 overflow-auto whitespace-pre-wrap">
                  {cpRun.steps.find((s: any) => s.handoffPrompt)?.handoffPrompt?.promptMarkdown?.slice(0, 500)}
                </pre>
              </div>
            )}
          </div>
        )}
        {cpError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-[11px] font-bold text-rose-200">{cpError}</div>
        )}
      </div>
    </div>
  );
}
