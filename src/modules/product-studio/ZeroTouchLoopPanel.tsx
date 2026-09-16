import { useEffect, useState } from 'react';
import { Rocket, Play, CheckCircle, AlertTriangle, RefreshCw, Layers, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { startLoop, advanceLoop, listLoops, LoopRun, LoopStage } from '../../utils/treasuryApi';

const STAGES: LoopStage[] = ['signal', 'build', 'market', 'sell', 'invoice', 'reconcile', 'tax', 'done'];

const STAGE_LABELS: Record<LoopStage, string> = {
  signal: 'Phát hiện nhu cầu',
  build: 'Sinh sản phẩm',
  market: 'Video 9:16 Marketing',
  sell: 'Chốt sale đa kênh',
  invoice: 'Xuất hóa đơn & thu tiền',
  reconcile: 'Đối soát VietQR',
  tax: 'Quyết toán thuế',
  done: 'Hoàn tất',
};

function fmtVnd(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ ₫`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr ₫`;
  return `${Math.round(n).toLocaleString('vi-VN')} ₫`;
}

export default function ZeroTouchLoopPanel() {
  const [runs, setRuns] = useState<LoopRun[]>([]);
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const res = await listLoops();
      setRuns(res.runs);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const start = async () => {
    if (!productId.trim()) return;
    setBusy(true);
    try {
      await startLoop(productId.trim());
      setProductId('');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const advance = async (id: string, approve: boolean) => {
    setBusy(true);
    try {
      await advanceLoop(id, approve);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {error && (
        <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Rocket className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Vòng Lặp Tự Vận Hành 0-Chạm (Zero-Touch Product-to-Revenue)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Autonomous Loop
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Vòng đời sản phẩm khép kín hoàn toàn từ Signal → Code → Video Marketing → Bán hàng → Thu tiền → Thuế.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              {runs.length} Vòng Lặp Hoạt Động
            </span>
          </div>
        </div>
      </section>

      {/* Action Start Loop */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Nhập mã sản phẩm mới (ví dụ: prod_saas_crm_001)..."
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <button
          type="button"
          onClick={start}
          disabled={busy || !productId.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Bắt Đầu Chu Trình</span>
        </button>
      </div>

      {runs.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Chưa có vòng lặp nào đang chạy.</p>
          <p className="text-xs text-slate-500 mt-1">Nhập mã sản phẩm ở trên để kích hoạt vòng đời tự động từ phát hiện nhu cầu đến quyết toán thuế.</p>
        </div>
      )}

      {/* Runs List */}
      <div className="space-y-4">
        {runs.map((run) => {
          const stageIdx = STAGES.indexOf(run.stage);
          return (
            <section key={run.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-black text-white">{run.productId}</span>
                  <span className="text-xs text-slate-400 font-mono">ID: {run.id}</span>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${run.status === 'awaiting_approval' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : run.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'}`}>
                  {run.status === 'awaiting_approval' && <AlertTriangle className="w-3 h-3" />}
                  {run.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                  <span>{run.status === 'awaiting_approval' ? 'Chờ CEO Phê Duyệt' : run.status === 'completed' ? 'Đã Hoàn Tất' : run.status}</span>
                </div>
              </div>

              {/* Step Flow */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {STAGES.map((s, i) => (
                  <div
                    key={s}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl text-center transition-all ${
                      i < stageIdx
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : i === stageIdx
                        ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200 ring-1 ring-sky-400/50'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="mb-1">
                      {i < stageIdx ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : i === stageIdx && run.status === 'awaiting_approval' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-current block" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">{STAGE_LABELS[s]}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Actions & Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Doanh thu: <strong className="text-emerald-400 font-mono text-sm">{fmtVnd(run.revenueVnd)}</strong></span>
                  <span>Biên lợi nhuận: <strong className="text-teal-300 font-mono text-sm">{fmtVnd(run.marginVnd)}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {run.status === 'awaiting_approval' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => advance(run.id, true)}
                        className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer"
                      >
                        ✓ Duyệt &amp; Tiếp Tục
                      </button>
                      <button
                        type="button"
                        onClick={() => refresh()}
                        className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Làm mới"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : run.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất toàn bộ chu trình 0-chạm
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => advance(run.id, false)}
                      className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg cursor-pointer"
                    >
                      Chuyển Bước Kế Tiếp ➔
                    </button>
                  )}
                </div>
              </div>

              {run.log.length > 0 && (
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3 max-h-24 overflow-y-auto space-y-1">
                  {run.log.slice(-4).map((l, i) => (
                    <div key={i} className="text-[10px] text-slate-400 font-mono">{l}</div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

