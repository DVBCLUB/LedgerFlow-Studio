import { useState } from 'react';
import {
  FOUNDER_DAILY_KPI_DASHBOARD,
  FOUNDER_RISK_REGISTER,
  PRODUCT_IDEA_PORTFOLIO,
  RELEASE_READINESS_CHECKLIST
} from '../../../data/founderCompanyEnhancements';
import { AGENT_OPS_AUDIT_KEY, appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, type AgentOpsAuditEntry } from '../storage';

const FACTORY_STATE_KEY = 'ledgerflow_product_factory_state_v1';
const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const PROMPT_PACK_KEY = 'ledgerflow_prompt_pack_v1';
const DECISION_KEY = 'ledgerflow-founder-decision-log-v1';

function ideaScore(idea: { pain: number; mvpCheapness: number; distribution: number; technicalRisk: number }) {
  return Math.round(idea.pain * 3 + idea.mvpCheapness * 2 + idea.distribution * 1.5 - idea.technicalRisk * 1.5);
}

function buildSnapshot() {
  const cards = readLocalStorageValue<unknown[]>(CARD_KEY, []);
  const approvals = readLocalStorageValue<unknown[]>(APPROVAL_KEY, []);
  const prompts = readLocalStorageValue<unknown[]>(PROMPT_PACK_KEY, []);
  const decisions = readLocalStorageValue<unknown[]>(DECISION_KEY, []);
  const factoryState = readLocalStorageValue<Record<string, string>>(FACTORY_STATE_KEY, {});
  const audit = readLocalStorageValue<AgentOpsAuditEntry[]>(AGENT_OPS_AUDIT_KEY, []);
  const topIdeas = PRODUCT_IDEA_PORTFOLIO
    .map((idea) => ({ ...idea, score: ideaScore(idea) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const kpiText = FOUNDER_DAILY_KPI_DASHBOARD.map((item) => `### ${item.group}\nPurpose: ${item.purpose}\nKPI: ${item.kpis.join(', ')}\nWarning: ${item.warning}`).join('\n\n');
  const ideaText = topIdeas.map((idea, index) => `${index + 1}. ${idea.idea} — score ${idea.score}\n   MVP: ${idea.firstMvp}\n   Monetization: ${idea.monetization}`).join('\n');
  const factoryText = Object.entries(factoryState).map(([idea, status]) => `- ${idea}: ${status}`).join('\n') || '- No tracked product factory state yet.';
  const riskText = FOUNDER_RISK_REGISTER.map((risk) => `- [${risk.severity}] ${risk.risk}: ${risk.control}`).join('\n');
  const releaseText = RELEASE_READINESS_CHECKLIST.map((item) => `- [ ] ${item}`).join('\n');
  const auditText = audit.slice(0, 12).map((item) => `- ${item.at} | ${item.action} | ${item.cardId} | ${item.detail}`).join('\n') || '- No local audit event yet.';

  return [
    '# LedgerFlow Studio - Company Memory Snapshot',
    '',
    `Generated: ${new Date().toLocaleString('vi-VN')}`,
    '',
    '## Product Boundary',
    'LedgerFlow Studio is a learning, R&D, simulation and Company OS workspace. Founder keeps final approval.',
    '',
    '## Operating Counts',
    `- WorkCards: ${cards.length}`,
    `- Approval requests: ${approvals.length}`,
    `- Custom prompt pack items: ${prompts.length}`,
    `- Decision log items: ${decisions.length}`,
    `- Product Factory tracked ideas: ${Object.keys(factoryState).length}`,
    `- Recent audit events: ${audit.length}`,
    '',
    '## Founder KPI Groups',
    kpiText,
    '',
    '## Top Ideas',
    ideaText,
    '',
    '## Product Factory State',
    factoryText,
    '',
    '## Risk Register',
    riskText,
    '',
    '## Release Readiness',
    releaseText,
    '',
    '## Recent Audit Trail',
    auditText
  ].join('\n');
}

export default function CompanyMemoryTab() {
  const [copied, setCopied] = useState(false);
  useLocalStorageVersion();
  const snapshot = buildSnapshot();
  const auditCount = readLocalStorageValue<AgentOpsAuditEntry[]>(AGENT_OPS_AUDIT_KEY, []).length;

  const copySnapshot = async () => {
    await navigator.clipboard.writeText(snapshot);
    appendAgentOpsAudit('COMPANY_MEMORY_SNAPSHOT', 'company-memory', 'Copied markdown company memory snapshot to clipboard.');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Weekly snapshot · markdown export · offline-ready</p>
          <h3 className="mt-1 text-xl font-black text-white">Company Memory</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tạo snapshot để gửi cho AI agent ở cuộc trò chuyện mới, giữ lịch sử quyết định và rủi ro.</p>
        </div>
        <button onClick={copySnapshot} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">{copied ? 'Đã copy snapshot' : 'Copy Markdown Snapshot'}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="KPI groups" value={FOUNDER_DAILY_KPI_DASHBOARD.length} />
        <Metric label="Ideas" value={PRODUCT_IDEA_PORTFOLIO.length} />
        <Metric label="Risks" value={FOUNDER_RISK_REGISTER.length} />
        <Metric label="Release checks" value={RELEASE_READINESS_CHECKLIST.length} />
        <Metric label="Local audit" value={auditCount} />
      </div>

      <pre className="mt-4 max-h-[560px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">{snapshot}</pre>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}
