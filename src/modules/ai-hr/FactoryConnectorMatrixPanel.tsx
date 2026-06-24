import { useEffect, useMemo, useState } from 'react';
import { Cable, CheckCircle2, Copy, KeyRound, Loader2, RefreshCw, Settings2 } from 'lucide-react';

interface ConnectorProfile {
  id: string;
  label: string;
  category: string;
  status: 'ready' | 'needs_config' | 'planned';
  officialRoute: string;
  supportedWork: string[];
  reviewRequired: boolean;
  notes: string;
}

interface ConnectorConfigCheck {
  id: string;
  label: string;
  state: 'configured' | 'missing' | 'not_required';
  envKeys: string[];
  detail: string;
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function StatusBadge({ status }: { status: ConnectorProfile['status'] }) {
  const cls = status === 'ready'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : status === 'needs_config'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{status.replace('_', ' ')}</span>;
}

function ConfigBadge({ state }: { state: ConnectorConfigCheck['state'] }) {
  const cls = state === 'configured'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : state === 'not_required'
      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{state.replace('_', ' ')}</span>;
}

export default function FactoryConnectorMatrixPanel() {
  const [connectors, setConnectors] = useState<ConnectorProfile[]>([]);
  const [configChecks, setConfigChecks] = useState<ConnectorConfigCheck[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [configStats, setConfigStats] = useState<Record<string, number>>({});
  const [envTemplate, setEnvTemplate] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [connectorsResponse, configResponse, templateResponse] = await Promise.all([
        fetch(`${API_BASE}/connectors`),
        fetch(`${API_BASE}/connectors/config`),
        fetch(`${API_BASE}/connectors/env-template`),
      ]);
      if (!connectorsResponse.ok || !configResponse.ok) throw new Error(`Backend returned ${connectorsResponse.status}/${configResponse.status}`);
      const connectorsPayload = await connectorsResponse.json();
      const configPayload = await configResponse.json();
      setConnectors(connectorsPayload.connectors || []);
      setStats(connectorsPayload.stats || {});
      setConfigChecks(configPayload.checks || []);
      setConfigStats(configPayload.stats || connectorsPayload.configStats || {});
      setEnvTemplate(templateResponse.ok ? await templateResponse.text() : '');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot load connector matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const configById = useMemo(() => new Map(configChecks.map((item) => [item.id, item])), [configChecks]);
  const filtered = useMemo(() => category === 'all' ? connectors : connectors.filter((item) => item.category === category), [connectors, category]);
  const categories = ['all', 'ai_platform', 'ai_agent', 'ide', 'repo', 'local_runtime'];

  const copyEnvTemplate = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate);
      setMessage('Đã copy env template vào clipboard.');
    } catch {
      setShowTemplate(true);
      setMessage('Không copy được tự động; template đã được mở bên dưới.');
    }
  };

  return <section className="space-y-4 rounded-[2rem] border border-violet-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-200"><Cable className="mr-2 inline h-4 w-4" />AI connector matrix</p>
        <h3 className="mt-2 text-xl font-black text-white">AI platforms, agents and IDE routes</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Matrix này gom các nền tảng AI, AI agent, IDE, repository và local runtime vào một catalog. Phần config cho biết connector nào đã có biến môi trường/workspace path trên máy local.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200">
          {categories.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
        </select>
        <button onClick={copyEnvTemplate} disabled={!envTemplate} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-60"><Copy className="h-4 w-4" />Copy env</button>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-violet-400/40 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </div>
    </div>

    {message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">{message}</div>}

    <div className="grid gap-3 md:grid-cols-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">total</p><p className="mt-1 text-2xl font-black text-white">{stats.total ?? connectors.length}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AI platforms</p><p className="mt-1 text-2xl font-black text-cyan-200">{stats.aiPlatforms ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AI agents</p><p className="mt-1 text-2xl font-black text-violet-200">{stats.aiAgents ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">IDEs</p><p className="mt-1 text-2xl font-black text-emerald-200">{stats.ides ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ready</p><p className="mt-1 text-2xl font-black text-emerald-200">{stats.ready ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">needs config</p><p className="mt-1 text-2xl font-black text-amber-200">{stats.needsConfig ?? 0}</p></div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/70">configured</p><p className="mt-1 text-2xl font-black text-emerald-100">{configStats.configured ?? 0}</p></div>
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/70">missing</p><p className="mt-1 text-2xl font-black text-rose-100">{configStats.missing ?? 0}</p></div>
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">not required</p><p className="mt-1 text-2xl font-black text-cyan-100">{configStats.notRequired ?? 0}</p></div>
    </div>

    {showTemplate && <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-300">{envTemplate || 'No template available.'}</pre>}

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item) => {
        const config = configById.get(item.id);
        return <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-white">{item.label}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{item.category.replace('_', ' ')}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5"><StatusBadge status={item.status} />{config && <ConfigBadge state={config.state} />}</div>
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500"><Settings2 className="mr-1 inline h-3 w-3" />{item.officialRoute}</p>
          {config && <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500"><KeyRound className="mr-1 inline h-3 w-3" />{config.detail}</p>}
          {config && config.envKeys.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{config.envKeys.map((key) => <span key={key} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300">{key}</span>)}</div>}
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">{item.notes}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.supportedWork.slice(0, 5).map((work) => <span key={work} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300">{work}</span>)}
            {item.reviewRequired && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-100">review gate</span>}
          </div>
        </div>;
      })}
    </div>

    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
      <p className="text-xs font-black text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4" />Connection policy</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-100/80">Mỗi connector chỉ chạy qua API, token, CLI hoặc workspace connector chính thức do bạn cấu hình. Các bước high-impact vẫn đi qua review gate.</p>
    </div>
  </section>;
}
