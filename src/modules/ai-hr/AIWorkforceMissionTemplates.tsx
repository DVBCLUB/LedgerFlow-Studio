import { useState, type ReactNode } from 'react';
import { ClipboardCopy, Code, Database, FileCheck2, GitPullRequest, Lock, MessageSquare, ShieldCheck, Sparkles, TestTube2 } from 'lucide-react';

type Template = {
  id: string;
  title: string;
  icon: ReactNode;
  tone: string;
  prompt: string;
  outcome: string;
};

const templates: Template[] = [
  {
    id: 'safe-code-review',
    title: 'Safe Code Review',
    icon: <Code className="h-4 w-4" />,
    tone: 'text-cyan-200 border-cyan-500/20 bg-cyan-500/10',
    prompt: 'Review the LedgerFlow codebase area I mention, identify risks, propose a small safe patch plan, and do not modify files until founder approval.',
    outcome: 'Plan + risk list + approval points',
  },
  {
    id: 'build-fix-plan',
    title: 'Build Fix Plan',
    icon: <TestTube2 className="h-4 w-4" />,
    tone: 'text-emerald-200 border-emerald-500/20 bg-emerald-500/10',
    prompt: 'Inspect the latest build or TypeScript failure, summarize the root cause, propose the smallest fix, and prepare a reviewed patch artifact.',
    outcome: 'Root cause + reviewed patch path',
  },
  {
    id: 'approval-audit',
    title: 'Approval Audit',
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: 'text-amber-200 border-amber-500/20 bg-amber-500/10',
    prompt: 'Audit pending AI agent steps, classify risk, explain each approval fingerprint, and recommend approve/reject decisions with reasons.',
    outcome: 'Approval recommendation',
  },
  {
    id: 'memory-curation',
    title: 'Memory Curation',
    icon: <Database className="h-4 w-4" />,
    tone: 'text-violet-200 border-violet-500/20 bg-violet-500/10',
    prompt: 'Search LedgerFlow AI memory for relevant context, remove stale assumptions from the plan, and propose what should become reviewed long-term memory.',
    outcome: 'Memory hits + promotion plan',
  },
  {
    id: 'release-readiness',
    title: 'Release Readiness',
    icon: <FileCheck2 className="h-4 w-4" />,
    tone: 'text-cyan-200 border-cyan-500/20 bg-cyan-500/10',
    prompt: 'Check release readiness for LedgerFlow: lint, build, desktop packaging, AI daemon health, offline readiness, and list blockers before release.',
    outcome: 'Release checklist + blockers',
  },
  {
    id: 'pr-prep',
    title: 'PR Prep',
    icon: <GitPullRequest className="h-4 w-4" />,
    tone: 'text-emerald-200 border-emerald-500/20 bg-emerald-500/10',
    prompt: 'Prepare a pull request description from the latest AI Workforce changes: summarize scope, safety impact, test plan, and rollback notes.',
    outcome: 'PR body + test plan',
  },
  {
    id: 'security-review',
    title: 'Plugin Security Review',
    icon: <Lock className="h-4 w-4" />,
    tone: 'text-rose-200 border-rose-500/20 bg-rose-500/10',
    prompt: 'Review AI plugin and tool execution security. Identify unsafe dynamic loading, missing permission scopes, missing sandboxing, and propose hardening steps.',
    outcome: 'Security hardening plan',
  },
  {
    id: 'telegram-command',
    title: 'Telegram Command Parity',
    icon: <MessageSquare className="h-4 w-4" />,
    tone: 'text-amber-200 border-amber-500/20 bg-amber-500/10',
    prompt: 'Design Telegram command parity for AI Workforce missions: create mission, get status, approve fingerprint, stop mission, and fetch artifact summary.',
    outcome: 'Command spec + safety gates',
  },
];

export default function AIWorkforceMissionTemplates() {
  const [copiedId, setCopiedId] = useState('');

  const copy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.prompt);
      setCopiedId(template.id);
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      setCopiedId('copy_failed');
      window.setTimeout(() => setCopiedId(''), 1600);
    }
  };

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Sparkles className="mr-2 inline h-4 w-4" />Mission Templates</p>
        <h3 className="mt-2 text-lg font-black text-white">Lệnh mẫu cho AI Workforce</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Bấm copy rồi dán vào Mission Builder hoặc Command Chat. Các mẫu này ưu tiên an toàn, review được và có approval gate.</p>
      </div>
      {copiedId && <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-200">{copiedId === 'copy_failed' ? 'Không copy được' : 'Đã copy prompt'}</p>}
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {templates.map((template) => <button key={template.id} onClick={() => void copy(template)} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/80">
        <div className={`mb-3 inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-black ${template.tone}`}>{template.icon}{template.title}</div>
        <p className="line-clamp-4 text-xs font-semibold leading-5 text-slate-300">{template.prompt}</p>
        <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold text-slate-500">Output: {template.outcome}</p>
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-cyan-300"><ClipboardCopy className="mr-1 inline h-3.5 w-3.5" />Copy Prompt</p>
      </button>)}
    </div>
  </section>;
}
