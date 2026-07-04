import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clipboard, GitBranch, Package, RefreshCw, Rocket, ShieldCheck, Stethoscope } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type GitStatus = Record<string, unknown>;
type GitDiff = Record<string, unknown>;
type CIContext = { selectedRun?: any; failedJobs?: any[]; actionsUrl?: string; lastCheckedAt?: string; repo?: string };
type DeployConfig = Record<string, any>;
type DeployRun = Record<string, any>;
type Snapshot = Record<string, any>;

type HubData = {
  status: GitStatus;
  diff: GitDiff;
  commitMessage: string;
  ci: CIContext | null;
  deployConfigs: DeployConfig[];
  deployRuns: DeployRun[];
  snapshots: Snapshot[];
};

const emptyData: HubData = { status: {}, diff: {}, commitMessage: '', ci: null, deployConfigs: [], deployRuns: [], snapshots: [] };

function rows(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  return [];
}

function unwrap<T = any>(value: any, ...keys: string[]): T {
  for (const key of keys) {
    if (value && value[key] !== undefined) return value[key];
  }
  return value as T;
}

function countList(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{label}</p>
    <p className="mt-2 text-2xl font-black text-text-primary">{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-text-tertiary">{hint}</p>}
  </div>;
}

function StatusBadge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-border-secondary bg-bg-primary text-text-secondary';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-border-primary bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-text-primary">{icon}{title}</div>
    {children}
  </section>;
}

