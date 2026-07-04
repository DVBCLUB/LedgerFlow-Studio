import { useEffect, useMemo, useState } from 'react';

type BrowserTaskStatus = 'Draft' | 'Ready' | 'In Progress' | 'Blocked' | 'Done';
type BrowserTaskRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type StepStatus = 'Todo' | 'Doing' | 'Done' | 'Blocked';

type BrowserStep = {
  id: string;
  title: string;
  instruction: string;
  expectedResult: string;
  evidenceNote: string;
  status: StepStatus;
};

type BrowserTask = {
  id: string;
  title: string;
  targetApp: string;
  objective: string;
  risk: BrowserTaskRisk;
  status: BrowserTaskStatus;
  createdAt: string;
  guardrails: string[];
  steps: BrowserStep[];
};

type BrowserEvent = {
  id: string;
  at: string;
  taskId: string;
  action: string;
  detail: string;
};

const defaultTasks: BrowserTask[] = [
  {
    id: 'browser-task-001',
    title: 'Manual GitHub PR review flow',
    targetApp: 'GitHub',
    objective: 'Lập checklist thao tác thủ công để review PR, không tự merge và không tự bấm nút nguy hiểm.',
    risk: 'MEDIUM',
    status: 'Ready',
    createdAt: 'Mặc định',
    guardrails: [
      'Không tự đăng nhập thay người dùng.',
      'Không tự bấm merge/main/deploy thật.',
      'Chỉ mô tả bước thao tác và bằng chứng cần kiểm tra.',
      'Mọi hành động ghi/duyệt cần Founder xác nhận.'
    ],
    steps: [
      {
        id: 'step-open-pr',
        title: 'Mở PR cần review',
        instruction: 'Mở link PR từ Review Desk hoặc Build Monitor. Kiểm tra branch phải bắt đầu bằng ai/.',
        expectedResult: 'PR mở ở trạng thái Draft hoặc chưa merge.',
        evidenceNote: 'Ghi PR number, branch, base branch.',
        status: 'Todo'
      },
      {
        id: 'step-files',
        title: 'Kiểm tra Files changed',
        instruction: 'Mở tab Files changed, kiểm tra danh sách file có đúng phạm vi đã duyệt không.',
        expectedResult: 'Không có .env, key, secret, dist/release build output hoặc file ngoài phạm vi.',
        evidenceNote: 'Ghi số lượng file và file rủi ro nếu có.',
        status: 'Todo'
      },
      {
        id: 'step-checks',
        title: 'Kiểm tra CI/checks',
        instruction: 'Mở checks/workflow run. Nếu fail thì không merge, chuyển sang CI Recovery.',
        expectedResult: 'Checks success hoặc có lỗi được ghi nhận trong CI Recovery.',
        evidenceNote: 'Ghi workflow name và kết luận.',
        status: 'Todo'
      }
    ]
  }
];

