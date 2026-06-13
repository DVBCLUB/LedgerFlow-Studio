import { useMemo, useState } from 'react';
import {
  FOUNDER_DAILY_KPI_DASHBOARD,
  FOUNDER_RISK_REGISTER,
  PRODUCT_IDEA_PORTFOLIO,
  RELEASE_READINESS_CHECKLIST
} from '../../../data/founderCompanyEnhancements';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_aiops_approvals_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';
const FEEDBACK_KEY = 'ledgerflow_feedback_loop_v1';
const COST_MANUAL_KEY = 'ledgerflow_ai_cost_manual_v1';
const FACTORY_STATE_KEY = 'ledgerflow_product_factory_state_v1';
const STANDUP_KEY = 'ledgerflow_daily_standup_v1';

type WorkCard = { id: string; title: string; status: string; risk: string; owner: string; kind: string; request?: string };
type ApprovalRequest = { id: string; title: string; status: string; risk: string; action?: string };
type FeedbackItem = { id: string; type: string; risk: string; status: string; text: string; source: string };
type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };
type CostEntry = { id: string; provider: string; estimatedCostUsd?: number; costUsd?: number; status?: string };
type StandupArchive = { id: string; at: string; report: string };

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

function ideaScore(idea: { pain: number; mvpCheapness: number; distribution: number; technicalRisk: number }) {
  return Math.round(idea.pain * 3 + idea.mvpCheapness * 2 + idea.distribution * 1.5 - idea.technicalRisk * 1.5);
}

function healthLabel(score: number) {
  if (score >= 75) return 'GREEN - tập trung tốt';
  if (score >= 55) return 'YELLOW - cần cắt bớt việc';
  return 'RED - backlog/risk đang vượt sức founder';
}

