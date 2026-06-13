import { useEffect, useMemo, useState } from 'react';
import {
  AI_AGENT_WORK_ORDER_BOARD,
  FOUNDER_RISK_REGISTER,
  PRODUCT_IDEA_PORTFOLIO,
  RELEASE_READINESS_CHECKLIST
} from '../../../data/founderCompanyEnhancements';

const FACTORY_STATE_KEY = 'ledgerflow_product_factory_state_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';
const APPROVAL_KEY = 'ledgerflow_aiops_approvals_v1';
const CARD_KEY = 'ledgerflow_aiops_cards_v1';

type FactoryStatus = 'Idea' | 'Work Order' | 'Code Plan' | 'Waiting Approval' | 'CI / PR' | 'Release Audit';
type FactoryState = Record<string, FactoryStatus>;
type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  sourceId?: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
  details: string;
  conditions?: string;
  createdAt: string;
  expiresAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
};

type WorkCard = {
  id: string;
  title: string;
  kind: 'Product' | 'Code';
  owner: string;
  status: 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  request: string;
  plan: string[];
  tools: string[];
  approval: string;
};

const pipeline: FactoryStatus[] = ['Idea', 'Work Order', 'Code Plan', 'Waiting Approval', 'CI / PR', 'Release Audit'];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function scoreIdea(idea: { pain: number; mvpCheapness: number; distribution: number; technicalRisk: number }) {
  return Math.round(idea.pain * 3 + idea.mvpCheapness * 2 + idea.distribution * 1.5 - idea.technicalRisk * 1.5);
}

function verdict(score: number) {
  if (score >= 40) return 'GO';
  if (score >= 30) return 'HOLD';
  return 'NO-GO';
}

function riskForIdea(idea: { technicalRisk: number }) {
  if (idea.technicalRisk >= 7) return 'HIGH';
  if (idea.technicalRisk >= 4) return 'MEDIUM';
  return 'LOW';
}

