import React, { useCallback, useEffect, useState } from 'react';
import { Bot, RefreshCw, Target, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import {
  getCeoAutopilotState,
  triggerCeoAutopilotCycle,
  listStrategicOKRs,
  decomposeStrategicOKR,
  type CEODecisionCycleState,
  type StrategicOKR,
} from '../../utils/aiOpsApi';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-rose-500/15 text-rose-300',
  high: 'bg-amber-500/15 text-amber-300',
  medium: 'bg-cyan-500/15 text-cyan-300',
  low: 'bg-slate-500/15 text-slate-300',
};

export default function AiCeoAutopilotPanel() {
  const [state, setState] = useState<CEODecisionCycleState | null>(null);
  const [okrs, setOkrs] = useState<StrategicOKR[]>([]);
  const [busy, setBusy] = useState(false);
  const [decomposingId, setDecomposingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    try {
      setState(await getCeoAutopilotState());
      setOkrs(await listStrategicOKRs());
    } catch {
      /* offline fallback */
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const runCycle = async () => {
    setBusy(true);
    setMsg('');
    try {
      await triggerCeoAutopilotCycle('ui_manual');
      setMsg('✅ Đã chạy chu kỳ autopilot.');
      await refresh();
    } catch (e: any) {
      setMsg('❌ ' + String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const decompose = async (okrId: string) => {
    setDecomposingId(okrId);
    setMsg('');
    try {
      await decomposeStrategicOKR(okrId);
      setMsg('✅ Đã phân rã OKR thành sprint.');
      setOkrs(await listStrategicOKRs());
    } catch (e: any) {
      setMsg('❌ ' + String(e?.message ?? e));
    } finally {
      setDecomposingId(null);
    }
  };

  return (
    <div className="space-y-4 text-left text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2"><Bot className="w-4 h-4 text-cyan-400" /> AI CEO Autopilot</h3>
        <div className="flex gap-2">
          <button onClick={() => void refresh()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
          <button onClick={() => void runCycle()} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black cursor-pointer disabled:opacity-50">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Chạy chu kỳ
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-cyan-300">{msg}</p>}

      {state && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-300">Cycle: {state.cycleId}</span>
            <span className="px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300">Phase: {state.currentPhase}</span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300">{state.status}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Quyết định hôm nay', value: state.metrics.decisionsMadeToday },
              { label: 'Blocker', value: state.metrics.activeBlockersDetected },
              { label: 'Đã gỡ blocker', value: state.metrics.resolvedBlockers },
              { label: 'Task ủy quyền', value: state.metrics.delegatedTasksCount },
              { label: 'Confidence', value: (state.metrics.autopilotConfidenceScore * 100).toFixed(0) + '%' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{m.label}</p>
                <p className="text-sm font-black mt-1 text-cyan-300">{m.value}</p>
              </div>
            ))}
          </div>

          {state.activePriorities.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Ưu tiên đang chạy</p>
              <div className="space-y-1.5">
                {state.activePriorities.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{p.title} <span className="text-slate-600">· {p.ownerAgent}</span></span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${URGENCY_COLOR[p.urgency] ?? 'bg-slate-500/15 text-slate-300'}`}>{p.urgency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.executiveInsights.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Insight điều hành</p>
              <ul className="space-y-1">
                {state.executiveInsights.map((ins, i) => (
                  <li key={i} className="text-xs text-slate-400">• {ins}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {okrs.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">OKR chiến lược</p>
          <div className="space-y-2">
            {okrs.slice(0, 8).map((o) => (
              <div key={o.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{o.objective}</span>
                  <button onClick={() => decompose(o.id)} disabled={decomposingId === o.id} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-[10px] font-bold cursor-pointer disabled:opacity-50">
                    {decomposingId === o.id ? 'Đang phân rã...' : 'Phân rã'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {o.keyResults.map((kr) => (
                    <span key={kr.krId} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                      {kr.description}: {kr.currentValue}/{kr.targetValue}{kr.unit}
                    </span>
                  ))}
                </div>
                {o.decomposedSprints && o.decomposedSprints.length > 0 && (
                  <div className="mt-1.5 text-[10px] text-slate-500">{o.decomposedSprints.length} sprint đã phân rã</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
