import { useEffect, useMemo, useState } from 'react';

type RuntimeStatus = 'Idle' | 'Planning' | 'Prepared Patch' | 'Waiting Review Desk' | 'Blocked';
type RuntimeStepStatus = 'Todo' | 'Running' | 'Done' | 'Blocked';

type AgentSession = {
  id: string;
  title: string;
  kind?: string;
  risk?: string;
  goal?: string;
  status?: string;
};

type Skill = {
  id?: string;
  name?: string;
  category?: string;
  owner?: string;
  systemPrompt?: string;
  checklist?: string;
  allowedTools?: string;
  blockedTools?: string;
  outputFormat?: string;
  status?: string;
};

type Memory = {
  id?: string;
  title?: string;
  type?: string;
  content?: string;
  tags?: string;
  risk?: string;
};

type RuntimeRun = {
  id: string;
  at: string;
  sessionId?: string;
  title: string;
  status: RuntimeStatus;
  selectedSkill?: string;
  selectedMemory: string[];
  plan: string[];
  patchPath: string;
  patchContent: string;
  notes: string;
};

type RuntimeStep = {
  id: string;
  title: string;
  status: RuntimeStepStatus;
  detail: string;
};

const RUNS_KEY = 'ledgerflow_agent_runtime_runs_v1';
const SESSIONS_KEY = 'ledgerflow_agent_sessions_v1';
const SKILLS_KEY = 'ledgerflow_agent_skills_v1';
const MEMORY_KEY = 'ledgerflow_project_memory_v1';
const DIFF_PREFILL_KEY = 'ledgerflow_patch_diff_runtime_prefill_v1';
const REVIEW_PREFILL_KEY = 'ledgerflow_review_desk_prefill_v1';
const AUDIT_KEY = 'ledgerflow_agent_runtime_audit_v1';