export default function ProductFactoryTab() {
  const [state, setState] = useState<FactoryState>(() => readLocal(FACTORY_STATE_KEY, {}));
  const [selectedIdea, setSelectedIdea] = useState(PRODUCT_IDEA_PORTFOLIO[0]?.idea ?? '');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => writeLocal(FACTORY_STATE_KEY, state), [state]);

  const ideas = useMemo(() => PRODUCT_IDEA_PORTFOLIO.map((idea) => {
    const score = scoreIdea(idea);
    return { ...idea, score, verdict: verdict(score), status: state[idea.idea] ?? 'Idea' as FactoryStatus, risk: riskForIdea(idea) };
  }), [state]);

  const selected = ideas.find((idea) => idea.idea === selectedIdea) ?? ideas[0];
  const matchedWorkOrder = AI_AGENT_WORK_ORDER_BOARD.find((order) => order.task.toLowerCase().includes('prd')) ?? AI_AGENT_WORK_ORDER_BOARD[0];

  const pushAudit = (action: string, cardId: string, detail: string) => {
    const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId, detail }, ...current].slice(0, 120));
  };

  const move = (ideaName: string, status: FactoryStatus) => {
    setState((current) => ({ ...current, [ideaName]: status }));
    pushAudit('PRODUCT_FACTORY_STATUS', ideaName, `Moved product idea to ${status}.`);
  };

  const createWorkCard = () => {
    if (!selected) return;
    const current = readLocal<WorkCard[]>(CARD_KEY, []);
    const card: WorkCard = {
      id: `pf-${Date.now()}`,
      title: `Product Factory: ${selected.idea}`,
      kind: selected.status === 'Idea' ? 'Product' : 'Code',
      owner: selected.status === 'Code Plan' ? 'AI Dev' : 'AI Chief of Staff',
      status: selected.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
      risk: selected.risk,
      request: `Biến ý tưởng "${selected.idea}" thành MVP nhỏ. User: ${selected.targetUser}. First MVP: ${selected.firstMvp}.`,
      plan: ['Confirm GO/HOLD/NO-GO', 'Create PRD/work order', 'Generate code plan only', 'Founder approves risky action', 'Run CI/PR/release audit'],
      tools: ['Idea Portfolio', 'AI Work Orders', 'Approval Gate', 'CI Doctor', 'Risk & Release Audit'],
      approval: selected.risk === 'LOW' ? 'Sandbox-first, audit required.' : 'Founder must approve before GitHub branch/commit/PR.'
    };
    writeLocal(CARD_KEY, [card, ...current]);
    move(selected.idea, selected.risk === 'LOW' ? 'Work Order' : 'Waiting Approval');
  };

  const requestApproval = () => {
    if (!selected) return;
    const current = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
    const approval: ApprovalRequest = {
      id: `appr-pf-${Date.now()}`,
      title: `Approve Product Factory action: ${selected.idea}`,
      source: 'ProductFactoryTab',
      sourceId: selected.idea,
      risk: selected.risk === 'LOW' ? 'MEDIUM' : selected.risk,
      action: 'Allow AI Dev to prepare branch/commit/PR plan in sandbox-first mode',
      details: `Idea score ${selected.score} (${selected.verdict}). MVP: ${selected.firstMvp}. Monetization: ${selected.monetization}.`,
      conditions: 'No hardcoded API key. No direct external write before founder approval. CI and release audit required.',
      createdAt: new Date().toLocaleString('vi-VN'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('vi-VN'),
      status: 'Pending'
    };
    writeLocal(APPROVAL_KEY, [approval, ...current]);
    move(selected.idea, 'Waiting Approval');
  };

  const copyFactoryPrompt = async () => {
    if (!selected) return;
    const prompt = `Bạn là AI Dev trong LedgerFlow Studio Product Factory.\n\nÝ tưởng: ${selected.idea}\nNgười dùng mục tiêu: ${selected.targetUser}\nScore: ${selected.score} (${selected.verdict})\nMVP đầu tiên: ${selected.firstMvp}\nMonetization: ${selected.monetization}\n\nYêu cầu:\n1. Chỉ lập code plan, chưa commit/push nếu chưa qua Approval Gate.\n2. Giữ app là learning/R&D/simulation + Company OS, không định vị như ERP kế toán thật.\n3. Đề xuất file cần sửa tối thiểu, test tay, rủi ro, acceptance criteria.\n4. Không hardcode API key, không thêm CDN dependency, giữ offline-ready.`;
    await navigator.clipboard.writeText(prompt);
    setCopied('prompt');
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Idea → Work Order → Code Plan → Approval → CI/PR → Release Audit</p>
          <h3 className="mt-1 text-xl font-black text-white">Product Factory</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Phòng Dev sinh sản phẩm con từ Idea Portfolio, nhưng mọi GitHub/external action vẫn đi qua Approval Gate.</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-200">{ideas.length} ideas · {AI_AGENT_WORK_ORDER_BOARD.length} seed work orders</span>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-6">
        {pipeline.map((step, index) => <div key={step} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Step {index + 1}</p><p className="mt-1 text-sm font-black text-white">{step}</p></div>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-3">
          {ideas.map((idea) => (
            <button key={idea.idea} onClick={() => setSelectedIdea(idea.idea)} className={`w-full rounded-2xl border p-3 text-left ${selected?.idea === idea.idea ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/70 hover:border-cyan-500/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{idea.idea}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">{idea.targetUser}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{idea.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                <span className="rounded-full border border-emerald-400/25 px-2 py-0.5 text-emerald-200">{idea.score} · {idea.verdict}</span>
                <span className="rounded-full border border-amber-400/25 px-2 py-0.5 text-amber-200">{idea.risk} risk</span>
              </div>
            </button>
          ))}
        </div>

        {selected && <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Selected product line</p>
              <h4 className="mt-2 text-lg font-black text-white">{selected.idea}</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{selected.targetUser}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase text-emerald-200">GO score</p>
              <p className="text-2xl font-black text-white">{selected.score}</p>
              <p className="text-[10px] font-black text-emerald-200">{selected.verdict}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="Pain" value={selected.pain} />
            <Metric label="MVP cheap" value={selected.mvpCheapness} />
            <Metric label="Distribution" value={selected.distribution} />
            <Metric label="Tech risk" value={selected.technicalRisk} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBox title="First MVP" body={selected.firstMvp} />
            <InfoBox title="Monetization" body={selected.monetization} />
          </div>

          <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3">
            <p className="text-[10px] font-black uppercase text-violet-200">Suggested work order seed</p>
            <p className="mt-2 text-sm font-black text-white">{matchedWorkOrder?.ownerAgent}: {matchedWorkOrder?.task}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{matchedWorkOrder?.founderReview}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button onClick={createWorkCard} className="rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950">Tạo WorkCard</button>
            <button onClick={requestApproval} className="rounded-2xl border border-amber-300/40 px-4 py-3 text-xs font-black text-amber-100">Gửi Approval Gate</button>
            <button onClick={copyFactoryPrompt} className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-black text-slate-200">{copied === 'prompt' ? 'Đã copy' : 'Copy code-plan prompt'}</button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3">
              <p className="text-[10px] font-black uppercase text-rose-200">Risk controls trước khi build</p>
              {FOUNDER_RISK_REGISTER.slice(0, 3).map((risk) => <p key={risk.risk} className="mt-2 text-xs font-semibold leading-5 text-rose-50">• {risk.risk}: {risk.control}</p>)}
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
              <p className="text-[10px] font-black uppercase text-emerald-200">Release readiness sample</p>
              {RELEASE_READINESS_CHECKLIST.slice(0, 4).map((item) => <p key={item} className="mt-2 text-xs font-semibold leading-5 text-emerald-50">• {item}</p>)}
            </div>
          </div>
        </article>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}

function InfoBox({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-cyan-300">{title}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{body}</p></div>;
}
