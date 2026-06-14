import { useMemo } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion } from '../storage';

const FINANCE_CORE_KEY = 'ledgerflow_finance_core_v1';
const PROJECTS_CORE_KEY = 'ledgerflow_projects_delivery_core_v1';

type FinanceKind = 'Cashflow' | 'Budget' | 'Invoice' | 'Payment' | 'Tax' | 'Payroll' | 'Procurement' | 'Report' | 'Receivable' | 'Payable' | 'Advance' | 'Settlement';
type FinanceRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type FinanceItem = {
  id: string;
  title: string;
  kind: FinanceKind;
  risk: FinanceRisk;
  status: string;
  amount: number;
  counterparty: string;
  period: string;
  projectName?: string;
  accountingFlow?: 'Inflow' | 'Outflow' | 'Non-cash' | 'Mixed';
  settlementStatus?: 'Open' | 'Partially Settled' | 'Settled' | 'Overdue' | 'Disputed' | 'Missing Document';
  dueDate?: string;
  documentNo?: string;
  taxNote?: string;
};

type ProjectItem = {
  id: string;
  name: string;
  budget?: number;
  actual?: number;
  financeStatus?: string;
};

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

function isOverdue(item: FinanceItem) {
  if (item.settlementStatus === 'Overdue') return true;
  if (!item.dueDate || item.settlementStatus === 'Settled') return false;
  const due = new Date(item.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

function makeReport(items: FinanceItem[], projects: ProjectItem[]) {
  const inflow = items.filter((item) => item.accountingFlow === 'Inflow').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const outflow = items.filter((item) => item.accountingFlow === 'Outflow').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const receivable = items.filter((item) => item.kind === 'Receivable' && item.settlementStatus !== 'Settled');
  const payable = items.filter((item) => item.kind === 'Payable' && item.settlementStatus !== 'Settled');
  const advance = items.filter((item) => item.kind === 'Advance' && item.settlementStatus !== 'Settled');
  const settlement = items.filter((item) => item.kind === 'Settlement');
  const overdue = items.filter(isOverdue);
  const missingDocs = items.filter((item) => !item.documentNo || item.settlementStatus === 'Missing Document');
  const approvalQueue = items.filter((item) => item.risk === 'HIGH' || item.status === 'Review' || item.settlementStatus === 'Disputed');
  const projectVariance = projects.map((project) => ({
    name: project.name,
    budget: toNumber(project.budget),
    actual: toNumber(project.actual),
    variance: toNumber(project.actual) - toNumber(project.budget),
    financeStatus: project.financeStatus || 'Unknown'
  })).filter((project) => project.budget || project.actual || project.financeStatus !== 'Unknown');

  return { inflow, outflow, net: inflow - outflow, receivable, payable, advance, settlement, overdue, missingDocs, approvalQueue, projectVariance };
}

function reportMarkdown(items: FinanceItem[], projects: ProjectItem[]) {
  const report = makeReport(items, projects);
  return [
    '# Finance & Accounting Report',
    '',
    `- Cash inflow: ${formatVnd(report.inflow)}`,
    `- Cash outflow: ${formatVnd(report.outflow)}`,
    `- Net cash: ${formatVnd(report.net)}`,
    `- Receivable open: ${report.receivable.length}`,
    `- Payable open: ${report.payable.length}`,
    `- Advance open: ${report.advance.length}`,
    `- Settlement rows: ${report.settlement.length}`,
    `- Overdue: ${report.overdue.length}`,
    `- Missing documents: ${report.missingDocs.length}`,
    `- Need approval/review: ${report.approvalQueue.length}`,
    '',
    '## Overdue / Missing Docs',
    ...report.overdue.concat(report.missingDocs).slice(0, 12).map((item) => `- ${item.title} · ${item.kind} · ${formatVnd(item.amount)} · ${item.counterparty} · due ${item.dueDate || 'n/a'} · doc ${item.documentNo || 'missing'}`),
    '',
    '## Project budget variance',
    ...report.projectVariance.slice(0, 12).map((project) => `- ${project.name}: budget ${formatVnd(project.budget)} · actual ${formatVnd(project.actual)} · variance ${formatVnd(project.variance)} · ${project.financeStatus}`)
  ].join('\n');
}

export default function FinanceReportsTab() {
  useLocalStorageVersion();
  const financeItems = readLocalStorageValue<FinanceItem[]>(FINANCE_CORE_KEY, []);
  const projects = readLocalStorageValue<ProjectItem[]>(PROJECTS_CORE_KEY, []);
  const report = useMemo(() => makeReport(financeItems, projects), [financeItems, projects]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportMarkdown(financeItems, projects));
    appendAgentOpsAudit('FINANCE_REPORT_COPIED', 'finance-reports', `Copied finance report · ${financeItems.length} items · ${projects.length} projects`);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Finance & Accounting v3</p>
          <h3 className="mt-1 text-xl font-black text-white">Finance Reports</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Sổ tiền, công nợ, tạm ứng/hoàn ứng, chứng từ thiếu, hạn thanh toán và chênh lệch ngân sách dự án.</p>
        </div>
        <button onClick={copyReport} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10">Copy report</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {[
          ['Inflow', formatVnd(report.inflow)],
          ['Outflow', formatVnd(report.outflow)],
          ['Net', formatVnd(report.net)],
          ['Overdue', String(report.overdue.length)],
          ['Missing docs', String(report.missingDocs.length)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {[
          ['Receivable open', report.receivable.length],
          ['Payable open', report.payable.length],
          ['Advance open', report.advance.length],
          ['Need approval', report.approvalQueue.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-black text-slate-300">{label}</p>
            <p className="mt-2 text-2xl font-black text-emerald-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Overdue / Missing documents</p>
          <div className="mt-3 grid gap-2">
            {report.overdue.concat(report.missingDocs).slice(0, 10).map((item) => (
              <p key={`${item.id}-${item.documentNo || 'missing'}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
                <span className="text-amber-200">{item.title}</span> · {item.kind} · {formatVnd(item.amount)} · {item.counterparty}<br />Due: {item.dueDate || 'n/a'} · Doc: {item.documentNo || 'missing'} · {item.settlementStatus || 'Open'}
              </p>
            ))}
            {report.overdue.length + report.missingDocs.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có dòng quá hạn hoặc thiếu chứng từ.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Project budget variance</p>
          <div className="mt-3 grid gap-2">
            {report.projectVariance.slice(0, 10).map((project) => (
              <p key={project.name} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
                <span className="text-cyan-200">{project.name}</span> · {project.financeStatus}<br />Budget: {formatVnd(project.budget)} · Actual: {formatVnd(project.actual)} · Variance: {formatVnd(project.variance)}
              </p>
            ))}
            {report.projectVariance.length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có ngân sách/thực tế dự án để đối chiếu.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
