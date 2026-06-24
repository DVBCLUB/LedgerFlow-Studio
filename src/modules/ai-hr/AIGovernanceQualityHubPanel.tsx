import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, Database, FileCheck2, GitBranch, GraduationCap, RefreshCw, Route, ShieldCheck } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type GovernanceData = {
  validationRules: any[];
  explainTraces: any[];
  explainStats: Record<string, any>;
  finetunePairs: any[];
  finetuneStats: Record<string, any>;
  finetuneDatasets: any[];
  telemetryLatest: any | null;
  telemetryMetrics: any[];
  intentResult: any | null;
  validationResult: any | null;
};

const empty: GovernanceData = {
  validationRules: [],
  explainTraces: [],
  explainStats: {},
  finetunePairs: [],
  finetuneStats: {},
  finetuneDatasets: [],
  telemetryLatest: null,
  telemetryMetrics: [],
  intentResult: null,
  validationResult: null,
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

export default function AIGovernanceQualityHubPanel() {
  const [data, setData] = useState<GovernanceData>(empty);
  const [intentQuery, setIntentQuery] = useState('Summarize the latest failed build and propose a safe fix.');
  const [validationInput, setValidationInput] = useState('Founder requested a safe AI operation.');
  const [validationOutput, setValidationOutput] = useState('I will inspect status first, then ask for approval before destructive actions.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/validate/rules', undefined, 10000),
        daemonFetch<any>('/api/explain/traces', undefined, 10000),
        daemonFetch<any>('/api/finetune/pairs', undefined, 10000),
        daemonFetch<any>('/api/finetune/datasets', undefined, 10000),
        daemonFetch<any>('/api/telemetry/latest', undefined, 10000),
        daemonFetch<any>('/api/telemetry/metrics', undefined, 10000),
      ]);
      const [rules, traces, pairs, datasets, latest, metrics] = results;
      setData((current) => ({
        ...current,
        validationRules: rules.status === 'fulfilled' ? arr(unwrap(rules.value, 'rules')) : [],
        explainTraces: traces.status === 'fulfilled' ? arr(unwrap(traces.value, 'traces')) : [],
        explainStats: traces.status === 'fulfilled' ? obj(unwrap(traces.value, 'stats')) : {},
        finetunePairs: pairs.status === 'fulfilled' ? arr(unwrap(pairs.value, 'pairs')) : [],
        finetuneStats: pairs.status === 'fulfilled' ? obj(unwrap(pairs.value, 'stats')) : {},
        finetuneDatasets: datasets.status === 'fulfilled' ? arr(unwrap(datasets.value, 'datasets')) : [],
        telemetryLatest: latest.status === 'fulfilled' ? unwrap(latest.value, 'snapshot') : null,
        telemetryMetrics: metrics.status === 'fulfilled' ? arr(unwrap(metrics.value, 'metrics')) : [],
      }));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải AI Governance, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải AI Governance & Quality.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được AI Governance & Quality.');
    } finally { setLoading(false); }
  };

  const classifyIntent = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/intent/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: intentQuery, useAI: false }) }, 10000);
      setData((current) => ({ ...current, intentResult: res }));
      setMessage('Đã classify intent.');
    } catch (err: any) { setError(err?.message || 'Không classify được intent.'); }
    finally { setLoading(false); }
  };

  const validateOutput = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: validationInput, output: validationOutput, strictMode: true }) }, 10000);
      setData((current) => ({ ...current, validationResult: res }));
      setMessage('Đã validate AI output.');
    } catch (err: any) { setError(err?.message || 'Không validate được output.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/25 p-5 shadow-2xl shadow-slate-950/25">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200"><ShieldCheck className="mr-2 inline h-4 w-4" />AI Governance & Quality</p>
          <h2 className="mt-2 text-xl font-black text-white">Intent, validation, explainability, fine-tuning and telemetry</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Gom các lớp kiểm soát chất lượng AI để thấy AI đang hiểu gì, có vi phạm rule không, trace quyết định ra sao và dữ liệu fine-tune đang tích lũy thế nào.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Rules" value={data.validationRules.length} hint="validator" />
      <Stat label="Traces" value={data.explainTraces.length} hint="explainability" />
      <Stat label="Fine-tune pairs" value={data.finetunePairs.length} hint={`${data.finetuneDatasets.length} datasets`} />
      <Stat label="Telemetry" value={data.telemetryLatest ? 'Live' : 'None'} hint={`${data.telemetryMetrics.length} metrics`} />
      <Stat label="Quality stats" value={Object.keys(data.explainStats).length + Object.keys(data.finetuneStats).length} hint="stat groups" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Intent classifier" icon={<Route className="h-4 w-4 text-cyan-300" />}>
        <textarea value={intentQuery} onChange={(e) => setIntentQuery(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-cyan-400" />
        <button onClick={() => void classifyIntent()} disabled={loading || !intentQuery.trim()} className="mt-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black text-cyan-100 disabled:opacity-50">Classify</button>
        {data.intentResult && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.intentResult, null, 2)}</pre>}
      </Section>
      <Section title="Output validator" icon={<FileCheck2 className="h-4 w-4 text-emerald-300" />}>
        <input value={validationInput} onChange={(e) => setValidationInput(e.target.value)} className="mb-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-emerald-400" />
        <textarea value={validationOutput} onChange={(e) => setValidationOutput(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-emerald-400" />
        <button onClick={() => void validateOutput()} disabled={loading || !validationOutput.trim()} className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">Validate strict</button>
        {data.validationResult && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.validationResult, null, 2)}</pre>}
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-4">
      <Section title="Validation rules" icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}>
        <MiniList items={data.validationRules} emptyText="Chưa có validation rule." render={(rule, index) => <div key={rule.id || rule.name || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{rule.name || rule.id || 'Rule'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{rule.severity || rule.description || 'validation rule'}</p></div>} />
      </Section>
      <Section title="Decision traces" icon={<GitBranch className="h-4 w-4 text-violet-300" />}>
        <MiniList items={data.explainTraces} emptyText="Chưa có decision trace." render={(trace, index) => <div key={trace.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{trace.task || trace.id || 'Trace'}</p><Badge tone={trace.completedAt ? 'green' : 'amber'}>{trace.completedAt ? 'done' : 'open'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{trace.startedAt || trace.sessionId || 'trace'}</p></div>} />
      </Section>
      <Section title="Fine-tune data" icon={<GraduationCap className="h-4 w-4 text-amber-300" />}>
        <MiniList items={data.finetunePairs.length ? data.finetunePairs : data.finetuneDatasets} emptyText="Chưa có pair/dataset." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.name || item.domain || item.id || 'Fine-tune item'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.quality || item.format || item.createdAt || 'training data'}</p></div>} />
      </Section>
      <Section title="Telemetry metrics" icon={<BrainCircuit className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.telemetryLatest ? 'green' : 'amber'}>{data.telemetryLatest ? 'snapshot' : 'none'}</Badge><Badge>{data.telemetryMetrics.length} metrics</Badge></div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.telemetryLatest || data.telemetryMetrics.slice(0, 3), null, 2)}</pre>
      </Section>
    </section>

    {rawOpen && <Section title="Raw AI Governance payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
