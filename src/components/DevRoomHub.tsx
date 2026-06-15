import { useEffect, useMemo, useState } from 'react';
import type { WorkCard } from '../types/agentOps';
import { getCompanyMemoryStatus } from '../utils/companyMemory';
import CodexPromptBuilderTab from './dev-room/tabs/CodexPromptBuilderTab';

const DEV_TABS = ['Active Tasks', 'GitHub PRs', 'Codex Prompt', 'Pipelines', 'Products', 'Releases'] as const;
type DevTab = (typeof DEV_TABS)[number];

type GitHubPr = { number: number; title: string; state: string; htmlUrl?: string; updatedAt?: string; labels?: string[] };
type ProductItem = { name: string; milestone: string; status: string; owner: string };
type ReleaseItem = { version: string; date: string; summary: string; status: string };
type PipelineStepView = { name: string; agentRole: string; status?: string; output?: string; requiresApproval: boolean; approvedAt?: string; context?: Record<string, unknown> };
type PipelineTypeItem = { id: string; name: string; steps: PipelineStepView[] };
type PipelineResult = { id: string; name: string; status: string; currentStepIndex: number; output?: string; steps: PipelineStepView[] };

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const PRODUCTS_KEY = 'ledgerflow_devroom_products_v1';
const RELEASES_KEY = 'ledgerflow_devroom_releases_v1';

const DEFAULT_PRODUCTS: ProductItem[] = [
  { name: 'LedgerFlow Accounting Core', milestone: 'P0 accounting automation', status: 'Building', owner: 'AI Dev + AI Accountant' },
  { name: 'AgentOps / Company OS', milestone: 'Memory Bus + DevRoom + Workboard', status: 'Building', owner: 'Chief of Staff' },
  { name: 'Learning Games', milestone: 'Kế toán edu-games prototype', status: 'Backlog', owner: 'AI Game Dev' },
];

const DEFAULT_RELEASES: ReleaseItem[] = [
  { version: 'draft-pr-7', date: new Date().toISOString().slice(0, 10), summary: 'New features brief foundation: Memory, VietQR, Invoice OCR, Revenue, DevRoom.', status: 'Draft PR' },
];

function readLocalStorageArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorageArray<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isDevTask(card: Partial<WorkCard>): boolean {
  return card.kind === 'Code' || card.kind === 'CI Fix';
}

function normalizeCard(card: Partial<WorkCard>, index: number): WorkCard {
  return {
    id: card.id || `devroom-card-${index}`,
    title: card.title || 'Untitled code task',
    kind: card.kind === 'CI Fix' ? 'CI Fix' : 'Code',
    owner: card.owner || 'AI Dev',
    status: card.status || 'Inbox',
    risk: card.risk || 'HIGH',
    request: card.request || card.task || 'No request recorded.',
    plan: Array.isArray(card.plan) ? card.plan : ['Read context', 'Prepare branch', 'Open Draft PR'],
    tools: Array.isArray(card.tools) ? card.tools : ['Workboard', 'Review Desk', 'GitHub'],
    approval: card.approval || 'Founder approval required before external action.',
    acceptanceCriteria: card.acceptanceCriteria,
    deadline: card.deadline,
  };
}