const defaultEvents: BrowserEvent[] = [
  { id: 'browser-event-001', at: 'Mặc định', taskId: 'browser-task-001', action: 'BROWSER_SIM_BOOTSTRAP', detail: 'Khởi tạo browser/computer-use planner ở chế độ manual-only.' }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
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

function statusClass(status: BrowserTaskStatus | StepStatus) {
  if (status === 'Done') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Ready') return 'border-blue-400/35 bg-blue-400/10 text-blue-200';
  if (status === 'In Progress' || status === 'Doing') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Blocked') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-border-secondary bg-slate-950 text-text-secondary';
}

function makeDefaultSteps(objective: string): BrowserStep[] {
  return [
    {
      id: `step-${Date.now()}-plan`,
      title: 'Chuẩn bị trước khi thao tác',
      instruction: 'Xác nhận mục tiêu, tài khoản đúng, môi trường đúng và không có hành động ghi nguy hiểm.',
      expectedResult: 'Người dùng biết rõ sẽ thao tác ở đâu và dừng ở bước nào cần duyệt.',
      evidenceNote: 'Ghi app, URL/trang, phạm vi thao tác.',
      status: 'Todo'
    },
    {
      id: `step-${Date.now()}-do`,
      title: 'Thực hiện từng bước thủ công',
      instruction: objective || 'Thực hiện theo mục tiêu đã nhập, không tự động bấm thay người dùng.',
      expectedResult: 'Hoàn tất bước thủ công hoặc ghi rõ lý do bị chặn.',
      evidenceNote: 'Ghi ảnh/screenshot/note nếu cần.',
      status: 'Todo'
    },
    {
      id: `step-${Date.now()}-verify`,
      title: 'Xác minh kết quả',
      instruction: 'Kiểm tra trạng thái sau thao tác và ghi lại bằng chứng. Nếu có rủi ro, đưa sang Approval/Audit.',
      expectedResult: 'Có note xác minh rõ ràng, không tự merge/deploy/gửi tiền/gửi email nhạy cảm.',
      evidenceNote: 'Ghi kết quả cuối cùng và bước tiếp theo.',
      status: 'Todo'
    }
  ];
}

export default function BrowserSimulationPlanner() {
  const [tasks, setTasks] = useState<BrowserTask[]>(() => readLocal('ledgerflow_browser_sim_tasks_v1', defaultTasks));
  const [events, setEvents] = useState<BrowserEvent[]>(() => readLocal('ledgerflow_browser_sim_events_v1', defaultEvents));
  const [selectedId, setSelectedId] = useState(() => tasks[0]?.id ?? defaultTasks[0].id);
  const [draft, setDraft] = useState({ title: '', targetApp: '', objective: '', risk: 'MEDIUM' as BrowserTaskRisk });

  useEffect(() => {
    localStorage.setItem('ledgerflow_browser_sim_tasks_v1', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_browser_sim_events_v1', JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => tasks.find((task) => task.id === selectedId) ?? tasks[0], [tasks, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.taskId === selected?.id), [events, selected?.id]);

  const pushEvent = (taskId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `browser-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), taskId, action, detail }, ...current].slice(0, 160));
  };

  const createTask = () => {
    if (!draft.title.trim() || !draft.objective.trim()) return;
    const id = `browser-task-${Date.now()}`;
    const task: BrowserTask = {
      id,
      title: draft.title.trim(),
      targetApp: draft.targetApp.trim() || 'Browser / External App',
      objective: draft.objective.trim(),
      risk: draft.risk,
      status: 'Draft',
      createdAt: new Date().toLocaleString('vi-VN'),
      guardrails: [
        'Manual-only: AI không tự điều khiển trình duyệt thật.',
        'Không nhập/mở/gửi secret, mật khẩu, token trong planner.',
        'Không tự merge, deploy, thanh toán, gửi email hoặc xóa dữ liệu.',
        'Bước rủi ro phải chuyển Approval Gate trước khi làm.'
      ],
      steps: makeDefaultSteps(draft.objective.trim())
    };
    setTasks((current) => [task, ...current]);
    setSelectedId(id);
    pushEvent(id, 'TASK_CREATED', `Tạo browser simulation task risk ${task.risk}.`);
    setDraft({ title: '', targetApp: '', objective: '', risk: draft.risk });
  };

  const updateTask = (updater: (task: BrowserTask) => BrowserTask, action: string, detail: string) => {
    if (!selected) return;
    const next = updater(selected);
    setTasks((current) => current.map((task) => task.id === selected.id ? next : task));
    pushEvent(selected.id, action, detail);
  };

  const markStep = (stepId: string, status: StepStatus) => {
    updateTask((task) => {
      const steps = task.steps.map((step) => step.id === stepId ? { ...step, status } : step);
      const taskStatus: BrowserTaskStatus = steps.every((step) => step.status === 'Done') ? 'Done' : status === 'Blocked' ? 'Blocked' : status === 'Doing' ? 'In Progress' : task.status;
      return { ...task, steps, status: taskStatus };
    }, 'STEP_STATUS_CHANGED', `Đổi step ${stepId} sang ${status}.`);
  };

  const sendToApproval = () => {
    if (!selected) return;
    const request = {
      id: `approval-browser-${selected.id}`,
      sourceType: 'Browser Simulation',
      sourceId: selected.id,
      title: `Approve manual browser task: ${selected.title}`,
      action: selected.objective,
      risk: selected.risk,
      constraints: selected.guardrails.join('\n'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'Pending',
      approvalPhrase: 'APPROVE AI GITHUB PUSH',
      createdAt: new Date().toISOString()
    };
    const current = readLocal<any[]>('ledgerflow_approval_gate_requests_v1', []);
    const exists = current.some((item) => item.id === request.id && (item.status === 'Pending' || item.status === 'Approved'));
    if (!exists) localStorage.setItem('ledgerflow_approval_gate_requests_v1', JSON.stringify([request, ...current]));
    pushEvent(selected.id, 'SEND_TO_APPROVAL', 'Đưa browser/manual task sang Approval Gate.');
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-request-created'));
    window.location.hash = '#/ai_ops';
  };

  const sendToAudit = () => {
    if (!selected) return;
    const audit = readLocal<any[]>('ledgerflow_manual_browser_audit_v1', []);
    const record = {
      id: `manual-browser-audit-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      source: 'Browser Simulation',
      taskId: selected.id,
      title: selected.title,
      targetApp: selected.targetApp,
      status: selected.status,
      risk: selected.risk,
      steps: selected.steps
    };
    localStorage.setItem('ledgerflow_manual_browser_audit_v1', JSON.stringify([record, ...audit].slice(0, 160)));
    pushEvent(selected.id, 'SEND_TO_AUDIT', 'Ghi browser/manual task vào audit trail.');
    window.dispatchEvent(new CustomEvent('ledgerflow-audit-refresh'));
  };

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Browser simulation · manual-only</p>
          <h3 className="mt-1 text-xl font-black text-text-primary">Manual Computer-use Planner</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-text-secondary">Lập kế hoạch thao tác trình duyệt/app ngoài theo kiểu OpenClaw nhưng không tự bấm, không tự đăng nhập, không tự merge/deploy.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-browser-simulation.json', { tasks, events })} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-indigo-300">Xuất planner JSON</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-border-primary bg-slate-950/60 p-3">
          <p className="text-sm font-black text-text-primary">Tạo manual browser task</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Tên task" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="App / website mục tiêu" value={draft.targetApp} onChange={(event) => setDraft({ ...draft, targetApp: event.target.value })} />
            <select className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as BrowserTaskRisk })}>
              {(['LOW', 'MEDIUM', 'HIGH'] as BrowserTaskRisk[]).map((risk) => <option key={risk}>{risk}</option>)}
            </select>
            <textarea className="min-h-[120px] rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm leading-6 text-text-primary" placeholder="Mục tiêu thao tác thủ công..." value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} />
            <button onClick={createTask} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">Tạo planner task</button>
          </div>

          <div className="mt-4 space-y-2">
            {tasks.map((task) => <button key={task.id} onClick={() => setSelectedId(task.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === task.id ? 'border-indigo-300 bg-indigo-400/10' : 'border-border-primary bg-slate-950/50 hover:border-indigo-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-text-primary">{task.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(task.status)}`}>{task.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-text-secondary">{task.targetApp} · Risk {task.risk} · {task.createdAt}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-border-primary bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Selected manual task</p>
              <h4 className="mt-1 text-lg font-black text-text-primary">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-text-secondary">{selected.targetApp} · Risk {selected.risk}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
          </div>

          <p className="mt-4 rounded-2xl border border-border-primary bg-slate-950 p-3 text-sm font-semibold leading-6 text-text-secondary">{selected.objective}</p>

          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3">
            <p className="text-xs font-black text-rose-200">Guardrails bắt buộc</p>
            <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-text-secondary">
              {selected.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
            </ul>
          </div>

          <div className="mt-4 space-y-2">
            {selected.steps.map((step, index) => <div key={step.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-text-primary">{String(index + 1).padStart(2, '0')} · {step.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-text-tertiary">Expected: {step.expectedResult}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(step.status)}`}>{step.status}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{step.instruction}</p>
              <p className="mt-2 rounded-xl border border-border-primary bg-slate-950 p-2 text-[11px] font-semibold leading-5 text-text-tertiary">Evidence note: {step.evidenceNote}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Doing', 'Done', 'Blocked'] as StepStatus[]).map((status) => <button key={status} onClick={() => markStep(step.id, status)} className="rounded-full border border-border-secondary px-2.5 py-1 text-[10px] font-black text-text-secondary hover:border-indigo-300">{status}</button>)}
              </div>
            </div>)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => updateTask((task) => ({ ...task, status: 'Ready' }), 'TASK_READY', 'Đánh dấu planner task sẵn sàng thao tác thủ công.')} className="rounded-2xl border border-blue-400/40 px-4 py-2 text-xs font-black text-blue-200 hover:bg-blue-400/10">Mark ready</button>
            <button onClick={sendToApproval} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Gửi Approval</button>
            <button onClick={sendToAudit} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Ghi Audit</button>
          </div>

          <div className="mt-4 rounded-2xl border border-border-primary bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Task events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-border-primary bg-slate-950 p-2">
                <p className="text-[10px] font-black text-indigo-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-text-secondary">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
