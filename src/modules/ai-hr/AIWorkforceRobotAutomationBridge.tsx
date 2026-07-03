import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Gauge,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  Zap,
  Info,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type RobotCapability = {
  id?: string;
  name?: string;
  command?: string;
  mode?: 'simulation' | 'digital_twin' | 'hardware' | string;
  risk?: 'low' | 'medium' | 'high' | 'blocked' | string;
  requiresApproval?: boolean;
  description?: string;
  safetyNotes?: string[];
};

type AutomationRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerEvent: string;
  triggerCount: number;
  lastTriggeredAt?: string;
};

type RuleExecutionLog = {
  id: string;
  ruleId: string;
  ruleName: string;
  eventType: string;
  conditionResult: boolean;
  status: 'success' | 'partial' | 'failed' | 'condition_not_met';
  error?: string;
  executedAt: string;
  durationMs: number;
};

type SchedulerStatus = {
  running?: boolean;
  intervalMs?: number;
  startedAt?: string;
  lastTickAt?: string;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  tickCount?: number;
};

type AuditResult = {
  ok: boolean;
  summary?: string;
  policyDetails?: string;
  mode?: string;
  requiresApproval?: boolean;
  evidence?: string;
};

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function readStatus(value: unknown): SchedulerStatus {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const status = record.status;
    if (status && typeof status === 'object') return status as SchedulerStatus;
  }
  return {};
}

