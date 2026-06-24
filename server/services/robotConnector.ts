import { randomUUID } from 'node:crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RobotCommandType =
  | 'inspect'
  | 'move'
  | 'stop'
  | 'home'
  | 'rotate'
  | 'grip'
  | 'release'
  | 'calibrate';

export type RobotTaskStatus = 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface RobotPosition6DOF {
  /** Linear axes (millimeters) */
  x: number;
  y: number;
  z: number;
  /** Rotational axes (degrees) */
  roll: number;
  pitch: number;
  yaw: number;
}

export interface RobotTelemetrySnapshot {
  snapshotId: string;
  recordedAt: string;
  position: RobotPosition6DOF;
  velocity: number;
  gripperState: 'open' | 'closed' | 'partial';
  motorTemperatureC: number;
  batteryPercent: number;
  collisionDetected: boolean;
}

export interface RobotTask {
  id: string;
  command: RobotCommandType;
  position?: RobotPosition6DOF;
  velocity?: number;
  gripAngle?: number;
  status: RobotTaskStatus;
  approvalPhrase?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface RobotSimulationState {
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
  taskQueue: RobotTask[];
  telemetryHistory: RobotTelemetrySnapshot[];
}

// ─── Safety Envelope ──────────────────────────────────────────────────────────

const ENVELOPE = {
  maxLinearMm: 500,
  maxVelocityMmS: 100,
  maxRotationDeg: 180,
  maxTelemetryHistory: 50,
  maxQueueLength: 10,
} as const;

// ─── State ────────────────────────────────────────────────────────────────────

let state: RobotSimulationState = {
  emergencyStop: false,
  connected: false,
  mode: 'simulation',
  position: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
  velocity: 0,
  gripperState: 'open',
  motorTemperatureC: 22,
  batteryPercent: 100,
  lastHeartbeatAt: new Date().toISOString(),
  taskQueue: [],
  telemetryHistory: [],
};

// ─── Telemetry ────────────────────────────────────────────────────────────────

function recordTelemetry(): RobotTelemetrySnapshot {
  const snapshot: RobotTelemetrySnapshot = {
    snapshotId: `tel_${randomUUID()}`,
    recordedAt: new Date().toISOString(),
    position: { ...state.position },
    velocity: state.velocity,
    gripperState: state.gripperState,
    motorTemperatureC: state.motorTemperatureC + (Math.random() * 0.4 - 0.2), // slight variation
    batteryPercent: Math.max(0, state.batteryPercent - 0.01), // gradual drain
    collisionDetected: false,
  };
  const history = [snapshot, ...state.telemetryHistory].slice(0, ENVELOPE.maxTelemetryHistory);
  state = { ...state, telemetryHistory: history };
  return snapshot;
}

// ─── Collision Detection ──────────────────────────────────────────────────────

function detectCollision(target: RobotPosition6DOF): boolean {
  // Simple envelope check; always false within bounds — future: mesh-based
  return (
    Math.abs(target.x) > ENVELOPE.maxLinearMm ||
    Math.abs(target.y) > ENVELOPE.maxLinearMm ||
    Math.abs(target.z) > ENVELOPE.maxLinearMm
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getRobotSimulationState(): RobotSimulationState {
  state = { ...state, lastHeartbeatAt: new Date().toISOString() };
  return structuredClone(state);
}

export function getRobotTelemetry(limit = 20): RobotTelemetrySnapshot[] {
  return state.telemetryHistory.slice(0, limit);
}

export function setRobotEmergencyStop(active: boolean) {
  // Cancel all queued tasks on E-stop
  const updatedQueue = state.taskQueue.map((task) =>
    ['queued', 'executing'].includes(task.status)
      ? { ...task, status: 'cancelled' as RobotTaskStatus, completedAt: new Date().toISOString() }
      : task,
  );
  state = {
    ...state,
    emergencyStop: active,
    velocity: 0,
    taskQueue: updatedQueue,
    lastHeartbeatAt: new Date().toISOString(),
  };
  recordTelemetry();
  if (active) {
    import('./agentEventBus.ts').then(({ publish }) => {
      publish('robot.emergency_stop', { active: true, timestamp: new Date().toISOString() }).catch(() => undefined);
    }).catch(() => undefined);
  }
  return getRobotSimulationState();
}

export function resetRobotEmergencyStop() {
  if (!state.emergencyStop) return getRobotSimulationState();
  state = { ...state, emergencyStop: false, lastHeartbeatAt: new Date().toISOString() };
  return getRobotSimulationState();
}

export function getRobotTaskQueue(): RobotTask[] {
  return structuredClone(state.taskQueue);
}

export function simulateRobotCommand(input: {
  command: RobotCommandType;
  position?: RobotPosition6DOF;
  velocity?: number;
  gripAngle?: number;
  approvalPhrase?: string;
}): { commandId: string; accepted: boolean; mode: 'simulation'; limits: typeof ENVELOPE; evidence: { observedAt: string; state: RobotSimulationState; telemetry: RobotTelemetrySnapshot } } {
  const commandId = `robot_${randomUUID()}`;

  // ─ Emergency stop command ─────────────────────────────────────────────────
  if (input.command === 'stop') {
    setRobotEmergencyStop(true);
    const tel = recordTelemetry();
    return {
      commandId,
      accepted: true,
      mode: 'simulation',
      limits: ENVELOPE,
      evidence: { observedAt: new Date().toISOString(), state: getRobotSimulationState(), telemetry: tel },
    };
  }

  if (state.emergencyStop) {
    throw new Error('Robot emergency stop is active. Reset it with resetRobotEmergencyStop() before issuing commands.');
  }

  // ─ Task queue limit ───────────────────────────────────────────────────────
  const pendingTasks = state.taskQueue.filter((t) => ['queued', 'executing'].includes(t.status));
  if (pendingTasks.length >= ENVELOPE.maxQueueLength) {
    throw new Error(`Robot task queue is full (max ${ENVELOPE.maxQueueLength} pending tasks).`);
  }

  // ─ Move command ───────────────────────────────────────────────────────────
  if (input.command === 'move') {
    if (input.approvalPhrase !== 'APPROVE ROBOT SIMULATION') {
      throw new Error('Robot move command requires approvalPhrase: "APPROVE ROBOT SIMULATION".');
    }
    const target = input.position;
    if (!target) throw new Error('position is required for move command.');

    const linearAxes: (keyof RobotPosition6DOF)[] = ['x', 'y', 'z'];
    for (const axis of linearAxes) {
      if (!Number.isFinite(target[axis]) || Math.abs(target[axis]) > ENVELOPE.maxLinearMm) {
        throw new Error(`Position axis ${axis} = ${target[axis]} exceeds ±${ENVELOPE.maxLinearMm} mm safety envelope.`);
      }
    }
    if (detectCollision(target)) {
      throw new Error('Simulated collision detected at target position. Command rejected.');
    }
    const velocity = input.velocity ?? 25;
    if (!Number.isFinite(velocity) || velocity <= 0 || velocity > ENVELOPE.maxVelocityMmS) {
      throw new Error(`Velocity must be 0 < v ≤ ${ENVELOPE.maxVelocityMmS} mm/s.`);
    }
    state = { ...state, position: { ...state.position, ...target }, velocity: 0, lastHeartbeatAt: new Date().toISOString(), lastCommandId: commandId };
  }

  // ─ Rotate command ─────────────────────────────────────────────────────────
  else if (input.command === 'rotate') {
    if (input.approvalPhrase !== 'APPROVE ROBOT SIMULATION') {
      throw new Error('Robot rotate command requires approvalPhrase: "APPROVE ROBOT SIMULATION".');
    }
    const target = input.position;
    if (!target) throw new Error('position with roll/pitch/yaw is required for rotate command.');
    const rotAxes: (keyof RobotPosition6DOF)[] = ['roll', 'pitch', 'yaw'];
    for (const axis of rotAxes) {
      if (!Number.isFinite(target[axis]) || Math.abs(target[axis]) > ENVELOPE.maxRotationDeg) {
        throw new Error(`Rotation axis ${axis} = ${target[axis]} exceeds ±${ENVELOPE.maxRotationDeg}° safety envelope.`);
      }
    }
    state = {
      ...state,
      position: { ...state.position, roll: target.roll, pitch: target.pitch, yaw: target.yaw },
      lastHeartbeatAt: new Date().toISOString(),
      lastCommandId: commandId,
    };
  }

  // ─ Grip / Release ─────────────────────────────────────────────────────────
  else if (input.command === 'grip') {
    const angle = input.gripAngle ?? 90;
    const gripperState = angle >= 90 ? 'closed' : angle <= 10 ? 'open' : 'partial';
    state = { ...state, gripperState, lastHeartbeatAt: new Date().toISOString(), lastCommandId: commandId };
  } else if (input.command === 'release') {
    state = { ...state, gripperState: 'open', lastHeartbeatAt: new Date().toISOString(), lastCommandId: commandId };
  }

  // ─ Home ───────────────────────────────────────────────────────────────────
  else if (input.command === 'home') {
    state = {
      ...state,
      position: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
      velocity: 0,
      gripperState: 'open',
      lastHeartbeatAt: new Date().toISOString(),
      lastCommandId: commandId,
    };
  }

  // ─ Calibrate ─────────────────────────────────────────────────────────────
  else if (input.command === 'calibrate') {
    state = {
      ...state,
      motorTemperatureC: 22,
      batteryPercent: 100,
      lastHeartbeatAt: new Date().toISOString(),
      lastCommandId: commandId,
    };
  }

  // ─ Inspect (no-op, just record) ───────────────────────────────────────────
  else {
    state = { ...state, lastHeartbeatAt: new Date().toISOString(), lastCommandId: commandId };
  }

  const tel = recordTelemetry();

  // Add to task queue history
  const task: RobotTask = {
    id: commandId,
    command: input.command,
    position: input.position,
    velocity: input.velocity,
    gripAngle: input.gripAngle,
    status: 'completed',
    queuedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  state = {
    ...state,
    taskQueue: [task, ...state.taskQueue].slice(0, 100),
  };

  return {
    commandId,
    accepted: true,
    mode: 'simulation',
    limits: ENVELOPE,
    evidence: { observedAt: new Date().toISOString(), state: getRobotSimulationState(), telemetry: tel },
  };
}

export { ENVELOPE as ROBOT_SAFETY_ENVELOPE };
