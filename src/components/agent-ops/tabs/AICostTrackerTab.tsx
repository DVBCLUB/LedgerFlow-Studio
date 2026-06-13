import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, writeLocalStorageValue } from '../storage';

const MANUAL_USAGE_KEY = 'ledgerflow_ai_manual_usage_v1';

type UsageRow = {
  id: string;
  at: string;
  provider: string;
  model: string;
  promptChars: number;
  outputChars: number;
  status: 'ok' | 'quota' | 'error';
};

function tokens(chars: number) {
  return Math.ceil(Math.max(0, chars) / 4);
}

export default function AICostTrackerTab() {
  const [rows, setRows] = useState<UsageRow[]>(() => readLocalStorageValue(MANUAL_USAGE_KEY, []));
  const [form, setForm] = useState({ provider: 'gemini', model: 'manual', promptChars: 4000, outputChars: 1200, status: 'ok' as UsageRow['status'] });
  const [message, setMessage] = useState('');

  const summary = useMemo(() => {
    const inputTokens = rows.reduce((sum, row) => sum + tokens(row.promptChars), 0);
    const outputTokens = rows.reduce((sum, row) => sum + tokens(row.outputChars), 0);
    const quota = rows.filter((row) => row.status === 'quota').length;
    const errors = rows.filter((row) => row.status === 'error').length;
    return { inputTokens, outputTokens, quota, errors };
  }, [rows]);

  const addRow = () => {
    const row: UsageRow = { id: `usage-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), ...form };
    const next = [row, ...rows];
    setRows(next);
    writeLocalStorageValue(MANUAL_USAGE_KEY, next);
    appendAgentOpsAudit('AI_COST_TRACKER', 'ai-cost', `Added manual usage ${row.provider}/${row.model}.`);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ rows, summary }, null, 2));
    setMessage('Đã copy AI cost JSON.');
    appendAgentOpsAudit('AI_COST_TRACKER', 'ai-cost', `Exported ${rows.length} AI usage rows.`);
  };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">local-first cost control</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Cost / Token Tracker</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Bản ổn định CI: nhập usage thủ công, ước tính token và export JSON. Kết nối sâu AI Gateway sẽ build lại sau khi CI xanh.</p>
        </div>
        <button onClick={copyJson} className="rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Copy JSON</button>
      </div>

      {message && <p className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-300">{message}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Metric label="Rows" value={rows.length} />
        <Metric label="Input tokens" value={summary.inputTokens.toLocaleString()} />
        <Metric label="Output tokens" value={summary.outputTokens.toLocaleString()} />
        <Metric label="Quota / Errors" value={`${summary.quota} / ${summary.errors}`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Manual usage</p>
          <div className="mt-3 grid gap-2">
            <input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input type="number" value={form.promptChars} onChange={(event) => setForm({ ...form, promptChars: Number(event.target.value) || 0 })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input type="number" value={form.outputChars} onChange={(event) => setForm({ ...form, outputChars: Number(event.target.value) || 0 })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UsageRow['status'] })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>ok</option><option>quota</option><option>error</option></select>
            <button onClick={addRow} className="rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Add usage</button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => <article key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{row.provider} · {row.model}</p><p className="mt-1 text-xs font-semibold text-slate-400">{row.at} · {row.status}</p><p className="mt-2 text-xs font-semibold text-amber-100">{tokens(row.promptChars).toLocaleString()} in / {tokens(row.outputChars).toLocaleString()} out tokens</p></article>)}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}
