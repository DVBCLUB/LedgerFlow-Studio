import { useEffect, useRef } from 'react';

type RuntimeRun = {
  id: string;
  at?: string;
  sessionId?: string;
  title?: string;
  status?: string;
  patchPath?: string;
  patchContent?: string;
  notes?: string;
  plan?: string[];
};

type ToolRun = {
  id: string;
  at: string;
  toolName: string;
  mode: 'Simulate' | 'Read Only' | 'Draft Write' | 'Blocked';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  status: 'Draft' | 'Simulated' | 'Ready for Review Desk' | 'Blocked' | 'Done';
  goal: string;
  inputJson: string;
  outputJson: string;
  auditNote: string;
};

type ToolEvent = {
  id: string;
  at: string;
  action: string;
  detail: string;
};

const RUNTIME_RUNS_KEY = 'ledgerflow_agent_runtime_runs_v1';
const TOOL_RUNS_KEY = 'ledgerflow_tool_execution_runs_v1';
const TOOL_EVENTS_KEY = 'ledgerflow_tool_execution_events_v1';
const SYNC_KEY = 'ledgerflow_runtime_tool_bridge_synced_v1';

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

function branchFromTitle(title: string) {
  return `ai/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'runtime-tool-run'}`;
}

function createToolRun(runtime: RuntimeRun): ToolRun {
  const title = runtime.title || 'Runtime prepared work';
  const path = runtime.patchPath || 'docs/agent-runtime/output.md';
  const content = runtime.patchContent || '';
  return {
    id: `tool-run-from-runtime-${runtime.id}-${Date.now()}`,
    at: new Date().toLocaleString('vi-VN'),
    toolName: 'GitHub Draft PR Connector',
    mode: 'Draft Write',
    risk: 'MEDIUM',
    status: 'Draft',
    goal: title,
    inputJson: JSON.stringify({
      action: 'prepare_draft_pr',
      sourceRuntimeRunId: runtime.id,
      branch: branchFromTitle(title),
      draft: true,
      files: [{ path, content }],
      plan: runtime.plan ?? [],
      note: 'Fast Secure: Review Desk remains the single approval gate before GitHub write.'
    }, null, 2),
    outputJson: JSON.stringify({
      simulated: true,
      next: 'Open Tool Execution Layer or send the runtime patch to Review Desk for one approval.'
    }, null, 2),
    auditNote: 'Created automatically from Agent Runtime. No external tool was executed.'
  };
}

export default function RuntimeToolBridge() {
  const lastFingerprint = useRef('');

  useEffect(() => {
    const sync = () => {
      const runtimeRuns = readLocal<RuntimeRun[]>(RUNTIME_RUNS_KEY, []);
      const prepared = runtimeRuns.filter((run) => run.id && run.status === 'Prepared Patch');
      const synced = readLocal<string[]>(SYNC_KEY, []);
      const nextRuntime = prepared.find((run) => run.id && !synced.includes(run.id));
      const fingerprint = JSON.stringify({ latest: prepared[0]?.id, synced });
      if (fingerprint === lastFingerprint.current && !nextRuntime) return;
      lastFingerprint.current = fingerprint;
      if (!nextRuntime) return;

      const toolRuns = readLocal<ToolRun[]>(TOOL_RUNS_KEY, []);
      const alreadyExists = toolRuns.some((run) => run.id.includes(nextRuntime.id));
      if (alreadyExists) {
        writeLocal(SYNC_KEY, [nextRuntime.id, ...synced].slice(0, 100));
        return;
      }

      const toolRun = createToolRun(nextRuntime);
      writeLocal(TOOL_RUNS_KEY, [toolRun, ...toolRuns].slice(0, 100));

      const events = readLocal<ToolEvent[]>(TOOL_EVENTS_KEY, []);
      writeLocal(TOOL_EVENTS_KEY, [{
        id: `tool-event-runtime-${Date.now()}`,
        at: new Date().toLocaleString('vi-VN'),
        action: 'RUNTIME_TOOL_RUN_CREATED',
        detail: `Runtime ${nextRuntime.id} created draft tool run ${toolRun.id}.`
      }, ...events].slice(0, 120));

      writeLocal(SYNC_KEY, [nextRuntime.id, ...synced].slice(0, 100));
      window.dispatchEvent(new CustomEvent('ledgerflow-tool-execution-sync', { detail: { sourceRuntimeRunId: nextRuntime.id, toolRunId: toolRun.id } }));
    };

    sync();
    const timer = window.setInterval(sync, 2000);
    window.addEventListener('ledgerflow-agent-runtime-audit', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-agent-runtime-audit', sync);
    };
  }, []);

  return null;
}
