import { useMemo, useState } from 'react';

const TASK_TYPES = ['Bug Fix', 'New Feature', 'Refactor', 'Test', 'DevOps'] as const;
const AGENT_ROLES = [
  'Chief of Staff',
  'AI CFO',
  'AI Dev',
  'AI DevOps',
  'AI PM',
  'AI Designer',
  'AI Game Dev',
  'AI QA',
  'AI Marketer',
  'AI Research',
  'AI Sales',
  'AI Accountant',
  'AI Auditor',
  'AI Legal',
  'AI Onboarding',
  'AI Support',
  'AI Analyst',
] as const;

const DEFAULT_CONTEXT_FILES = [
  'server.ts',
  'server/services/githubConnector.ts',
  'src/components/agent-ops/AgentOpsHub.tsx',
  'src/components/agent-ops/agentOpsNavigation.ts',
  'src/components/agent-ops/tabs/WorkboardTab.tsx',
  'src/types/agentOps.ts',
  'package.json',
];

type PromptTask = {
  type: string;
  description: string;
  contextFiles: string[];
  acceptanceCriteria: string;
  agentRole: string;
};

function buildCodexPrompt(task: PromptTask): string {
  return `# LedgerFlow Studio — ${task.type} Task

## Agent Role
${task.agentRole}

## Task Description
${task.description || 'Mô tả task cụ thể ở đây.'}

## Context Files
${task.contextFiles.length ? task.contextFiles.map((file) => `- \`${file}\``).join('\n') : '- `TODO: add relevant files`'}

## Acceptance Criteria
${task.acceptanceCriteria || '- npm run lint && npm run build pass\n- Không break existing features'}

## Stack
React 19 + TypeScript + Vite + Express.js + Supabase + Electron
Theme: dark slate (bg-slate-950, text-slate-100, accent cyan-400)

## Rules
- Không push main — tạo branch + Draft PR
- Không gọi AI từ frontend — chỉ qua /api/
- Chạy: npm run lint && npm run build sau khi xong
- Không break existing features`;
}

export default function CodexPromptBuilderTab() {
  const [taskType, setTaskType] = useState<(typeof TASK_TYPES)[number]>('New Feature');
  const [agentRole, setAgentRole] = useState<(typeof AGENT_ROLES)[number]>('AI Dev');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('- Implement đúng brief Claude\n- Có UI dark slate nếu là frontend\n- npm run lint && npm run build pass');
  const [selectedFiles, setSelectedFiles] = useState<string[]>(['server.ts', 'src/components/agent-ops/AgentOpsHub.tsx']);
  const [customFile, setCustomFile] = useState('');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildCodexPrompt({ type: taskType, description, contextFiles: selectedFiles, acceptanceCriteria, agentRole }),
    [acceptanceCriteria, agentRole, description, selectedFiles, taskType],
  );

  function toggleFile(file: string) {
    setSelectedFiles((current) => current.includes(file) ? current.filter((item) => item !== file) : [...current, file]);
  }

  function addCustomFile() {
    const normalized = customFile.trim().replace(/^\/+/, '');
    if (!normalized || selectedFiles.includes(normalized)) return;
    setSelectedFiles((current) => [...current, normalized]);
    setCustomFile('');
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Claude Code Bridge</p>
          <h3 className="mt-1 text-lg font-black text-white">Codex / Claude Prompt Builder</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tạo prompt chuẩn theo brief: task type, context files, acceptance criteria và rules chống phá main.</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task type</span>
            <select value={taskType} onChange={(event) => setTaskType(event.target.value as typeof taskType)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {TASK_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agent role</span>
            <select value={agentRole} onChange={(event) => setAgentRole(event.target.value as typeof agentRole)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {AGENT_ROLES.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
        </div>

        <label className="mt-3 block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Ví dụ: Implement Task F — DevRoomHub với 5 tabs theo brief Claude..." />
        </label>

        <label className="mt-3 block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Acceptance criteria</span>
          <textarea value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
        </label>

        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Context files</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONTEXT_FILES.map((file) => (
              <button key={file} onClick={() => toggleFile(file)} className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${selectedFiles.includes(file) ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-400 hover:border-cyan-300 hover:text-cyan-100'}`}>
                {file}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customFile} onChange={(event) => setCustomFile(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addCustomFile(); }} className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Thêm file path khác..." />
            <button onClick={addCustomFile} className="rounded-2xl border border-cyan-400/50 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10">Thêm</button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Output</p>
            <h3 className="mt-1 text-lg font-black text-white">Prompt sẵn copy</h3>
          </div>
          <button onClick={copyPrompt} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">{copied ? 'Đã copy' : 'Copy prompt'}</button>
        </div>
        <pre className="mt-4 max-h-[680px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-200">{prompt}</pre>
      </section>
    </div>
  );
}
