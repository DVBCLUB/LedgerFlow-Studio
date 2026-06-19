import { useEffect, useState } from 'react';

type ControlPlaneRow = Record<string, any>;

type ControlPlaneSnapshot = {
  storage?: 'local' | 'supabase';
  events?: ControlPlaneRow[];
  tasks?: ControlPlaneRow[];
  toolRuns?: ControlPlaneRow[];
};

type TaskStatus = 'inbox' | 'planning' | 'waiting_approval' | 'ready' | 'done' | 'blocked';

const statusActions: Array<{ status: TaskStatus; label: string; tone: string }> = [
  { status: 'ready', label: 'Approve', tone: 'border-emerald-300/50 text-emerald-100 hover:bg-emerald-400/10' },
  { status: 'done', label: 'Done', tone: 'border-cyan-300/50 text-cyan-100 hover:bg-cyan-400/10' },
  { status: 'blocked', label: 'Block', tone: 'border-rose-300/50 text-rose-100 hover:bg-rose-400/10' },
];

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed: ${response.status}`);
  return data;
}

function recent(items?: ControlPlaneRow[]) {
  return Array.isArray(items) ? items.slice(0, 6) : [];
}

function rowSubtitle(item: ControlPlaneRow) {
  return [item.status, item.risk, item.source, item.created_at || item.createdAt].filter(Boolean).join(' | ') || 'audit';
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function CompanyOSControlPlaneTab() {
  const [snapshot, setSnapshot] = useState<ControlPlaneSnapshot>({});
  const [message, setMessage] = useState('Loading control plane...');
  const [taskTitle, setTaskTitle] = useState('Prepare Company OS daily brief');
  const [openClawTitle, setOpenClawTitle] = useState('Simulate browser QA for LedgerFlow desktop login');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchJson('/api/company-os/control-plane/status?limit=20');
      setSnapshot(data);
      setMessage(`Control plane ready via ${data.storage || 'unknown'} storage.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot load control plane.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async () => {
    try {
      await fetchJson('/api/company-os/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: 'Task created from AgentOps Control Plane tab.',
          agentRole: 'Chief of Staff',
          source: 'dashboard',
          risk: 'low',
          status: 'waiting_approval',
        }),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot create task.');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setBusyTaskId(taskId);
    try {
      await fetchJson(`/api/company-os/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          source: 'founder',
          note: `Founder marked task as ${status}.`,
        }),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot update task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const simulateOpenClaw = async () => {
    try {
      await fetchJson('/api/company-os/openclaw/simulate', {
        method: 'POST',
        body: JSON.stringify({
          action: 'browser_check',
          title: openClawTitle,
          target: 'LedgerFlow desktop/web UI',
          prompt: 'Check login gate, AgentOps navigation, and Marketing V2 visibility. Simulation only.',
          simulate: true,
        }),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot simulate OpenClaw action.');
    }
  };

  const exportAudit = async () => {
    try {
      const data = await fetchJson('/api/company-os/audit/export?limit=500');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadJson(`ledgerflow-company-os-audit-${stamp}.json`, data.audit || data);
      setMessage('Audit JSON exported from Company OS control plane.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot export audit log.');
    }
  };

  return (
    <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Company OS control plane</p>
          <h3 className="mt-1 text-xl font-black text-white">n8n | Telegram | OpenClaw Gateway</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
            Event bus for 14 AI agents. Every action is logged first; OpenClaw stays simulation-only behind an allowlist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportAudit} className="rounded-2xl border border-emerald-300/50 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10">
            Export audit JSON
          </button>
          <button onClick={load} className="rounded-2xl border border-cyan-300/50 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10">
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-300">
        {message}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-black text-white">Create Agent Task</p>
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white"
          />
          <button onClick={createTask} className="mt-3 rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">
            Send to Approval Queue
          </button>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-black text-white">Simulate OpenClaw Action</p>
          <input
            value={openClawTitle}
            onChange={(event) => setOpenClawTitle(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white"
          />
          <button onClick={simulateOpenClaw} className="mt-3 rounded-2xl border border-amber-300/50 px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-400/10">
            Simulate Only
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-black text-white">Tasks</p>
          <div className="mt-3 space-y-2">
            {recent(snapshot.tasks).length === 0 && <p className="text-xs font-semibold text-slate-500">No rows yet.</p>}
            {recent(snapshot.tasks).map((item) => (
              <div key={String(item.id)} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs font-black text-slate-100">{item.title || item.id}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{rowSubtitle(item)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusActions.map((action) => (
                    <button
                      key={`${item.id}-${action.status}`}
                      disabled={busyTaskId === item.id}
                      onClick={() => updateTaskStatus(String(item.id), action.status)}
                      className={`rounded-xl border px-3 py-1.5 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-50 ${action.tone}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {[
          ['Tool Runs', recent(snapshot.toolRuns)],
          ['Events', recent(snapshot.events)],
        ].map(([title, items]) => (
          <div key={String(title)} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-black text-white">{String(title)}</p>
            <div className="mt-3 space-y-2">
              {(items as ControlPlaneRow[]).length === 0 && <p className="text-xs font-semibold text-slate-500">No rows yet.</p>}
              {(items as ControlPlaneRow[]).map((item) => (
                <div key={String(item.id)} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs font-black text-slate-100">{item.title || item.action || item.event_type || item.id}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{rowSubtitle(item)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
