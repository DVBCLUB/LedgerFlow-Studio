import { useEffect, useMemo, useState } from 'react';

type ToolMode = 'Simulate' | 'Read Only' | 'Draft Write' | 'Blocked';
type ToolRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
type ToolRunStatus = 'Draft' | 'Simulated' | 'Ready for Review Desk' | 'Blocked' | 'Done';

type ToolRun = {
  id: string;
  at: string;
  toolName: string;
  mode: ToolMode;
  risk: ToolRisk;
  status: ToolRunStatus;
  goal: string;
  inputJson: string;
  outputJson: string;
  auditNote: string;
};

type ConnectorSummaryItem = {
  id?: string;
  name?: string;
  mode?: string;
  risk?: string;
  approvalRequired?: boolean;
  auditRequired?: boolean;
  allowedActions?: string[];
  blockedActions?: string[];
};

type ToolEvent = {
  id: string;
  at: string;
  action: string;
  detail: string;
};

const RUNS_KEY = 'ledgerflow_tool_execution_runs_v1';
const EVENTS_KEY = 'ledgerflow_tool_execution_events_v1';
const POLICY_SUMMARY_KEY = 'ledgerflow_connector_policy_summary_v1';
const REVIEW_PREFILL_KEY = 'ledgerflow_review_desk_prefill_v1';

const defaultRuns: ToolRun[] = [
  {
    id: 'tool-run-001',
    at: 'Mặc định',
    toolName: 'GitHub Draft PR Connector',
    mode: 'Draft Write',
    risk: 'MEDIUM',
    status: 'Draft',
    goal: 'Chuẩn bị một thay đổi code đi qua Review Desk, không merge/deploy tự động.',
    inputJson: JSON.stringify({ branch: 'ai/example-safe-change', draft: true }, null, 2),
    outputJson: JSON.stringify({ next: 'Review Desk approval required' }, null, 2),
    auditNote: 'Fast Secure: tool layer chỉ chuẩn hóa input/output và audit; GitHub write vẫn qua Review Desk.'
  }
];

const defaultEvents: ToolEvent[] = [
  { id: 'tool-event-001', at: 'Mặc định', action: 'TOOL_LAYER_BOOTSTRAP', detail: 'Khởi tạo lớp gọi tool an toàn: simulate/draft/audit trước, không tự chạy thao tác nguy hiểm.' }
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

function safeParseJson(text: string) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, value: error instanceof Error ? error.message : 'Invalid JSON' };
  }
}

function normalizeMode(mode?: string): ToolMode {
  if (mode === 'Read Only') return 'Read Only';
  if (mode === 'Draft Write' || mode === 'Draft Only') return 'Draft Write';
  if (mode === 'Blocked') return 'Blocked';
  return 'Simulate';
}

