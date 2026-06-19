import { Clipboard, Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MARKETING_V2_EXECUTION_BOARD } from '../data/marketingV2ExecutionBoard';
import { MARKETING_V2_LAUNCH_CHECKS, MARKETING_V2_LAUNCH_PLAYBOOK } from '../data/marketingV2LaunchPlaybook';
import { MARKETING_V2_NEXT_CHECKS, MARKETING_V2_ROLLOUT_STATUS } from '../data/marketingV2RolloutStatus';

function buildMarketingV2Markdown(): string {
  const lines: string[] = [
    '# LedgerFlow Marketing V2 Export Pack',
    '',
    'Generated from offline-first Marketing V2 workspace data.',
    '',
    '## 1. Rollout Status',
    '',
  ];

  for (const item of MARKETING_V2_ROLLOUT_STATUS) {
    lines.push(`### ${item.title}`);
    lines.push(`- Status: ${item.status}`);
    lines.push(`- Area: ${item.area}`);
    lines.push(`- Summary: ${item.summary}`);
    lines.push(`- Next action: ${item.nextAction}`);
    lines.push(`- Files: ${item.filePaths.join(', ')}`);
    lines.push('');
  }

  lines.push('## 2. Execution Board', '');
  for (const item of MARKETING_V2_EXECUTION_BOARD) {
    lines.push(`### ${item.title}`);
    lines.push(`- Status: ${item.status}`);
    lines.push(`- Owner: ${item.owner}`);
    lines.push(`- Why it matters: ${item.whyItMatters}`);
    lines.push(`- Next action: ${item.nextAction}`);
    lines.push(`- Related files: ${item.relatedFiles.join(', ')}`);
    lines.push('');
  }

  lines.push('## 3. Launch Playbook', '');
  for (const stage of MARKETING_V2_LAUNCH_PLAYBOOK) {
    lines.push(`### ${stage.stage.toUpperCase()} — ${stage.title}`);
    lines.push(`- Owner: ${stage.owner}`);
    lines.push(`- Goal: ${stage.goal}`);
    lines.push('- Actions:');
    for (const action of stage.actions) lines.push(`  - ${action}`);
    lines.push('- Evidence:');
    for (const evidence of stage.evidence) lines.push(`  - ${evidence}`);
    lines.push(`- Related module: ${stage.relatedModule}`);
    lines.push('');
  }

  lines.push('## 4. Checks', '');
  for (const check of MARKETING_V2_NEXT_CHECKS) lines.push(`- ${check}`);
  for (const check of MARKETING_V2_LAUNCH_CHECKS) lines.push(`- ${check}`);

  lines.push('', '## Human review note', 'AI-generated copy, lead scoring, outbound messages, and marketing recommendations must be reviewed by the founder before publishing or contacting customers.');

  return lines.join('\n');
}

export default function MarketingV2ExportPackPanel() {
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(() => buildMarketingV2Markdown(), []);

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ledgerflow-marketing-v2-export-pack.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Marketing V2 · export pack</p>
          <h3 className="mt-1 text-xl font-black text-white">Bộ xuất kế hoạch Marketing V2</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
            Xuất toàn bộ rollout status, execution board, launch playbook và checklist thành Markdown để gửi sếp,
            lưu hồ sơ dự án hoặc dán qua Codex/Claude Code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyMarkdown}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300 hover:text-cyan-200"
          >
            <Clipboard size={14} /> {copied ? 'Đã copy' : 'Copy Markdown'}
          </button>
          <button
            onClick={downloadMarkdown}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200"
          >
            <Download size={14} /> Tải .md
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
          <FileText size={16} className="text-cyan-300" /> Preview Markdown
        </div>
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">
          {markdown}
        </pre>
      </div>
    </section>
  );
}
