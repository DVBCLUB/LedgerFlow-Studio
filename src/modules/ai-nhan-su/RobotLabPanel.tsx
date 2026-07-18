import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Home, RefreshCw, RotateCcw, ShieldAlert, Target } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type RobotPosition6DOF = { x: number; y: number; z: number; roll: number; pitch: number; yaw: number };
type RobotTelemetrySnapshot = {
  snapshotId: string;
  recordedAt: string;
  position: RobotPosition6DOF;
  velocity: number;
  gripperState: 'open' | 'closed' | 'partial';
  motorTemperatureC: number;
  batteryPercent: number;
  collisionDetected: boolean;
};
type RobotSimulationState = {
  emergencyStop: boolean;
  connected: false;
  mode: 'simulation';
  position: RobotPosition6DOF;
  velocity: number;
  gripperState: 'open' | 'closed' | 'partial';
  motorTemperatureC: number;
  batteryPercent: number;
  lastHeartbeatAt: string;
  lastCommandId?: string;
  taskQueue: Array<{ id: string; command: string; status: string; queuedAt: string }>;
  telemetryHistory: RobotTelemetrySnapshot[];
};

type RobotStatusResponse = RobotSimulationState | { success?: boolean; state?: RobotSimulationState; error?: string };
type RobotCommand = 'inspect' | 'home' | 'calibrate' | 'grip' | 'release' | 'move' | 'rotate';

const ZERO: RobotPosition6DOF = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };

function unwrapState(data: RobotStatusResponse): RobotSimulationState {
  if ('state' in data && data.state) return data.state;
  return data as RobotSimulationState;
}

function AxisValue({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{label}</p>
      <p className="mt-1 text-lg font-black text-cyan-200">{value.toFixed(1)}{unit}</p>
    </div>
  );
}

