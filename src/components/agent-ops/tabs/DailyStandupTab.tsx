import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FOUNDER_RISK_REGISTER, PRODUCT_IDEA_PORTFOLIO, RELEASE_READINESS_CHECKLIST } from '../../../data/founderCompanyEnhancements';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_aiops_approvals_v1';
const FEEDBACK_KEY = 'ledgerflow_customer_feedback_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';
const STANDUP_KEY = 'ledgerflow_daily_standup_v1';

type WorkCard = { id?: string; title?: string; status?: string; risk?: string; owner?: string };
type ApprovalRequest = { id?: string; title?: string; status?: string; risk?: string };
type FeedbackItem = { id?: string; type?: string; severity?: string; risk?: string; status?: string; message?: string };
type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };
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

function riskOf(item: { risk?: string; severity?: string }) {
  return item.risk ?? item.severity ?? 'LOW';
}

export default function DailyStandupTab() {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const data = useMemo(() => {
    const cards = readLocal<WorkCard[]>(CARD_KEY, []);
    const approvals = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
    const feedback = readLocal<FeedbackItem[]>(FEEDBACK_KEY, []);
    const audit = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    const openCards = cards.filter((card) => card.status !== 'Done');
    const pendingApprovals = approvals.filter((item) => item.status === 'Pending');
    const highRisk = cards.filter((card) => riskOf(card) === 'HIGH').length + pendingApprovals.filter((item) => riskOf(item) === 'HIGH').length + feedback.filter((item) => riskOf(item) === 'HIGH' && item.status !== 'Converted').length;
    const bugs = feedback.filter((item) => item.type === 'Bug' && item.status !== 'Converted');
    const topIdeas = PRODUCT_IDEA_PORTFOLIO.map((idea) => ({ ...idea, score: ideaScore(idea) })).sort((a, b) => b.score - a.score).slice(0, 3);
    const healthScore = Math.max(0, Math.min(100, 80 - openCards.length * 3 - pendingApprovals.length * 5 - highRisk * 4));
    return { cards, approvals, feedback, audit, openCards, pendingApprovals, highRisk, bugs, topIdeas, healthScore };
  }, []);

  const report = `# AI Daily Standup - LedgerFlow Studio\n\nNgày: ${new Date().toLocaleString('vi-VN')}\nFounder health score: ${data.healthScore}/100\n\n## Tình hình\n- WorkCards mở: ${data.openCards.length}\n- Approval pending: ${data.pendingApprovals.length}\n- High-risk signals: ${data.highRisk}\n- Bug feedback: ${data.bugs.length}\n\n## Founder cần duyệt\n${data.pendingApprovals.map((item, index) => `${index + 1}. ${item.title ?? item.id ?? 'Pending item'} [${riskOf(item)}]`).join('\n') || '- Không có mục pending.'}\n\n## Top ideas\n${data.topIdeas.map((idea, index) => `${index + 1}. ${idea.idea} — score ${idea.score}`).join('\n')}\n\n## Rủi ro cần nhớ\n${FOUNDER_RISK_REGISTER.slice(0, 4).map((risk) => `- [${risk.severity}] ${risk.risk}`).join('\n')}\n\n## Release checklist\n${RELEASE_READINESS_CHECKLIST.slice(0, 5).map((item) => `- [ ] ${item}`).join('\n')}\n\nGuardrail: không tự chạy external action; founder duyệt cuối.`;

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
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Morning command brief · CI-stable</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Daily Standup</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Báo cáo sáng local-first: việc mở, approval, feedback, rủi ro và release checklist.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveSnapshot} className="rounded-2xl border border-sky-300/40 px-4 py-2 text-xs font-black text-sky-100">{saved ? 'Đã lưu' : 'Save snapshot'}</button>
          <button onClick={copyReport} className="rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black text-slate-950">{copied ? 'Đã copy' : 'Copy Markdown'}</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Health" value={`${data.healthScore}/100`} />
        <Metric label="Open cards" value={data.openCards.length} />
        <Metric label="Pending" value={data.pendingApprovals.length} />
        <Metric label="High risk" value={data.highRisk} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="Founder duyệt trước">
          {data.pendingApprovals.slice(0, 6).map((item, index) => <p key={item.id ?? `approval-${index}`} className="text-xs font-semibold leading-5 text-amber-100">• {item.title ?? 'Pending item'} ({riskOf(item)})</p>)}
          {data.pendingApprovals.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có mục đang chờ duyệt.</p>}
        </Panel>
        <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">{report}</pre>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-sky-300">{title}</p>{children}</div>;
}