export default function DailyStandupTab() {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const data = useMemo(() => {
    const cards = readLocal<WorkCard[]>(CARD_KEY, []);
    const approvals = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
    const feedback = readLocal<FeedbackItem[]>(FEEDBACK_KEY, []);
    const audit = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    const cost = readLocal<CostEntry[]>(COST_MANUAL_KEY, []);
    const factory = readLocal<Record<string, string>>(FACTORY_STATE_KEY, {});
    const openCards = cards.filter((card) => card.status !== 'Done');
    const waitingApproval = [...cards.filter((card) => card.status === 'Waiting Approval'), ...approvals.filter((item) => item.status === 'Pending')];
    const highRisk = cards.filter((card) => card.risk === 'HIGH').length + approvals.filter((item) => item.risk === 'HIGH' && item.status === 'Pending').length + feedback.filter((item) => item.risk === 'HIGH' && item.status !== 'Converted').length;
    const bugs = feedback.filter((item) => item.type === 'Bug' && item.status !== 'Converted');
    const riskFeedback = feedback.filter((item) => item.type === 'Risk' && item.status !== 'Converted');
    const estimatedCost = cost.reduce((sum, item) => sum + (Number(item.estimatedCostUsd ?? item.costUsd ?? 0) || 0), 0);
    const topIdeas = PRODUCT_IDEA_PORTFOLIO.map((idea) => ({ ...idea, score: ideaScore(idea) })).sort((a, b) => b.score - a.score).slice(0, 3);
    const doneCards = cards.filter((card) => card.status === 'Done').length;
    const focusPenalty = Math.min(35, openCards.length * 3 + waitingApproval.length * 5 + highRisk * 6);
    const progressBoost = Math.min(20, doneCards * 4 + Object.keys(factory).length * 2);
    const healthScore = Math.max(0, Math.min(100, 70 - focusPenalty + progressBoost));

    return { cards, approvals, feedback, audit, cost, factory, openCards, waitingApproval, highRisk, bugs, riskFeedback, estimatedCost, topIdeas, healthScore };
  }, []);

  const report = `# AI Daily Standup - LedgerFlow Studio\n\nNgày: ${new Date().toLocaleString('vi-VN')}\nFounder health score: ${data.healthScore}/100 (${healthLabel(data.healthScore)})\n\n## 1. Tình hình hôm nay\n- WorkCards mở: ${data.openCards.length}\n- Đang chờ founder duyệt: ${data.waitingApproval.length}\n- High-risk signals: ${data.highRisk}\n- Feedback bug chưa xử lý: ${data.bugs.length}\n- Feedback risk chưa xử lý: ${data.riskFeedback.length}\n- AI cost ước tính local: $${data.estimatedCost.toFixed(4)}\n\n## 2. Founder cần duyệt trước\n${data.waitingApproval.slice(0, 8).map((item, index) => `${index + 1}. ${'title' in item ? item.title : item.id} [${'risk' in item ? item.risk : 'risk?'}]`).join('\n') || '- Không có mục pending approval.'}\n\n## 3. Top việc AI nên làm tiếp\n${data.openCards.slice(0, 5).map((card, index) => `${index + 1}. ${card.owner} — ${card.title} (${card.status}/${card.risk})`).join('\n') || '- Chưa có WorkCard mở. Tạo việc từ Product Factory hoặc Feedback.'}\n\n## 4. Ý tưởng sản phẩm nên ưu tiên\n${data.topIdeas.map((idea, index) => `${index + 1}. ${idea.idea} — score ${idea.score}; MVP: ${idea.firstMvp}`).join('\n')}\n\n## 5. Rủi ro cần nhớ\n${FOUNDER_RISK_REGISTER.slice(0, 5).map((risk) => `- [${risk.severity}] ${risk.risk}: ${risk.control}`).join('\n')}\n\n## 6. Checklist trước khi ship hôm nay\n${RELEASE_READINESS_CHECKLIST.slice(0, 5).map((item) => `- [ ] ${item}`).join('\n')}\n\n## 7. KPI nhóm đang theo dõi\n${FOUNDER_DAILY_KPI_DASHBOARD.map((item) => `- ${item.group}: ${item.kpis.slice(0, 2).join(', ')}`).join('\n')}\n\n## 8. Recent audit\n${data.audit.slice(0, 8).map((item) => `- ${item.at} | ${item.action} | ${item.detail}`).join('\n') || '- Chưa có audit event.'}\n\nGuardrail: báo cáo này chỉ điều phối việc học/R&D/simulation/Company OS. Không tự thực hiện external action và không thay founder duyệt.`;

  const pushAudit = (detail: string) => {
    const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action: 'DAILY_STANDUP', cardId: 'daily-standup', detail }, ...current].slice(0, 120));
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    pushAudit('Copied AI Daily Standup markdown report.');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const saveSnapshot = () => {
    const current = readLocal<StandupArchive[]>(STANDUP_KEY, []);
    writeLocal(STANDUP_KEY, [{ id: `standup-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), report }, ...current].slice(0, 30));
    pushAudit('Saved AI Daily Standup snapshot to localStorage.');
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="rounded-3xl border border-sky-400/35 bg-sky-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Morning command brief · approval-first</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Daily Standup</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tổng hợp việc đang mở, approval, feedback, risk, cost và audit để founder quyết định hôm nay.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveSnapshot} className="rounded-2xl border border-sky-300/40 px-4 py-2 text-xs font-black text-sky-100">{saved ? 'Đã lưu' : 'Save local snapshot'}</button>
          <button onClick={copyReport} className="rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black text-slate-950">{copied ? 'Đã copy' : 'Copy Markdown'}</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <Metric label="Health" value={`${data.healthScore}/100`} />
        <Metric label="Open cards" value={data.openCards.length} />
        <Metric label="Pending" value={data.waitingApproval.length} />
        <Metric label="High risk" value={data.highRisk} />
        <Metric label="Bugs" value={data.bugs.length} />
        <Metric label="Cost" value={`$${data.estimatedCost.toFixed(2)}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          <Panel title="Founder duyệt trước">
            {data.waitingApproval.slice(0, 6).map((item) => <p key={'id' in item ? item.id : Math.random()} className="text-xs font-semibold leading-5 text-amber-100">• {'title' in item ? item.title : 'Pending item'} ({'risk' in item ? item.risk : 'risk?'})</p>)}
            {data.waitingApproval.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có mục đang chờ duyệt.</p>}
          </Panel>
          <Panel title="Top ideas">
            {data.topIdeas.map((idea) => <p key={idea.idea} className="text-xs font-semibold leading-5 text-emerald-100">• {idea.idea} — {idea.score}</p>)}
          </Panel>
          <Panel title="Risk reminders">
            {FOUNDER_RISK_REGISTER.slice(0, 3).map((risk) => <p key={risk.risk} className="text-xs font-semibold leading-5 text-rose-100">• {risk.risk}</p>)}
          </Panel>
        </div>
        <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">{report}</pre>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-sky-300">{title}</p>{children}</div>;
}
