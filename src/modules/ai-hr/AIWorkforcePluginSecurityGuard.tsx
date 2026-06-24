import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, Lock, PackageCheck, RefreshCw, ShieldAlert, ShieldCheck, Unplug, XCircle } from 'lucide-react';
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
};

type GuardRow = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
};

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
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

  const load = async () => {
    setBusy(true); setError('');
    try {
      const result = await daemonFetch<unknown>('/api/plugins', undefined, 10000);
      setPlugins([...readArray<Plugin>(result, 'plugins'), ...readArray<Plugin>(result, 'items')]);
    } catch (err: any) {
      setError(err?.message || 'Cannot load plugin security state. Plugin endpoint may not be available yet.');
      setPlugins([]);
    } finally { setBusy(false); }
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

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><ShieldCheck className="mr-2 inline h-4 w-4" />Plugin Security Guard</p>
        <h3 className="mt-2 text-lg font-black text-white">Signed, scoped and sandboxed plugins</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Kiểm soát plugin như untrusted code: cần chữ ký, permission scope, sandbox và review entry point trước khi invoke.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Unplug className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Plugins</p><p className="mt-1 text-2xl font-black text-white">{totals.plugins}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><PackageCheck className="mb-2 h-4 w-4 text-violet-300" /><p className="text-[10px] font-black uppercase text-slate-500">Enabled</p><p className="mt-1 text-2xl font-black text-white">{totals.enabled}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Pass</p><p className="mt-1 text-2xl font-black text-white">{totals.pass}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><AlertTriangle className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-slate-500">Warn</p><p className="mt-1 text-2xl font-black text-white">{totals.warn}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><XCircle className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-slate-500">Fail</p><p className="mt-1 text-2xl font-black text-white">{totals.fail}</p></div>
    </div>

    <div className="space-y-3">
      {plugins.map((plugin, index) => {
        const rows = evaluatePlugin(plugin);
        return <div key={plugin.id || plugin.name || index} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{plugin.type || 'plugin'}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${plugin.enabled ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>{plugin.enabled ? 'enabled' : 'disabled'}</span>
              </div>
              <p className="mt-3 text-sm font-black text-white">{plugin.name || plugin.id || `Plugin ${index + 1}`}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{plugin.version || 'no version'} • {plugin.author || 'unknown author'}</p>
            </div>
            <Lock className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {rows.map((row) => <div key={row.id} className={`rounded-2xl border p-3 ${statusClass(row.status)}`}>
              <div className="flex items-center gap-2 text-xs font-black"><StatusIcon status={row.status} />{row.label}</div>
              <p className="mt-2 text-[11px] font-semibold leading-5 opacity-90">{row.detail}</p>
            </div>)}
          </div>

          {Array.isArray(plugin.capabilities) && plugin.capabilities.length > 0 && <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold text-slate-400">Capabilities: {plugin.capabilities.join(', ')}</p>}
        </div>;
      })}

      {plugins.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-sm font-black text-white"><ShieldAlert className="mr-2 inline h-4 w-4 text-amber-300" />No plugin data loaded</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Khi backend plugin endpoint sẵn sàng, panel này sẽ kiểm tra signature, sandbox, permission scopes và entry point. Tạm thời coi plugin runtime là vùng rủi ro cao.</p>
      </div>}
    </div>
  </section>;
}
