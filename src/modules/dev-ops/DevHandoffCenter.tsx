import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  Github,
  Loader2,
  MonitorUp,
  Send,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';
import { appendIntegrationEvent } from '../../utils/integrationHubApi';

const repoUrl = 'https://github.com/DVBCLUB/LedgerFlow-Studio';
const actionsUrl = `${repoUrl}/actions`;
const issuesUrl = `${repoUrl}/issues`;
const inputClass = 'w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20';
const primaryButtonClass = 'inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-xs font-black text-cyan-100 hover:border-cyan-300 hover:bg-cyan-900/40';
const mutedButtonClass = 'inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500 hover:bg-slate-800';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'dev-task';
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DevHandoffCenter() {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [constraints, setConstraints] = useState('Không làm vỡ AI Gateway, Integration Hub, endpoint AI legacy/backend; không commit .env hoặc file vault/log local.');
  const [files, setFiles] = useState('src/components/\nserver/services/\nserver.ts\ndocs/');
  const [acceptance, setAcceptance] = useState('npm run lint xanh\nnpm run build xanh\nGitHub Actions xanh\nCó mô tả file đã sửa và cách test');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const branchName = useMemo(() => `feature/${slugify(title || goal)}`, [goal, title]);

  const prompt = useMemo(() => {
    const safeTitle = title.trim() || 'Yêu cầu phát triển LedgerFlow Studio';
    const safeGoal = goal.trim() || 'Mô tả yêu cầu chưa được nhập. Hãy hỏi lại trước khi sửa code.';
    return `# LedgerFlow Studio — Dev Handoff Prompt\n\n## Vai trò\nBạn là AI coding agent hỗ trợ phát triển repo LedgerFlow-Studio. Hãy làm theo kiểu kỹ sư phần mềm cẩn thận: đọc code trước, lên plan, sửa tối thiểu, giữ logic nghiệp vụ hiện có, không phá build.\n\n## Repo\n- GitHub: ${repoUrl}\n- Nhánh đề xuất: ${branchName}\n\n## Yêu cầu\n${safeTitle}\n\n## Mục tiêu nghiệp vụ / sản phẩm\n${safeGoal}\n\n## Ràng buộc không được vi phạm\n${constraints || '- Không xóa logic fallback/error handling hiện có.\n- Không commit secrets.'}\n\n## File/khu vực nên kiểm tra trước\n${files || '- Hãy tự tìm file liên quan bằng search trong repo.'}\n\n## Quy trình bắt buộc\n1. Đọc các file liên quan trước khi sửa.\n2. Tóm tắt nguyên nhân/cách thiết kế.\n3. Sửa theo patch nhỏ, có thể review được.\n4. Không xóa logic cũ nếu không có lý do rõ.\n5. Chạy/check các lệnh kiểm thử.\n6. Nếu lỗi, phân tích log rồi sửa tiếp.\n\n## Acceptance checklist\n${acceptance || '- npm run build xanh'}\n\n## Báo cáo sau khi làm\n- File đã sửa/thêm\n- Tóm tắt thay đổi từng file\n- Cách test\n- Rủi ro còn lại\n`;
  }, [acceptance, branchName, constraints, files, goal, title]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setMessage('Đã copy prompt cho VS Code / Cursor / Copilot.');
    await appendIntegrationEvent('vscode-cursor', {
      type: 'handoff',
      level: 'success',
      message: `Copied dev handoff prompt: ${title || 'Untitled task'}`,
    }).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function exportTask() {
    const filename = `ledgerflow-dev-task-${slugify(title || goal)}.md`;
    downloadText(filename, prompt);
    setMessage(`Đã xuất ${filename}.`);
    await appendIntegrationEvent('vscode-cursor', {
      type: 'handoff',
      level: 'success',
      message: `Exported dev task markdown: ${filename}`,
    }).catch(() => undefined);
  }

  async function openTool(url: string, label: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
    await appendIntegrationEvent('vscode-cursor', {
      type: 'handoff',
      level: 'info',
      message: `Opened ${label} from Dev Handoff Center.`,
    }).catch(() => undefined);
  }

  async function createIssueDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const issueTitle = encodeURIComponent(title || 'Dev task from LedgerFlow');
      const issueBody = encodeURIComponent(prompt);
      await openTool(`${issuesUrl}/new?title=${issueTitle}&body=${issueBody}`, 'GitHub issue draft');
      setMessage('Đã mở GitHub issue draft. Bạn kiểm tra rồi bấm Submit trên GitHub.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/50 shadow-2xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <TerminalSquare className="h-4 w-4" /> VS Code / Cursor Handoff v1
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Dev Handoff Center</h1>
            <p className="max-w-3xl text-sm font-semibold leading-7 text-slate-300">
              LedgerFlow không clone VS Code/Cursor. Nó chuẩn hóa yêu cầu, sinh prompt kỹ thuật, mở đúng công cụ, ghi log handoff và buộc AI coder đi theo checklist an toàn.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard icon={Github} title="GitHub" text="Issue, Actions, repo." />
              <InfoCard icon={MonitorUp} title="VS Code/Cursor" text="Xưởng code thật." />
              <InfoCard icon={Sparkles} title="AI Gateway" text="Sinh spec/prompt, fallback model." />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Luật an toàn
            </div>
            <ul className="mt-4 space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <li>AI coder chỉ nhận prompt/issue/checklist; không được tự đụng secrets.</li>
              <li>Mọi thay đổi phải qua build: <code className="rounded bg-slate-900 px-1">npm run lint</code> và <code className="rounded bg-slate-900 px-1">npm run build</code>.</li>
              <li>CI GitHub Actions là trọng tài cuối trước khi coi là xong.</li>
            </ul>
            {message && <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs font-bold text-cyan-100">{message}</div>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
            <FileText className="h-4 w-4 text-cyan-300" /> Nhập yêu cầu phát triển
          </div>
          <Field label="Tiêu đề task">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Thêm Google Workspace connector v1" className={inputClass} />
          </Field>
          <Field label="Mục tiêu nghiệp vụ / sản phẩm">
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={6} placeholder="Mô tả bạn muốn phần mềm làm gì, người dùng bấm ở đâu, kết quả ra sao..." className={`${inputClass} resize-y`} />
          </Field>
          <Field label="Ràng buộc không được vi phạm">
            <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={4} className={`${inputClass} resize-y`} />
          </Field>
          <Field label="File/khu vực nên kiểm tra trước">
            <textarea value={files} onChange={(event) => setFiles(event.target.value)} rows={4} className={`${inputClass} resize-y font-mono`} />
          </Field>
          <Field label="Acceptance checklist">
            <textarea value={acceptance} onChange={(event) => setAcceptance(event.target.value)} rows={4} className={`${inputClass} resize-y`} />
          </Field>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Clipboard className="h-4 w-4 text-emerald-300" /> Prompt bàn giao cho AI coder
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">Branch đề xuất: <span className="text-cyan-200">{branchName}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyPrompt()} className={primaryButtonClass}>
                <Clipboard className="h-3.5 w-3.5" /> {copied ? 'Đã copy' : 'Copy prompt'}
              </button>
              <button type="button" onClick={() => void exportTask()} className={mutedButtonClass}>
                <Download className="h-3.5 w-3.5" /> Export .md
              </button>
            </div>
          </div>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs font-semibold leading-6 text-slate-200">{prompt}</pre>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <ActionButton icon={Github} label="Mở repo" onClick={() => void openTool(repoUrl, 'GitHub repo')} />
        <ActionButton icon={ExternalLink} label="Mở Actions" onClick={() => void openTool(actionsUrl, 'GitHub Actions')} />
        <ActionButton icon={Send} label="Tạo issue draft" busy={busy} onClick={() => void createIssueDraft()} />
        <ActionButton icon={TerminalSquare} label="Mở hướng dẫn VS Code" onClick={() => window.open('vscode://file/', '_blank')} />
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <div className="text-sm font-black text-white">{title}</div>
      <div className="mt-1 text-xs font-semibold text-slate-500">{text}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, busy }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; busy?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm font-black text-slate-100 hover:border-cyan-500 hover:bg-cyan-950/30 disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
