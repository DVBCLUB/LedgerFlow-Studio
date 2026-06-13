import { useEffect, useMemo, useState } from 'react';
import { AIUsageLogEntry, fetchAIUsageLogs } from '../../../utils/aiSettingsApi';

const COST_RATE_KEY = 'ledgerflow_ai_cost_rates_v1';
const MANUAL_USAGE_KEY = 'ledgerflow_ai_manual_usage_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';

type CostRate = { provider: string; inputPer1M: number; outputPer1M: number; monthlyBudgetUsd: number };
type ManualUsage = { id: string; at: string; provider: string; keyLabel: string; model: string; promptChars: number; outputChars: number; status: 'ok' | 'quota' | 'error'; note: string };
type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

type NormalizedUsage = {
  id: string;
  at: string;
  provider: string;
  keyLabel: string;
  model: string;
  promptChars: number;
  outputChars: number;
  status: 'ok' | 'quota' | 'error';
  source: 'Gateway' | 'Manual';
};

const defaultRates: CostRate[] = [
  { provider: 'gemini', inputPer1M: 0, outputPer1M: 0, monthlyBudgetUsd: 0 },
  { provider: 'groq', inputPer1M: 0, outputPer1M: 0, monthlyBudgetUsd: 0 },
  { provider: 'openrouter', inputPer1M: 0.5, outputPer1M: 1.5, monthlyBudgetUsd: 5 },
  { provider: 'anthropic', inputPer1M: 3, outputPer1M: 15, monthlyBudgetUsd: 10 },
  { provider: 'ollama', inputPer1M: 0, outputPer1M: 0, monthlyBudgetUsd: 0 },
  { provider: 'litellm-proxy', inputPer1M: 0.5, outputPer1M: 1.5, monthlyBudgetUsd: 5 }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function approxTokens(chars: number) {
  return Math.ceil(chars / 4);
}

function costFor(usage: Pick<NormalizedUsage, 'provider' | 'promptChars' | 'outputChars'>, rates: CostRate[]) {
  const rate = rates.find((item) => item.provider === usage.provider) ?? defaultRates.find((item) => item.provider === usage.provider) ?? defaultRates[0];
  const inputTokens = approxTokens(usage.promptChars);
  const outputTokens = approxTokens(usage.outputChars);
  return (inputTokens / 1_000_000) * rate.inputPer1M + (outputTokens / 1_000_000) * rate.outputPer1M;
}

function normalizeGatewayLog(log: AIUsageLogEntry): NormalizedUsage {
  return {
    id: log.id,
    at: log.timestamp,
    provider: log.provider ?? 'unknown',
    keyLabel: log.keyLabel ?? log.keyId ?? 'unknown key',
    model: log.model ?? 'unknown model',
    promptChars: log.promptChars ?? 0,
    outputChars: log.outputChars ?? 0,
    status: log.status,
    source: 'Gateway'
  };
}

function normalizeManual(log: ManualUsage): NormalizedUsage {
  return { ...log, source: 'Manual' };
}

function pushAudit(detail: string) {
  const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
  writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action: 'AI_COST_TRACKER', cardId: 'ai-cost-tracker', detail }, ...current].slice(0, 120));
}