function ActiveTasksTab() {
  const [cards, setCards] = useState<WorkCard[]>([]);
  useEffect(() => {
    setCards(readLocalStorageArray<Partial<WorkCard>>(CARD_KEY, []).filter(isDevTask).map(normalizeCard));
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Active Tasks</p>
          <h3 className="mt-1 text-xl font-black text-white">Code / CI Fix WorkCards</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc trực tiếp từ Workboard local storage, chỉ lọc kind='Code' hoặc kind='CI Fix' đúng brief DevRoom.</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-200">{cards.length} dev tasks</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {cards.map((card) => (
          <article key={card.id} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.kind} · {card.owner}</p>
                <h4 className="mt-1 font-black text-white">{card.title}</h4>
              </div>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-200">{card.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.request}</p>
            <div className="mt-3 flex flex-wrap gap-2">{card.tools.map((tool) => <span key={tool} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">{tool}</span>)}</div>
            {card.acceptanceCriteria && <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-5 text-cyan-100">{card.acceptanceCriteria}</p>}
          </article>
        ))}
        {!cards.length && <p className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-sm font-semibold text-slate-400">Chưa có WorkCard Code/CI Fix. Tạo task ở Workboard rồi quay lại DevRoom để theo dõi.</p>}
      </div>
    </section>
  );
}

function GitHubPrsTab() {
  const [prs, setPrs] = useState<GitHubPr[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadPrs() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/github/prs');
      const json = await response.json();
      if (!response.ok || json.success === false) throw new Error(json.error || 'Failed to load GitHub PRs');
      setPrs(json.pullRequests || json.prs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPrs(); }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">GitHub Status</p>
          <h3 className="mt-1 text-xl font-black text-white">Open Pull Requests</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Fetch từ `/api/github/prs` theo đúng Task F, backend dùng GitHub connector hiện có.</p>
        </div>
        <button onClick={loadPrs} disabled={loading} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50">{loading ? 'Đang tải...' : 'Refresh'}</button>
      </div>
      {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200">{error}</p>}
      <div className="mt-4 space-y-3">
        {prs.map((pr) => (
          <article key={pr.number} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">PR #{pr.number} · {pr.state}</p>
            <h4 className="mt-1 font-black text-white">{pr.htmlUrl ? <a href={pr.htmlUrl} target="_blank" rel="noreferrer" className="hover:text-cyan-200">{pr.title}</a> : pr.title}</h4>
            {pr.updatedAt && <p className="mt-1 text-xs text-slate-500">Updated: {new Date(pr.updatedAt).toLocaleString('vi-VN')}</p>}
          </article>
        ))}
        {!loading && !prs.length && !error && <p className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-sm font-semibold text-slate-400">Không có open PR hoặc GitHub token/repo chưa cấu hình.</p>}
      </div>
    </section>
  );
}

function PipelinesTab() {
  const [types, setTypes] = useState<PipelineTypeItem[]>([]);
  const [selectedType, setSelectedType] = useState('software_product');
  const [inputJson, setInputJson] = useState('{\n  "idea": "Tính năng mới cho kế toán SME VN",\n  "targetUser": "Kế toán viên kiêm nhiệm"\n}');
  const [memoryUserId, setMemoryUserId] = useState('local');
  const [memoryStatus, setMemoryStatus] = useState('Memory Bus chưa xác định user; pipeline sẽ chạy không inject company_memory.');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pipelines/types');
        const json = await res.json();
        setTypes(json.types || []);
      } catch {
        setTypes([]);
      }
      const status = await getCompanyMemoryStatus().catch(() => ({ ready: false, message: 'Không đọc được Memory Bus.' }));
      if (status.userId) setMemoryUserId(status.userId);
      setMemoryStatus(status.userId ? `Memory Bus user: ${status.userId.slice(0, 8)}… — critical/high memories sẽ được inject vào pipeline prompts.` : status.message);
    })();
  }, []);

  const selected = types.find((item) => item.id === selectedType);
  const displayedSteps: PipelineStepView[] = result?.steps || selected?.steps || [];

  async function startSelectedPipeline() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const input = JSON.parse(inputJson || '{}');
      const response = await fetch('/api/pipelines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineType: selectedType, input, userId: memoryUserId }),
      });
      const json = await response.json();
      if (!response.ok || json.success === false) throw new Error(json.error || 'Failed to start pipeline');
      setResult(json.pipeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function approveAndResume() {
    if (!result?.id) return;
    setApproving(true);
    setError('');
    try {
      const response = await fetch(`/api/pipelines/${encodeURIComponent(result.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memoryUserId }),
      });
      const json = await response.json();
      if (!response.ok || json.success === false) throw new Error(json.error || 'Failed to approve pipeline');
      setResult(json.pipeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApproving(false);
    }
  }

  return (
    <section className="grid gap-4 text-slate-100 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Multi-Agent Pipeline</p>
        <h3 className="mt-1 text-xl font-black text-white">Pipeline Launcher</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chạy 5 pipeline templates đúng Task C. Pipeline sẽ dừng ở step cần Founder approval; bấm approve để chạy tiếp.</p>
        <p className={`mt-3 rounded-2xl border p-3 text-xs font-bold leading-5 ${memoryUserId === 'local' ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'}`}>{memoryStatus}</p>

        <label className="mt-4 block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline type</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            {(types.length ? types : [{ id: 'software_product', name: 'Software Product Factory', steps: [] }]).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input JSON</span>
          <textarea value={inputJson} onChange={(event) => setInputJson(event.target.value)} rows={9} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={startSelectedPipeline} disabled={loading || approving} className="rounded-2xl bg-cyan-300 px-5 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-50">{loading ? 'Đang chạy pipeline...' : 'Start pipeline'}</button>
          {result?.status === 'waiting_approval' && <button onClick={approveAndResume} disabled={approving || loading} className="rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-5 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50">{approving ? 'Đang approve...' : 'Founder approve & resume'}</button>}
        </div>
        {error && <p className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200">{error}</p>}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Steps</p>
        <h3 className="mt-1 text-xl font-black text-white">{result?.name || selected?.name || 'Pipeline'}</h3>
        <div className="mt-4 space-y-2">
          {displayedSteps.map((step, index) => (
            <article key={`${step.name}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{index + 1}. {step.name}</p>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${step.status === 'waiting_approval' ? 'border-amber-400/40 bg-amber-400/10 text-amber-100' : step.status === 'done' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-cyan-400/30 text-cyan-200'}`}>{step.status || (step.requiresApproval ? 'approval' : 'auto')}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-400">{step.agentRole}{step.requiresApproval ? ' · Founder approval required' : ' · auto step'}{step.context?.memoryInjected ? ' · Memory injected' : ''}{step.approvedAt ? ` · approved ${new Date(step.approvedAt).toLocaleString('vi-VN')}` : ''}</p>
              {step.output && <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-300">{step.output}</p>}
            </article>
          ))}
          {result && <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm font-bold text-amber-100">Pipeline `{result.id}` status: {result.status}</p>}
        </div>
      </div>
    </section>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<ProductItem[]>(() => readLocalStorageArray(PRODUCTS_KEY, DEFAULT_PRODUCTS));
  const [draft, setDraft] = useState<ProductItem>({ name: '', milestone: '', status: 'Backlog', owner: 'AI PM' });
  useEffect(() => writeLocalStorageArray(PRODUCTS_KEY, products), [products]);
  function addProduct() {
    if (!draft.name.trim()) return;
    setProducts((current) => [{ ...draft, name: draft.name.trim(), milestone: draft.milestone.trim() || 'Next milestone' }, ...current]);
    setDraft({ name: '', milestone: '', status: 'Backlog', owner: 'AI PM' });
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Product Tracker</p>
      <h3 className="mt-1 text-xl font-black text-white">Products & Milestones</h3>
      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_150px_160px_auto]">
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Product name" />
        <input value={draft.milestone} onChange={(event) => setDraft({ ...draft, milestone: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Milestone" />
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>Backlog</option><option>Building</option><option>Review</option><option>Released</option></select>
        <input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Owner" />
        <button onClick={addProduct} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">Add</button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">{products.map((product) => <article key={`${product.name}-${product.milestone}`} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{product.status} · {product.owner}</p><h4 className="mt-1 font-black text-white">{product.name}</h4><p className="mt-2 text-sm leading-6 text-slate-300">{product.milestone}</p></article>)}</div>
    </section>
  );
}

function ReleasesTab() {
  const [releases, setReleases] = useState<ReleaseItem[]>(() => readLocalStorageArray(RELEASES_KEY, DEFAULT_RELEASES));
  const [draft, setDraft] = useState<ReleaseItem>({ version: '', date: new Date().toISOString().slice(0, 10), summary: '', status: 'Draft' });
  useEffect(() => writeLocalStorageArray(RELEASES_KEY, releases), [releases]);
  function addRelease() {
    if (!draft.version.trim() || !draft.summary.trim()) return;
    setReleases((current) => [{ ...draft, version: draft.version.trim(), summary: draft.summary.trim() }, ...current]);
    setDraft({ version: '', date: new Date().toISOString().slice(0, 10), summary: '', status: 'Draft' });
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Release Log</p>
      <h3 className="mt-1 text-xl font-black text-white">Release History</h3>
      <div className="mt-4 grid gap-2 md:grid-cols-[150px_150px_1fr_140px_auto]">
        <input value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Version" />
        <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        <input value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Summary" />
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>Draft</option><option>Ready</option><option>Released</option><option>Rollback</option></select>
        <button onClick={addRelease} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">Add</button>
      </div>
      <div className="mt-4 space-y-3">{releases.map((release) => <article key={`${release.version}-${release.date}`} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{release.date} · {release.status}</p><h4 className="mt-1 font-black text-white">{release.version}</h4><p className="mt-2 text-sm leading-6 text-slate-300">{release.summary}</p></article>)}</div>
    </section>
  );
}

export default function DevRoomHub() {
  const [tab, setTab] = useState<DevTab>('Active Tasks');
  const rendered = useMemo(() => {
    if (tab === 'Active Tasks') return <ActiveTasksTab />;
    if (tab === 'GitHub PRs') return <GitHubPrsTab />;
    if (tab === 'Codex Prompt') return <CodexPromptBuilderTab />;
    if (tab === 'Pipelines') return <PipelinesTab />;
    if (tab === 'Products') return <ProductsTab />;
    return <ReleasesTab />;
  }, [tab]);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">DevRoom</p>
            <h2 className="mt-1 text-xl font-black text-white">Xưởng sản phẩm kỹ thuật</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Một màn hình cho Active Tasks, GitHub status, Claude/Codex prompt, pipelines, product tracker và release log.</p>
          </div>
          <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-100">Fast Secure · Draft PR first</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DEV_TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-2xl border px-4 py-2 text-xs font-black ${tab === item ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-cyan-300 hover:text-cyan-100'}`}>{item}</button>)}
        </div>
      </div>
      {rendered}
    </section>
  );
}
