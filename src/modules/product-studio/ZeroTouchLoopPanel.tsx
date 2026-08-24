import { useEffect, useState } from 'react';
import { Rocket, Play, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
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
    <div className="space-y-5 animate-fade-in text-left">
      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
          <Rocket className="w-4 h-4 text-sky-400" /> Zero-Touch Product-to-Revenue Loop
        </div>
        <div className="flex gap-2">
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Mã sản phẩm (ví dụ: prod_saas_001)"
            className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-600"
          />
          <button onClick={start} disabled={busy || !productId.trim()} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50">
            <Play className="w-3 h-3" /> Bắt đầu
          </button>
        </div>
      </section>

      {runs.length === 0 && (
        <div className="text-xs text-slate-500">Chưa có vòng lặp nào. Nhập mã sản phẩm để khởi động pipeline signal → build → … → tax.</div>
      )}

      {runs.map((run) => {
        const stageIdx = STAGES.indexOf(run.stage);
        return (
          <section key={run.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-300">{run.productId}</div>
              <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${run.status === 'awaiting_approval' ? 'bg-amber-500/15 text-amber-300' : run.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                {run.status === 'awaiting_approval' ? 'Chờ phê duyệt' : run.status}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {STAGES.map((s, i) => (
                <div key={s} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${i < stageIdx ? 'bg-emerald-500/10 text-emerald-300' : i === stageIdx ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-800/50 text-slate-500'}`}>
                  {i < stageIdx ? <CheckCircle className="w-3 h-3" /> : i === stageIdx && run.status === 'awaiting_approval' ? <AlertTriangle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                  {STAGE_LABELS[s]}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Doanh thu <span className="text-emerald-400 font-semibold">{fmtVnd(run.revenueVnd)}</span> · Margin <span className="text-slate-200 font-semibold">{fmtVnd(run.marginVnd)}</span>
              </div>
              <div className="flex gap-2">
                {run.status === 'awaiting_approval' ? (
                  <>
                    <button onClick={() => advance(run.id, true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
                      Duyệt & tiếp tục
                    </button>
                    <button onClick={() => refresh()} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </>
                ) : run.status === 'completed' ? (
                  <span className="text-xs text-emerald-400 font-semibold">Đã hoàn tất chu trình</span>
                ) : (
                  <button onClick={() => advance(run.id, false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white">
                    Chuyển bước tiếp
                  </button>
                )}
              </div>
            </div>

            {run.log.length > 0 && (
              <div className="mt-3 rounded-lg bg-slate-900/80 border border-slate-800 p-2 max-h-24 overflow-y-auto">
                {run.log.slice(-4).map((l, i) => (
                  <div key={i} className="text-[10px] text-slate-500">{l}</div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