export default function DevOpsReleaseHubPanel() {
  const [data, setData] = useState<HubData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const [statusRes, diffRes, ciRes, deployConfigRes, deployRunRes, snapshotRes] = await Promise.allSettled([
        daemonFetch<any>('/api/git/status', undefined, 10000),
        daemonFetch<any>('/api/git/diff', undefined, 10000),
        daemonFetch<any>('/api/ci-doctor/context?repo=DVBCLUB%2FLedgerFlow-Studio', undefined, 30000),
        daemonFetch<any>('/api/deploy/configs', undefined, 10000),
        daemonFetch<any>('/api/deploy/runs', undefined, 10000),
        daemonFetch<any>('/api/snapshot', undefined, 10000),
      ]);

      const next: HubData = {
        status: statusRes.status === 'fulfilled' ? unwrap(statusRes.value, 'status') : {},
        diff: diffRes.status === 'fulfilled' ? unwrap(diffRes.value, 'diff') : {},
        commitMessage: data.commitMessage,
        ci: ciRes.status === 'fulfilled' ? unwrap<CIContext>(ciRes.value, 'context') : null,
        deployConfigs: deployConfigRes.status === 'fulfilled' ? rows(unwrap(deployConfigRes.value, 'configs')) : [],
        deployRuns: deployRunRes.status === 'fulfilled' ? rows(unwrap(deployRunRes.value, 'runs')) : [],
        snapshots: snapshotRes.status === 'fulfilled' ? rows(unwrap(snapshotRes.value, 'snapshots')) : [],
      };
      setData(next);
      const failed = [statusRes, diffRes, ciRes, deployConfigRes, deployRunRes, snapshotRes].filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải khu phát hành, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Phát hành & Khôi phục.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Phát hành & Khôi phục.');
    } finally {
      setLoading(false);
    }
  };

  const generateCommit = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/git/commit-msg', undefined, 30000);
      setData((current) => ({ ...current, commitMessage: String(res?.message || res?.commitMessage || '') }));
      setMessage('Đã tạo gợi ý nội dung commit.');
    } catch (err: any) { setError(err?.message || 'Không tạo được gợi ý nội dung commit.'); }
    finally { setLoading(false); }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage('Đã sao chép.');
  };

  useEffect(() => { void load(); }, []);

  const changedCount = useMemo(() => {
    const s: any = data.status || {};
    return countList(s.staged) + countList(s.modified) + countList(s.untracked) + countList(s.deleted);
  }, [data.status]);

  const ciTone = data.ci?.selectedRun?.conclusion === 'success' ? 'green' : data.ci?.selectedRun?.conclusion ? 'rose' : 'amber';

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Rocket className="mr-2 inline h-4 w-4" />Phát hành & Khôi phục</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Kiểm tra → Đóng gói → Phát hành → Khôi phục</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Một màn gọn để xem thay đổi mã nguồn, kiểm thử, lịch sử phát hành và điểm khôi phục an toàn.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Làm mới'}</button>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-4">
      <StatCard label="Thay đổi mã nguồn" value={changedCount} hint="đã chọn + đã sửa + chưa theo dõi + đã xóa" />
      <StatCard label="Trạng thái kiểm thử" value={data.ci?.selectedRun?.conclusion || data.ci?.selectedRun?.status || 'chưa rõ'} hint={data.ci?.selectedRun?.name || 'lần chạy gần nhất'} />
      <StatCard label="Cấu hình phát hành" value={data.deployConfigs.length} hint="đích phát hành đã lưu" />
      <StatCard label="Điểm khôi phục" value={data.snapshots.length} hint="mốc có thể khôi phục" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Trợ lý mã nguồn" icon={<GitBranch className="h-4 w-4 text-emerald-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><StatusBadge tone="cyan">{changedCount} thay đổi</StatusBadge><StatusBadge>{countList((data.status as any).untracked)} chưa theo dõi</StatusBadge><StatusBadge tone="amber">{countList((data.status as any).modified)} đã sửa</StatusBadge></div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(data.status, null, 2)}</pre>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void generateCommit()} disabled={loading} className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-100">Tạo gợi ý commit</button>{data.commitMessage && <button onClick={() => void copy(data.commitMessage)} className="rounded-xl border border-cyan-500/30 px-3 py-2 text-xs font-black text-cyan-100"><Clipboard className="mr-1 inline h-3.5 w-3.5" />Sao chép</button>}</div>
        {data.commitMessage && <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-3 text-xs font-semibold leading-6 text-emerald-50">{data.commitMessage}</pre>}
      </Section>

      <Section title="Kiểm tra CI" icon={<Stethoscope className="h-4 w-4 text-amber-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><StatusBadge tone={ciTone as any}>{data.ci?.selectedRun?.conclusion || data.ci?.selectedRun?.status || 'chưa rõ'}</StatusBadge><StatusBadge>{data.ci?.repo || 'DVBCLUB/LedgerFlow-Studio'}</StatusBadge></div>
        <p className="text-sm font-black text-text-primary">{data.ci?.selectedRun?.name || 'Chưa có workflow run'}</p>
        <p className="mt-1 text-xs font-semibold text-text-tertiary">Checked: {data.ci?.lastCheckedAt ? new Date(data.ci.lastCheckedAt).toLocaleString('vi-VN') : '—'}</p>
        <div className="mt-3 max-h-64 space-y-2 overflow-auto">{(data.ci?.failedJobs || []).length === 0 ? <p className="text-xs font-bold text-text-tertiary">Không có failed job cụ thể.</p> : data.ci?.failedJobs?.map((job: any) => <div key={job.id || job.name} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-text-primary">{job.name}</p><StatusBadge tone={job.conclusion === 'success' ? 'green' : 'rose'}>{job.conclusion || job.status || 'unknown'}</StatusBadge></div><p className="mt-2 text-[11px] font-semibold text-text-tertiary">{(job.failedSteps || []).map((s: any) => `${s.number}. ${s.name}`).join(', ') || 'No failed steps in summary.'}</p></div>)}</div>
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Cấu hình phát hành" icon={<Rocket className="h-4 w-4 text-cyan-300" />}>
        <div className="space-y-2">{data.deployConfigs.length === 0 ? <p className="text-xs font-bold text-text-tertiary">Chưa có deploy config.</p> : data.deployConfigs.slice(0, 6).map((config) => <div key={config.id || config.name} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><p className="text-xs font-black text-text-primary">{config.name || config.id}</p><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{config.environment || config.target || 'deploy target'}</p></div>)}</div>
      </Section>
      <Section title="Lịch sử phát hành" icon={<Package className="h-4 w-4 text-violet-300" />}>
        <div className="space-y-2">{data.deployRuns.length === 0 ? <p className="text-xs font-bold text-text-tertiary">Chưa có deploy run.</p> : data.deployRuns.slice(0, 6).map((run) => <div key={run.id || run.createdAt} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-text-primary">{run.configName || run.id}</p><StatusBadge tone={run.status === 'success' || run.status === 'completed' ? 'green' : run.status === 'failed' ? 'rose' : 'amber'}>{run.status || 'run'}</StatusBadge></div><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{run.createdAt || run.startedAt || '—'}</p></div>)}</div>
      </Section>
      <Section title="Điểm khôi phục" icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}>
        <div className="space-y-2">{data.snapshots.length === 0 ? <p className="text-xs font-bold text-text-tertiary">Chưa có snapshot.</p> : data.snapshots.slice(0, 6).map((snap) => <div key={snap.id || snap.name} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><p className="text-xs font-black text-text-primary">{snap.name || snap.id}</p><p className="mt-1 text-[11px] font-semibold text-text-tertiary">{snap.createdAt || snap.description || 'restore point'}</p></div>)}</div>
      </Section>
    </section>

    <Section title="Tóm tắt diff thô" icon={<Package className="h-4 w-4 text-text-secondary" />}>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(data.diff, null, 2)}</pre>
    </Section>
  </div>;
}
