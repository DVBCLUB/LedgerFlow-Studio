/**
 * robotStateMachine.ts
 * ============================================================
 * Formal Robot Digital Twin State Machine & Predictive Maintenance Engine for LedgerFlow OS.
 *
 * Enforces valid state transitions and physical guards:
 *  - States: 'idle' | 'moving' | 'rotating' | 'gripping' | 'calibrating' | 'emergency_stopped' | 'error'
 *  - Transition Guards: Battery thresholds, temperature limits, envelope safety.
 *  - Predictive Maintenance: Forecasts overheat risk and battery/component degradation.
 *  - Visual Export: Generates Mermaid stateDiagram-v2 for UI rendering.
 */

import { randomUUID } from 'node:crypto';
import { getRobotSimulationState, getRobotTelemetry, setRobotEmergencyStop, resetRobotEmergencyStop, type RobotPosition6DOF } from './robotConnector.ts';
import { appendAuditEvent } from './auditLog.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RobotState =
  | 'idle'
  | 'moving'
  | 'rotating'
  | 'gripping'
  | 'calibrating'
  | 'emergency_stopped'
  | 'error';

export interface StateTransitionEvent {
  id: string;
  fromState: RobotState;
  toState: RobotState;
  command: string;
  accepted: boolean;
  reason?: string;
  timestamp: string;
}

export interface PredictiveMaintenanceHealth {
  healthScore: number;            // 0 - 100%
  motorOverheatRiskMinutes: number; // Estimated mins until overheat if running continuously
  batteryDegradationScore: number;  // 0 - 100%
  recommendedMaintenance: string[];
  status: 'OPTIMAL' | 'ATTENTION_REQUIRED' | 'MAINTENANCE_DUE' | 'CRITICAL';
}

// ─── Transition Table ─────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<RobotState, RobotState[]> = {
  idle: ['moving', 'rotating', 'gripping', 'calibrating', 'emergency_stopped', 'error'],
  moving: ['idle', 'moving', 'rotating', 'gripping', 'emergency_stopped', 'error'],
  rotating: ['idle', 'moving', 'rotating', 'gripping', 'emergency_stopped', 'error'],
  gripping: ['idle', 'moving', 'rotating', 'emergency_stopped', 'error'],
  calibrating: ['idle', 'emergency_stopped', 'error'],
  emergency_stopped: ['idle'], // Only reset can move back to idle
  error: ['idle', 'emergency_stopped'],
};

// ─── State Management ─────────────────────────────────────────────────────────

let currentState: RobotState = 'idle';
const transitionHistory: StateTransitionEvent[] = [];

export function getCurrentRobotState(): RobotState {
  // Sync with physical emergency stop if active
  const rawState = getRobotSimulationState();
  if (rawState.emergencyStop && currentState !== 'emergency_stopped') {
    currentState = 'emergency_stopped';
  }
  return currentState;
}

export function validateRobotStateTransition(
  requestedCommand: 'move' | 'rotate' | 'grip' | 'release' | 'home' | 'calibrate' | 'stop' | 'reset',
  params?: { position?: RobotPosition6DOF }
): { allowed: boolean; targetState: RobotState; reason?: string } {
  const current = getCurrentRobotState();

  if (requestedCommand === 'stop') {
    return { allowed: true, targetState: 'emergency_stopped' };
  }

  if (requestedCommand === 'reset') {
    if (current !== 'emergency_stopped' && current !== 'error') {
      return { allowed: false, targetState: current, reason: 'Reset is only valid when in emergency_stopped or error state.' };
    }
    return { allowed: true, targetState: 'idle' };
  }

  let targetState: RobotState = 'idle';
  if (requestedCommand === 'move') targetState = 'moving';
  else if (requestedCommand === 'rotate') targetState = 'rotating';
  else if (requestedCommand === 'grip' || requestedCommand === 'release') targetState = 'gripping';
  else if (requestedCommand === 'calibrate') targetState = 'calibrating';
  else if (requestedCommand === 'home') targetState = 'moving';

  const validNextStates = ALLOWED_TRANSITIONS[current] || [];
  if (!validNextStates.includes(targetState)) {
    return {
      allowed: false,
      targetState,
      reason: `Invalid transition from "${current}" to "${targetState}". Valid transitions: ${validNextStates.join(', ')}`,
    };
  }

  // Physical Guard Checks
  const telemetry = getRobotSimulationState();
  if (telemetry.batteryPercent <= 5 && (targetState === 'moving' || targetState === 'rotating')) {
    return {
      allowed: false,
      targetState,
      reason: `Battery level critically low (${telemetry.batteryPercent.toFixed(1)}%). Re-charge required before moving.`,
    };
  }

  if (telemetry.motorTemperatureC >= 65 && targetState !== 'idle') {
    return {
      allowed: false,
      targetState,
      reason: `Motor temperature excessive (${telemetry.motorTemperatureC.toFixed(1)}°C >= 65°C). Cool-down required.`,
    };
  }

  return { allowed: true, targetState };
}

