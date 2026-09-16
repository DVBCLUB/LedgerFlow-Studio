import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, ClipboardCheck, PackageCheck, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { fetchReleaseReadiness, type ReleaseReadinessSnapshot } from '../../utils/releaseReadinessApi';

type ReadinessCheck = { label: string; command: string; note: string; category: 'quality' | 'desktop' | 'runtime' };

const checks: ReadinessCheck[] = [
  { label: 'Kiểu dữ liệu nghiêm ngặt', command: 'npm run lint:strict', note: 'Chặn sai lệch kiểu giữa UI, API và runtime.', category: 'quality' },
  { label: 'Bộ test cốt lõi', command: 'npm test', note: 'Xác minh local-first, AI workforce và an toàn tự động hóa.', category: 'quality' },
  { label: 'Build phát hành', command: 'npm run build', note: 'Build web, backend và desktop entrypoint theo cùng chuỗi kiểm tra.', category: 'runtime' },
  { label: 'Đóng gói desktop', command: 'npm run check:desktop', note: 'Kiểm tra Electron shell, icon và cấu trúc bản Windows.', category: 'desktop' },
  { label: 'Khả năng offline', command: 'npm run check:offline', note: 'Phân biệt tài sản local với connector người dùng mở chủ động.', category: 'desktop' },
  { label: 'Mã hóa văn bản', command: 'npm run check:text-encoding', note: 'Kiểm tra UTF-8 thực tế, không phụ thuộc cách terminal hiển thị tiếng Việt.', category: 'quality' },
];

const categoryStyle = { quality: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200', desktop: 'border-violet-400/25 bg-violet-500/10 text-violet-200', runtime: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200' };

export default function ReleaseReadinessPanel() {
  const [snapshot, setSnapshot] = useState<ReleaseReadinessSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setSnapshot(await fetchReleaseReadiness()); setError(''); }
    catch (reason: any) { setError(reason?.message || 'Không thể kiểm tra artifact phát hành.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  return <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950 p-5 shadow-xl shadow-emerald-950/10">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">System Settings · Release checklist</p><h2 className="mt-1 text-lg font-black text-white">Release Readiness</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Đối chiếu artifact thực tế của runtime hiện tại. Màn hình chỉ đọc: không tự chạy lệnh, đóng gói hay phát hành.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới</button><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${snapshot?.ready ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/25 bg-amber-500/10 text-amber-200'}`}><ClipboardCheck className="h-3.5 w-3.5" /> {snapshot?.ready ? 'Artifact sẵn sàng' : 'Chờ xác minh'}</span></div></div>
    {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{error}</p>}
    {snapshot && <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{snapshot.artifacts.map((artifact) => <article key={artifact.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><div className="flex items-start justify-between gap-2">{artifact.present ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-300" />}<span className={`text-[9px] font-black uppercase tracking-wider ${artifact.present ? 'text-emerald-200' : 'text-rose-200'}`}>{artifact.present ? 'Có mặt' : 'Thiếu'}</span></div><h3 className="mt-3 text-sm font-black text-white">{artifact.label}</h3><p className="mt-2 truncate text-[10px] text-slate-500" title={artifact.location}>{artifact.location}</p>{artifact.modifiedAt && <p className="mt-2 text-[10px] text-slate-400">{new Date(artifact.modifiedAt).toLocaleString('vi-VN')} · {Math.ceil((artifact.sizeBytes || 0) / 1024)} KB</p>}</article>)}</div>}
    {snapshot && <p className="mt-3 text-[10px] text-slate-500">Kiểm tra lúc {new Date(snapshot.checkedAt).toLocaleString('vi-VN')} · runtime {snapshot.runtime === 'desktop' ? 'Windows Desktop' : 'máy build local'}.</p>}
    <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{checks.map((check) => <article key={check.command} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><h3 className="text-sm font-black text-white">{check.label}</h3></div><span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${categoryStyle[check.category]}`}>{check.category}</span></div><code className="mt-3 block overflow-x-auto rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-cyan-200">{check.command}</code><p className="mt-3 text-xs leading-5 text-slate-400">{check.note}</p></article>)}</div>
    <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p>Các connector web, AI provider và liên kết affiliate có thể cần mạng khi người dùng gọi chúng. Chúng không phải tài sản bắt buộc để shell desktop, dữ liệu local hoặc luồng kiểm tra cốt lõi hoạt động.</p><PackageCheck className="ml-auto h-4 w-4 text-violet-300" /><ShieldCheck className="h-4 w-4 text-emerald-300" /></div>
  </section>;
}
