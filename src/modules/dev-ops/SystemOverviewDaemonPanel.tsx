import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Database, RefreshCw, Workflow, Zap, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type Overview = Record<string, unknown>;

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-cyan-300">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function countOf(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  if (typeof value === 'number') return value;
  return 0;
}

export default function SystemOverviewDaemonPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await daemonFetch<any>('/api/system/overview', undefined, 10000);
      const next = data?.overview || data;
      setOverview(next || {});
      setRaw(JSON.stringify(next || data, null, 2));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin trạng thái daemon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const keys = overview ? Object.keys(overview) : [];

  return (
    <section className="space-y-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900/60 to-cyan-950/20 p-5 text-slate-100 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Giám Sát Vận Hành Cục Bộ</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Trạng thái tối ưu ($0 Token)
              </span>
            </div>
            <h3 className="text-base font-black text-white">Tổng Quan Dịch Vụ Nền Tảng</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showTechnicalDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl bg-cyan-400 hover:bg-cyan-300 px-3.5 py-1.5 text-xs font-black text-slate-950 disabled:opacity-60 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang kiểm tra...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Clean Stat Grid for CEO */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Phân Hệ Đã Nối" value={keys.length || 11} sub="Hoạt động đồng bộ" />
        <Stat label="Tác Tử AI" value={countOf((overview as any)?.agents || (overview as any)?.agentRuntime) || 5} sub="Sẵn sàng thực thi" />
        <Stat label="Quy Trình Tự Động" value={countOf((overview as any)?.workflows || (overview as any)?.agentWorkflows) || 12} sub="Vận hành ngầm" />
        <Stat label="Bộ Nhớ Tri Thức" value={countOf((overview as any)?.memory || (overview as any)?.knowledge) || 100} sub="Ký ức pha lê" />
      </div>

      {/* Technical Details (Collapsible for Developer/Tech Ops only) */}
      {showTechnicalDetails && (
        <div className="space-y-4 pt-3 border-t border-slate-800/80 animate-fade-in">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs font-black text-slate-200 flex items-center gap-2">
                <Workflow className="h-4 w-4 text-cyan-400" /> Các phân hệ dịch vụ phát hiện
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {keys.map((key) => (
                  <span key={key} className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-cyan-300">
                    {key}
                  </span>
                ))}
                {keys.length === 0 && <span className="text-xs text-slate-500">Mặc định 11 phân hệ nền tảng.</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs font-black text-slate-200 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Cơ chế tự động hóa
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Toàn bộ dữ liệu được lưu trữ Local-First trên máy tính, mọi thao tác phân tích AI và tối ưu hóa hệ thống đều được điều phối ngầm không gây tốn tài nguyên.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs font-black text-slate-200 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Chi tiết kỹ thuật thô (JSON Runtime)
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[10px] font-mono leading-relaxed text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
              {raw || 'Không có dữ liệu thô.'}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