function normalizeRisk(risk?: string): ToolRisk {
  if (risk === 'BLOCKED') return 'BLOCKED';
  if (risk === 'HIGH') return 'HIGH';
  if (risk === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function classFor(status: ToolRunStatus | ToolRisk | ToolMode) {
  if (status === 'Blocked' || status === 'BLOCKED') return 'border-rose-400/40 bg-rose-400/10 text-rose-200';
  if (status === 'HIGH') return 'border-orange-400/40 bg-orange-400/10 text-orange-200';
  if (status === 'Ready for Review Desk' || status === 'Draft Write' || status === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  if (status === 'Done' || status === 'Read Only' || status === 'LOW') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
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

export default function ToolExecutionLayerPanel() {
  const [runs, setRuns] = useState<ToolRun[]>(() => readLocal(RUNS_KEY, defaultRuns));
  const [events, setEvents] = useState<ToolEvent[]>(() => readLocal(EVENTS_KEY, defaultEvents));
  const [selectedId, setSelectedId] = useState(() => readLocal<ToolRun[]>(RUNS_KEY, defaultRuns)[0]?.id ?? defaultRuns[0].id);
  const [policyItems, setPolicyItems] = useState<ConnectorSummaryItem[]>(() => readLocal<ConnectorSummaryItem[]>(POLICY_SUMMARY_KEY, []));
  const [draft, setDraft] = useState({
    toolName: 'GitHub Draft PR Connector',
    goal: '',
    inputJson: JSON.stringify({ action: 'prepare_draft_pr', branch: 'ai/my-change', files: [] }, null, 2)
  });

  useEffect(() => writeLocal(RUNS_KEY, runs), [runs]);
  useEffect(() => writeLocal(EVENTS_KEY, events), [events]);

  useEffect(() => {
    const refresh = () => setPolicyItems(readLocal<ConnectorSummaryItem[]>(POLICY_SUMMARY_KEY, []));
    window.addEventListener('ledgerflow-connector-policy-synced', refresh);
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.removeEventListener('ledgerflow-connector-policy-synced', refresh);
      window.clearInterval(timer);
    };
  }, []);

  const selected = useMemo(() => runs.find((run) => run.id === selectedId) ?? runs[0], [runs, selectedId]);
  const selectedPolicy = useMemo(() => policyItems.find((item) => item.name === draft.toolName || item.id === draft.toolName), [policyItems, draft.toolName]);

  const pushEvent = (action: string, detail: string) => {
    setEvents((current) => [{ id: `tool-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, detail }, ...current].slice(0, 120));
  };

  const createRun = () => {
    if (!draft.goal.trim()) return;
    const parsed = safeParseJson(draft.inputJson);
    const mode = normalizeMode(selectedPolicy?.mode);
    const risk = normalizeRisk(selectedPolicy?.risk);
    const status: ToolRunStatus = !parsed.ok || mode === 'Blocked' || risk === 'BLOCKED' ? 'Blocked' : 'Draft';
    const run: ToolRun = {
      id: `tool-run-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      toolName: draft.toolName.trim() || 'Unnamed Tool',
      mode,
      risk,
      status,
      goal: draft.goal.trim(),
      inputJson: draft.inputJson,
      outputJson: JSON.stringify({ simulated: true, note: 'No external tool was executed. Review Desk remains the write gate.' }, null, 2),
      auditNote: parsed.ok ? 'Input JSON hợp lệ. Tool layer đang ở chế độ an toàn: simulate/draft/audit.' : `Input JSON lỗi: ${parsed.value}`
    };
    setRuns((current) => [run, ...current]);
    setSelectedId(run.id);
    pushEvent('TOOL_RUN_CREATED', `${run.toolName} · ${run.mode} · ${run.risk} · ${run.status}`);
    setDraft({ ...draft, goal: '' });
  };

  const simulateRun = () => {
    if (!selected) return;
    const parsed = safeParseJson(selected.inputJson);
    const next: ToolRun = {
      ...selected,
      status: parsed.ok && selected.mode !== 'Blocked' && selected.risk !== 'BLOCKED' ? 'Simulated' : 'Blocked',
      outputJson: JSON.stringify({
        ok: parsed.ok,
        mode: selected.mode,
        risk: selected.risk,
        next: parsed.ok ? 'Send to Review Desk if this is a write/code change.' : 'Fix input JSON before continuing.'
      }, null, 2),
      auditNote: parsed.ok ? 'Simulation complete. Không gọi tool thật, không ghi hệ thống.' : `Blocked: ${parsed.value}`
    };
    setRuns((current) => current.map((run) => run.id === selected.id ? next : run));
    pushEvent('TOOL_RUN_SIMULATED', `${selected.toolName} simulation status: ${next.status}`);
  };

  const sendToReviewDesk = () => {
    if (!selected) return;
    const parsed = safeParseJson(selected.inputJson);
    if (!parsed.ok || selected.mode === 'Blocked' || selected.risk === 'BLOCKED') {
      setRuns((current) => current.map((run) => run.id === selected.id ? { ...run, status: 'Blocked', auditNote: 'Không thể gửi Review Desk do tool/input bị block.' } : run));
      pushEvent('TOOL_RUN_BLOCKED', `${selected.toolName} blocked before Review Desk.`);
      return;
    }
    writeLocal(REVIEW_PREFILL_KEY, {
      sourceToolRunId: selected.id,
      title: selected.goal,
      branchName: `ai/${selected.goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'tool-run'}`,
      summary: `${selected.goal}\n\nTool Execution Layer:\n- Tool: ${selected.toolName}\n- Mode: ${selected.mode}\n- Risk: ${selected.risk}\n- Run: ${selected.id}\n\nReview Desk is the only write approval gate.`,
      filePath: 'docs/TOOL_EXECUTION_OUTPUT.md',
      fileContent: `# Tool Execution Output\n\n## Goal\n\n${selected.goal}\n\n## Tool\n\n- Name: ${selected.toolName}\n- Mode: ${selected.mode}\n- Risk: ${selected.risk}\n\n## Input\n\n\`\`\`json\n${selected.inputJson}\n\`\`\`\n\n## Output\n\n\`\`\`json\n${selected.outputJson}\n\`\`\`\n`
    });
    setRuns((current) => current.map((run) => run.id === selected.id ? { ...run, status: 'Ready for Review Desk' } : run));
    pushEvent('TOOL_RUN_SENT_TO_REVIEW_DESK', `${selected.toolName} sent to Review Desk.`);
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-teal-400/35 bg-teal-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-200">Tool execution layer</p>
          <h3 className="mt-1 text-xl font-black text-white">Lớp gọi tool an toàn</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chuẩn hóa tool input/output, kiểm policy, ghi audit. Mặc định không chạy thao tác nguy hiểm; write/code vẫn đi qua Review Desk một lần duyệt.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-tool-execution-log.json', { runs, events, policyItems })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-teal-300">Xuất tool log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo tool run</p>
          <div className="mt-3 grid gap-2">
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.toolName} onChange={(event) => setDraft({ ...draft, toolName: event.target.value })}>
              <option>GitHub Draft PR Connector</option>
              <option>Knowledge Library Connector</option>
              <option>CI Doctor Connector</option>
              <option>Local Tools Connector</option>
              {policyItems.map((item) => <option key={item.id ?? item.name} value={item.name ?? item.id}>{item.name ?? item.id}</option>)}
            </select>
            {selectedPolicy && <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-400">
              Policy: <span className="text-teal-200">{selectedPolicy.mode}</span> · Risk: <span className="text-teal-200">{selectedPolicy.risk}</span> · Audit: {selectedPolicy.auditRequired ? 'Yes' : 'No'}
            </div>}
            <textarea className="min-h-[90px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Mục tiêu tool run..." value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} />
            <textarea className="min-h-[150px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" value={draft.inputJson} onChange={(event) => setDraft({ ...draft, inputJson: event.target.value })} />
            <button onClick={createRun} className="rounded-2xl bg-teal-300 px-4 py-2 text-xs font-black text-slate-950">Tạo tool run</button>
          </div>

          <div className="mt-4 space-y-2">
            {runs.map((run) => <button key={run.id} onClick={() => setSelectedId(run.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === run.id ? 'border-teal-300 bg-teal-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-teal-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{run.toolName}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${classFor(run.status)}`}>{run.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{run.mode} · {run.risk} · {run.at}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected tool run</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.toolName}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.goal}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${classFor(selected.mode)}`}>{selected.mode}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${classFor(selected.risk)}`}>{selected.risk}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Input</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{selected.inputJson}</pre>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Output / audit</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{selected.outputJson}</pre>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">{selected.auditNote}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={simulateRun} className="rounded-2xl border border-teal-400/40 px-4 py-2 text-xs font-black text-teal-200 hover:bg-teal-400/10">Simulate</button>
            <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tool events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {events.slice(0, 10).map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-teal-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
