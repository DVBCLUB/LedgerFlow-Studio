import { useEffect, useState } from 'react';
import { Activity, Bot, Database, FileJson, ListChecks, Network, RefreshCw, Route, ServerCog } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type PlatformData = {
  jobs: any[];
  jobStats: Record<string, any>;
  openApiRoutes: any[];
  openApiCount: number;
  gatewayProviders: any[];
  gatewayStats: Record<string, any>;
  gatewayConfigs: any[];
  timelines: any[];
  robotDraft: any | null;
};

const empty: PlatformData = {
  jobs: [],
  jobStats: {},
  openApiRoutes: [],
  openApiCount: 0,
  gatewayProviders: [],
  gatewayStats: {},
  gatewayConfigs: [],
  timelines: [],
  robotDraft: null,
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }
function obj(value: any) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-border-secondary bg-bg-primary text-text-secondary';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{label}</p>
    <p className="mt-2 text-2xl font-black text-text-primary">{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-text-tertiary">{hint}</p>}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: any; children: any }) {
  return <section className="rounded-3xl border border-border-primary bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-text-primary">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => any }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-text-tertiary">{emptyText}</p> : items.slice(0, 8).map(render)}</div>;
}

export default function PlatformServicesHubPanel() {
  const [data, setData] = useState<PlatformData>(empty);
  const [robotDescription, setRobotDescription] = useState('Generate a safe desktop automation script to open the dashboard and refresh health panels.');
  const [timelineName, setTimelineName] = useState('LedgerFlow Integration Cleanup');
  const [timelineDescription, setTimelineDescription] = useState('Finish consolidating scattered backend services into clear desktop hubs.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/jobs', undefined, 10000),
        daemonFetch<any>('/api/openapi/routes', undefined, 10000),
        daemonFetch<any>('/api/gateway/health', undefined, 10000),
        daemonFetch<any>('/api/gateway/configs', undefined, 10000),
        daemonFetch<any>('/api/timeline', undefined, 10000),
      ]);
      const [jobs, routes, gateway, configs, timeline] = results;
      setData((current) => ({
        ...current,
        jobs: jobs.status === 'fulfilled' ? arr(unwrap(jobs.value, 'jobs')) : [],
        jobStats: jobs.status === 'fulfilled' ? obj(unwrap(jobs.value, 'stats')) : {},
        openApiRoutes: routes.status === 'fulfilled' ? arr(unwrap(routes.value, 'routes')) : [],
        openApiCount: routes.status === 'fulfilled' ? Number(unwrap(routes.value, 'count') || 0) : 0,
        gatewayProviders: gateway.status === 'fulfilled' ? arr(unwrap(gateway.value, 'providers')) : [],
        gatewayStats: gateway.status === 'fulfilled' ? obj(unwrap(gateway.value, 'stats')) : {},
        gatewayConfigs: configs.status === 'fulfilled' ? arr(unwrap(configs.value, 'configs')) : [],
        timelines: timeline.status === 'fulfilled' ? arr(unwrap(timeline.value, 'timelines')) : [],
      }));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải Platform Services, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Platform Services.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Platform Services.');
    } finally { setLoading(false); }
  };

  const saveOpenApi = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/openapi/save', { method: 'POST' }, 20000);
      setMessage('Đã lưu OpenAPI spec vào docs/api.');
      await load();
    } catch (err: any) { setError(err?.message || 'Không lưu được OpenAPI spec.'); }
    finally { setLoading(false); }
  };

  const generateRobot = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/robot/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: robotDescription, target: 'desktop', safetyMode: 'review_only' }) }, 30000);
      setData((current) => ({ ...current, robotDraft: unwrap(res, 'robot') }));
      setMessage('Đã tạo robot script draft review-only.');
    } catch (err: any) { setError(err?.message || 'Không tạo được robot draft.'); }
    finally { setLoading(false); }
  };

  const generateTimeline = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/timeline/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName: timelineName, description: timelineDescription }) }, 30000);
      setMessage('Đã tạo project timeline.');
      await load();
    } catch (err: any) { setError(err?.message || 'Không tạo được timeline.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/25 p-5 shadow-2xl shadow-slate-950/25">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><ServerCog className="mr-2 inline h-4 w-4" />Platform Services</p>
          <h2 className="mt-2 text-xl font-black text-text-primary">Jobs, OpenAPI, Gateway, Timeline and Robot Drafts</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Gom các service nền tảng còn ẩn trong daemon để người dùng thấy hàng đợi job, tài liệu API, gateway AI, timeline dự án và robot script draft.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-cyan-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Jobs" value={data.jobs.length} hint="queue items" />
      <Stat label="API routes" value={data.openApiCount || data.openApiRoutes.length} hint="daemon routes" />
      <Stat label="AI providers" value={data.gatewayProviders.length} hint={`${data.gatewayConfigs.length} configs`} />
      <Stat label="Timelines" value={data.timelines.length} hint="project plans" />
      <Stat label="Job stats" value={Object.keys(data.jobStats).length} hint="queue metrics" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Background job queue" icon={<ListChecks className="h-4 w-4 text-emerald-300" />}>
        <MiniList items={data.jobs} emptyText="Chưa có background job." render={(job, index) => <div key={job.id || index} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-text-primary">{job.type || job.id || 'Job'}</p><Badge tone={job.status === 'completed' ? 'green' : job.status === 'failed' ? 'rose' : 'amber'}>{job.status || 'queued'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{job.createdAt || job.updatedAt || 'background queue'}</p></div>} />
      </Section>
      <Section title="OpenAPI route map" icon={<FileJson className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="cyan">{data.openApiCount || data.openApiRoutes.length} routes</Badge><button onClick={() => void saveOpenApi()} disabled={loading} className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[10px] font-black text-cyan-100 disabled:opacity-50">Save spec</button></div>
        <MiniList items={data.openApiRoutes} emptyText="Chưa scan được OpenAPI routes." render={(route, index) => <div key={`${route.method}-${route.path}-${index}`} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center gap-2"><Badge tone="cyan">{route.method || 'GET'}</Badge><p className="text-xs font-black text-text-primary">{route.path || route.route || 'Route'}</p></div></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="AI model gateway" icon={<Network className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="violet">{data.gatewayProviders.length} providers</Badge><Badge>{Object.keys(data.gatewayStats).length} stats</Badge></div>
        <MiniList items={data.gatewayProviders.length ? data.gatewayProviders : data.gatewayConfigs} emptyText="Chưa có provider/config." render={(provider, index) => <div key={provider.id || provider.name || index} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-text-primary">{provider.name || provider.provider || provider.id || 'Provider'}</p><Badge tone={provider.ok || provider.status === 'healthy' ? 'green' : 'amber'}>{provider.status || provider.model || 'gateway'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{provider.message || provider.baseUrl || 'AI gateway'}</p></div>} />
      </Section>
      <Section title="Project timeline" icon={<Route className="h-4 w-4 text-amber-300" />}>
        <div className="space-y-2"><input value={timelineName} onChange={(e) => setTimelineName(e.target.value)} className="w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-amber-400" /><textarea value={timelineDescription} onChange={(e) => setTimelineDescription(e.target.value)} className="min-h-20 w-full rounded-2xl border border-border-primary bg-slate-950 p-3 text-sm font-semibold text-text-primary outline-none focus:border-amber-400" /><button onClick={() => void generateTimeline()} disabled={loading} className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-xs font-black text-amber-100 disabled:opacity-50">Generate timeline</button></div>
        <div className="mt-3"><MiniList items={data.timelines} emptyText="Chưa có timeline." render={(timeline, index) => <div key={timeline.id || index} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><p className="text-xs font-black text-text-primary">{timeline.projectName || timeline.name || timeline.id || 'Timeline'}</p><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{timeline.status || timeline.createdAt || 'project timeline'}</p></div>} /></div>
      </Section>
      <Section title="Robot script generator" icon={<Bot className="h-4 w-4 text-emerald-300" />}>
        <textarea value={robotDescription} onChange={(e) => setRobotDescription(e.target.value)} className="min-h-28 w-full rounded-2xl border border-border-primary bg-slate-950 p-3 text-sm font-semibold text-text-primary outline-none focus:border-emerald-400" />
        <button onClick={() => void generateRobot()} disabled={loading || !robotDescription.trim()} className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">Generate draft</button>
        {data.robotDraft && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(data.robotDraft, null, 2)}</pre>}
      </Section>
    </section>

    {rawOpen && <Section title="Raw Platform Services payload" icon={<Database className="h-4 w-4 text-text-secondary" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
