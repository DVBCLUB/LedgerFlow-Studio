import { ArrowRight, Boxes, Brain, Download, FlaskConical, Gamepad2, LineChart, ShieldCheck } from 'lucide-react';

const quickPaths = [
  {
    title: 'Dùng phần mềm như người dùng cuối',
    note: 'Mở Company OS để xem định hướng sản phẩm, roadmap, doanh thu và lịch vận hành.',
    target: 'Company OS',
    icon: Boxes,
    tone: 'emerald'
  },
  {
    title: 'Học bằng mini-game',
    note: 'Vào Game Library, chơi Audit Game, Cash Runway, PMF, Document Matching hoặc Cost Flow.',
    target: 'Game Library',
    icon: Gamepad2,
    tone: 'cyan'
  },
  {
    title: 'Theo dõi tiến độ game',
    note: 'Game Progress đọc lịch sử ledgerflow-game-session-history-v1 để tổng hợp attempts, best score và recent sessions.',
    target: 'Game Progress',
    icon: LineChart,
    tone: 'violet'
  },
  {
    title: 'Quản lý tài chính founder',
    note: 'Finance Lab và Tool Budget giúp kiểm tra runway, burn, tool subscription và quyết định keep/kill.',
    target: 'Finance Lab / Tool Budget',
    icon: Brain,
    tone: 'amber'
  },
  {
    title: 'Sao lưu trước khi update',
    note: 'Vào Backup / Restore để xuất JSON trước khi clear cache, đổi máy hoặc cài bản mới.',
    target: 'Backup / Restore',
    icon: Download,
    tone: 'rose'
  },
  {
    title: 'Kiểm tra release an toàn',
    note: 'Các script check sẽ rà module, desktop package, offline readiness và release artifact trước khi đóng gói.',
    target: 'Release checklist',
    icon: ShieldCheck,
    tone: 'blue'
  }
];

const toneClasses: Record<string, { border: string; bg: string; text: string; chip: string }> = {
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-200', chip: 'bg-emerald-300 text-slate-950' },
  cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-200', chip: 'bg-cyan-300 text-slate-950' },
  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-200', chip: 'bg-violet-300 text-slate-950' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-200', chip: 'bg-amber-300 text-slate-950' },
  rose: { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-200', chip: 'bg-rose-300 text-slate-950' },
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-200', chip: 'bg-blue-300 text-slate-950' }
};

export default function StartHereLab() {
  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Start here</p>
            <h2 className="mt-2 text-2xl font-black text-white">LedgerFlow Hub — màn hình bắt đầu</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-400">
              Đây là lớp điều hướng an toàn cho người mới mở app. Các module cũ vẫn giữ nguyên trong Founder Labs; màn hình này chỉ gợi ý nên bắt đầu từ đâu để không bị rối giữa nhiều lab, game và dashboard.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-100">
            Không thay thế app chính · Không xóa lab cũ
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {quickPaths.map((path) => {
          const Icon = path.icon;
          const tone = toneClasses[path.tone];
          return (
            <article key={path.title} className={`rounded-3xl border ${tone.border} ${tone.bg} p-5`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl border ${tone.border} bg-slate-950/60 p-3 ${tone.text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white">{path.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{path.note}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[11px] font-black text-slate-200">
                    <ArrowRight className="h-3.5 w-3.5" /> Mở tab: {path.target}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-1 h-5 w-5 text-emerald-300" />
          <div>
            <h3 className="text-sm font-black text-white">Nguyên tắc dùng app hiện tại</h3>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-400">
              LedgerFlow hiện là studio/lab offline-first: dữ liệu chính nằm trên máy/trình duyệt của bạn. Trước khi cài bản mới, clear cache hoặc đổi máy, hãy vào Backup / Restore để xuất file JSON. Khi cần bản cài đặt Windows, tải file .exe từ GitHub Release/Actions artifact, không tải source ZIP nếu chỉ muốn sử dụng.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
