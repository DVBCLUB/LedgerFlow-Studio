import { useMemo } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion } from '../storage';

const PROJECTS_CORE_KEY = 'ledgerflow_projects_delivery_core_v1';
const FINANCE_CORE_KEY = 'ledgerflow_finance_core_v1';

type ProjectRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type ProjectItem = {
  id: string;
  name: string;
  client: string;
  stage: string;
  risk: ProjectRisk;
  owner: string;
  milestone: string;
  blocker: string;
  acceptance: string;
  budget?: number;
  actual?: number;
  financeStatus?: string;
  deliveryStatus?: string;
  evidenceLinks?: string;
  riskLog?: string;
  handoverChecklist?: string;
};

type FinanceItem = {
  id: string;
  title: string;
  projectName?: string;
  amount: number;
  kind: string;
  status: string;
};

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

function makeReport(projects: ProjectItem[], financeItems: FinanceItem[]) {
  const open = projects.filter((project) => project.stage !== 'Delivered' && project.stage !== 'Blocked');
  const blocked = projects.filter((project) => project.stage === 'Blocked' || project.deliveryStatus === 'Blocked' || Boolean(project.blocker.trim()));
  const highRisk = projects.filter((project) => project.risk === 'HIGH');
  const readyReview = projects.filter((project) => project.deliveryStatus === 'Ready for Review');
  const accepted = projects.filter((project) => project.deliveryStatus === 'Accepted' || project.deliveryStatus === 'Closed');
  const missingEvidence = projects.filter((project) => !project.evidenceLinks?.trim() || !project.handoverChecklist?.trim());
  const overBudget = projects.filter((project) => toNumber(project.budget) > 0 && toNumber(project.actual) > toNumber(project.budget));
  const projectFinance = projects.map((project) => {
    const linked = financeItems.filter((item) => (item.projectName || '').trim().toLowerCase() === project.name.trim().toLowerCase());
    return {
      project,
      financeCount: linked.length,
      financeTotal: linked.reduce((sum, item) => sum + toNumber(item.amount), 0)
    };
  });
  const withoutFinance = projectFinance.filter((item) => item.financeCount === 0);
  return { open, blocked, highRisk, readyReview, accepted, missingEvidence, overBudget, projectFinance, withoutFinance };
}

function reportMarkdown(projects: ProjectItem[], financeItems: FinanceItem[]) {
  const report = makeReport(projects, financeItems);
  return [
    '# Projects & Delivery Report',
    '',
    `- Projects: ${projects.length}`,
    `- Open: ${report.open.length}`,
    `- Blocked: ${report.blocked.length}`,
    `- High risk: ${report.highRisk.length}`,
    `- Ready for review: ${report.readyReview.length}`,
    `- Accepted/Closed: ${report.accepted.length}`,
    `- Missing evidence/handover: ${report.missingEvidence.length}`,
    `- Over budget: ${report.overBudget.length}`,
    `- Without finance link: ${report.withoutFinance.length}`,
    '',
    '## Blockers / review',
    ...report.blocked.concat(report.readyReview).slice(0, 12).map((project) => `- ${project.name} · ${project.client} · ${project.stage} · ${project.deliveryStatus || 'Unknown'} · blocker: ${project.blocker || 'none'}`),
    '',
    '## Finance link',
    ...report.projectFinance.slice(0, 12).map((item) => `- ${item.project.name}: ${item.financeCount} finance rows · total ${formatVnd(item.financeTotal)} · budget ${formatVnd(toNumber(item.project.budget))} · actual ${formatVnd(toNumber(item.project.actual))}`)
  ].join('\n');
}

export default function ProjectReportsTab() {
  useLocalStorageVersion();
  const projects = readLocalStorageValue<ProjectItem[]>(PROJECTS_CORE_KEY, []);
  const financeItems = readLocalStorageValue<FinanceItem[]>(FINANCE_CORE_KEY, []);
  const report = useMemo(() => makeReport(projects, financeItems), [projects, financeItems]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportMarkdown(projects, financeItems));
    appendAgentOpsAudit('PROJECT_REPORT_COPIED', 'project-reports', `Copied project report · ${projects.length} projects`);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Projects & Delivery v3</p>
          <h3 className="mt-1 text-xl font-black text-white">Project Reports</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Báo cáo dự án, milestone, nghiệm thu, evidence, handover, rủi ro và liên kết tài chính.</p>
        </div>
        <button onClick={copyReport} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10">Copy report</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {[
          ['Open', report.open.length],
          ['Blocked', report.blocked.length],
          ['High risk', report.highRisk.length],
          ['Ready review', report.readyReview.length],
          ['Missing evidence', report.missingEvidence.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Blockers / Review</p>
          <div className="mt-3 grid gap-2">
            {report.blocked.concat(report.readyReview).slice(0, 8).map((project) => (
              <p key={project.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
                <span className="text-amber-200">{project.name}</span> · {project.client}<br />{project.stage} · {project.deliveryStatus || 'Unknown'} · blocker: {project.blocker || 'none'}
              </p>
            ))}
            {report.blocked.length + report.readyReview.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có blocker hoặc review pending.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Evidence / Handover missing</p>
          <div className="mt-3 grid gap-2">
            {report.missingEvidence.slice(0, 8).map((project) => (
              <p key={project.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
                <span className="text-cyan-200">{project.name}</span><br />Evidence: {project.evidenceLinks ? 'ok' : 'missing'} · Handover: {project.handoverChecklist ? 'ok' : 'missing'}
              </p>
            ))}
            {report.missingEvidence.length === 0 && <p className="text-xs font-semibold text-slate-500">Evidence và handover đã đủ.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Finance link</p>
          <div className="mt-3 grid gap-2">
            {report.projectFinance.slice(0, 8).map((item) => (
              <p key={item.project.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
                <span className="text-emerald-200">{item.project.name}</span><br />Finance rows: {item.financeCount} · Total: {formatVnd(item.financeTotal)} · Variance: {formatVnd(toNumber(item.project.actual) - toNumber(item.project.budget))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