function riskClass(risk?: string) {
  if (risk === 'low') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
  if (risk === 'medium') return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  if (risk === 'high') return 'border-orange-500/25 bg-orange-500/10 text-orange-200';
  if (risk === 'blocked') return 'border-rose-500/25 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function formatMs(value?: number) {
  if (!value) return 'not set';
  if (value >= 3_600_000) return `${Math.round(value / 3_600_000)}h`;
  if (value >= 60_000) return `${Math.round(value / 60_000)}m`;
  return `${value}ms`;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function AIWorkforceRobotAutomationBridge() {
  const [capabilities, setCapabilities] = useState<RobotCapability[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerStatus>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Interactive validation state per capability
  const [validationResults, setValidationResults] = useState<Record<string, AuditResult>>({});
  const [validationModes, setValidationModes] = useState<Record<string, 'simulation' | 'digital_twin' | 'hardware'>>({});

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleExecutionLog[]>([]);

  const load = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const [capabilityResult, schedulerResult, rulesResult, logsResult] = await Promise.allSettled([
        daemonFetch<{ ok: boolean; capabilities: RobotCapability[] }>('/api/robot-capabilities?includeBlocked=true', undefined, 10000),
        daemonFetch<unknown>('/api/automation-scheduler/status', undefined, 10000),
        daemonFetch<{ ok: boolean; rules: AutomationRule[] }>('/api/automation/rules', undefined, 10000),
        daemonFetch<{ ok: boolean; logs: RuleExecutionLog[] }>('/api/automation/execution-log', undefined, 10000),
      ]);
      if (capabilityResult.status === 'fulfilled' && capabilityResult.value?.capabilities) {
        setCapabilities(capabilityResult.value.capabilities);
      } else if (capabilityResult.status === 'fulfilled') {
        setCapabilities(readArray<RobotCapability>(capabilityResult.value, 'capabilities'));
      } else {
        setCapabilities([]);
      }
      
      if (schedulerResult.status === 'fulfilled') {
        setScheduler(readStatus(schedulerResult.value));
      } else {
        setScheduler({});
      }

      if (rulesResult.status === 'fulfilled' && rulesResult.value?.rules) {
        setRules(rulesResult.value.rules);
      } else {
        setRules([]);
      }

      if (logsResult.status === 'fulfilled' && logsResult.value?.logs) {
        setLogs(logsResult.value.logs);
      } else {
        setLogs([]);
      }
      
      if (capabilityResult.status === 'rejected' || schedulerResult.status === 'rejected') {
        setError('Robot/automation daemon routes are not patched yet. Run npm run ai:openclaw-plus locally.');
      }
    } catch (err: unknown) {
      setError(errorMessage(err, 'Cannot load robot automation bridge.'));
      setCapabilities([]); setScheduler({});
    } finally { setBusy(false); }
  };

  const handleToggleRule = async (id: string, currentStatus: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean }>((`/api/automation/rules/${encodeURIComponent(id)}/toggle`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      }, 10000);
      if (res.ok) {
        setMessage(`Đã thay đổi trạng thái hoạt động của luật tự động hóa.`);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Không thể đổi trạng thái luật tự động hóa.');
    } finally { setBusy(false); }
  };

  const schedulerAction = async (action: 'start' | 'stop' | 'tick') => {
    setBusy(true); setError(''); setMessage('');
    try {
      const path = action === 'tick' ? '/api/automation-scheduler/tick' : `/api/automation-scheduler/${action}`;
      const result = await daemonFetch<unknown>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'start' ? JSON.stringify({ intervalMs: 60 * 60 * 1000 }) : '{}'
      }, 15000);
      setScheduler(readStatus(result));
      setMessage(action === 'tick' ? 'Scheduler tick fired safely.' : `Scheduler ${action} requested.`);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, `Cannot ${action} automation scheduler.`));
    } finally { setBusy(false); }
  };

  const handleValidateCapability = async (id: string) => {
    const selectedMode = validationModes[id] || 'simulation';
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean; result: AuditResult }>(`/api/robot-capabilities/${encodeURIComponent(id)}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, approvalPhrase: 'FOUNDER CONFIRMATION' })
      }, 15000);
      if (res && res.result) {
        setValidationResults(prev => ({ ...prev, [id]: res.result }));
        setMessage(`Đã kiểm định an toàn thành công cho capability ${id}`);
      }
    } catch (err: any) {
      // API có thể trả về status code 400 nếu validation fail, ta vẫn parse kết quả nếu có
      if (err.status === 400 && err.response) {
        try {
          const raw = await err.response.json();
          if (raw && raw.result) {
            setValidationResults(prev => ({ ...prev, [id]: raw.result }));
            return;
          }
        } catch {}
      }
      setError(err.message || 'Lỗi trong quá trình kiểm định an toàn robot.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => ({
    capabilities: capabilities.length,
    simulation: capabilities.filter((item) => item.mode === 'simulation').length,
    blocked: capabilities.filter((item) => item.risk === 'blocked').length,
    approvals: capabilities.filter((item) => item.requiresApproval).length,
  }), [capabilities]);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Bot className="mr-2 inline h-4 w-4" />Robot + Automation Bridge</p>
        <h3 className="mt-2 text-lg font-black text-white">Kiểm soát Robot mô phỏng & Vòng lặp Tự trị</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Giám sát các capability của Robot, thiết lập môi trường giả lập (Simulation) và kiểm soát bộ lập lịch định kỳ.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60 transition-all"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    {message && <p className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Bot className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Capabilities</p><p className="mt-1 text-2xl font-black text-white">{totals.capabilities}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Simulation</p><p className="mt-1 text-2xl font-black text-white">{totals.simulation}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><AlertTriangle className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-slate-500">Blocked</p><p className="mt-1 text-2xl font-black text-white">{totals.blocked}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Gauge className="mb-2 h-4 w-4 text-violet-300" /><p className="text-[10px] font-black uppercase text-slate-500">Approvals</p><p className="mt-1 text-2xl font-black text-white">{totals.approvals}</p></div>
    </div>

    <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-white"><Clock3 className="mr-2 inline h-4 w-4 text-cyan-300" />Automation Scheduler</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Status: <span className={scheduler.running ? 'text-emerald-200' : 'text-slate-300'}>{scheduler.running ? 'running' : 'stopped'}</span> • interval {formatMs(scheduler.intervalMs)} • ticks {scheduler.tickCount || 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">Last tick: {scheduler.lastTickAt || 'never'} • daily {scheduler.lastDailyKey || 'none'} • weekly {scheduler.lastWeeklyKey || 'none'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void schedulerAction('tick')} disabled={busy} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-500/25 transition-all"><Zap className="mr-1 inline h-3.5 w-3.5" />Tick</button>
          <button onClick={() => void schedulerAction('start')} disabled={busy || scheduler.running} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase text-emerald-100 hover:bg-emerald-500/25 transition-all"><Play className="mr-1 inline h-3.5 w-3.5" />Start</button>
          <button onClick={() => void schedulerAction('stop')} disabled={busy || !scheduler.running} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase text-rose-100 hover:bg-rose-500/25 transition-all"><Square className="mr-1 inline h-3.5 w-3.5" />Stop</button>
        </div>
      </div>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {capabilities.map((capability, index) => {
        const id = capability.id || '';
        const currentMode = validationModes[id] || 'simulation';
        const audit = validationResults[id];

        return <div key={capability.id || capability.command || index} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between group hover:border-slate-700 transition-all">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{capability.mode || 'unknown'}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${riskClass(capability.risk)}`}>{capability.risk || 'risk'}</span>
                {capability.requiresApproval && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">approval</span>}
              </div>
              <Bot className="h-5 w-5 text-cyan-300 animate-pulse" />
            </div>
            
            <p className="mt-3 text-sm font-black text-white">{capability.name || capability.id || `Capability ${index + 1}`}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 font-mono">Command: {capability.command || 'unknown'}</p>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">{capability.description || 'No description available.'}</p>
            {Array.isArray(capability.safetyNotes) && capability.safetyNotes.length > 0 && (
              <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold text-slate-500">
                Safety Notes: {capability.safetyNotes.join(' • ')}
              </p>
            )}

            {/* Audit validation details if triggered */}
            {audit && (
              <div className={`mt-3 rounded-2xl border p-3 text-xs ${audit.ok ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-rose-500/25 bg-rose-500/5 text-rose-300'}`}>
                <div className="flex items-center gap-1.5 font-black uppercase text-[10px] mb-1.5">
                  {audit.ok ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />}
                  <span>{audit.ok ? 'Safety Audit: Approved' : 'Safety Audit: Blocked / Pending'}</span>
                </div>
                <p className="font-semibold text-slate-300">{audit.summary || 'Kiểm tra an toàn kết thúc.'}</p>
                {audit.policyDetails && <p className="mt-1 text-[10px] text-slate-500 font-medium">Policy: {audit.policyDetails}</p>}
                {audit.evidence && (
                  <pre className="mt-1.5 text-[9px] font-mono p-1.5 bg-slate-950/60 rounded text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {audit.evidence}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-900 pt-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={currentMode}
                onChange={(e) => setValidationModes(prev => ({ ...prev, [id]: e.target.value as any }))}
                className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[10px] font-black text-slate-300 uppercase outline-none focus:border-cyan-400"
              >
                <option value="simulation">simulation</option>
                <option value="digital_twin">digital twin</option>
                <option value="hardware">hardware</option>
              </select>
            </div>
            {id && (
              <button
                onClick={() => void handleValidateCapability(id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 px-3 py-1.5 text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-900/40 transition-all disabled:opacity-40"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Validate Safety
              </button>
            )}
          </div>
        </div>;
      })}
      {capabilities.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
        <p className="text-sm font-black text-white"><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-300" />No robot capability data loaded</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Run the local patcher so daemon routes can expose robot capabilities and scheduler status.</p>
      </div>}
    </div>

    {/* Section for Automation Rules & Execution Logs */}
    <div className="mt-6 grid gap-6 lg:grid-cols-2 border-t border-slate-900 pt-6">
      {/* Rules Manager Panel */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-sm font-black text-white flex items-center gap-1.5 mb-4">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Danh sách Luật tự động hóa (Automation Rules)</span>
        </p>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-850 bg-slate-950/60 p-3 hover:border-slate-800 transition-all flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-white">{rule.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{rule.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[9px] font-black text-amber-300 uppercase">{rule.triggerEvent}</span>
                  <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Triggers: {rule.triggerCount || 0}</span>
                </div>
              </div>
              <button
                onClick={() => void handleToggleRule(rule.id, rule.enabled)}
                disabled={busy}
                className={`rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase border transition-all ${
                  rule.enabled 
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' 
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                {rule.enabled ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-4">Chưa đăng ký luật tự động hóa nào.</p>
          )}
        </div>
      </div>

      {/* Execution Logs Timeline Panel */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-sm font-black text-white flex items-center gap-1.5 mb-4">
          <Clock3 className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span>Nhật ký Kích hoạt Gần nhất (Execution Logs)</span>
        </p>
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isSuccess = log.status === 'success';
            const isFailed = log.status === 'failed';
            return (
              <div key={log.id} className="rounded-2xl border border-slate-850 bg-slate-950/60 p-3 hover:border-slate-800 transition-all text-xs font-semibold leading-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200">{log.ruleName}</span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    isSuccess ? 'bg-emerald-500/25 text-emerald-300' :
                    isFailed ? 'bg-rose-500/25 text-rose-300' :
                    'bg-slate-905 text-slate-400'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Event: <span className="font-mono text-cyan-400">{log.eventType}</span></span>
                  <span>{log.durationMs}ms</span>
                </div>
                {log.error && (
                  <p className="mt-1.5 rounded bg-rose-950/20 p-2 text-[10px] text-rose-300 font-mono border border-rose-900/30">
                    Error: {log.error}
                  </p>
                )}
                <p className="mt-1 text-[9px] text-slate-600 text-right font-medium">{log.executedAt}</p>
              </div>
            );
          })}
          {logs.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-4">Chưa có lịch sử kích hoạt nào.</p>
          )}
        </div>
      </div>
    </div>
  </section>;
}
