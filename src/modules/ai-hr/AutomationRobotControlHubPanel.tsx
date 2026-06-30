import { useEffect, useMemo, useState } from 'react';
import { Activity, BellRing, Bot, ClipboardList, Database, PlayCircle, RefreshCw, ShieldAlert, Workflow, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type HubData = {
  robotState: any | null;
  automationRules: any[];
  automationLogs: any[];
  workflowTemplates: any[];
  workflows: any[];
  streamPipelines: any[];
  streamStats: Record<string, any>;
  streamEvents: any[];
  notifyTemplates: any[];
  notifyEvents: any[];
  notifyStats: Record<string, any>;
};

const empty: HubData = {
  robotState: null,
  automationRules: [],
  automationLogs: [],
  workflowTemplates: [],
  workflows: [],
  streamPipelines: [],
  streamStats: {},
  streamEvents: [],
  notifyTemplates: [],
  notifyEvents: [],
  notifyStats: {},
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }
function obj(value: any) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function RobotVisualizer({ robotState, onCommand, loading }: { robotState: any; onCommand: (cmd: any) => Promise<void>; loading: boolean }) {
  const pos = robotState?.position || { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };
  const gripper = robotState?.gripperState || 'open';
  
  // Base coordinates mapping for SVG (100, 160)
  const scale = 0.15; // mm to px
  const basePoint = { x: 100, y: 150 };
  const shoulder = { x: basePoint.x, y: basePoint.y - 30 };
  
  // Calculate Elbow and Wrist target coordinates
  const targetX = basePoint.x + (pos.x || 0) * scale;
  const targetY = basePoint.y - 30 - (pos.z || 0) * scale;
  
  // Intermediary Elbow joint
  const elbow = { 
    x: (shoulder.x + targetX) / 2 - 15, 
    y: (shoulder.y + targetY) / 2 - 20 
  };
  
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-cyan-300">Live Mechanical Telemetry</span>
        <span className="text-[10px] text-slate-500 font-bold">X: {pos.x || 0}mm | Z: {pos.z || 0}mm</span>
      </div>

      {/* SVG Canvas */}
      <div className="relative h-44 w-full rounded-xl border border-slate-900 bg-slate-950/90 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 200 180">
          <line x1="0" y1="150" x2="200" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="100" y1="0" x2="100" y2="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
          
          {/* Base structure */}
          <rect x="80" y="150" width="40" height="8" fill="#475569" rx="1.5" />
          <line x1="100" y1="150" x2="100" y2="120" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          
          {/* Shoulder Link */}
          <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          <circle cx={shoulder.x} cy={shoulder.y} r="4.5" fill="#1d4ed8" />
          
          {/* Elbow Link */}
          <line x1={elbow.x} y1={elbow.y} x2={targetX} y2={targetY} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <circle cx={elbow.x} cy={elbow.y} r="3.5" fill="#047857" />
          
          {/* Gripper end effector */}
          <circle cx={targetX} cy={targetY} r="3.5" fill="#f59e0b" />
          {gripper === 'closed' ? (
            <path d={`M ${targetX-4} ${targetY-4} L ${targetX} ${targetY} L ${targetX+4} ${targetY-4}`} stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d={`M ${targetX-6} ${targetY-5} L ${targetX-2} ${targetY} M ${targetX+6} ${targetY-5} L ${targetX+2} ${targetY}`} stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
        
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[9px] font-black uppercase text-right">
          <span className="flex items-center justify-end gap-1 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> mode: sim
          </span>
          <span className="text-slate-500">temp: {robotState?.motorTemperatureC?.toFixed(1) || 22}°c</span>
          <span className="text-slate-500">battery: {Math.round(robotState?.batteryPercent || 100)}%</span>
        </div>
      </div>

      {/* Manual Joysticks */}
      <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase">
        <div className="space-y-1">
          <span className="text-slate-500 text-[9px] block">Linear Axes</span>
          <div className="flex gap-1">
            <button 
              onClick={() => onCommand({ command: 'move', position: { x: Math.min(500, (pos.x || 0) + 50), y: pos.y, z: pos.z }, velocity: 30, approvalPhrase: 'APPROVE ROBOT SIMULATION' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              X+
            </button>
            <button 
              onClick={() => onCommand({ command: 'move', position: { x: Math.max(-500, (pos.x || 0) - 50), y: pos.y, z: pos.z }, velocity: 30, approvalPhrase: 'APPROVE ROBOT SIMULATION' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              X-
            </button>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => onCommand({ command: 'move', position: { x: pos.x, y: pos.y, z: Math.min(500, (pos.z || 0) + 50) }, velocity: 30, approvalPhrase: 'APPROVE ROBOT SIMULATION' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              Z+
            </button>
            <button 
              onClick={() => onCommand({ command: 'move', position: { x: pos.x, y: pos.y, z: Math.max(-500, (pos.z || 0) - 50) }, velocity: 30, approvalPhrase: 'APPROVE ROBOT SIMULATION' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              Z-
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 text-[9px] block">Tool & Calib</span>
          <div className="flex gap-1">
            <button 
              onClick={() => onCommand({ command: 'grip', gripAngle: 90 })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              Grip
            </button>
            <button 
              onClick={() => onCommand({ command: 'release' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              Release
            </button>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => onCommand({ command: 'home' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 font-extrabold text-amber-400"
            >
              Home
            </button>
            <button 
              onClick={() => onCommand({ command: 'calibrate' })}
              disabled={loading || robotState?.emergencyStop}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 p-1 rounded text-center active:scale-95 transition disabled:opacity-50 text-slate-300"
            >
              Calib
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Stat({ label, value, hint, tone = 'slate' }: { label: string; value: string | number; hint?: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' }) {
  const cls = tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'cyan' ? 'text-cyan-300' : 'text-white';
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-black ${cls}`}>{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => React.ReactNode }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 8).map(render)}</div>;
}

export default function AutomationRobotControlHubPanel() {
  const [data, setData] = useState<HubData>(empty);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/robot-simulation/status', undefined, 10000),
        daemonFetch<any>('/api/automation-rules', undefined, 10000),
        daemonFetch<any>('/api/automation-rules/logs?limit=30', undefined, 10000),
        daemonFetch<any>('/api/agent-workflows/templates', undefined, 10000),
        daemonFetch<any>('/api/agent-workflows', undefined, 10000),
        daemonFetch<any>('/api/streams/pipelines', undefined, 10000),
        daemonFetch<any>('/api/streams/events', undefined, 10000),
        daemonFetch<any>('/api/notify/templates', undefined, 10000),
        daemonFetch<any>('/api/notify/events', undefined, 10000),
      ]);
      const [robot, rules, logs, templates, workflows, streams, streamEvents, notifyTemplates, notifyEvents] = results;
      setData({
        robotState: robot.status === 'fulfilled' ? unwrap(robot.value, 'state') : null,
        automationRules: rules.status === 'fulfilled' ? arr(unwrap(rules.value, 'rules')) : [],
        automationLogs: logs.status === 'fulfilled' ? arr(unwrap(logs.value, 'logs')) : [],
        workflowTemplates: templates.status === 'fulfilled' ? arr(unwrap(templates.value, 'templates')) : [],
        workflows: workflows.status === 'fulfilled' ? arr(unwrap(workflows.value, 'workflows')) : [],
        streamPipelines: streams.status === 'fulfilled' ? arr(unwrap(streams.value, 'pipelines')) : [],
        streamStats: streams.status === 'fulfilled' ? obj(unwrap(streams.value, 'stats')) : {},
        streamEvents: streamEvents.status === 'fulfilled' ? arr(unwrap(streamEvents.value, 'events')) : [],
        notifyTemplates: notifyTemplates.status === 'fulfilled' ? arr(unwrap(notifyTemplates.value, 'templates')) : [],
        notifyEvents: notifyEvents.status === 'fulfilled' ? arr(unwrap(notifyEvents.value, 'events')) : [],
        notifyStats: notifyEvents.status === 'fulfilled' ? obj(unwrap(notifyEvents.value, 'stats')) : {},
      });
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải Automation Control, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Automation & Robot Control.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Automation & Robot Control.');
    } finally { setLoading(false); }
  };

  const robotEmergencyStop = async (active: boolean) => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/robot-simulation/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) }, 10000);
      setData((current) => ({ ...current, robotState: unwrap(res, 'state') }));
      setMessage(active ? 'Đã bật robot emergency stop.' : 'Đã tắt robot emergency stop.');
    } catch (err: any) { setError(err?.message || 'Không đổi được emergency stop.'); }
    finally { setLoading(false); }
  };
  
  const runRobotCommand = async (cmd: any) => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/robot-simulation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd)
      }, 10000);
      setData((current) => ({
        ...current,
        robotState: unwrap(res, 'result')?.evidence?.state || current.robotState,
        automationLogs: [
          { ruleName: `Command: ${cmd.command}`, action: 'executed', status: 'completed', createdAt: new Date().toISOString() },
          ...current.automationLogs
        ]
      }));
      setMessage(`Gửi lệnh robot thành công: ${cmd.command}`);
    } catch (err: any) {
      setError(err?.message || 'Lỗi thực thi lệnh robot.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const activeRules = useMemo(() => data.automationRules.filter((rule: any) => rule.enabled !== false && rule.status !== 'disabled').length, [data.automationRules]);
  const runningWorkflows = useMemo(() => data.workflows.filter((wf: any) => ['running', 'active', 'waiting_approval'].includes(String(wf.status).toLowerCase())).length, [data.workflows]);
  const robotTone = data.robotState?.emergencyStop ? 'rose' : data.robotState?.connected ? 'green' : 'amber';

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200"><Bot className="mr-2 inline h-4 w-4" />Automation & Robot Control</p>
          <h2 className="mt-2 text-2xl font-black text-white">Robot, rules, workflows, streams and notifications</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Một màn điều khiển an toàn: xem trạng thái, log, workflow và event. Hành động rủi ro được tách riêng, không tự chạy ngầm.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Robot" value={data.robotState?.emergencyStop ? 'E-STOP' : data.robotState?.connected ? 'Online' : 'Unknown'} hint={data.robotState?.mode || 'simulation'} tone={robotTone as any} />
      <Stat label="Active rules" value={activeRules} hint={`${data.automationRules.length} total`} tone="green" />
      <Stat label="Workflows" value={runningWorkflows} hint={`${data.workflows.length} total`} tone={runningWorkflows ? 'amber' : 'slate'} />
      <Stat label="Streams" value={data.streamPipelines.length} hint={`${data.streamEvents.length} events`} tone="cyan" />
      <Stat label="Notifications" value={data.notifyEvents.length} hint={`${data.notifyTemplates.length} templates`} />
    </section>

    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Section title="Robot simulation safety" icon={<ShieldAlert className="h-4 w-4 text-rose-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={robotTone as any}>{data.robotState?.emergencyStop ? 'emergency stop' : data.robotState?.connected ? 'connected' : 'unknown'}</Badge><Badge>{data.robotState?.mode || 'simulation'}</Badge></div>
        <RobotVisualizer robotState={data.robotState} onCommand={runRobotCommand} loading={loading} />
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void robotEmergencyStop(true)} disabled={loading} className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs font-black text-rose-100">Bật E-Stop</button><button onClick={() => void robotEmergencyStop(false)} disabled={loading} className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-100">Tắt E-Stop</button></div>
      </Section>
      <Section title="Automation rules & logs" icon={<Zap className="h-4 w-4 text-amber-300" />}>
        <div className="grid gap-3 lg:grid-cols-2">
          <MiniList items={data.automationRules} emptyText="Chưa có automation rule." render={(rule, index) => <div key={rule.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{rule.name || rule.title || rule.id || 'Rule'}</p><Badge tone={rule.enabled === false ? 'slate' : 'green'}>{rule.enabled === false ? 'off' : 'on'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{rule.trigger || rule.description || rule.status || 'automation rule'}</p></div>} />
          <MiniList items={data.automationLogs} emptyText="Chưa có automation log." render={(log, index) => <div key={log.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{log.ruleName || log.action || log.id || 'Log'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{log.status || log.createdAt || log.message || JSON.stringify(log).slice(0, 120)}</p></div>} />
        </div>
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Agent workflows" icon={<Workflow className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="violet">{data.workflowTemplates.length} templates</Badge><Badge tone={runningWorkflows ? 'amber' : 'green'}>{data.workflows.length} runs</Badge></div>
        <MiniList items={data.workflows.length ? data.workflows : data.workflowTemplates} emptyText="Chưa có workflow/template." render={(wf, index) => <div key={wf.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{wf.name || wf.goal || wf.id || 'Workflow'}</p><Badge tone={String(wf.status || '').includes('running') ? 'amber' : 'slate'}>{wf.status || wf.category || 'workflow'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{wf.description || wf.updatedAt || wf.createdAt || 'agent workflow'}</p></div>} />
      </Section>
      <Section title="Event streams" icon={<Activity className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="cyan">{data.streamPipelines.length} pipelines</Badge><Badge>{data.streamEvents.length} events</Badge></div>
        <MiniList items={data.streamEvents.length ? data.streamEvents : data.streamPipelines} emptyText="Chưa có stream pipeline/event." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.stream || item.name || item.type || item.id || 'Stream'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.source || item.status || item.createdAt || item.description || 'event stream'}</p></div>} />
      </Section>
      <Section title="Notification engine" icon={<BellRing className="h-4 w-4 text-emerald-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="green">{data.notifyTemplates.length} templates</Badge><Badge>{data.notifyEvents.length} events</Badge></div>
        <MiniList items={data.notifyEvents.length ? data.notifyEvents : data.notifyTemplates} emptyText="Chưa có notification template/event." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.template || item.name || item.subject || item.id || 'Notification'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.channel || item.status || item.priority || item.createdAt || 'notification'}</p></div>} />
      </Section>
    </section>

    <Section title="Control room summary" icon={<ClipboardList className="h-4 w-4 text-slate-300" />}>
      <div className="flex flex-wrap gap-2"><Badge tone={data.robotState?.emergencyStop ? 'rose' : 'green'}>Robot {data.robotState?.emergencyStop ? 'stopped' : 'safe'}</Badge><Badge tone="green">{activeRules} active rules</Badge><Badge tone={runningWorkflows ? 'amber' : 'slate'}>{runningWorkflows} running workflows</Badge><Badge tone="cyan">{data.streamEvents.length} stream events</Badge><Badge>{data.notifyEvents.length} notifications</Badge></div>
      <p className="mt-3 text-xs font-semibold leading-6 text-slate-500">Read-only dashboards tự tải dữ liệu. Các action chạy workflow/deploy/notification sẽ được thêm sau khi có approval UI rõ ràng.</p>
    </Section>

    {rawOpen && <Section title="Raw Automation Control payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
