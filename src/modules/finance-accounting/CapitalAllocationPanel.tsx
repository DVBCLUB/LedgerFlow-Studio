import { useState } from 'react';
import { Coins, Landmark, TrendingUp, Play, RefreshCw } from 'lucide-react';
import { runTreasuryCycle, TreasurySnapshot } from '../../utils/treasuryApi';

function fmtVnd(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ ₫`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr ₫`;
  return `${Math.round(n).toLocaleString('vi-VN')} ₫`;
}

export default function CapitalAllocationPanel() {
  const [snapshot, setSnapshot] = useState<TreasurySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await runTreasuryCycle({
        workingCapital: { dioDays: 45, dsoDays: 30, dpoDays: 25, inventoryVnd: 2_000_000_000, receivablesVnd: 3_000_000_000, payablesVnd: 1_500_000_000, dailyBurnVnd: 50_000_000 },
        idleCashVnd: 28_400_000_000,
        minOperatingCashVnd: 3_000_000_000,
        monteCarlo: { paths: 2000, years: 10 },
      });
      setSnapshot(res.snapshot);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Landmark className="w-4 h-4 text-emerald-400" /> Autonomous Capital Allocation
        </div>
        <button onClick={run} disabled={busy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
          {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} {busy ? 'Đang chạy chu trình…' : 'Chạy chu trình Treasury'}
        </button>
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</div>}

      {!snapshot && !busy && (
        <div className="text-xs text-slate-500">Chạy chu trình để tính Monte Carlo DSGE → Working Capital → Overnight Sweep.</div>
      )}

      {snapshot && (
        <>
          {/* Stress test */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <TrendingUp className="w-4 h-4 text-sky-400" /> Monte Carlo DSGE 10 năm
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">CVaR 99% (buffer)</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{fmtVnd(snapshot.stress.cvar99)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">VaR 99%</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{fmtVnd(snapshot.stress.var99)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Survival (12 tháng)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{(snapshot.stress.survivalProbability * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Runway (median)</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{snapshot.stress.runwayMonthsMedian} tháng</div>
              </div>
            </div>
          </section>

          {/* Working capital */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <Coins className="w-4 h-4 text-amber-400" /> Working Capital (CCC)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">CCC trước</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{snapshot.workingCapital.cccDays} ngày</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">CCC tối ưu</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{snapshot.workingCapital.optimizedCccDays} ngày</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Tiền giải phóng</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{fmtVnd(snapshot.workingCapital.freedCashVnd)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">DIO/DSO/DPO</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{snapshot.workingCapital.recommended.dioDays}/{snapshot.workingCapital.recommended.dsoDays}/{snapshot.workingCapital.recommended.dpoDays}</div>
              </div>
            </div>
          </section>

          {/* Sweep */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <Landmark className="w-4 h-4 text-violet-400" /> Overnight Yield Sweep
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Số tiền quét</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{fmtVnd(snapshot.sweep.sweepAmountVnd)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Buffer giữ lại</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{fmtVnd(snapshot.sweep.bufferHeldVnd)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Lợi suất / ngày</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{fmtVnd(snapshot.sweep.dailyYieldVnd)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase text-slate-500">Instrument</div>
                <div className="text-sm font-bold text-slate-100 mt-1 truncate">{snapshot.sweep.instrument?.name ?? '—'}</div>
              </div>
            </div>
          </section>

          <div className="text-xs text-slate-500">Dòng tiền 10 năm dự kiến: <span className="text-slate-300 font-semibold">{fmtVnd(snapshot.projected10yVnd)}</span></div>
        </>
      )}
    </div>
  );
}
