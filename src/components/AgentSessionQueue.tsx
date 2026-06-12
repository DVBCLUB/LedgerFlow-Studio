import { useEffect, useMemo, useState } from 'react';

type SessionStatus = 'Draft' | 'Queued' | 'Running' | 'Waiting Approval' | 'Blocked' | 'Done';
type StepStatus = 'Todo' | 'Running' | 'Waiting Approval' | 'Done' | 'Blocked';
type SessionKind = 'Q&A' | 'Code' | 'Design' | 'Data' | 'Marketing' | 'Integration' | 'CI Fix';

type SessionStep = {
  id: string;
  title: string;
  owner: string;
  tool: string;
  status: StepStatus;
  note: string;
};

type AgentSession = {
  id: string;
  title: string;
  kind: SessionKind;
  status: SessionStatus;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  goal: string;
  createdAt: string;
  currentStepId: string;
  steps: SessionStep[];
};

type SessionEvent = {
  id: string;
  at: string;
  sessionId: string;
  action: string;
  detail: string;
};

const kindOptions: SessionKind[] = ['Q&A', 'Code', 'Design', 'Data', 'Marketing', 'Integration', 'CI Fix'];

const defaultSessions: AgentSession[] = [
  {
    id: 'session-001',
    title: 'Build OpenClaw-like AI Ops safely',
    kind: 'Integration',
    status: 'Waiting Approval',
    risk: 'HIGH',
    goal: 'Biến AI Operations Center thành luồng agent có kiểm soát: context, plan, approval, Review Desk, CI, recovery.',
    createdAt: 'Mặc định',
    currentStepId: 'step-approval',
    steps: [
      { id: 'step-inbox', title: 'Nhận yêu cầu', owner: 'AI Điều phối trưởng', tool: 'Workboard', status: 'Done', note: 'Yêu cầu đã được đưa vào AI Ops.' },
      { id: 'step-context', title: 'Gom context', owner: 'AI Dữ liệu / Tri thức', tool: 'Knowledge Context Pack', status: 'Done', note: 'Đọc thư viện tri thức và guardrail.' },
      { id: 'step-plan', title: 'Lập kế hoạch', owner: 'AI Thiết kế sản phẩm', tool: 'Tool Cards', status: 'Done', note: 'Chọn hướng sandbox-first, approval-first.' },
      { id: 'step-approval', title: 'Founder duyệt', owner: 'Founder', tool: 'Approval Gate', status: 'Waiting Approval', note: 'Cần duyệt trước khi đi sang Review Desk.' },
      { id: 'step-review', title: 'Tạo PR draft', owner: 'AI Code / Dev Agent', tool: 'Review Desk', status: 'Todo', note: 'Chỉ chạy sau approval.' },
      { id: 'step-ci', title: 'Theo dõi CI', owner: 'CI Doctor', tool: 'Build Monitor', status: 'Todo', note: 'Nếu fail thì chuyển CI Recovery.' }
    ]
  }
];

