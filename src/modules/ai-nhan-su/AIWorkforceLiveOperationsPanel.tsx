import { useEffect, useState, type ReactNode } from 'react';
import { Activity, AlertTriangle, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { fetchAIWorkforceLiveBoard, type AIWorkforceLiveBoard } from '../../utils/aiWorkforceLiveBoardApi';

const statusStyle: Record<string, string> = {
  ACTIVE: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  IN_SHIFT: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  IDLE: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  QUARANTINED: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
};

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function AIWorkforceLiveOperationsPanel() {
  const [board, setBoard] = useState<AIWorkforceLiveBoard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setBoard(await fetchAIWorkforceLiveBoard());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối Live Operations Board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200"><Activity className="h-3.5 w-3.5" /> Live Operations</div>
          <h2 className="mt-3 text-base font-black text-text-primary">Trạng thái đội ngũ AI theo thời gian thực</h2>
          <p className="mt-1 text-xs font-semibold text-text-secondary">Chỉ đọc từ Action Ledger và Approval Gateway; không tự kích hoạt tác vụ hay phê duyệt.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-secondary bg-bg-surface px-3 py-2 text-xs font-black text-text-secondary transition hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-50"><RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /> Làm mới</button>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div> : null}
      {!board && loading ? <p className="mt-5 text-xs font-semibold text-text-tertiary">Đang nạp trạng thái vận hành…</p> : null}
      {board ? <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Users className="h-4 w-4 text-cyan-300" />} label="Nhân sự AI" value={board.totalEmployeesCount} detail={`Ca: ${board.activeShift.name}`} />
          <Metric icon={<Activity className="h-4 w-4 text-emerald-300" />} label="Đang hoạt động" value={board.activeCount} detail={`Trưởng ca: ${board.activeShift.leaderRoleId}`} />
          <Metric icon={<ShieldAlert className="h-4 w-4 text-amber-300" />} label="Chờ phê duyệt" value={board.pendingApprovalsCount} detail="Founder/HITL quyết định" />
          <Metric icon={<AlertTriangle className="h-4 w-4 text-rose-300" />} label="Cách ly" value={board.quarantinedCount} detail="Không nhận lệnh mới" />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-border-primary bg-bg-surface/60 p-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary">Nhân sự & hành động gần nhất</h3>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {board.employees.map((employee) => <div key={employee.roleId} className="rounded-lg border border-border-primary bg-slate-950/60 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-black text-text-primary">{employee.roleName}</p><p className="mt-1 text-[10px] font-semibold text-text-tertiary">{employee.authorityLevel} · {employee.tasksCompletedToday} việc hoàn tất</p></div><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${statusStyle[employee.status] || statusStyle.IDLE}`}>{employee.status}</span></div><p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{employee.currentAction}</p></div>)}
            </div>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-surface/60 p-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary">Action Ledger gần đây</h3>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">{board.recentFeed.length ? board.recentFeed.map((item, index) => <div key={`${item.timestamp}-${index}`} className="rounded-lg border border-border-primary bg-slate-950/60 p-3"><p className="text-[10px] font-black text-cyan-200">{item.actor}</p><p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{item.summary}</p><p className="mt-2 text-[10px] text-text-tertiary">{formatTime(item.timestamp)}</p></div>) : <p className="text-xs font-semibold text-text-tertiary">Chưa có action ledger mới.</p>}</div>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-semibold text-text-tertiary">Cập nhật: {formatTime(board.generatedAt)} · Ca {board.activeShift.timeRange}</p>
      </> : null}
    </section>
  );
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number; detail: string }) {
  return <div className="rounded-xl border border-border-primary bg-bg-surface/60 p-3"><div className="flex items-center gap-2">{icon}<p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">{label}</p></div><p className="mt-2 text-2xl font-black text-text-primary">{value}</p><p className="mt-1 text-[10px] font-semibold text-text-secondary">{detail}</p></div>;
}
