import { appendAuditEvent } from './auditLog.ts';

export type RobotCapabilityMode = 'simulation' | 'digital_twin' | 'hardware';
export type RobotCapabilityRisk = 'low' | 'medium' | 'high' | 'blocked';

export interface RobotCapabilityParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'position' | 'object';
  required: boolean;
  description: string;
}

export interface RobotCapability {
  id: string;
  name: string;
  command: string;
  mode: RobotCapabilityMode;
  risk: RobotCapabilityRisk;
  requiresApproval: boolean;
  approvalPhrase?: string;
  description: string;
  parameters: RobotCapabilityParameter[];
  safetyNotes: string[];
}

const CAPABILITIES: RobotCapability[] = [
  {
    id: 'robot.inspect.simulation',
    name: 'Inspect Robot State',
    command: 'inspect',
    mode: 'simulation',
    risk: 'low',
    requiresApproval: false,
    description: 'Read current simulated robot telemetry and task state.',
    parameters: [],
    safetyNotes: ['Read-only capability.', 'Never moves hardware.'],
  },
  {
    id: 'robot.move.simulation',
    name: 'Move Robot In Simulation',
    command: 'move',
    mode: 'simulation',
    risk: 'high',
    requiresApproval: true,
    approvalPhrase: 'APPROVE ROBOT SIMULATION',
    description: 'Move the simulated robot inside the configured safety envelope.',
    parameters: [
      { name: 'position', type: 'position', required: true, description: 'Target x/y/z/roll/pitch/yaw pose.' },
      { name: 'velocity', type: 'number', required: false, description: 'Requested velocity in mm/s.' },
    ],
    safetyNotes: ['Requires founder approval phrase.', 'Validated by envelope before execution.', 'Simulation-only by default.'],
  },
  {
    id: 'robot.rotate.simulation',
    name: 'Rotate Robot In Simulation',
    command: 'rotate',
    mode: 'simulation',
    risk: 'high',
    requiresApproval: true,
    approvalPhrase: 'APPROVE ROBOT SIMULATION',
    description: 'Rotate the simulated robot wrist/orientation within degree limits.',
    parameters: [
      { name: 'position', type: 'position', required: true, description: 'Roll, pitch, and yaw values.' },
    ],
    safetyNotes: ['Requires founder approval phrase.', 'Validated by rotation envelope before execution.'],
  },
  {
    id: 'robot.grip.simulation',
    name: 'Grip In Simulation',
    command: 'grip',
    mode: 'simulation',
    risk: 'medium',
    requiresApproval: false,
    description: 'Close or partially close the simulated gripper.',
    parameters: [
      { name: 'gripAngle', type: 'number', required: false, description: 'Gripper angle from open to closed.' },
    ],
    safetyNotes: ['Simulation-only.', 'Hardware adapters must define force limits separately.'],
  },
  {
    id: 'robot.stop.all',
    name: 'Emergency Stop',
    command: 'stop',
    mode: 'simulation',
    risk: 'low',
    requiresApproval: false,
    description: 'Stop robot activity and cancel queued tasks.',
    parameters: [],
    safetyNotes: ['Always allowed.', 'Cancels queued and executing tasks.'],
  },
  {
    id: 'robot.hardware.pending',
    name: 'Hardware Adapter Invocation',
    command: 'hardware',
    mode: 'hardware',
    risk: 'blocked',
    requiresApproval: true,
    approvalPhrase: 'APPROVE ROBOT HARDWARE ADAPTER',
    description: 'Placeholder for future hardware adapters. Blocked until a signed adapter, sandbox boundary, and operator review exist.',
    parameters: [],
    safetyNotes: ['Blocked by default.', 'Requires signed adapter manifest.', 'Requires physical safety validation.'],
  },
];

export function listRobotCapabilities(filter?: { mode?: RobotCapabilityMode; includeBlocked?: boolean }) {
  return CAPABILITIES.filter((capability) => {
    if (filter?.mode && capability.mode !== filter.mode) return false;
    if (!filter?.includeBlocked && capability.risk === 'blocked') return false;
    return true;
  }).map((capability) => ({ ...capability, parameters: capability.parameters.map((param) => ({ ...param })), safetyNotes: [...capability.safetyNotes] }));
}

export function getRobotCapability(idOrCommand: string) {
  const capability = CAPABILITIES.find((item) => item.id === idOrCommand || item.command === idOrCommand);
  return capability ? { ...capability, parameters: capability.parameters.map((param) => ({ ...param })), safetyNotes: [...capability.safetyNotes] } : null;
}

export function validateRobotCapabilityRequest(input: { capabilityId: string; approvalPhrase?: string; mode?: RobotCapabilityMode }) {
  const capability = getRobotCapability(input.capabilityId);
  if (!capability) return { ok: false, reason: 'Unknown robot capability.', capability: null };
  if (capability.risk === 'blocked') return { ok: false, reason: 'Robot capability is blocked until a reviewed adapter is installed.', capability };
  if (input.mode && capability.mode !== input.mode) return { ok: false, reason: `Robot capability mode mismatch: expected ${capability.mode}.`, capability };
  if (capability.requiresApproval && capability.approvalPhrase !== input.approvalPhrase) return { ok: false, reason: `Robot capability requires approval phrase: ${capability.approvalPhrase}.`, capability };
  return { ok: true, reason: 'Robot capability request is allowed for the declared mode.', capability };
}

export async function auditRobotCapabilityRequest(input: { capabilityId: string; approvalPhrase?: string; mode?: RobotCapabilityMode; actor?: 'founder' | 'ai-agent' | 'system' }) {
  const result = validateRobotCapabilityRequest(input);
  await appendAuditEvent({
    actor: input.actor || 'system',
    workspace: 'Robot Capability Registry',
    action: result.ok ? 'robot.capability.allowed' : 'robot.capability.rejected',
    target: input.capabilityId,
    risk: result.ok ? 'LOW' : 'HIGH',
    status: result.ok ? 'approved' : 'rejected',
    summary: result.reason,
    connectorId: 'robot-capability-registry',
    evidence: { capability: result.capability, mode: input.mode },
  });
  return result;
}