const defaultEvents: SessionEvent[] = [
  { id: 'event-001', at: 'Mặc định', sessionId: 'session-001', action: 'SESSION_BOOTSTRAP', detail: 'Khởi tạo queue kiểu OpenClaw nhưng kiểm soát bằng approval.' }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function riskFor(kind: SessionKind): AgentSession['risk'] {
  if (kind === 'Code' || kind === 'Integration' || kind === 'CI Fix') return 'HIGH';
  if (kind === 'Design' || kind === 'Data') return 'MEDIUM';
  return 'LOW';
}

function ownerFor(kind: SessionKind) {
  if (kind === 'Code' || kind === 'CI Fix') return 'AI Code / Dev Agent';
  if (kind === 'Design') return 'AI Thiết kế sản phẩm';
  if (kind === 'Data') return 'AI Dữ liệu / Tri thức';
  if (kind === 'Marketing') return 'AI Marketing / Sales';
  if (kind === 'Integration') return 'AI Điều phối trưởng';
  return 'AI Điều phối trưởng';
}

function makeSteps(kind: SessionKind): SessionStep[] {
  const owner = ownerFor(kind);
  const risk = riskFor(kind);
  const base: SessionStep[] = [
    { id: 'inbox', title: 'Nhận yêu cầu', owner: 'AI Điều phối trưởng', tool: 'Workboard', status: 'Todo', note: 'Chuyển yêu cầu thành session có owner và risk.' },
    { id: 'context', title: 'Gom context', owner: 'AI Dữ liệu / Tri thức', tool: 'Knowledge Context Pack', status: 'Todo', note: 'Lấy tri thức liên quan từ thư viện.' },
    { id: 'plan', title: 'Lập kế hoạch', owner, tool: 'Tool Cards', status: 'Todo', note: 'Tạo kế hoạch nhỏ, không hành động ngoài sandbox.' }
  ];
  if (risk !== 'LOW') {
    base.push({ id: 'approval', title: 'Founder duyệt', owner: 'Founder', tool: 'Approval Gate', status: 'Waiting Approval', note: 'Bắt buộc trước khi tạo PR, connector, hoặc tác vụ có rủi ro.' });
  }
  if (kind === 'Code' || kind === 'Integration' || kind === 'CI Fix') {
    base.push({ id: 'review', title: 'Tạo PR draft', owner: 'AI Code / Dev Agent', tool: 'Review Desk', status: 'Todo', note: 'Tạo branch ai/* và PR draft sau khi được duyệt.' });
    base.push({ id: 'ci', title: 'Theo dõi CI', owner: 'CI Doctor', tool: 'Build Monitor / CI Recovery', status: 'Todo', note: 'Theo dõi build, lỗi thì đưa vào recovery queue.' });
  } else {
    base.push({ id: 'output', title: 'Xuất kết quả', owner, tool: 'Knowledge Library', status: 'Todo', note: 'Kết quả tốt quay lại thư viện tri thức.' });
  }
  return base;
}

function statusClass(status: SessionStatus | StepStatus) {
  if (status === 'Done') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Waiting Approval') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (status === 'Running') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Blocked') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
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

export default function AgentSessionQueue() {
  const [sessions, setSessions] = useState<AgentSession[]>(() => readLocal('ledgerflow_agent_sessions_v1', defaultSessions));
  const [events, setEvents] = useState<SessionEvent[]>(() => readLocal('ledgerflow_agent_session_events_v1', defaultEvents));
  const [selectedId, setSelectedId] = useState(() => sessions[0]?.id ?? defaultSessions[0].id);
  const [draft, setDraft] = useState({ title: '', kind: 'Code' as SessionKind, goal: '' });

  useEffect(() => {
    localStorage.setItem('ledgerflow_agent_sessions_v1', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_agent_session_events_v1', JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => sessions.find((session) => session.id === selectedId) ?? sessions[0], [sessions, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.sessionId === selected?.id), [events, selected?.id]);

  const pushEvent = (sessionId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), sessionId, action, detail }, ...current].slice(0, 120));
  };

  const createSession = () => {
    if (!draft.title.trim() || !draft.goal.trim()) return;
    const risk = riskFor(draft.kind);
    const steps = makeSteps(draft.kind);
    const session: AgentSession = {
      id: `session-${Date.now()}`,
      title: draft.title.trim(),
      kind: draft.kind,
      status: risk === 'LOW' ? 'Queued' : 'Waiting Approval',
      risk,
      goal: draft.goal.trim(),
      createdAt: new Date().toLocaleString('vi-VN'),
      currentStepId: steps[0].id,
      steps
    };
    setSessions((current) => [session, ...current]);
    setSelectedId(session.id);
    pushEvent(session.id, 'SESSION_CREATED', `Tạo session ${session.kind} với risk ${session.risk}.`);
    setDraft({ title: '', kind: draft.kind, goal: '' });
  };

  const updateSession = (updater: (session: AgentSession) => AgentSession, detail: string, action = 'SESSION_UPDATED') => {
    if (!selected) return;
    const next = updater(selected);
    setSessions((current) => current.map((session) => session.id === selected.id ? next : session));
    pushEvent(selected.id, action, detail);
  };

  const markStep = (stepId: string, status: StepStatus) => {
    updateSession((session) => {
      const steps = session.steps.map((step) => step.id === stepId ? { ...step, status } : step);
      const current = steps.find((step) => step.status !== 'Done') ?? steps[steps.length - 1];
      const sessionStatus: SessionStatus = steps.every((step) => step.status === 'Done') ? 'Done' : status === 'Blocked' ? 'Blocked' : status === 'Waiting Approval' ? 'Waiting Approval' : 'Running';
      return { ...session, steps, currentStepId: current.id, status: sessionStatus };
    }, `Đổi step ${stepId} sang ${status}.`, 'STEP_STATUS_CHANGED');
  };

  const sendToWorkboard = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_aiops_workboard_prefill_v1', JSON.stringify({
      title: selected.title,
      kind: selected.kind === 'CI Fix' ? 'Code' : selected.kind,
      request: selected.goal,
      sourceSessionId: selected.id
    }));
    pushEvent(selected.id, 'SEND_TO_WORKBOARD', 'Đưa session sang Workboard để tạo card xử lý.');
    window.dispatchEvent(new CustomEvent('ledgerflow-aiops-workboard-prefill'));
    window.location.hash = '#/ai_ops';
  };

  const sendToReviewDesk = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      sourceSessionId: selected.id,
      title: selected.title,
      branchName: `ai/${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'agent-session'}`,
      summary: `${selected.goal}\n\nAgent Session: ${selected.id}\nKind: ${selected.kind}\nRisk: ${selected.risk}`,
      filePath: 'docs/AI_SESSION_OUTPUT.md',
      fileContent: `# ${selected.title}\n\n## Goal\n\n${selected.goal}\n\n## Session\n\n- ID: ${selected.id}\n- Kind: ${selected.kind}\n- Risk: ${selected.risk}\n`
    }));
    pushEvent(selected.id, 'SEND_TO_REVIEW_DESK', 'Đưa session sang Review Desk để chuẩn bị PR draft.');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-blue-400/35 bg-blue-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">Agent session queue</p>
          <h3 className="mt-1 text-xl font-black text-white">Hàng đợi phiên AI</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Biến một yêu cầu thành phiên nhiều bước: context, plan, approval, Review Desk, CI và recovery.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-agent-sessions.json', { sessions, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-blue-300">Xuất sessions</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo phiên AI mới</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên phiên" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as SessionKind })}>
              {kindOptions.map((kind) => <option key={kind}>{kind}</option>)}
            </select>
            <textarea className="min-h-[110px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Mục tiêu phiên AI..." value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} />
            <button onClick={createSession} className="rounded-2xl bg-blue-300 px-4 py-2 text-xs font-black text-slate-950">Tạo session</button>
          </div>

          <div className="mt-4 space-y-2">
            {sessions.map((session) => <button key={session.id} onClick={() => setSelectedId(session.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === session.id ? 'border-blue-300 bg-blue-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-blue-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{session.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(session.status)}`}>{session.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{session.kind} · {session.risk} · {session.createdAt}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected session</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.kind} · Risk {selected.risk} · {selected.createdAt}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.goal}</p>

          <div className="mt-4 space-y-2">
            {selected.steps.map((step, index) => <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-white">{String(index + 1).padStart(2, '0')} · {step.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{step.owner} · {step.tool}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(step.status)}`}>{step.status}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{step.note}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Running', 'Waiting Approval', 'Done', 'Blocked'] as StepStatus[]).map((status) => <button key={status} onClick={() => markStep(step.id, status)} className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-black text-slate-300 hover:border-blue-300">{status}</button>)}
              </div>
            </div>)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={sendToWorkboard} className="rounded-2xl border border-violet-400/40 px-4 py-2 text-xs font-black text-violet-200 hover:bg-violet-400/10">Đưa sang Workboard</button>
            {(selected.kind === 'Code' || selected.kind === 'Integration' || selected.kind === 'CI Fix') && <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Session events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-blue-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
              {selectedEvents.length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có event cho session này.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
