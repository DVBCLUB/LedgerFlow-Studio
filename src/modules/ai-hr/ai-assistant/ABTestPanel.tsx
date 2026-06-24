import React, { useState, useEffect, useCallback } from 'react';
import { FlaskConical, PlayCircle, Loader2, Trophy, Zap, Clock, BarChart3, RefreshCw, Eye, EyeOff } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface ABRun {
  id: string; name: string; prompt: string; domain: string; blindMode: boolean;
  status: string; responses: Array<{ modelId: string; modelLabel: string; content: string; latencyMs: number; route: string }>;
  scores: Array<{ modelId: string; totalScore: number; criteriaScores: Record<string, number>; rank: number; summary: string }>;
  winner: { modelId: string; totalScore: number } | null;
  totalCostUsd: number; evaluatorNotes: string[];
}

const rankColors = ['text-amber-300', 'text-slate-300', 'text-amber-700/60', 'text-slate-500', 'text-slate-600'];

export default function ABTestPanel() {
  const [prompt, setPrompt] = useState('');
  const [domain, setDomain] = useState('coding');
  const [blindMode, setBlindMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<ABRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${DAEMON}/api/ab-test/runs`).then(r => r.json()).catch(() => null);
      if (r?.ok) setRuns(r.runs || []);
    } catch { }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${DAEMON}/api/ab-test/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, domain, blindMode, name: `Test ${new Date().toLocaleTimeString()}` }),
      });
      const data = await res.json();
      if (data.ok) refresh();
      else setError(data.error);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4 text-amber-400" /> AI Model A/B Evaluator
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Blind test: so sánh response từ các model, AI tự chấm điểm</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:border-amber-500">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2 text-[10px] font-bold text-rose-200">{error}</div>}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
        <div className="flex gap-2">
          <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Prompt để test (VD: Viết hàm kiểm tra số nguyên tố tối ưu)" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-amber-500/60" onKeyDown={e => e.key === 'Enter' && handleRun()} />
          <button onClick={handleRun} disabled={loading || !prompt.trim()} className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />} Run A/B
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select value={domain} onChange={e => setDomain(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-200 outline-none">
            <option value="coding">Coding</option><option value="general">General</option><option value="finance">Finance</option>
          </select>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer">
            <input type="checkbox" checked={blindMode} onChange={e => setBlindMode(e.target.checked)} className="accent-amber-500" />
            {blindMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Blind test
          </label>
        </div>
      </div>

      {runs.length === 0 && !loading && <div className="text-center py-8 text-xs text-slate-500">Chưa có AB test nào. Nhập prompt và chạy.</div>}

      {runs.map(run => {
        const isExpanded = expandedId === run.id;
        return (
          <div key={run.id} className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button onClick={() => setExpandedId(isExpanded ? null : run.id)} className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40">
              <div className="flex items-center gap-2.5 min-w-0">
                {run.winner ? <Trophy className="h-4 w-4 text-amber-400 shrink-0" /> : <FlaskConical className="h-4 w-4 text-slate-500 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-xs text-slate-200 truncate max-w-[350px]">{run.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-500">{run.domain}</span>
                    <span className="text-[9px] text-slate-600">· {run.responses.length} models</span>
                    {run.winner && <span className="text-[9px] text-amber-400">· Winner: {run.winner.modelId} ({run.winner.totalScore}/10)</span>}
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-slate-600">${run.totalCostUsd.toFixed(4)}</span>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-800 p-3 space-y-3 bg-slate-950/40">
                <div className="text-[10px] text-slate-400 font-bold">Prompt: {run.prompt.slice(0, 200)}</div>

                {/* Scoreboard */}
                <div className="flex gap-2">
                  {run.scores.map((score, i) => (
                    <div key={score.modelId} className={`flex-1 rounded-lg border p-2.5 ${i === 0 ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800 bg-slate-900/30'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-300">{score.modelId}</span>
                        <span className={`text-lg font-black ${rankColors[i] || 'text-slate-400'}`}>{score.totalScore}</span>
                      </div>
                      {Object.entries(score.criteriaScores).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[8px]"><span className="text-slate-500">{k}</span><span className="text-slate-400">{v}/10</span></div>
                      ))}
                      <div className="text-[8px] text-slate-500 mt-1 italic">{score.summary}</div>
                    </div>
                  ))}
                </div>

                {/* Responses */}
                {run.responses.map((resp, i) => (
                  <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{run.blindMode ? `Response ${i + 1}` : resp.modelLabel}</span>
                      <span className="text-[9px] text-slate-600">{resp.latencyMs}ms · {resp.route}</span>
                    </div>
                    <pre className="text-[10px] text-slate-300 whitespace-pre-wrap max-h-32 overflow-auto p-1.5 bg-slate-950 rounded">{resp.content.slice(0, 400)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
