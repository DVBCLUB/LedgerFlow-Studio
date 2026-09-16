import { useState } from 'react';
import { AlertTriangle, ClipboardCheck, FileSearch, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react';
import { runFounderControlReport, type FounderControlReportKind } from '../../utils/founderControlApi';

const actions: Array<{ kind: FounderControlReportKind; title: string; detail: string; icon: typeof FileSearch; tone: string }> = [
  { kind: 'nightly-sweeper', title: 'Bản brief điều hành', detail: 'Tổng hợp KPI, chi phí và ưu tiên hôm nay.', icon: ClipboardCheck, tone: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10' },
  { kind: 'revenue-leak', title: 'Rà soát rò rỉ doanh thu', detail: 'Phát hiện hóa đơn quá hạn và tạo nhắc việc dạng nháp.', icon: AlertTriangle, tone: 'text-amber-300 border-amber-400/30 bg-amber-500/10' },
  { kind: 'customer-churn', title: 'Cảnh báo rời bỏ', detail: 'Đánh giá rủi ro khách hàng; chỉ tạo đề xuất chăm sóc.', icon: UsersRound, tone: 'text-rose-300 border-rose-400/30 bg-rose-500/10' },
  { kind: 'code-quality', title: 'Sức khỏe sản phẩm', detail: 'Tạo báo cáo chất lượng và các finding để Founder xem xét.', icon: ShieldCheck, tone: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
];

function summaryFor(report: any): string {
  return report?.summary || report?.markdownBriefing || report?.markdownSummary || 'Báo cáo đã sẵn sàng để xem xét.';
}

export default function FounderControlPanel() {
  const [running, setRunning] = useState<FounderControlReportKind | null>(null);
  const [reports, setReports] = useState<Partial<Record<FounderControlReportKind, any>>>({});
  const [error, setError] = useState('');

  const run = async (kind: FounderControlReportKind) => {
    setRunning(kind);
    setError('');
    try {
      const report = await runFounderControlReport(kind);
      setReports((current) => ({ ...current, [kind]: report }));
    } catch (reason: any) {
      setError(reason.message || 'Không thể tạo báo cáo.');
    } finally {
      setRunning(null);
    }
  };

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950/30 via-slate-950 to-slate-950 p-5 shadow-xl shadow-violet-950/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Founder Control · Draft-first</p>
          <h2 className="mt-1 text-lg font-black text-white">Điều hành có kiểm soát</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Chạy phân tích theo yêu cầu để tạo báo cáo và đề xuất nháp. Không gửi khách hàng, không hạch toán và không triển khai thay đổi tự động.</p>
        </div>
        <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-200">Approval by default</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ kind, title, detail, icon: Icon, tone }) => {
          const report = reports[kind];
          const isRunning = running === kind;
          return (
            <article key={kind} className="rounded-2xl border border-white/10 bg-slate-900/65 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}><Icon className="h-4 w-4" /></div>
              <h3 className="mt-3 text-sm font-black text-white">{title}</h3>
              <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-400">{detail}</p>
              {report && <p className="mt-3 line-clamp-3 rounded-xl border border-slate-700/70 bg-slate-950/70 p-2 text-[10px] leading-4 text-slate-300">{summaryFor(report)}</p>}
              <button type="button" onClick={() => void run(kind)} disabled={running !== null} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-black text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
                {isRunning ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang phân tích…</> : 'Tạo báo cáo nháp'}
              </button>
            </article>
          );
        })}
      </div>
      {error && <p className="mt-3 text-xs font-semibold text-rose-300">{error}</p>}
    </section>
  );
}
