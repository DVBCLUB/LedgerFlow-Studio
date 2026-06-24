import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bug, Database, Gauge, Plug, RefreshCw, ShieldCheck, ShieldAlert, Terminal } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type HubData = {
  overview: Record<string, any> | null;
  plugins: any[];
  pluginStats: Record<string, any>;
  driftReports: any[];
  driftStats: Record<string, any>;
  depReports: any[];
  depStats: Record<string, any>;
  sastReports: any[];
  sastStats: Record<string, any>;
  logAnalyses: any[];
  logStats: Record<string, any>;
  perfProfiles: any[];
};

const empty: HubData = {
  overview: null,
  plugins: [], pluginStats: {},
  driftReports: [], driftStats: {},
  depReports: [], depStats: {},
  sastReports: [], sastStats: {},
  logAnalyses: [], logStats: {},
  perfProfiles: [],
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}

function arr(value: any) { return Array.isArray(value) ? value : []; }
function obj(value: any) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function Stat({ label, value, hint, tone = 'slate' }: { label: string; value: string | number; hint?: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' }) {
  const valueClass = tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'cyan' ? 'text-cyan-300' : 'text-white';
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => React.ReactNode }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 6).map(render)}</div>;
}

export default function SecuritySystemHubPanel() {
  const [data, setData] = useState<HubData>(empty);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/system/overview', undefined, 10000),
        daemonFetch<any>('/api/plugins', undefined, 10000),
        daemonFetch<any>('/api/drift/reports', undefined, 10000),
        daemonFetch<any>('/api/deps/reports', undefined, 10000),
        daemonFetch<any>('/api/sast/reports', undefined, 10000),
        daemonFetch<any>('/api/logs/analyses', undefined, 10000),
        daemonFetch<any>('/api/perf/profiles', undefined, 10000),
      ]);
      const [overview, plugins, drift, deps, sast, logs, perf] = results;
      setData({
        overview: overview.status === 'fulfilled' ? unwrap(overview.value, 'overview') : null,
        plugins: plugins.status === 'fulfilled' ? arr(unwrap(plugins.value, 'plugins')) : [],
        pluginStats: plugins.status === 'fulfilled' ? obj(unwrap(plugins.value, 'stats')) : {},
        driftReports: drift.status === 'fulfilled' ? arr(unwrap(drift.value, 'reports')) : [],
        driftStats: drift.status === 'fulfilled' ? obj(unwrap(drift.value, 'stats')) : {},
        depReports: deps.status === 'fulfilled' ? arr(unwrap(deps.value, 'reports')) : [],
        depStats: deps.status === 'fulfilled' ? obj(unwrap(deps.value, 'stats')) : {},
        sastReports: sast.status === 'fulfilled' ? arr(unwrap(sast.value, 'reports')) : [],
        sastStats: sast.status === 'fulfilled' ? obj(unwrap(sast.value, 'stats')) : {},
        logAnalyses: logs.status === 'fulfilled' ? arr(unwrap(logs.value, 'analyses')) : [],
        logStats: logs.status === 'fulfilled' ? obj(unwrap(logs.value, 'stats')) : {},
        perfProfiles: perf.status === 'fulfilled' ? arr(unwrap(perf.value, 'profiles')) : [],
      });
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải System Health, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Security & System Health.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Security & System Health.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const riskCount = useMemo(() => {
    const possible = [data.driftReports, data.depReports, data.sastReports, data.logAnalyses].flat();
    return possible.filter((item: any) => ['high', 'critical', 'failed', 'error'].includes(String(item.severity || item.status || item.risk || '').toLowerCase())).length;
  }, [data]);

  const overviewSections = data.overview ? Object.keys(data.overview).length : 0;

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-rose-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-200"><ShieldAlert className="mr-2 inline h-4 w-4" />Security & System Health</p>
          <h2 className="mt-2 text-2xl font-black text-white">Risk queue, plugins, scans and runtime health</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Một màn gọn để xem plugin, drift, dependency, SAST, log analysis và performance profile. Chỉ đọc trạng thái; scan/fix nguy hiểm không tự chạy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-rose-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Overview" value={overviewSections} hint="system sections" tone="cyan" />
      <Stat label="Plugins" value={data.plugins.length} hint="registered" tone="green" />
      <Stat label="Risk queue" value={riskCount} hint="high/error items" tone={riskCount ? 'rose' : 'green'} />
      <Stat label="SAST reports" value={data.sastReports.length} hint="security scans" tone="amber" />
      <Stat label="Log analyses" value={data.logAnalyses.length} hint="runtime logs" />
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Plugin registry" icon={<Plug className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="cyan">{data.plugins.length} plugins</Badge><Badge>{JSON.stringify(data.pluginStats).slice(0, 40) || 'stats'}</Badge></div>
        <MiniList items={data.plugins} emptyText="Chưa có plugin registered." render={(plugin, index) => <div key={plugin.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{plugin.name || plugin.id || 'Plugin'}</p><Badge tone={plugin.status === 'active' || plugin.enabled ? 'green' : 'slate'}>{plugin.status || plugin.type || 'plugin'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{plugin.type || plugin.description || 'extension'}</p></div>} />
      </Section>
      <Section title="Config drift" icon={<Database className="h-4 w-4 text-amber-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.driftReports.length ? 'amber' : 'green'}>{data.driftReports.length} reports</Badge></div>
        <MiniList items={data.driftReports} emptyText="Chưa có drift report." render={(report, index) => <div key={report.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{report.name || report.id || 'Drift report'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{report.status || report.createdAt || report.summary || 'config drift'}</p></div>} />
      </Section>
      <Section title="Dependency health" icon={<Bug className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.depReports.length ? 'amber' : 'green'}>{data.depReports.length} reports</Badge></div>
        <MiniList items={data.depReports} emptyText="Chưa có dependency report." render={(report, index) => <div key={report.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{report.packageName || report.name || report.id || 'Dependency report'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{report.status || report.severity || report.createdAt || 'dependency health'}</p></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="SAST security" icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.sastReports.length ? 'amber' : 'green'}>{data.sastReports.length} reports</Badge></div>
        <MiniList items={data.sastReports} emptyText="Chưa có SAST report." render={(report, index) => <div key={report.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{report.name || report.id || 'SAST report'}</p><Badge tone={String(report.severity || report.status || '').toLowerCase().includes('high') ? 'rose' : 'slate'}>{report.severity || report.status || 'scan'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{report.createdAt || report.summary || 'security scan'}</p></div>} />
      </Section>
      <Section title="Log analyzer" icon={<Terminal className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.logAnalyses.length ? 'cyan' : 'green'}>{data.logAnalyses.length} analyses</Badge></div>
        <MiniList items={data.logAnalyses} emptyText="Chưa có log analysis." render={(analysis, index) => <div key={analysis.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{analysis.filePath || analysis.name || analysis.id || 'Log analysis'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{analysis.summary || analysis.createdAt || analysis.status || 'runtime logs'}</p></div>} />
      </Section>
      <Section title="Performance profiles" icon={<Gauge className="h-4 w-4 text-amber-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="amber">{data.perfProfiles.length} profiles</Badge></div>
        <MiniList items={data.perfProfiles} emptyText="Chưa có performance profile." render={(profile, index) => <div key={profile.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{profile.name || profile.pattern || profile.id || 'Performance profile'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{profile.createdAt || profile.durationMs || profile.summary || 'performance'}</p></div>} />
      </Section>
    </section>

    <Section title="System overview snapshot" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <div className="flex flex-wrap gap-2">{data.overview ? Object.keys(data.overview).map((key) => <Badge key={key} tone="cyan">{key}</Badge>) : <p className="text-xs font-bold text-slate-500">Chưa tải được system overview.</p>}</div>
    </Section>

    {rawOpen && <Section title="Raw security/system payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
