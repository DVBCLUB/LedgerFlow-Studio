import { useState } from 'react';

export default function ClaudeCodeBridgeTab() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('task');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/claude/code-bridge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, mode }),
      });
      const j = await res.json();
      if (j?.success) setResult(j.prompt || j?.wrapped || '');
      else setResult(`Error: ${j?.error || 'unknown'}`);
    } catch (e: any) {
      setResult(String(e?.message || e));
    } finally { setLoading(false); }
  };

  const copy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); } catch { /* ignore */ }
  };

  return (
    <section className="rounded-3xl border border-indigo-400/30 bg-indigo-400/6 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Claude Code Bridge</p>
      <h3 className="mt-1 text-xl font-black text-white">Prepare task for Claude Code</h3>
      <p className="mt-1 text-sm text-slate-400">Compose a brief and generate a Claude-ready prompt with small patch guidance.</p>

      <div className="mt-4 grid gap-2">
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg bg-slate-900 p-2 text-sm text-white w-56">
          <option value="task">Task</option>
          <option value="refactor">Refactor</option>
          <option value="patch">Patch</option>
        </select>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} className="rounded-2xl bg-slate-900 p-3 text-sm text-white" placeholder="Describe the change or task for Claude Code" />
        <div className="flex gap-2">
          <button onClick={generate} disabled={loading} className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-black">{loading ? 'Generating...' : 'Generate Prompt'}</button>
          <button onClick={copy} disabled={!result} className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black">Copy</button>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-200">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </section>
  );
}
