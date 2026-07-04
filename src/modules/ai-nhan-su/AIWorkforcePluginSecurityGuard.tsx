import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Unplug,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Terminal,
  Play
} from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type Plugin = {
  id?: string;
  name?: string;
  version?: string;
  type?: string;
  enabled?: boolean;
  author?: string;
  entryPoint?: string;
  capabilities?: string[];
  permissions?: string[];
  signature?: string;
  sandbox?: boolean;
  verified?: boolean;
  sastScore?: number;
  sastIssues?: string[];
};

type GuardRow = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
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

function statusClass(status: GuardRow['status']) {
  if (status === 'pass') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

function StatusIcon({ status }: { status: GuardRow['status'] }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function evaluatePlugin(plugin: Plugin): GuardRow[] {
  const hasSignature = Boolean(plugin.signature || plugin.verified);
  const hasSandbox = Boolean(plugin.sandbox);
  const hasExplicitPermissions = Array.isArray(plugin.permissions) && plugin.permissions.length > 0;
  const hasEntryPoint = Boolean(plugin.entryPoint);
  const enabled = Boolean(plugin.enabled);

  return [
    {
      id: 'signature',
      label: 'Signed manifest',
      status: hasSignature ? 'pass' : enabled ? 'fail' : 'warn',
      detail: hasSignature ? 'Plugin has a signature/verified flag.' : 'No signature marker found. Treat as untrusted until reviewed.',
    },
    {
      id: 'sandbox',
      label: 'Sandbox execution',
      status: hasSandbox ? 'pass' : enabled ? 'fail' : 'warn',
      detail: hasSandbox ? 'Plugin declares sandbox execution.' : 'No sandbox marker found. Host-side dynamic loading should be blocked or manually approved.',
    },
    {
      id: 'permissions',
      label: 'Permission scopes',
      status: hasExplicitPermissions ? 'pass' : 'warn',
      detail: hasExplicitPermissions ? `Scopes: ${(plugin.permissions || []).join(', ')}` : 'No explicit permissions array found. Use least-privilege scopes before enabling.',
    },
    {
      id: 'entry',
      label: 'Entry point review',
      status: hasEntryPoint ? 'warn' : 'pass',
      detail: hasEntryPoint ? `Entry point: ${plugin.entryPoint}. Review before invocation.` : 'No entry point declared; safer until installed/invoked.',
    },
  ];
}

export default function AIWorkforcePluginSecurityGuard() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Discover states
  const [discoveredCount, setDiscoveredCount] = useState<number | null>(null);

  const load = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await daemonFetch<{ ok: boolean; plugins?: Plugin[] }>('/api/plugins', undefined, 10000);
      if (result && result.plugins) {
        setPlugins(result.plugins);
      } else {
        setPlugins([...readArray<Plugin>(result, 'plugins'), ...readArray<Plugin>(result, 'items')]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cannot load plugin security state. Plugin endpoint may not be available yet.');
      setPlugins([]);
    } finally { setBusy(false); }
  };

  const handleUnloadPlugin = async (id: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean }>(`/api/plugins/${encodeURIComponent(id)}/unload`, { method: 'POST' }, 10000);
      if (res.ok) {
        setMessage(`Plugin ${id} has been unloaded (disabled).`);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Cannot unload plugin.');
    } finally { setBusy(false); }
  };

  const handleReloadPlugin = async (id: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean }>(`/api/plugins/${encodeURIComponent(id)}/reload`, { method: 'POST' }, 10000);
      if (res.ok) {
        setMessage(`Plugin ${id} has been reloaded (enabled & initialized).`);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Cannot reload plugin.');
    } finally { setBusy(false); }
  };

  const handleDiscoverPlugins = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean; discovered?: string[] }>('/api/plugins/discover', { method: 'POST' }, 15000);
      if (res.ok) {
        const count = res.discovered?.length || 0;
        setDiscoveredCount(count);
        setMessage(`Đã phát hiện ${count} plugins mới từ filesystem. Bấm "Install" để tải vào runtime.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error discovering plugins.');
    } finally { setBusy(false); }
  };

  const handleInstallDiscovered = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ ok: boolean; installed?: string[] }>('/api/plugins/install-discovered', { method: 'POST' }, 20000);
      if (res.ok) {
        const count = res.installed?.length || 0;
        setMessage(`Đã cài đặt thành công ${count} plugins mới.`);
        setDiscoveredCount(null);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Error installing discovered plugins.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => {
    const rows = plugins.flatMap(evaluatePlugin);
    return {
      plugins: plugins.length,
      pass: rows.filter((row) => row.status === 'pass').length,
      warn: rows.filter((row) => row.status === 'warn').length,
      fail: rows.filter((row) => row.status === 'fail').length,
      enabled: plugins.filter((plugin) => plugin.enabled).length,
    };
  }, [plugins]);

  return <section className="rounded-[2rem] border border-border-primary bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><ShieldCheck className="mr-2 inline h-4 w-4" />Plugin Security Guard</p>
        <h3 className="mt-2 text-lg font-black text-text-primary">Bảo mật & Kích hoạt Plugin Swarm</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-text-tertiary">Giám sát các plugin mở rộng như untrusted code: kiểm tra chữ ký số, phạm vi permission, sandbox và tắt/reload nhanh.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void handleDiscoverPlugins()} disabled={busy} className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60 transition-all">Scan Plugins</button>
        {discoveredCount !== null && discoveredCount > 0 && (
          <button onClick={() => void handleInstallDiscovered()} disabled={busy} className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60 transition-all">Install ({discoveredCount})</button>
        )}
        <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-cyan-300 disabled:opacity-60 transition-all"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
      </div>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    {message && <p className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200">{message}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-5">
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><Unplug className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Plugins</p><p className="mt-1 text-2xl font-black text-text-primary">{totals.plugins}</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><PackageCheck className="mb-2 h-4 w-4 text-violet-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Enabled</p><p className="mt-1 text-2xl font-black text-text-primary">{totals.enabled}</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Pass</p><p className="mt-1 text-2xl font-black text-text-primary">{totals.pass}</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><AlertTriangle className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Warn</p><p className="mt-1 text-2xl font-black text-text-primary">{totals.warn}</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><XCircle className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Fail</p><p className="mt-1 text-2xl font-black text-text-primary">{totals.fail}</p></div>
    </div>

    <div className="space-y-3">
      {plugins.map((plugin, index) => {
        const rows = evaluatePlugin(plugin);
        return <div key={plugin.id || plugin.name || index} className="rounded-3xl border border-border-primary bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{plugin.type || 'plugin'}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${plugin.enabled ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-border-secondary bg-bg-primary text-text-secondary'}`}>{plugin.enabled ? 'enabled' : 'disabled'}</span>
              </div>
              <p className="mt-3 text-sm font-black text-text-primary">{plugin.name || plugin.id || `Plugin ${index + 1}`}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-text-tertiary">
                <span>{plugin.version || 'no version'} • {plugin.author || 'unknown author'}</span>
                {plugin.sastScore !== undefined && (
                  <>
                    <span>•</span>
                    <span className={`inline-flex items-center gap-0.5 font-black uppercase text-[10px] px-1.5 py-0.5 rounded ${
                      plugin.sastScore === 100 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                    }`}>
                      SAST Score: {plugin.sastScore}/100
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {plugin.id && plugin.enabled && (
                <button
                  onClick={() => void handleUnloadPlugin(plugin.id!)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-[10px] font-black uppercase text-rose-200 hover:bg-rose-900/30 transition-all"
                >
                  <EyeOff className="h-3 w-3" /> Disable
                </button>
              )}
              {plugin.id && !plugin.enabled && (
                <button
                  onClick={() => void handleReloadPlugin(plugin.id!)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-200 hover:bg-emerald-900/30 transition-all"
                >
                  <Eye className="h-3 w-3" /> Enable
                </button>
              )}
              <Lock className="h-5 w-5 text-cyan-300 mt-1" />
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {rows.map((row) => <div key={row.id} className={`rounded-2xl border p-3 ${statusClass(row.status)}`}>
              <div className="flex items-center gap-2 text-xs font-black"><StatusIcon status={row.status} />{row.label}</div>
              <p className="mt-2 text-[11px] font-semibold leading-5 opacity-90">{row.detail}</p>
            </div>)}
          </div>
          
          {plugin.sastIssues && plugin.sastIssues.length > 0 && (
            <div className="mt-3 rounded-2xl border border-rose-500/25 bg-rose-950/10 p-3 text-xs">
              <p className="font-black text-rose-300 uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Cảnh báo bảo mật SAST
              </p>
              <ul className="list-disc pl-4 space-y-1 font-semibold text-text-secondary text-[11px] leading-5">
                {plugin.sastIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(plugin.capabilities) && plugin.capabilities.length > 0 && <p className="mt-3 rounded-2xl border border-border-primary bg-bg-surface/70 p-2 text-[11px] font-bold text-text-secondary">Capabilities: {plugin.capabilities.join(', ')}</p>}
        </div>;
      })}

      {plugins.length === 0 && <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
        <p className="text-sm font-black text-text-primary"><ShieldAlert className="mr-2 inline h-4 w-4 text-amber-300" />No plugin data loaded</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-text-tertiary">Bấm "Scan Plugins" ở trên để quét filesystem phát hiện plugin mới.</p>
      </div>}
    </div>
  </section>;
}