export default function AICostTrackerTab() {
  const [gatewayLogs, setGatewayLogs] = useState<AIUsageLogEntry[]>([]);
  const [manualLogs, setManualLogs] = useState<ManualUsage[]>(() => readLocal(MANUAL_USAGE_KEY, []));
  const [rates, setRates] = useState<CostRate[]>(() => readLocal(COST_RATE_KEY, defaultRates));
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ provider: 'gemini', keyLabel: 'manual', model: 'unknown', promptChars: 4000, outputChars: 1200, status: 'ok' as 'ok' | 'quota' | 'error', note: '' });

  useEffect(() => writeLocal(MANUAL_USAGE_KEY, manualLogs), [manualLogs]);
  useEffect(() => writeLocal(COST_RATE_KEY, rates), [rates]);

  const reload = async () => {
    try {
      const logs = await fetchAIUsageLogs();
      setGatewayLogs(logs);
      setMessage(`Đã tải ${logs.length} AI Gateway usage logs.`);
      pushAudit(`Loaded ${logs.length} AI Gateway usage logs into cost tracker.`);
    } catch (err: any) {
      setMessage(`Không tải được AI Gateway logs: ${err.message || err}. Vẫn dùng manual/local logs được.`);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usages = useMemo(() => [...gatewayLogs.map(normalizeGatewayLog), ...manualLogs.map(normalizeManual)], [gatewayLogs, manualLogs]);

  const summary = useMemo(() => {
    const byProvider = usages.reduce<Record<string, { calls: number; inputTokens: number; outputTokens: number; cost: number; quota: number; errors: number }>>((acc, usage) => {
      const bucket = acc[usage.provider] ?? { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0, quota: 0, errors: 0 };
      bucket.calls += 1;
      bucket.inputTokens += approxTokens(usage.promptChars);
      bucket.outputTokens += approxTokens(usage.outputChars);
      bucket.cost += costFor(usage, rates);
      if (usage.status === 'quota') bucket.quota += 1;
      if (usage.status === 'error') bucket.errors += 1;
      acc[usage.provider] = bucket;
      return acc;
    }, {});
    const totalCost = Object.values(byProvider).reduce((sum, item) => sum + item.cost, 0);
    const totalCalls = usages.length;
    const quotaEvents = usages.filter((item) => item.status === 'quota').length;
    const errorEvents = usages.filter((item) => item.status === 'error').length;
    return { byProvider, totalCost, totalCalls, quotaEvents, errorEvents };
  }, [rates, usages]);

  const addManual = () => {
    const item: ManualUsage = { id: `manual-${Date.now()}`, at: new Date().toISOString(), ...form };
    setManualLogs((current) => [item, ...current]);
    pushAudit(`Added manual AI usage for ${item.provider}/${item.model}.`);
  };

  const exportJson = async () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), rates, gatewayLogs, manualLogs, summary }, null, 2);
    await navigator.clipboard.writeText(payload);
    setMessage('Đã copy cost tracker JSON vào clipboard.');
    pushAudit(`Exported AI cost tracker JSON with ${usages.length} usage rows.`);
  };

  const exportCsv = async () => {
    const rows = ['at,source,provider,keyLabel,model,status,inputTokens,outputTokens,estimatedCostUsd', ...usages.map((usage) => [usage.at, usage.source, usage.provider, usage.keyLabel, usage.model, usage.status, approxTokens(usage.promptChars), approxTokens(usage.outputChars), costFor(usage, rates).toFixed(6)].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))];
    await navigator.clipboard.writeText(rows.join('\n'));
    setMessage('Đã copy CSV vào clipboard.');
    pushAudit(`Exported AI cost tracker CSV with ${usages.length} rows.`);
  };

  const updateRate = (provider: string, patch: Partial<CostRate>) => {
    setRates((current) => current.map((rate) => rate.provider === provider ? { ...rate, ...patch } : rate));
  };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">AI Gateway cost control · local-first</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Cost / Token Tracker</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Theo dõi usage, quota và chi phí ước tính. Rate mặc định chỉ là placeholder, hãy sửa theo gói/provider bạn đang dùng.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={reload} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-xs font-black text-cyan-100">Reload Gateway Logs</button>
          <button onClick={exportCsv} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200">Copy CSV</button>
          <button onClick={exportJson} className="rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Copy JSON</button>
        </div>
      </div>

      {message && <p className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-300">{message}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Metric label="Calls" value={summary.totalCalls.toString()} />
        <Metric label="Estimated cost" value={`$${summary.totalCost.toFixed(4)}`} />
        <Metric label="Quota events" value={summary.quotaEvents.toString()} />
        <Metric label="Error events" value={summary.errorEvents.toString()} />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Provider rates & budgets</p>
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-2">Provider</th><th className="p-2">Input $/1M tokens</th><th className="p-2">Output $/1M tokens</th><th className="p-2">Budget $/month</th><th className="p-2">Used</th></tr></thead>
              <tbody>
                {rates.map((rate) => {
                  const used = summary.byProvider[rate.provider]?.cost ?? 0;
                  const pct = rate.monthlyBudgetUsd ? Math.min(999, (used / rate.monthlyBudgetUsd) * 100) : 0;
                  return <tr key={rate.provider} className="border-t border-slate-800"><td className="p-2 font-black text-white">{rate.provider}</td><td className="p-2"><input type="number" step="0.01" value={rate.inputPer1M} onChange={(event) => updateRate(rate.provider, { inputPer1M: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-800 bg-slate-950 p-2 text-white" /></td><td className="p-2"><input type="number" step="0.01" value={rate.outputPer1M} onChange={(event) => updateRate(rate.provider, { outputPer1M: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-800 bg-slate-950 p-2 text-white" /></td><td className="p-2"><input type="number" step="1" value={rate.monthlyBudgetUsd} onChange={(event) => updateRate(rate.provider, { monthlyBudgetUsd: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-800 bg-slate-950 p-2 text-white" /></td><td className="p-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${pct >= 80 ? 'border-rose-400/30 text-rose-200' : pct >= 50 ? 'border-amber-400/30 text-amber-200' : 'border-emerald-400/30 text-emerald-200'}`}>${used.toFixed(4)} · {pct.toFixed(0)}%</span></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Manual usage entry</p>
          <div className="mt-3 grid gap-2">
            <input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} placeholder="provider" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input value={form.keyLabel} onChange={(event) => setForm({ ...form, keyLabel: event.target.value })} placeholder="key label" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="model" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <div className="grid grid-cols-2 gap-2"><input type="number" value={form.promptChars} onChange={(event) => setForm({ ...form, promptChars: Number(event.target.value) })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><input type="number" value={form.outputChars} onChange={(event) => setForm({ ...form, outputChars: Number(event.target.value) })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></div>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'ok' | 'quota' | 'error' })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>ok</option><option>quota</option><option>error</option></select>
            <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="note" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <button onClick={addManual} className="rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Add manual usage</button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {Object.entries(summary.byProvider).map(([provider, item]) => <article key={provider} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-white">{provider}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{item.calls} calls · {item.inputTokens.toLocaleString()} in · {item.outputTokens.toLocaleString()} out tokens</p></div><span className="rounded-full border border-amber-400/25 px-2 py-0.5 text-[10px] font-black text-amber-200">${item.cost.toFixed(4)}</span></div><p className="mt-3 text-xs font-semibold text-slate-400">Quota: {item.quota} · Errors: {item.errors}</p></article>)}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}