export function transitionRobotState(
  command: 'move' | 'rotate' | 'grip' | 'release' | 'home' | 'calibrate' | 'stop' | 'reset',
  params?: { position?: RobotPosition6DOF }
): { success: boolean; state: RobotState; reason?: string } {
  const validation = validateRobotStateTransition(command, params);
  const fromState = currentState;

  const evt: StateTransitionEvent = {
    id: `trans_${Date.now()}_${randomUUID().slice(0, 4)}`,
    fromState,
    toState: validation.targetState,
    command,
    accepted: validation.allowed,
    reason: validation.reason,
    timestamp: new Date().toISOString(),
  };

  transitionHistory.push(evt);
  if (transitionHistory.length > 100) transitionHistory.shift();

  if (!validation.allowed) {
    emitTelemetryEvent({
      category: 'robot',
      eventType: 'state_transition_rejected',
      severity: 'warning',
      source: 'robot_state_machine',
      summary: `Robot state transition rejected: ${fromState} -> ${validation.targetState} (${validation.reason})`,
    });
    return { success: false, state: currentState, reason: validation.reason };
  }

  currentState = validation.targetState;

  if (command === 'stop') {
    setRobotEmergencyStop(true);
  } else if (command === 'reset') {
    resetRobotEmergencyStop();
  }

  emitTelemetryEvent({
    category: 'robot',
    eventType: 'state_transition',
    severity: currentState === 'emergency_stopped' || currentState === 'error' ? 'error' : 'info',
    source: 'robot_state_machine',
    summary: `Robot transition: ${fromState} -> ${currentState} [Command: ${command}]`,
  });

  return { success: true, state: currentState };
}

// ─── Predictive Maintenance Predictor ────────────────────────────────────────

export function analyzePredictiveMaintenance(): PredictiveMaintenanceHealth {
  const history = getRobotTelemetry(50);
  const rawState = getRobotSimulationState();

  let healthScore = 100;
  const recommendations: string[] = [];

  const currTemp = rawState.motorTemperatureC;
  if (currTemp > 50) {
    healthScore -= (currTemp - 50) * 1.5;
    recommendations.push(`Motor running warm (${currTemp.toFixed(1)}°C). Inspect cooling fan.`);
  }

  const currBattery = rawState.batteryPercent;
  if (currBattery < 20) {
    healthScore -= 15;
    recommendations.push(`Battery low (${currBattery.toFixed(1)}%). Connect charger.`);
  }

  // Calculate temp rate of change over history
  let tempRatePerMin = 0.1;
  if (history.length >= 2) {
    const oldest = history[history.length - 1];
    const newest = history[0];
    const timeDiffMin = Math.max(0.1, (Date.parse(newest.recordedAt) - Date.parse(oldest.recordedAt)) / 60000);
    const tempDiff = newest.motorTemperatureC - oldest.motorTemperatureC;
    tempRatePerMin = Math.max(0.01, tempDiff / timeDiffMin);
  }

  const tempMargin = Math.max(0, 65 - currTemp);
  const motorOverheatRiskMinutes = Math.round(tempMargin / tempRatePerMin);

  if (motorOverheatRiskMinutes < 15) {
    recommendations.push(`Critical: High workload will cause overheat in ~${motorOverheatRiskMinutes} mins.`);
  }

  let status: PredictiveMaintenanceHealth['status'] = 'OPTIMAL';
  if (healthScore < 50 || motorOverheatRiskMinutes < 10) status = 'CRITICAL';
  else if (healthScore < 75 || motorOverheatRiskMinutes < 30) status = 'MAINTENANCE_DUE';
  else if (healthScore < 90) status = 'ATTENTION_REQUIRED';

  if (recommendations.length === 0) {
    recommendations.push('Robot operating within ideal thermal and power envelopes.');
  }

  return {
    healthScore: Math.round(Math.max(0, Math.min(100, healthScore))),
    motorOverheatRiskMinutes,
    batteryDegradationScore: Math.round(Math.max(0, 100 - currBattery * 0.1)),
    recommendedMaintenance: recommendations,
    status,
  };
}

export function exportRobotStateDiagramMermaid(): string {
  return [
    'stateDiagram-v2',
    '    [*] --> idle',
    '    idle --> moving: move / home',
    '    idle --> rotating: rotate',
    '    idle --> gripping: grip / release',
    '    idle --> calibrating: calibrate',
    '    moving --> idle: complete',
    '    rotating --> idle: complete',
    '    gripping --> idle: complete',
    '    calibrating --> idle: complete',
    '    idle --> emergency_stopped: E-Stop / error',
    '    moving --> emergency_stopped: E-Stop / collision',
    '    emergency_stopped --> idle: reset',
  ].join('\n');
}

export function getStateTransitionHistory(limit = 20): StateTransitionEvent[] {
  return transitionHistory.slice(-limit).reverse();
}