const steps: RuntimeStep[] = [
  { id: 'session', title: 'Đọc session', status: 'Todo', detail: 'Lấy mục tiêu và risk từ Agent Sessions.' },
  { id: 'skill', title: 'Chọn skill', status: 'Todo', detail: 'Chọn prompt/skill phù hợp từ Skill Registry.' },
  { id: 'memory', title: 'Gom memory/context', status: 'Todo', detail: 'Lấy quyết định, guardrail, CI pattern liên quan.' },
  { id: 'plan', title: 'Tạo kế hoạch', status: 'Todo', detail: 'Chia việc thành các bước nhỏ, không gọi tool nguy hiểm.' },
  { id: 'patch', title: 'Tạo patch nháp', status: 'Todo', detail: 'Tạo nội dung file nháp để đưa qua Diff/Sandbox/Review Desk.' },
  { id: 'review', title: 'Dừng ở Review Desk', status: 'Todo', detail: 'Không push GitHub nếu chưa có approve ở Review Desk.' }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function norm(value?: string) {
  return (value ?? '').toLowerCase();
}

function chooseSkill(session: AgentSession | undefined, skills: Skill[]) {
  const kind = norm(session?.kind);
  const activeSkills = skills.filter((skill) => skill.status !== 'Deprecated');
  if (kind.includes('ci')) return activeSkills.find((skill) => norm(skill.name).includes('ci')) ?? activeSkills[0];
  if (kind.includes('code') || kind.includes('integration')) return activeSkills.find((skill) => norm(skill.name).includes('code')) ?? activeSkills[0];
  if (kind.includes('data')) return activeSkills.find((skill) => norm(skill.category).includes('data')) ?? activeSkills[0];
  if (kind.includes('marketing')) return activeSkills.find((skill) => norm(skill.category).includes('marketing')) ?? activeSkills[0];
  return activeSkills[0];
}

function pickMemory(session: AgentSession | undefined, memories: Memory[]) {
  const haystack = `${session?.title ?? ''} ${session?.goal ?? ''} ${session?.kind ?? ''}`.toLowerCase();
  return memories
    .map((memory) => {
      const text = `${memory.title ?? ''} ${memory.type ?? ''} ${memory.content ?? ''} ${memory.tags ?? ''}`.toLowerCase();
      const words = haystack.split(/\s+/).filter((word) => word.length > 3);
      const score = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0) + (memory.type === 'guardrail' ? 2 : 0);
      return { memory, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.memory);
}

function safeBranch(title: string) {
  return `ai/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'agent-runtime'}`;
}

function buildPlan(session: AgentSession | undefined, skill: Skill | undefined, memories: Memory[]) {
  return [
    `Mục tiêu: ${session?.goal || session?.title || 'Chưa có mục tiêu cụ thể.'}`,
    `Skill dùng: ${skill?.name || 'AI Code - Safe Patch Builder'}`,
    `Context/memory: ${memories.map((memory) => memory.title).filter(Boolean).join('; ') || 'Không có memory liên quan.'}`,
    'Không gọi terminal, browser thật, auto merge hoặc auto deploy.',
    'Tạo patch nháp và dừng ở Review Desk để founder approve 1 lần.',
    'Sau PR: Build Monitor / CI Runs theo dõi; nếu fail thì tạo CI fix package.'
  ];
}

function buildPatch(session: AgentSession | undefined, plan: string[]) {
  const title = session?.title || 'Agent Runtime Prepared Work';
  return `# ${title}\n\n## Goal\n\n${session?.goal || 'Prepared by Agent Runtime Orchestrator.'}\n\n## Fast Secure Runtime Plan\n\n${plan.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n## Safety Rules\n\n- Review Desk is the single approval gate before GitHub Draft PR.\n- No direct main push.\n- No auto merge or auto deploy.\n- No real shell/browser execution.\n- Secret guard and audit trail stay enabled.\n`;
}

function pushAudit(action: string, detail: string) {
  const current = readLocal<any[]>(AUDIT_KEY, []);
  writeLocal(AUDIT_KEY, [{ id: `runtime-audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, detail }, ...current].slice(0, 120));
  window.dispatchEvent(new CustomEvent('ledgerflow-agent-runtime-audit'));
}

export default function AgentRuntimeOrchestratorPanel() {
  const [sessions, setSessions] = useState<AgentSession[]>(() => readLocal(SESSIONS_KEY, []));
  const [skills, setSkills] = useState<Skill[]>(() => readLocal(SKILLS_KEY, []));
  const [memories, setMemories] = useState<Memory[]>(() => readLocal(MEMORY_KEY, []));
  const [runs, setRuns] = useState<RuntimeRun[]>(() => readLocal(RUNS_KEY, []));
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => sessions[0]?.id ?? 'manual');
  const [manualTitle, setManualTitle] = useState('Runtime prepared patch');
  const [manualGoal, setManualGoal] = useState('Chuẩn bị patch nháp theo Fast Secure, dừng ở Review Desk để approve 1 lần.');
  const [currentSteps, setCurrentSteps] = useState<RuntimeStep[]>(steps);

  useEffect(() => {
    writeLocal(RUNS_KEY, runs);
  }, [runs]);

  const selectedSession = useMemo(() => {
    if (selectedSessionId === 'manual') return { id: 'manual', title: manualTitle, kind: 'Code', goal: manualGoal, risk: 'MEDIUM' };
    return sessions.find((session) => session.id === selectedSessionId);
  }, [selectedSessionId, sessions, manualTitle, manualGoal]);

  const latestRun = runs[0];

  const refresh = () => {
    setSessions(readLocal(SESSIONS_KEY, []));
    setSkills(readLocal(SKILLS_KEY, []));
    setMemories(readLocal(MEMORY_KEY, []));
    pushAudit('RUNTIME_REFRESHED', 'Agent runtime refreshed sessions, skills and memory.');
  };

  const setStepStatus = (id: string, status: RuntimeStepStatus) => {
    setCurrentSteps((current) => current.map((step) => step.id === id ? { ...step, status } : step));
  };

  const prepareRun = () => {
    const session = selectedSession;
    if (!session) return;
    setCurrentSteps(steps.map((step) => ({ ...step, status: 'Todo' as RuntimeStepStatus })));
    setStepStatus('session', 'Done');
    const skill = chooseSkill(session, skills);
    setStepStatus('skill', skill ? 'Done' : 'Blocked');
    const pickedMemory = pickMemory(session, memories);
    setStepStatus('memory', 'Done');
    const plan = buildPlan(session, skill, pickedMemory);
    setStepStatus('plan', 'Done');
    const patchPath = `docs/agent-runtime/${session.id || 'manual'}-${Date.now()}.md`;
    const patchContent = buildPatch(session, plan);
    setStepStatus('patch', 'Done');
    setStepStatus('review', 'Done');

    const run: RuntimeRun = {
      id: `runtime-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      sessionId: session.id,
      title: session.title,
      status: 'Prepared Patch',
      selectedSkill: skill?.name,
      selectedMemory: pickedMemory.map((memory) => memory.title || memory.id || 'Memory item'),
      plan,
      patchPath,
      patchContent,
      notes: 'Prepared in Fast Secure mode. Review Desk remains the only GitHub approval gate.'
    };
    setRuns((current) => [run, ...current].slice(0, 80));
    pushAudit('RUNTIME_PREPARED_PATCH', `Prepared patch for ${session.title}.`);
  };

  const sendToDiffReview = () => {
    if (!latestRun) return;
    writeLocal(DIFF_PREFILL_KEY, {
      sourceRuntimeRunId: latestRun.id,
      title: latestRun.title,
      branchName: safeBranch(latestRun.title),
      files: [{ id: `runtime-file-${Date.now()}`, action: 'create', path: latestRun.patchPath, beforeContent: '', afterContent: latestRun.patchContent }]
    });
    pushAudit('RUNTIME_SENT_TO_DIFF_REVIEW', `Runtime run ${latestRun.id} sent to Diff Review.`);
    window.dispatchEvent(new CustomEvent('ledgerflow-patch-diff-runtime-prefill'));
    window.location.hash = '#/ai_ops';
  };

  const sendToReviewDesk = () => {
    if (!latestRun) return;
    writeLocal(REVIEW_PREFILL_KEY, {
      sourceRuntimeRunId: latestRun.id,
      title: latestRun.title,
      branchName: safeBranch(latestRun.title),
      summary: `${latestRun.notes}\n\nPlan:\n${latestRun.plan.map((item, index) => `${index + 1}. ${item}`).join('\n')}`,
      filePath: latestRun.patchPath,
      fileContent: latestRun.patchContent
    });
    pushAudit('RUNTIME_SENT_TO_REVIEW_DESK', `Runtime run ${latestRun.id} sent to Review Desk.`);
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Agent runtime orchestrator</p>
          <h3 className="mt-1 text-xl font-black text-white">Runtime Fast Secure</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tự chuẩn bị context, skill, plan và patch nháp; dừng ở Review Desk để bạn approve 1 lần trước GitHub.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-fuchsia-300">Refresh context</button>
          <button onClick={() => exportJson('ledgerflow-agent-runtime-runs.json', runs)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-fuchsia-300">Xuất runs</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Nguồn runtime</p>
          <select className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
            <option value="manual">Manual runtime task</option>
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}
          </select>
          {selectedSessionId === 'manual' && <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} />
            <textarea className="min-h-[120px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={manualGoal} onChange={(event) => setManualGoal(event.target.value)} />
          </div>}
          <button onClick={prepareRun} className="mt-3 w-full rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black text-slate-950">Chuẩn bị runtime patch</button>

          <div className="mt-4 space-y-2">
            {currentSteps.map((step) => <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-white">{step.title}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{step.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{step.detail}</p>
            </div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Latest runtime run</p>
              <h4 className="mt-1 text-lg font-black text-white">{latestRun?.title ?? 'Chưa có run'}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{latestRun?.status ?? 'Idle'} · {latestRun?.at ?? '—'}</p>
            </div>
            {latestRun && <span className="rounded-full border border-fuchsia-400/35 bg-fuchsia-400/10 px-3 py-1 text-xs font-black text-fuchsia-200">{latestRun.status}</span>}
          </div>

          {latestRun ? <>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected skill</p>
              <p className="mt-1 text-sm font-black text-white">{latestRun.selectedSkill ?? 'No skill selected'}</p>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Plan</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs font-semibold leading-6 text-slate-300">
                {latestRun.plan.map((item, index) => <li key={index}>{item}</li>)}
              </ol>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Patch preview</p>
              <p className="mt-1 text-xs font-black text-fuchsia-200">{latestRun.patchPath}</p>
              <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-slate-300">{latestRun.patchContent}</pre>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={sendToDiffReview} className="rounded-2xl border border-blue-400/40 px-4 py-2 text-xs font-black text-blue-200 hover:bg-blue-400/10">Đưa sang Diff Review</button>
              <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>
            </div>
          </> : <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-semibold text-slate-400">Bấm “Chuẩn bị runtime patch” để runtime tự gom skill/memory/context và tạo patch nháp.</p>}
        </div>
      </div>
    </section>
  );
}
