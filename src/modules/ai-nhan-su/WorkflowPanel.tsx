import { useCallback, useEffect, useState } from 'react';
import { Check, Play, RefreshCw, Workflow, X } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  description: string;
  stages: Array<{ stageId: string; employeeId: string; requiresApproval?: boolean }>;
};

type Run = {
  id: string;
  templateId: string;
  input: string;
  status: string;
  currentIndex: number;
  results: Array<{ stageId: string; ok: boolean; output: string }>;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  return (await res.json().catch(() => ({}))) as T;
}

export default function WorkflowPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState('feature_dev');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api<{ templates: Template[]; runs: Run[] }>('/api/agent/workflows');
      setTemplates(d.templates || []);
      setRuns(d.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async () => {
    if (!input.trim()) return;
    setBusy(true);
    try {
      await api(`/api/agent/workflows/${selected}/run`, { method: 'POST', body: JSON.stringify({ input }) });
      setInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, approve: boolean) => {
    await api(`/api/agent/workflows/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
    await load();
  };

  const pending = runs.filter((r) => r.status === 'waiting_approval');

  return (
    <section className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-left">
      <div className="mb-3 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">Quy trình vận hành tự động</h2>
        <button onClick={load} className="ml-auto inline-flex items-center gap-1 rounded-xl border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Template picker + input */}
      <div className="mb-3 rounded-xl border border-border-primary bg-slate-900/60 p-3">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-bold text-text-primary">
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
          ))}
        </select>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mô tả yêu cầu (founder chỉ duyệt)…" rows={2} className="mt-2 w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary" />
        <button onClick={run} disabled={busy || !input.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-black text-slate-950 disabled:opacity-50">
          <Play className="h-3.5 w-3.5" /> Chạy tự động
        </button>
      </div>

      {error && <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">{error}</div>}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs font-black uppercase text-amber-300">⏳ Chờ bạn duyệt ({pending.length})</p>
          {pending.map((r) => (
            <div key={r.id} className="mt-2 rounded-lg border border-border-primary bg-slate-900/60 p-2 text-xs">
              <p className="font-bold text-text-primary">#{r.id} · {r.templateId} · {r.input.slice(0, 80)}</p>
              <p className="mt-1 text-text-secondary">Đã xong {r.currentIndex}/{r.results.length + 1} bước — cần duyệt để tiếp tục.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => decide(r.id, true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-black text-emerald-200 hover:bg-emerald-500/30">
                  <Check className="h-3 w-3" /> Duyệt
                </button>
                <button onClick={() => decide(r.id, false)} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-black text-rose-200 hover:bg-rose-500/30">
                  <X className="h-3 w-3" /> Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Runs */}
      {runs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase text-text-tertiary">Lịch sử chạy</p>
          {runs.slice(0, 8).map((r) => (
            <div key={r.id} className="rounded-lg border border-border-primary bg-slate-900/50 px-3 py-1.5 text-[11px]">
              <span className={`font-black ${r.status === 'completed' ? 'text-emerald-300' : r.status === 'waiting_approval' ? 'text-amber-300' : r.status === 'rejected' ? 'text-rose-300' : 'text-cyan-300'}`}>{r.status}</span>
              <span className="ml-1 text-text-primary">#{r.id} · {r.templateId}</span>
              <span className="ml-1 text-text-tertiary">· {r.input.slice(0, 50)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
