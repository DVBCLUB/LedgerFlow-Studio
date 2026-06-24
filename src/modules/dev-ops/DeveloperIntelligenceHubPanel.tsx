import { useEffect, useState } from 'react';
import { BookOpen, Braces, Code2, Database, FileText, GitPullRequest, Network, RefreshCw, SearchCheck } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type DevIntelData = {
  architectureGraphs: any[];
  testSuites: any[];
  testStats: Record<string, any>;
  docs: any[];
  docTypes: any[];
  reviewers: any[];
  reviews: any[];
  reviewStats: Record<string, any>;
  refactorReports: any[];
};

const empty: DevIntelData = {
  architectureGraphs: [],
  testSuites: [],
  testStats: {},
  docs: [],
  docTypes: [],
  reviewers: [],
  reviews: [],
  reviewStats: {},
  refactorReports: [],
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }
function obj(value: any) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: any; children: any }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => any }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 6).map(render)}</div>;
}

export default function DeveloperIntelligenceHubPanel() {
  const [data, setData] = useState<DevIntelData>(empty);
  const [targetDir, setTargetDir] = useState('server/services');
  const [sourceFile, setSourceFile] = useState('server/assistant-daemon.ts');
  const [docTarget, setDocTarget] = useState('server/assistant-daemon.ts');
  const [refactorPattern, setRefactorPattern] = useState('server/services/*.ts');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/architecture/graphs', undefined, 10000),
        daemonFetch<any>('/api/testgen/suites', undefined, 10000),
        daemonFetch<any>('/api/docs', undefined, 10000),
        daemonFetch<any>('/api/review/reviewers', undefined, 10000),
        daemonFetch<any>('/api/review/runs', undefined, 10000),
      ]);
      const [graphs, suites, docs, reviewers, reviews] = results;
      setData((current) => ({
        ...current,
        architectureGraphs: graphs.status === 'fulfilled' ? arr(unwrap(graphs.value, 'graphs')) : [],
        testSuites: suites.status === 'fulfilled' ? arr(unwrap(suites.value, 'suites')) : [],
        testStats: suites.status === 'fulfilled' ? obj(unwrap(suites.value, 'stats')) : {},
        docs: docs.status === 'fulfilled' ? arr(unwrap(docs.value, 'docs')) : [],
        docTypes: docs.status === 'fulfilled' ? arr(unwrap(docs.value, 'types')) : [],
        reviewers: reviewers.status === 'fulfilled' ? arr(unwrap(reviewers.value, 'reviewers')) : [],
        reviews: reviews.status === 'fulfilled' ? arr(unwrap(reviews.value, 'reviews')) : [],
        reviewStats: reviews.status === 'fulfilled' ? obj(unwrap(reviews.value, 'stats')) : {},
      }));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải Developer Intelligence, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Developer Intelligence.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Developer Intelligence.');
    } finally { setLoading(false); }
  };

  const generateArchitecture = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/architecture/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetDir, format: 'mermaid', maxFiles: 80 }) }, 30000);
      setMessage('Đã tạo architecture graph.');
      await load();
    } catch (err: any) { setError(err?.message || 'Không tạo được architecture graph.'); }
    finally { setLoading(false); }
  };

  const generateTests = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/testgen/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Suite for ${sourceFile}`, sourceFile, framework: 'node-test', maxRoutes: 20 }) }, 30000);
      setMessage('Đã tạo API test suite draft.');
      await load();
    } catch (err: any) { setError(err?.message || 'Không tạo được test suite.'); }
    finally { setLoading(false); }
  };

  const generateDocs = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/docs/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'module', target: docTarget, format: 'markdown' }) }, 30000);
      setMessage('Đã tạo documentation draft.');
      await load();
    } catch (err: any) { setError(err?.message || 'Không tạo được documentation.'); }
    finally { setLoading(false); }
  };

  const scanRefactor = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/refactor/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pattern: refactorPattern, maxFiles: 5 }) }, 30000);
      setData((current) => ({ ...current, refactorReports: arr(unwrap(res, 'reports')) }));
      setMessage('Đã scan refactor candidates.');
    } catch (err: any) { setError(err?.message || 'Không scan được refactor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/25 p-5 shadow-2xl shadow-slate-950/25">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200"><Code2 className="mr-2 inline h-4 w-4" />Developer Intelligence</p>
          <h2 className="mt-2 text-xl font-black text-white">Architecture, tests, docs, review and refactor</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Gom các công cụ developer còn rời rạc vào một bảng điều khiển hỗ trợ build/release. Các nút tạo chỉ tạo draft/report qua daemon.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-violet-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Architecture" value={data.architectureGraphs.length} hint="graphs" />
      <Stat label="Test suites" value={data.testSuites.length} hint="generated" />
      <Stat label="Docs" value={data.docs.length} hint={`${data.docTypes.length} types`} />
      <Stat label="Reviews" value={data.reviews.length} hint={`${data.reviewers.length} reviewers`} />
      <Stat label="Refactor" value={data.refactorReports.length} hint="reports" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Generate architecture graph" icon={<Network className="h-4 w-4 text-cyan-300" />}>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]"><input value={targetDir} onChange={(e) => setTargetDir(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400" /><button onClick={() => void generateArchitecture()} disabled={loading} className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black text-cyan-100 disabled:opacity-50">Generate</button></div>
        <MiniList items={data.architectureGraphs} emptyText="Chưa có architecture graph." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.name || item.id || 'Architecture graph'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.targetDir || item.format || item.createdAt || 'graph'}</p></div>} />
      </Section>
      <Section title="Generate API tests" icon={<Braces className="h-4 w-4 text-emerald-300" />}>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]"><input value={sourceFile} onChange={(e) => setSourceFile(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-emerald-400" /><button onClick={() => void generateTests()} disabled={loading} className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">Generate</button></div>
        <MiniList items={data.testSuites} emptyText="Chưa có test suite." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.name || item.id || 'Test suite'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.framework || item.sourceFile || item.createdAt || 'testgen'}</p></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Docs generator" icon={<BookOpen className="h-4 w-4 text-amber-300" />}>
        <div className="grid gap-2"><input value={docTarget} onChange={(e) => setDocTarget(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-400" /><button onClick={() => void generateDocs()} disabled={loading} className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-xs font-black text-amber-100 disabled:opacity-50">Generate docs</button></div>
        <div className="mt-3"><MiniList items={data.docs} emptyText="Chưa có generated doc." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.title || item.id || 'Doc'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.type || item.target || item.createdAt || 'documentation'}</p></div>} /></div>
      </Section>
      <Section title="Code review queue" icon={<GitPullRequest className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="violet">{data.reviewers.length} reviewers</Badge><Badge>{data.reviews.length} reviews</Badge></div>
        <MiniList items={data.reviews.length ? data.reviews : data.reviewers} emptyText="Chưa có review/reviewer." render={(item, index) => <div key={item.id || item.name || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.title || item.name || item.id || 'Review'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.status || item.role || item.createdAt || item.description || 'review'}</p></div>} />
      </Section>
      <Section title="Refactor scan" icon={<SearchCheck className="h-4 w-4 text-rose-300" />}>
        <div className="grid gap-2"><input value={refactorPattern} onChange={(e) => setRefactorPattern(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-rose-400" /><button onClick={() => void scanRefactor()} disabled={loading} className="rounded-2xl border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-50">Scan</button></div>
        <div className="mt-3"><MiniList items={data.refactorReports} emptyText="Chưa có refactor report." render={(item, index) => <div key={item.filePath || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.filePath || item.id || 'Refactor report'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.summary || item.score || item.createdAt || 'refactor'}</p></div>} /></div>
      </Section>
    </section>

    {rawOpen && <Section title="Raw Developer Intelligence payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