export default function RobotLabPanel() {
  const [state, setState] = useState<RobotSimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [cmd, setCmd] = useState<RobotCommand>('inspect');
  const [targetX, setTargetX] = useState('0');
  const [targetY, setTargetY] = useState('0');
  const [targetZ, setTargetZ] = useState('0');
  const [targetRoll, setTargetRoll] = useState('0');
  const [targetPitch, setTargetPitch] = useState('0');
  const [targetYaw, setTargetYaw] = useState('0');
  const [velocity, setVelocity] = useState('25');
  const [gripAngle, setGripAngle] = useState('90');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await daemonFetch<RobotStatusResponse>('/api/robot-simulation/status', undefined, 8000);
      setState(unwrapState(data));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Cannot connect Robot Simulator.');
    }
  }, []);

  useEffect(() => {
    void fetchState();
    intervalRef.current = setInterval(() => void fetchState(), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchState]);

  const handleCommand = async () => {
    const needsApproval = cmd === 'move' || cmd === 'rotate';
    if (needsApproval && !approvalConfirmed) {
      setMessage('Approval checkbox is required for move/rotate commands.');
      return;
    }
    setExecuting(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { command: cmd };
      if (cmd === 'move') {
        body.position = { x: Number(targetX), y: Number(targetY), z: Number(targetZ), roll: 0, pitch: 0, yaw: 0 };
        body.velocity = Number(velocity);
        body.approvalPhrase = 'APPROVE ROBOT SIMULATION';
      }
      if (cmd === 'rotate') {
        body.position = { x: 0, y: 0, z: 0, roll: Number(targetRoll), pitch: Number(targetPitch), yaw: Number(targetYaw) };
        body.approvalPhrase = 'APPROVE ROBOT SIMULATION';
      }
      if (cmd === 'grip') body.gripAngle = Number(gripAngle);
      const data = await daemonFetch<any>('/api/robot-simulation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, 15000);
      const commandId = data?.result?.commandId || data?.commandId || data?.boundary?.command?.id;
      setMessage(`Command accepted: ${commandId || cmd}`);
      setApprovalConfirmed(false);
      await fetchState();
    } catch (err: any) {
      setMessage(`Command failed: ${err?.message || 'unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handlePreview = async () => {
    setExecuting(true);
    setPreviewData(null);
    try {
      const body: Record<string, unknown> = {};
      if (cmd === 'move') {
        body.position = { x: Number(targetX), y: Number(targetY), z: Number(targetZ), roll: 0, pitch: 0, yaw: 0 };
      } else if (cmd === 'rotate') {
        body.position = { x: 0, y: 0, z: 0, roll: Number(targetRoll), pitch: Number(targetPitch), yaw: Number(targetYaw) };
      } else {
        setMessage('Preview only available for move/rotate.');
        setExecuting(false);
        return;
      }
      
      const data = await daemonFetch<any>('/api/robot-simulation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setPreviewData(data.preview);
    } catch (err: any) {
      setMessage(`Preview failed: ${err?.message || 'unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleEmergencyStop = async () => {
    setExecuting(true);
    try {
      const data = await daemonFetch<{ success?: boolean; state?: RobotSimulationState }>('/api/robot-simulation/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !state?.emergencyStop }),
      });
      if (data.state) setState(data.state);
      setMessage(state?.emergencyStop ? 'Emergency stop reset.' : 'Emergency stop activated.');
      await fetchState();
    } catch (err: any) {
      setMessage(`E-stop failed: ${err?.message || 'unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const pos = state?.position ?? ZERO;
  const telemetry = state?.telemetryHistory ?? [];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-border-primary bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300"><Bot className="h-3.5 w-3.5" /> Robot Digital Twin Lab</div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">Robot Simulator - 6 DOF</h1>
            <p className="mt-1 text-sm font-semibold text-text-secondary">Simulation only. No physical hardware is controlled.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void fetchState()} className="rounded-xl border border-border-secondary bg-bg-surface px-3 py-2 text-xs font-black text-text-secondary"><RefreshCw className="inline h-4 w-4" /></button>
            <button onClick={() => void handleEmergencyStop()} disabled={executing} className={`rounded-xl px-5 py-2.5 text-xs font-black ${state?.emergencyStop ? 'bg-rose-500 text-text-primary' : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'}`}><ShieldAlert className="mr-2 inline h-4 w-4" />{state?.emergencyStop ? 'E-STOP ACTIVE - Reset' : 'Emergency Stop'}</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
      {message && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm font-bold text-cyan-200">{message}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Mode</p><p className="mt-2 text-xl font-black text-emerald-300">{state?.mode || 'offline'}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Battery</p><p className="mt-2 text-xl font-black text-cyan-300">{(state?.batteryPercent ?? 0).toFixed(1)}%</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Temperature</p><p className="mt-2 text-xl font-black text-amber-300">{(state?.motorTemperatureC ?? 0).toFixed(1)} C</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <h2 className="mb-4 text-sm font-black text-text-primary"><Target className="mr-2 inline h-4 w-4 text-cyan-300" />Position</h2>
          <div className="grid grid-cols-3 gap-3">
            <AxisValue label="X" value={pos.x} unit="mm" /><AxisValue label="Y" value={pos.y} unit="mm" /><AxisValue label="Z" value={pos.z} unit="mm" />
            <AxisValue label="Roll" value={pos.roll} unit="deg" /><AxisValue label="Pitch" value={pos.pitch} unit="deg" /><AxisValue label="Yaw" value={pos.yaw} unit="deg" />
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <h2 className="mb-4 text-sm font-black text-text-primary"><RotateCcw className="mr-2 inline h-4 w-4 text-emerald-300" />Command</h2>
          <select value={cmd} onChange={(event) => setCmd(event.target.value as RobotCommand)} className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary">
            {['inspect', 'home', 'calibrate', 'grip', 'release', 'move', 'rotate'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {cmd === 'move' && <div className="mt-3 grid grid-cols-4 gap-2"><input value={targetX} onChange={(e) => setTargetX(e.target.value)} placeholder="X" className="rounded-lg bg-slate-950 p-2" /><input value={targetY} onChange={(e) => setTargetY(e.target.value)} placeholder="Y" className="rounded-lg bg-slate-950 p-2" /><input value={targetZ} onChange={(e) => setTargetZ(e.target.value)} placeholder="Z" className="rounded-lg bg-slate-950 p-2" /><input value={velocity} onChange={(e) => setVelocity(e.target.value)} placeholder="V" className="rounded-lg bg-slate-950 p-2" /></div>}
          {cmd === 'rotate' && <div className="mt-3 grid grid-cols-3 gap-2"><input value={targetRoll} onChange={(e) => setTargetRoll(e.target.value)} placeholder="Roll" className="rounded-lg bg-slate-950 p-2" /><input value={targetPitch} onChange={(e) => setTargetPitch(e.target.value)} placeholder="Pitch" className="rounded-lg bg-slate-950 p-2" /><input value={targetYaw} onChange={(e) => setTargetYaw(e.target.value)} placeholder="Yaw" className="rounded-lg bg-slate-950 p-2" /></div>}
          {cmd === 'grip' && <input value={gripAngle} onChange={(e) => setGripAngle(e.target.value)} placeholder="Grip angle" className="mt-3 w-full rounded-lg bg-slate-950 p-2" />}
          {(cmd === 'move' || cmd === 'rotate') && (
            <div className="mt-3 space-y-2">
              <button onClick={() => void handlePreview()} disabled={executing} className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300">Preview Path</button>
              {previewData && (
                <div className="rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                  <p><strong>Distance:</strong> {previewData.distanceMm?.toFixed(2)} mm</p>
                  <p><strong>Time:</strong> {previewData.estimatedTimeSec?.toFixed(2)} s</p>
                  <p><strong>Collision Risk:</strong> {previewData.collisionRisk ? <span className="text-rose-500">YES</span> : 'NO'}</p>
                  <p><strong>Boundary OK:</strong> {previewData.boundaryCheckPassed ? 'YES' : <span className="text-rose-500">NO</span>}</p>
                  <p className="mt-1 text-[10px] text-amber-200">{previewData.checklist?.join(' | ')}</p>
                </div>
              )}
              <label className="flex items-center gap-2 text-xs font-bold text-amber-200"><input type="checkbox" checked={approvalConfirmed} onChange={(e) => setApprovalConfirmed(e.target.checked)} />Approve simulation command</label>
            </div>
          )}
          <button onClick={() => void handleCommand()} disabled={executing} className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Home className="mr-2 inline h-4 w-4" />Run command</button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
        <h2 className="mb-3 text-sm font-black text-text-primary">Recent telemetry</h2>
        <div className="space-y-2">
          {telemetry.slice(0, 8).map((item) => <div key={item.snapshotId} className="rounded-xl border border-border-primary bg-slate-950/60 p-3 text-xs text-text-secondary">{new Date(item.recordedAt).toLocaleTimeString()} | battery {item.batteryPercent.toFixed(1)}% | temp {item.motorTemperatureC.toFixed(1)} C | grip {item.gripperState}</div>)}
          {telemetry.length === 0 && <p className="text-xs font-bold text-text-tertiary">No telemetry yet. Run inspect or another command.</p>}
        </div>
      </div>
    </div>
  );
}
