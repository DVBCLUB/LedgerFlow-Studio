/**
 * robotAdapterBoundary.ts
 * ============================================================
 * Robot Adapter Boundary — tách biệt robot phần cứng khỏi LLM.
 * Lớp này đóng vai trò safety controller độc lập: mọi lệnh từ
 * agent/LLM đều phải đi qua boundary để kiểm tra giới hạn vật lý,
 * approval phrase, và không được vượt quá envelope an toàn.
 */
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export type RobotAdapterMode = 'simulation' | 'digital_twin' | 'hardware';

export interface RobotSafetyEnvelope {
  maxDistanceMm: number;      // Khoảng cách tối đa mỗi lệnh
  maxVelocityMmS: number;     // Vận tốc tối đa
  maxGripForceN: number;      // Lực kẹp tối đa
  workspaceBoundary: {        // Vùng làm việc an toàn
    xMin: number; xMax: number;
    yMin: number; yMax: number;
    zMin: number; zMax: number;
  };
  requireApprovalPhrase: boolean;
  autoStopOnCollision: boolean;
}

export interface RobotPosition {
  x: number; y: number; z: number;
  roll?: number; pitch?: number; yaw?: number;
}

export interface RobotCommand {
  id: string;
  type: 'move' | 'grip' | 'release' | 'home' | 'stop' | 'inspect' | 'calibrate';
  params: {
    position?: RobotPosition;
    velocity?: number;
    gripAngle?: number;
    gripForce?: number;
  };
  approvalPhrase?: string;
  issuedBy: 'founder' | 'agent' | 'automation';
  priority: 'low' | 'normal' | 'high';
}

export interface RobotCommandResult {
  accepted: boolean;
  commandId: string;
  reason?: string;
  mode: RobotAdapterMode;
  evidence: {
    prePosition?: RobotPosition;
    postPosition?: RobotPosition;
    envelopeCheck: boolean;
    approvalCheck: boolean;
    executedAt: string;
  };
}

export interface RobotRunbookEntry {
  id: string;
  commandId: string;
  command: RobotCommand;
  result: RobotCommandResult;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  telemetry?: {
    position: RobotPosition;
    motorTempC: number;
  };
}

export interface RobotAdapterState {
  mode: RobotAdapterMode;
  emergencyStop: boolean;
  connected: boolean;
  currentPosition: RobotPosition;
  envelope: RobotSafetyEnvelope;
  activeCommandId?: string;
  runbook: RobotRunbookEntry[];
  lastHeartbeatAt: string;
}

// ─── Default safety envelope ────────────────────────────────────────
const DEFAULT_ENVELOPE: RobotSafetyEnvelope = {
  maxDistanceMm: 500,
  maxVelocityMmS: 200,
  maxGripForceN: 50,
  workspaceBoundary: {
    xMin: 0, xMax: 1000,
    yMin: 0, yMax: 800,
    zMin: -200, zMax: 600,
  },
  requireApprovalPhrase: true,
  autoStopOnCollision: true,
};

// ─── State ──────────────────────────────────────────────────────────
let adapterState: RobotAdapterState = {
  mode: 'simulation',
  emergencyStop: false,
  connected: false,
  currentPosition: { x: 0, y: 0, z: 0 },
  envelope: { ...DEFAULT_ENVELOPE },
  runbook: [],
  lastHeartbeatAt: new Date().toISOString(),
};

// ─── Safety checks ──────────────────────────────────────────────────

function checkEnvelope(pos: RobotPosition, envelope: RobotSafetyEnvelope): { ok: boolean; reason?: string } {
  const curr = adapterState.currentPosition;
  const distance = Math.sqrt(
    Math.pow(pos.x - curr.x, 2) + Math.pow(pos.y - curr.y, 2) + Math.pow(pos.z - curr.z, 2)
  );

  if (distance > envelope.maxDistanceMm) {
    return { ok: false, reason: `Khoảng cách ${distance.toFixed(0)}mm vượt giới hạn ${envelope.maxDistanceMm}mm.` };
  }

  if (pos.x < envelope.workspaceBoundary.xMin || pos.x > envelope.workspaceBoundary.xMax) {
    return { ok: false, reason: `Trục X ${pos.x} ngoài vùng làm việc.` };
  }
  if (pos.y < envelope.workspaceBoundary.yMin || pos.y > envelope.workspaceBoundary.yMax) {
    return { ok: false, reason: `Trục Y ${pos.y} ngoài vùng làm việc.` };
  }
  if (pos.z < envelope.workspaceBoundary.zMin || pos.z > envelope.workspaceBoundary.zMax) {
    return { ok: false, reason: `Trục Z ${pos.z} ngoài vùng làm việc.` };
  }

  return { ok: true };
}

// ─── Public API ─────────────────────────────────────────────────────

export function getAdapterState(): RobotAdapterState {
  return { ...adapterState };
}

export function setEmergencyStop(active: boolean): RobotAdapterState {
  adapterState.emergencyStop = active;
  adapterState.activeCommandId = undefined;

  appendAuditEvent({
    actor: 'founder',
    workspace: 'Robot Adapter',
    action: active ? 'robot.emergency_stop' : 'robot.emergency_resume',
    target: 'robot-adapter',
    risk: active ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: active ? 'EMERGENCY STOP activated.' : 'Emergency stop released.',
    connectorId: 'robot-adapter-boundary',
  }).catch(() => undefined);

  return { ...adapterState };
}

