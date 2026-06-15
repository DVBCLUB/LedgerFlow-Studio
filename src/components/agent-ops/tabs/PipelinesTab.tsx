import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { appendAgentOpsAudit } from '../storage';

type PipelineType =
  | 'software_product'
  | 'daily_content'
  | 'game_dev'
  | 'month_end'
  | 'daily_brief';

interface PipelineTemplate {
  id: string;
  name: string;
  steps: Array<{ name: string; agentRole: string; requiresApproval: boolean }>;
}

interface PipelineRunResult {
  success: boolean;
  pipeline?: { id: string; status: string; currentStepIndex: number };
  error?: string;
}

interface PipelineSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  current_step_index: number;
  created_at?: string;
}

export default function PipelinesTab() {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('agentops_token') || '';
  });
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    if (typeof window === 'undefined') return import.meta.env.VITE_SUPABASE_URL || '';
    return localStorage.getItem('agentops_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    if (typeof window === 'undefined') return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    return localStorage.getItem('agentops_supabase_anon') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authWorking, setAuthWorking] = useState(false);
  const [recentPipelines, setRecentPipelines] = useState<PipelineSummary[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);
  const [approveModal, setApproveModal] = useState<{ open: boolean; pipelineId?: string; stepIndex?: number }>(() => ({ open: false }));
  const [approveNote, setApproveNote] = useState('');
  const [approveBy, setApproveBy] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseClients, setSseClients] = useState(0);
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null);

  const saveToken = (token: string) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('agentops_token', token || '');
    } catch (e) { }
    setAuthToken(token);
  };

  const pushToast = (message: string) => {
    setToasts((current) => [{ id: `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`, message }, ...current].slice(0, 5));
  };

  const notify = (title: string, message: string) => {
    pushToast(message);
    if (typeof window !== 'undefined' && notifEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch (e) {
        // ignore notification failures
      }
    }

    try {
      const anyWin = window as any;
      anyWin?.electronAPI?.notify?.({ title, body: message, message });
    } catch (e) {
      // ignore desktop bridge failures
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('agentops_supabase_url', supabaseUrl || '');
        localStorage.setItem('agentops_supabase_anon', supabaseAnonKey || '');
      }
    } catch (e) {
      // ignore localStorage failures
    }
  }, [supabaseUrl, supabaseAnonKey]);

  const getSupabaseClient = () => {
    const url = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
    const key = supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  };

  const signInWithSupabase = async () => {
    setAuthWorking(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase chưa được cấu hình. Vui lòng nhập URL và anon key.');
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data?.session?.access_token) {
        throw new Error('Không nhận được access token từ Supabase.');
      }
      saveToken(data.session.access_token);
      setStatus(`Signed in as ${data.user?.email || 'user'}`);
      if (selectedPipeline?.id) await loadPipelineDetails(selectedPipeline.id);
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập Supabase thất bại.');
    } finally {
      setAuthWorking(false);
      setPassword('');
    }
  };

  const signOutSupabase = () => {
    saveToken('');
    setStatus('Signed out');
  };

  useEffect(() => {
    const headers: Record<string,string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    fetch('/api/pipelines/types', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setTemplates(data.types);
          if (!selected && data.types.length) {
            setSelected(data.types[0].id);
          }
        }
      })
      .catch(() => {
        setTemplates([]);
      });
  }, [authToken]);

  useEffect(() => {
    const headers: Record<string,string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    fetch('/api/pipelines', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.pipelines)) {
          setRecentPipelines(data.pipelines);
        }
      })
      .catch(() => {
        setRecentPipelines([]);
      });
  }, [authToken]);

  const loadPipelineDetails = async (id: string) => {
    try {
      const headers: Record<string,string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`/api/pipelines/${encodeURIComponent(id)}`, { headers });
      const data = await res.json();
      if (data?.success) {
        const pipeline = data.pipeline;
        try {
          const ap = await fetch(`/api/pipelines/${encodeURIComponent(id)}/approvals`, { headers }).then((r) => r.json());
          if (ap?.success) pipeline.approvals = ap.approvals;
        } catch (e) {
          pipeline.approvals = [];
        }
        setSelectedPipeline(pipeline);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleApproveStep = async (pipelineId: string, stepNumber?: number) => {
    // open modal to collect note/approver
    setApproveModal({ open: true, pipelineId, stepIndex: stepNumber });
  };

  const submitApproval = async () => {
    if (!approveModal.pipelineId) return;
    setLoading(true);
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      await fetch(`/api/pipelines/${encodeURIComponent(approveModal.pipelineId)}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ stepNumber: approveModal.stepIndex, note: approveNote, approver_id: approveBy || undefined }),
      });
      // refresh details and list
      await loadPipelineDetails(approveModal.pipelineId);
      const list = await fetch('/api/pipelines', { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }).then((r) => r.json());
      if (list?.success) setRecentPipelines(list.pipelines);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
      setApproveModal({ open: false });
      setApproveNote('');
      setApproveBy('');
    }
  };

  // Poll selected pipeline while it's active
  // Subscribe to per-pipeline SSE stream for live step output
  useEffect(() => {
    if (!selectedPipeline) return;
    const activeStatuses = ['running', 'waiting_approval'];
    if (!activeStatuses.includes(selectedPipeline.status)) return;
    let es: EventSource | null = null;
    let reconnectTimer: any = null;
    let retryCount = 0;

    const connect = () => {
      try {
        es = new EventSource(`/api/pipelines/${encodeURIComponent(selectedPipeline.id)}/stream`);
        es.onopen = () => {
          retryCount = 0;
          setSseConnected(true);
          // fetch active clients count once on open
          fetch(`/api/pipelines/${encodeURIComponent(selectedPipeline.id)}/clients`).then((r) => r.json()).then((d) => { if (d?.success) setSseClients(d.clients || 0); }).catch(() => {});
        };
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            setLastUpdateAt(new Date().toISOString());
            if (data?.type === 'chunk') {
              setSelectedPipeline((prev: any) => {
                if (!prev) return prev;
                const steps = Array.isArray(prev.steps) ? [...prev.steps] : [];
                const idx = Number(data.stepIndex ?? -1);
                if (idx >= 0) {
                  steps[idx] = { ...(steps[idx] || {}), output: (steps[idx]?.output || '') + String(data.chunk) };
                }
                return { ...prev, steps };
              });
            } else if (data?.type === 'update') {
              setSelectedPipeline((prev: any) => {
                if (!prev) return prev;
                const steps = Array.isArray(prev.steps) ? [...prev.steps] : [];
                const idx = Number(data.stepIndex ?? -1);
                if (idx >= 0) {
                  const nextStep = { ...(steps[idx] || {}), ...(data.step || {}) };
                  steps[idx] = nextStep;
                  if (nextStep.status === 'waiting_approval') {
                    const message = `Step ${idx + 1} is waiting approval.`;
                    pushToast(message);
                    notify('Pipeline approval needed', message);
                  } else if (nextStep.status === 'done') {
                    const message = `Step ${idx + 1} completed.`;
                    pushToast(message);
                    notify('Pipeline step completed', message);
                  }
                }
                return { ...prev, steps };
              });
            }
          } catch (e) {
            // ignore parse errors
          }
        };
        es.onerror = () => {
          setSseConnected(false);
          try { es?.close(); } catch (e) { }
          es = null;
          // schedule reconnect with exponential backoff
          retryCount = Math.min(retryCount + 1, 8);
          const delay = Math.min(30000, 500 * Math.pow(2, retryCount));
          reconnectTimer = setTimeout(() => connect(), delay);
        };
      } catch (e) {
        // schedule reconnect on immediate failure
        retryCount = Math.min(retryCount + 1, 8);
        const delay = Math.min(30000, 500 * Math.pow(2, retryCount));
        reconnectTimer = setTimeout(() => connect(), delay);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { if (es) es.close(); } catch (e) { }
      es = null;
    };
  }, [selectedPipeline?.id, selectedPipeline?.status]);

  // Listen for integration events via SSE and show toasts for pipeline warnings
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/integrations/events/stream');
      setSseConnected(true);
      const onMessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          setLastUpdateAt(new Date().toISOString());
          if (data?.connectorId === 'pipeline' && data?.level === 'warning') {
            const id = data.id || `evt_${Date.now()}`;
            setToasts((t) => [{ id, message: data.message }, ...t].slice(0, 5));
            // show browser notification when enabled
            try {
              if (notifEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Pipeline event', { body: data.message });
              }
            } catch (e) {
              // ignore notification errors
            }
            // desktop: use Electron bridge if available
            try {
              const anyWin = window as any;
              if (anyWin?.electronAPI?.notify) {
                anyWin.electronAPI.notify({ title: 'Pipeline event', body: data.message, message: data.message });
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore
        }
      };
      es.onerror = () => { setSseConnected(false); es?.close(); es = null; };
      es.onmessage = onMessage;
    } catch (e) {
      // ignore
    }
    return () => { if (es) es.close(); };
  }, []);

  // initialize notifEnabled from browser permission
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifEnabled(Notification.permission === 'granted');
      }
    } catch (e) { /* ignore */ }
  }, []);

  const requestNotifications = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      const p = await Notification.requestPermission();
      setNotifEnabled(p === 'granted');
    } catch (e) {
      // ignore
    }
  };

  // Auto-dismiss toasts after 6s
  useEffect(() => {
    if (!toasts.length) return;
    const iv = setInterval(() => setToasts((t) => t.slice(0, Math.max(0, t.length - 1))), 6000);
    return () => clearInterval(iv);
  }, [toasts]);

  const selectedTemplate = templates.find((template) => template.id === selected) ?? undefined;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const payload = { pipelineType: selected, input: { idea: input, topic: input, month: input, context: input } };
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetch('/api/pipelines/start', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as PipelineRunResult;
      if (!result.success) {
        setError(result.error || 'Failed to start pipeline');
        return;
      }
      setStatus(`Pipeline started: ${result.pipeline?.id} (${result.pipeline?.status})`);
      appendAgentOpsAudit('PIPELINE_STARTED', result.pipeline?.id || 'unknown', selected);
      if (result.pipeline?.id) await loadPipelineDetails(result.pipeline.id);
    } catch (err) {
      setError('Failed to start pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      {/* Banner when any recent pipeline needs approval */}
      {recentPipelines.some(p => p.status === 'waiting_approval') && (
        <div className="mb-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100">
          Có pipeline đang chờ phê duyệt — mở tab Recent pipelines để xem chi tiết.
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">AI Pipeline Orchestrator</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Pipelines</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Khởi chạy workflow đa-agent, theo dõi step và lưu trạng thái vào Supabase.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-xs font-black text-cyan-100">{templates.length} templates</span>
          <button onClick={requestNotifications} className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">{notifEnabled ? 'Notifications On' : 'Enable Notifications'}</button>
          <button onClick={() => notify('Test notification', 'This is a sample notification from LedgerFlow.')} className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">Test Notification</button>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-slate-300">Supabase token:</label>
        <input value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="Paste access token (optional)" className="w-96 rounded-lg bg-slate-900 p-2 text-sm text-white" />
        <button onClick={() => saveToken(authToken)} className="rounded-2xl bg-emerald-300 px-3 py-1 text-xs font-black text-slate-900">Set Token</button>
        <button onClick={() => saveToken('')} className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">Clear</button>
      </div>
      <div className="mb-4 grid gap-2">
        <div className="flex items-center gap-2">
          <input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="Supabase URL (e.g. https://xyz.supabase.co)" className="w-96 rounded-lg bg-slate-900 p-2 text-sm text-white" />
          <input value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} placeholder="Supabase anon key" className="w-96 rounded-lg bg-slate-900 p-2 text-sm text-white" />
        </div>
        <div className="flex items-center gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-64 rounded-lg bg-slate-900 p-2 text-sm text-white" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-64 rounded-lg bg-slate-900 p-2 text-sm text-white" />
          <button onClick={signInWithSupabase} disabled={authWorking} className="rounded-2xl bg-emerald-300 px-3 py-1 text-xs font-black text-slate-900">Sign in</button>
          <button onClick={signOutSupabase} className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">Sign out</button>
        </div>
      </div>
      {/* Toasts container */}
      <div className="fixed right-6 top-24 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-md bg-amber-600/90 px-3 py-2 text-sm font-bold text-slate-900 shadow">{t.message}</div>
        ))}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <button onClick={handleStart} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200 disabled:opacity-50">
          {loading ? 'Starting...' : 'Start Pipeline'}
        </button>
      </div>

      <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Input context / idea / month / topic" rows={4} className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none" />

      <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
        <p className="text-sm font-black text-white">Selected pipeline</p>
        {selectedTemplate ? (
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p><span className="font-black text-slate-100">{selectedTemplate.name}</span></p>
            <ul className="list-disc space-y-1 pl-5">
              {selectedTemplate.steps.map((step) => (
                <li key={step.name} className="text-slate-300">{step.name} · {step.agentRole} · {step.requiresApproval ? 'Approval' : 'Auto'}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No pipeline template loaded yet.</p>
        )}
      </div>

      {status && <p className="mt-4 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-3 text-sm text-cyan-100">{status}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-white">Recent pipelines</p>
          <span className="text-[11px] font-semibold text-slate-400">Last {recentPipelines.length} runs</span>
        </div>
        {recentPipelines.length ? (
          <div className="space-y-3">
            {recentPipelines.map((pipeline) => (
              <div key={pipeline.id} onClick={() => loadPipelineDetails(pipeline.id)} className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950/90 p-3 text-sm text-slate-300 hover:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-100">{pipeline.name}</p>
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-black uppercase text-slate-300">{pipeline.status}</span>
                </div>
                <p className="text-xs text-slate-500">Type: {pipeline.type} · Step {pipeline.current_step_index + 1}</p>
                <p className="text-xs text-slate-500">Created: {new Date(pipeline.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có pipeline nào được khởi chạy.</p>
        )}
      </div>
      {selectedPipeline && (
        <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-white">Pipeline: {selectedPipeline.name}</p>
              <p className="text-xs text-slate-400">Type: {selectedPipeline.type} · Status: {selectedPipeline.status}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => loadPipelineDetails(selectedPipeline.id)} disabled={loading} className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">Refresh</button>
              <button onClick={() => setSelectedPipeline(null)} className="text-xs font-black text-cyan-200">Close</button>
              <button onClick={async () => {
                try {
                  await fetch(`/api/pipelines/${encodeURIComponent(selectedPipeline.id)}/cancel`, { method: 'POST' });
                  await loadPipelineDetails(selectedPipeline.id);
                } catch { }
              }} className="rounded-2xl border border-rose-600 px-3 py-1 text-xs font-black text-rose-200">Cancel</button>
              <button onClick={async () => {
                try {
                  const stepIndex = Number(selectedPipeline.current_step_index ?? 0);
                  await fetch(`/api/pipelines/${encodeURIComponent(selectedPipeline.id)}/debug-event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'chunk', stepIndex, chunk: `Debug chunk at ${new Date().toISOString()}` }),
                  });
                } catch { }
              }} className="rounded-2xl border border-cyan-500 px-3 py-1 text-xs font-black text-cyan-200">Test SSE</button>
              <button onClick={async () => {
                try {
                  const stepIndex = Number(selectedPipeline.current_step_index ?? 0);
                  await fetch(`/api/pipelines/${encodeURIComponent(selectedPipeline.id)}/debug-event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'update',
                      stepIndex,
                      step: { status: 'waiting_approval', name: selectedPipeline.steps?.[stepIndex]?.name || `Step ${stepIndex + 1}` },
                    }),
                  });
                } catch { }
              }} className="rounded-2xl border border-amber-500 px-3 py-1 text-xs font-black text-amber-200">Test Approval</button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <div>Status: {sseConnected ? 'SSE connected' : 'SSE disconnected'}</div>
            <div>Clients: {sseClients}</div>
            <div>Last: {lastUpdateAt ? new Date(lastUpdateAt).toLocaleTimeString() : '—'}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(Array.isArray(selectedPipeline.steps) ? selectedPipeline.steps : []).map((s: any, idx: number) => (
              <div key={s.id || idx} className="rounded-lg border border-slate-700 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.agentRole} · {s.status}</p>
                  </div>
                  {s.status === 'waiting_approval' && (
                    <button onClick={() => handleApproveStep(selectedPipeline.id, idx)} disabled={loading} className="rounded-2xl bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">Approve</button>
                  )}
                </div>
                {s.output && <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">{s.output}</pre>}
                {/* approvals for this step */}
                {Array.isArray(selectedPipeline?.approvals) && (
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {selectedPipeline.approvals.filter((a: any) => a.step_index === idx).map((a: any) => (
                      <div key={a.id} className="rounded-md bg-slate-900/60 p-2">
                        <p className="font-semibold text-slate-200">Approved by: {a.approver_id || 'local'}</p>
                        <p className="text-[11px] text-slate-400">At: {new Date(a.created_at).toLocaleString()}</p>
                        {a.note && <p className="text-[11px] text-slate-400">Note: {a.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Approval modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="w-[520px] rounded-2xl bg-slate-950 p-6">
            <h3 className="text-lg font-black text-white">Approve step</h3>
            <p className="text-sm text-slate-400">Ghi chú (lý do / điều kiện) và tên người phê duyệt.</p>
            <textarea value={approveNote} onChange={(e) => setApproveNote(e.target.value)} rows={4} className="mt-3 w-full rounded-lg bg-slate-900 p-3 text-sm text-white" placeholder="Optional note" />
            <input value={approveBy} onChange={(e) => setApproveBy(e.target.value)} placeholder="Approver ID or name (optional)" className="mt-3 w-full rounded-lg bg-slate-900 p-3 text-sm text-white" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setApproveModal({ open: false })} className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200">Cancel</button>
              <button onClick={submitApproval} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-900">Confirm Approve</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
