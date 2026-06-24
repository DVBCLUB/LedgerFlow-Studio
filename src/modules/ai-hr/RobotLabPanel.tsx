import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Cpu,
  Home,
  Maximize2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';

// ─── Types (mirrors robotConnector.ts) ───────────────────────────────────────

interface RobotPosition6DOF {
  x: number; y: number; z: number;
  roll: number; pitch: number; yaw: number;
}

interface RobotTelemetrySnapshot {
  snapshotId: string;
  recordedAt: string;
  position: RobotPosition6DOF;
  velocity: number;
  gripperState: 'open' | 'closed' | 'partial';
  motorTemperatureC: number;
  batteryPercent: number;
  collisionDetected: boolean;
}

interface RobotSimulationState {
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
}

// ─── Axis Gauge ───────────────────────────────────────────────────────────────

function AxisBar({ label, value, max, unit, color = 'cyan' }: {
  label: string; value: number; max: number; unit: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    fuchsia: 'bg-fuchsia-500', rose: 'bg-rose-500',
  };
  const pct = Math.min(100, Math.max(0, ((value + max) / (max * 2)) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-right text-xs font-black text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700" />
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${colorMap[color] || 'bg-cyan-500'}`}
          style={value >= 0
            ? { left: '50%', width: `${pct - 50}%` }
            : { right: '50%', width: `${50 - pct}%` }
          }
        />
      </div>
      <span className="w-20 text-xs font-black text-white shrink-0">{value.toFixed(1)}{unit}</span>
    </div>
  );
}

// ─── 3D Position Visualizer (ASCII/SVG) ──────────────────────────────────────

function PositionVisualizer({ position }: { position: RobotPosition6DOF }) {
  const SCALE = 0.35; // mm → SVG units
  const cx = 80, cy = 80; // center
  const dx = position.x * SCALE;
  const dy = -position.y * SCALE;
  const endX = cx + dx;
  const endY = cy + dy;
  const zOpacity = Math.min(1, 0.3 + Math.abs(position.z) / 500 * 0.7);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="overflow-visible">
        {/* Grid */}
        {[-120, -80, -40, 0, 40, 80, 120].map((v) => (
          <React.Fragment key={v}>
            <line x1={cx + v * SCALE} y1={0} x2={cx + v * SCALE} y2={160} stroke="#1e293b" strokeWidth="0.5" />
            <line x1={0} y1={cy + v * SCALE} x2={160} y2={cy + v * SCALE} stroke="#1e293b" strokeWidth="0.5" />
          </React.Fragment>
        ))}
        {/* Safety envelope circle */}
        <circle cx={cx} cy={cy} r={500 * SCALE} fill="none" stroke="#22d3ee22" strokeWidth="1" strokeDasharray="4 4" />
        {/* Home marker */}
        <circle cx={cx} cy={cy} r="3" fill="#334155" stroke="#475569" strokeWidth="1" />
        <text x={cx + 4} y={cy - 4} fontSize="8" fill="#64748b" fontWeight="bold">HOME</text>
        {/* Arm line */}
        <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6" />
        {/* Robot end-effector */}
        <circle cx={endX} cy={endY} r="6" fill="#0e7490" stroke="#22d3ee" strokeWidth="2" opacity={zOpacity} />
        {/* Z indicator */}
        <text x={endX + 8} y={endY} fontSize="8" fill="#22d3ee99" fontWeight="bold">z:{position.z.toFixed(0)}</text>
        {/* Axes labels */}
        <text x={155} y={cy + 3} fontSize="8" fill="#22d3ee88" fontWeight="bold">X</text>
        <text x={cx + 3} y={10} fontSize="8" fill="#22d3ee88" fontWeight="bold">Y</text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RobotLabPanel() {
  const [state, setState] = useState<RobotSimulationState | null>(null);
  const [telemetry, setTelemetry] = useState<RobotTelemetrySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  // Command form state
  const [cmd, setCmd] = useState<'inspect' | 'home' | 'calibrate' | 'grip' | 'release' | 'move' | 'rotate'>('inspect');
  const [targetX, setTargetX] = useState('0');
  const [targetY, setTargetY] = useState('0');
  const [targetZ, setTargetZ] = useState('0');
  const [targetRoll, setTargetRoll] = useState('0');
  const [targetPitch, setTargetPitch] = useState('0');
  const [targetYaw, setTargetYaw] = useState('0');
  const [velocity, setVelocity] = useState('25');
  const [gripAngle, setGripAngle] = useState('90');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const [stateRes, telRes] = await Promise.all([
        fetch('/api/robot-simulation/status'),
        fetch('/api/robot-simulation/telemetry?limit=10'),
      ]);
      if (stateRes.ok) setState(await stateRes.json() as RobotSimulationState);
      if (telRes.ok) setTelemetry(await telRes.json() as RobotTelemetrySnapshot[]);
      setError(null);
    } catch {
      setError('Không thể kết nối Robot Simulator.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchState();
    intervalRef.current = setInterval(() => { void fetchState(); }, 3_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchState]);

  const handleCommand = async () => {
    const needsApproval = cmd === 'move' || cmd === 'rotate';
    if (needsApproval && !approvalConfirmed) {
      setCommandResult('⚠️ Vui lòng xác nhận approval trước khi ra lệnh di chuyển.');
      return;
    }

    setExecuting(true); setCommandResult(null);
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

      const res = await fetch('/api/robot-simulation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { accepted?: boolean; commandId?: string; error?: string };
      if (res.ok && data.accepted) {
        setCommandResult(`✅ Lệnh "${cmd}" thực thi: ${data.commandId?.slice(0, 20)}…`);
        setApprovalConfirmed(false);
      } else {
        setCommandResult(`❌ Lỗi: ${data.error || 'Command rejected'}`);
      }
      await fetchState();
    } catch {
      setCommandResult('❌ Lỗi kết nối server.');
    } finally {
      setExecuting(false);
    }
  };

  const handleEmergencyStop = async () => {
    setExecuting(true);
    try {
      await fetch('/api/robot-simulation/emergency-stop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !state?.emergencyStop }),
      });
      await fetchState();
      setCommandResult(state?.emergencyStop ? '✅ Emergency stop đã reset.' : '🔴 Emergency stop đã kích hoạt!');
    } catch {
      setCommandResult('❌ Lỗi E-Stop.');
    } finally {
      setExecuting(false);
    }
  };

  const pos = state?.position ?? { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };
  const batteryColor = (state?.batteryPercent ?? 100) > 50 ? 'text-emerald-400' : (state?.batteryPercent ?? 100) > 20 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
              <Bot className="h-3.5 w-3.5" /> Robot Digital Twin Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Robot Simulator — 6-DOF</h1>
            <p className="mt-1 text-sm text-slate-400 font-semibold">
              Chế độ: <span className="text-emerald-400 font-black">SIMULATION ONLY</span> — Không kết nối phần cứng thực.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchState()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => void handleEmergencyStop()}
              disabled={executing}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all ${
                state?.emergencyStop
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              {state?.emergencyStop ? '🔴 E-STOP ACTIVE — Click Reset' : 'Emergency Stop'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Position Visualizer & Telemetry ─────────────────────────────────── */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Target className="h-4 w-4 text-cyan-400" /> Vị trí End-Effector (XY Plane)
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500 animate-pulse">Đang tải…</div>
            ) : (
              <PositionVisualizer position={pos} />
            )}
          </section>

          {/* 6-DOF Axes */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Maximize2 className="h-4 w-4 text-emerald-400" /> 6-DOF Axes
            </h2>
            <div className="space-y-2.5">
              <AxisBar label="X" value={pos.x} max={500} unit="mm" color="cyan" />
              <AxisBar label="Y" value={pos.y} max={500} unit="mm" color="cyan" />
              <AxisBar label="Z" value={pos.z} max={500} unit="mm" color="emerald" />
              <div className="my-2 border-t border-slate-800" />
              <AxisBar label="Roll" value={pos.roll} max={180} unit="°" color="amber" />
              <AxisBar label="Pitch" value={pos.pitch} max={180} unit="°" color="amber" />
              <AxisBar label="Yaw" value={pos.yaw} max={180} unit="°" color="amber" />
            </div>
          </section>

          {/* Status indicators */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Activity className="h-4 w-4 text-fuchsia-400" /> Trạng thái hệ thống
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Gripper</p>
                <p className={`text-sm font-black ${
                  state?.gripperState === 'closed' ? 'text-rose-400' : state?.gripperState === 'partial' ? 'text-amber-400' : 'text-emerald-400'
                }`}>{state?.gripperState || 'open'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Battery</p>
                <p className={`text-sm font-black ${batteryColor}`}>{state?.batteryPercent?.toFixed(1) ?? '100'}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Temp Motor</p>
                <p className="text-sm font-black text-blue-400">{state?.motorTemperatureC?.toFixed(1) ?? '22'}°C</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">E-Stop</p>
                <div className="flex items-center gap-1.5">
                  {state?.emergencyStop
                    ? <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  }
                  <p className={`text-sm font-black ${state?.emergencyStop ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {state?.emergencyStop ? 'ACTIVE' : 'OK'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Command Console ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Cpu className="h-4 w-4 text-cyan-400" /> Command Console
            </h2>

            {/* Command select */}
            <div className="mb-4">
              <label className="block text-xs font-black text-slate-400 mb-2">Loại lệnh</label>
              <div className="flex flex-wrap gap-2">
                {(['inspect', 'home', 'calibrate', 'grip', 'release', 'move', 'rotate'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCmd(c); setApprovalConfirmed(false); setCommandResult(null); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                      cmd === c ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Move params */}
            {cmd === 'move' && (
              <div className="mb-4 space-y-3">
                <p className="text-xs text-amber-300 font-bold">⚠️ Giới hạn: ±500mm mỗi trục | Velocity max 100mm/s</p>
                <div className="grid grid-cols-3 gap-2">
                  {[['X (mm)', targetX, setTargetX], ['Y (mm)', targetY, setTargetY], ['Z (mm)', targetZ, setTargetZ]].map(([label, val, setter]) => (
                    <div key={label as string}>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">Velocity (mm/s)</label>
                  <input type="number" value={velocity} onChange={(e) => setVelocity(e.target.value)} min={1} max={100}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Rotate params */}
            {cmd === 'rotate' && (
              <div className="mb-4 space-y-3">
                <p className="text-xs text-amber-300 font-bold">⚠️ Giới hạn: ±180° mỗi trục</p>
                <div className="grid grid-cols-3 gap-2">
                  {[['Roll (°)', targetRoll, setTargetRoll], ['Pitch (°)', targetPitch, setTargetPitch], ['Yaw (°)', targetYaw, setTargetYaw]].map(([label, val, setter]) => (
                    <div key={label as string}>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grip params */}
            {cmd === 'grip' && (
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-500 mb-1">Grip Angle (0=open, 90=closed)</label>
                <input type="range" min={0} max={90} value={gripAngle} onChange={(e) => setGripAngle(e.target.value)}
                  className="w-full accent-cyan-400" />
                <div className="text-xs text-white font-black mt-1">{gripAngle}°</div>
              </div>
            )}

            {/* Approval checkbox for move/rotate */}
            {(cmd === 'move' || cmd === 'rotate') && (
              <label className="mb-4 flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={approvalConfirmed} onChange={(e) => setApprovalConfirmed(e.target.checked)}
                  className="mt-0.5 accent-cyan-400" />
                <span className="text-xs text-amber-200 font-semibold leading-5">
                  Tôi xác nhận lệnh này an toàn và đã kiểm tra toạ độ target trong giới hạn simulation envelope.
                  <br /><span className="text-slate-500">Phrase: APPROVE ROBOT SIMULATION</span>
                </span>
              </label>
            )}

            <button
              onClick={() => void handleCommand()}
              disabled={executing || Boolean(state?.emergencyStop) || (cmd === 'move' && !approvalConfirmed) || (cmd === 'rotate' && !approvalConfirmed)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-xs font-black text-slate-950 disabled:opacity-40 hover:bg-cyan-300 transition-colors"
            >
              <Zap className="h-4 w-4" /> {executing ? 'Đang thực thi…' : `Thực thi lệnh: ${cmd}`}
            </button>

            {commandResult && (
              <p className={`mt-3 text-sm font-bold ${commandResult.startsWith('✅') ? 'text-emerald-300' : commandResult.startsWith('⚠️') ? 'text-amber-300' : 'text-rose-300'}`}>
                {commandResult}
              </p>
            )}
          </section>

          {/* Telemetry History */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Activity className="h-4 w-4 text-fuchsia-400" /> Telemetry History (10 gần nhất)
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {telemetry.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu telemetry.</p>
              ) : telemetry.map((snap, i) => (
                <div key={snap.snapshotId} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-500">
                      {new Date(snap.recordedAt).toLocaleTimeString('vi-VN')}
                    </span>
                    {snap.collisionDetected && <span className="text-[10px] font-black text-rose-400">⚠️ COLLISION</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    XYZ: [{snap.position.x.toFixed(1)}, {snap.position.y.toFixed(1)}, {snap.position.z.toFixed(1)}]
                    · Roll/Pitch/Yaw: [{snap.position.roll.toFixed(1)}°, {snap.position.pitch.toFixed(1)}°, {snap.position.yaw.toFixed(1)}°]
                    · Gripper: {snap.gripperState}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