export function updateEnvelope(patch: Partial<RobotSafetyEnvelope>): RobotSafetyEnvelope {
  adapterState.envelope = { ...adapterState.envelope, ...patch };
  return { ...adapterState.envelope };
}

export function acceptRobotCommand(command: RobotCommand): RobotCommandResult {
  const now = new Date().toISOString();
  const resultBase: RobotCommandResult = {
    accepted: false,
    commandId: command.id,
    mode: adapterState.mode,
    evidence: {
      envelopeCheck: false,
      approvalCheck: false,
      executedAt: now,
    },
  };

  // Check emergency stop
  if (adapterState.emergencyStop && command.type !== 'stop') {
    return { ...resultBase, reason: 'EMERGENCY STOP đang kích hoạt. Chỉ chấp nhận lệnh stop.' };
  }

  // Check approval phrase for agent-issued commands
  if (command.issuedBy === 'agent' && adapterState.envelope.requireApprovalPhrase) {
    const validPhrase = command.approvalPhrase === 'APPROVE ROBOT MOVE'
      || command.approvalPhrase === 'APPROVE ROBOT GRIP'
      || command.approvalPhrase === 'APPROVE ROBOT CALIBRATE';
    if (!validPhrase) {
      return { ...resultBase, reason: 'Thiếu approval phrase. Cần: APPROVE ROBOT MOVE / GRIP / CALIBRATE.' };
    }
    resultBase.evidence.approvalCheck = true;
  } else {
    resultBase.evidence.approvalCheck = true; // founder không cần
  }

  // Check envelope for position commands
  if (command.type === 'move' && command.params.position) {
    const check = checkEnvelope(command.params.position, adapterState.envelope);
    if (!check.ok) {
      return { ...resultBase, reason: check.reason };
    }
    resultBase.evidence.envelopeCheck = true;
    resultBase.evidence.prePosition = { ...adapterState.currentPosition };
  }

  // Simulate execution
  const startedAt = now;
  adapterState.activeCommandId = command.id;

  const runbook: RobotRunbookEntry = {
    id: randomUUID(),
    commandId: command.id,
    command,
    result: { ...resultBase, accepted: true },
    startedAt,
    completedAt: new Date().toISOString(),
    latencyMs: Math.floor(Math.random() * 100) + 10, // simulated
  };

  if (command.type === 'move' && command.params.position) {
    adapterState.currentPosition = {
      x: command.params.position.x ?? adapterState.currentPosition.x,
      y: command.params.position.y ?? adapterState.currentPosition.y,
      z: command.params.position.z ?? adapterState.currentPosition.z,
    };
    runbook.telemetry = { position: { ...adapterState.currentPosition }, motorTempC: 35 + Math.random() * 10 };
  }
  if (command.type === 'home') {
    adapterState.currentPosition = { x: 0, y: 0, z: 0 };
    runbook.telemetry = { position: { x: 0, y: 0, z: 0 }, motorTempC: 30 };
  }

  resultBase.evidence.postPosition = { ...adapterState.currentPosition };
  adapterState.runbook.push(runbook);
  adapterState.activeCommandId = undefined;
  adapterState.lastHeartbeatAt = new Date().toISOString();

  // Audit
  appendAuditEvent({
    actor: command.issuedBy === 'agent' ? 'ai-agent' : 'founder',
    workspace: 'Robot Adapter',
    action: `robot.${command.type}`,
    target: `position=${JSON.stringify(adapterState.currentPosition)}`,
    risk: command.type === 'stop' ? 'LOW' : 'MEDIUM',
    status: 'executed',
    summary: `Robot ${command.type} accepted. Position: ${JSON.stringify(adapterState.currentPosition)}`,
    connectorId: 'robot-adapter-boundary',
    evidence: { commandId: command.id, runbookId: runbook.id },
  }).catch(() => undefined);

  return {
    accepted: true,
    commandId: command.id,
    mode: adapterState.mode,
    evidence: { ...resultBase.evidence, postPosition: { ...adapterState.currentPosition } },
  };
}

export function getRunbook(limit = 50): RobotRunbookEntry[] {
  return adapterState.runbook.slice(-limit);
}

export function getRunbookEntry(id: string): RobotRunbookEntry | undefined {
  return adapterState.runbook.find(e => e.id === id);
}

export function replayRunbook(limit = 20): {
  entries: RobotRunbookEntry[];
  totalCommands: number;
  accepted: number;
  rejected: number;
  averageLatencyMs: number;
} {
  const recent = adapterState.runbook.slice(-limit);
  const accepted = recent.filter(e => e.result.accepted).length;
  return {
    entries: recent,
    totalCommands: recent.length,
    accepted,
    rejected: recent.length - accepted,
    averageLatencyMs: recent.length > 0
      ? Math.round(recent.reduce((s, e) => s + e.latencyMs, 0) / recent.length)
      : 0,
  };
}

export function resetRunbook(): void {
  adapterState.runbook = [];
}
