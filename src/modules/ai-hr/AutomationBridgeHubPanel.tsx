import { useEffect, useState } from 'react';
import { Activity, Bot, Cable, Database, RefreshCw, Route, Wrench } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type BridgeData = {
  webhookRules: any[];
  webhookEvents: any[];
  webhookStats: Record<string, any>;
  tools: any[];
  swarmAgents: any[];
  swarmMissions: any[];
  telemetryLatest: any | null;
  telemetryHistory: any[];
};

const empty: BridgeData = {
  webhookRules: [],
  webhookEvents: [],
  webhookStats: {},
  tools: [],
  swarmAgents: [],
  swarmMissions: [],
  telemetryLatest: null,
  telemetryHistory: [],
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }
function obj(value: any) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: any; children: any }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => any }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 6).map(render)}</div>;
}

export default function AutomationBridgeHubPanel() {
  const [data, setData] = useState<BridgeData>(empty);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/webhooks/rules', undefined, 10000),
        daemonFetch<any>('/api/webhooks/events?limit=30', undefined, 10000),
        daemonFetch<any>('/api/tools', undefined, 10000),
        daemonFetch<any>('/api/swarm/agents', undefined, 10000),
        daemonFetch<any>('/api/swarm/missions', undefined, 10000),
        daemonFetch<any>('/api/telemetry/latest', undefined, 10000),
        daemonFetch<any>('/api/telemetry/history?limit=10', undefined, 10000),
      ]);
      const [rules, events, tools, agents, missions, latest, history] = results;
      setData({
        webhookRules: rules.status === 'fulfilled' ? arr(unwrap(rules.value, 'rules')) : [],
        webhookEvents: events.status === 'fulfilled' ? arr(unwrap(events.value, 'events')) : [],
        webhookStats: rules.status === 'fulfilled' ? obj(unwrap(rules.value, 'stats')) : {},
        tools: tools.status === 'fulfilled' ? arr(unwrap(tools.value, 'tools')) : [],
        swarmAgents: agents.status === 'fulfilled' ? arr(unwrap(agents.value, 'agents')) : [],
        swarmMissions: missions.status === 'fulfilled' ? arr(unwrap(missions.value, 'missions')) : [],
        telemetryLatest: latest.status === 'fulfilled' ? unwrap(latest.value, 'snapshot') : null,
        telemetryHistory: history.status === 'fulfilled' ? arr(unwrap(history.value, 'snapshots')) : [],
      });
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải bridge hub, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Automation Bridge Hub.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Automation Bridge Hub.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Cable className="mr-2 inline h-4 w-4" />Automation Bridge</p>
          <h2 className="mt-2 text-xl font-black text-white">Webhooks, tool router, swarm and telemetry</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Các luồng tự động bên ngoài app được gom vào đây để dễ quan sát trước khi bật action chạy thật.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Webhook rules" value={data.webhookRules.length} hint={`${data.webhookEvents.length} events`} />
      <Stat label="Tools" value={data.tools.length} hint="router definitions" />
      <Stat label="Swarm agents" value={data.swarmAgents.length} hint={`${data.swarmMissions.length} missions`} />
      <Stat label="Telemetry" value={data.telemetryLatest ? 'Live' : 'None'} hint={`${data.telemetryHistory.length} snapshots`} />
      <Stat label="Bridge stats" value={Object.keys(data.webhookStats).length} hint="webhook metrics" />
    </section>

    <section className="grid gap-4 xl:grid-cols-4">
      <Section title="Webhook rules" icon={<Route className="h-4 w-4 text-cyan-300" />}>
        <MiniList items={data.webhookRules} emptyText="Chưa có webhook rule." render={(rule, index) => <div key={rule.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{rule.name || rule.id || 'Webhook rule'}</p><Badge tone={rule.enabled === false ? 'slate' : 'green'}>{rule.enabled === false ? 'off' : 'on'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{rule.source || rule.eventFilter || 'webhook'}</p></div>} />
      </Section>
      <Section title="Tool router" icon={<Wrench className="h-4 w-4 text-amber-300" />}>
        <MiniList items={data.tools} emptyText="Chưa có tool definition." render={(tool, index) => <div key={tool.name || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{tool.name || 'Tool'}</p><p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-500">{tool.category || tool.description || 'tool router'}</p></div>} />
      </Section>
      <Section title="Agent swarm" icon={<Bot className="h-4 w-4 text-violet-300" />}>
        <MiniList items={data.swarmMissions.length ? data.swarmMissions : data.swarmAgents} emptyText="Chưa có swarm agent/mission." render={(item, index) => <div key={item.id || item.name || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{item.name || item.goal || item.id || 'Swarm'}</p><Badge tone="violet">{item.status || item.role || 'agent'}</Badge></div><p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-500">{item.description || item.updatedAt || item.createdAt || 'swarm runtime'}</p></div>} />
      </Section>
      <Section title="Telemetry" icon={<Activity className="h-4 w-4 text-emerald-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.telemetryLatest ? 'green' : 'amber'}>{data.telemetryLatest ? 'snapshot ready' : 'no snapshot'}</Badge><Badge>{data.telemetryHistory.length} history</Badge></div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.telemetryLatest || {}, null, 2)}</pre>
      </Section>
    </section>

    {rawOpen && <Section title="Raw bridge payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
