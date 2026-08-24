import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Dna, RefreshCw, Play, Zap } from 'lucide-react';
import {
  getMeshMetrics,
  flushMeshLog,
  runBftConsensus,
  evolvePrompts,
  getGeneticData,
  MeshStatus,
  BftDecision,
  GeneticEvolveResult,
} from '../../utils/agentKernelApi';

const ROLES = ['finance', 'sales', 'marketing', 'coding', 'media', 'support', 'general'];

export default function AgentKernelPanel() {
  const [mesh, setMesh] = useState<MeshStatus | null>(null);
  const [bft, setBft] = useState<BftDecision | null>(null);
  const [bftBusy, setBftBusy] = useState(false);
  const [role, setRole] = useState('finance');
  const [genetic, setGenetic] = useState<GeneticEvolveResult | null>(null);
  const [geneticBusy, setGeneticBusy] = useState(false);
  const [totalEvolved, setTotalEvolved] = useState(0);
  const [error, setError] = useState('');

  const refreshMesh = async () => {
    try {
      setMesh(await getMeshMetrics());
      const data = await getGeneticData();
      setTotalEvolved(data.summary.totalGenerationsEvolved);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refreshMesh();
  }, []);

  const runBft = async () => {
    setBftBusy(true);
    try {
      const res = await runBftConsensus({ topic: 'Kiểm tra quorum tài chính tự trị', roles: ['finance', 'security', 'architecture', 'planner'] });
      setBft(res.decision);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBftBusy(false);
    }
  };

  const runEvolve = async () => {
    setGeneticBusy(true);
    try {
      const res = await evolvePrompts(role, 15);
      setGenetic(res);
      setTotalEvolved((n) => n + res.result.generationsRun);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneticBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</div>}

      {/* Mesh metrics */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Activity className="w-4 h-4 text-emerald-400" /> Agentic Mesh (control-plane)
          </div>
          <div className="flex gap-2">
            <button onClick={refreshMesh} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200">
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
            <button onClick={() => flushMeshLog()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200">
              <Zap className="w-3 h-3" /> Flush log
            </button>
          </div>
        </div>
        {mesh ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'p50', value: `${mesh.metrics.p50Ms.toFixed(2)} ms` },
              { label: 'p95', value: `${mesh.metrics.p95Ms.toFixed(2)} ms` },
              { label: 'p99', value: `${mesh.metrics.p99Ms.toFixed(2)} ms` },
              { label: 'Published', value: String(mesh.metrics.published) },
              { label: 'Subscribers', value: String(mesh.subscribers) },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{m.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">Đang tải metrics…</div>
        )}
      </section>

      {/* BFT consensus */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> PBFT-lite Consensus (n=4, f=1)
          </div>
          <button onClick={runBft} disabled={bftBusy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50">
            <Play className="w-3 h-3" /> {bftBusy ? 'Đang chạy…' : 'Chạy quorum'}
          </button>
        </div>
        {bft ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">Decision</div>
              <div className="text-sm font-bold text-slate-100 mt-1 capitalize">{bft.value}</div>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">Quorum</div>
              <div className="text-sm font-bold text-slate-100 mt-1">{bft.approveCount}/{bft.replicaCount} approve · quorum {bft.quorum}</div>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">Faults tolerated</div>
              <div className="text-sm font-bold text-slate-100 mt-1">f = {bft.faultsTolerated}</div>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">Commit latency</div>
              <div className="text-sm font-bold text-slate-100 mt-1">{bft.commitLatencyMs.toFixed(2)} ms</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Chạy một vòng quorum để xem kết quả PBFT-lite.</div>
        )}
      </section>

      {/* Genetic evolution */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Dna className="w-4 h-4 text-violet-400" /> Genetic Prompt Evolution (tổng {totalEvolved} thế hệ)
          </div>
          <div className="flex gap-2">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={runEvolve} disabled={geneticBusy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50">
              <Play className="w-3 h-3" /> {geneticBusy ? 'Đang tiến hóa…' : 'Tiến hóa prompt'}
            </button>
          </div>
        </div>
        {genetic ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Champion fitness</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{(genetic.result.champion.fitness * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Generation</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{genetic.result.champion.generation}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Improvement</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">+{genetic.result.improvementPercent.toFixed(1)}%</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Quality / Safety</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{(genetic.result.champion.metrics.quality * 100).toFixed(0)}% / {(genetic.result.champion.metrics.safety * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500 mb-2">Champion prompt</div>
              <p className="text-xs text-slate-300 leading-relaxed">{genetic.result.champion.tokens.join(' ')}</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Chọn vai trò và chạy giải thuật di truyền để sinh prompt tối ưu.</div>
        )}
      </section>
    </div>
  );
}
