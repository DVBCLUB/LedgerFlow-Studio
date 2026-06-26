export type AutomationSurface = 'browser' | 'computer' | 'robot';
export type AutomationActionType = 'read' | 'click' | 'type' | 'navigate' | 'screenshot' | 'inspect' | 'move' | 'stop';

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  target: string;
  payload?: Record<string, unknown>;
}

export interface AutomationSafetyPlan {
  id: string;
  surface: AutomationSurface;
  title: string;
  allowedTargets: string[];
  actions: AutomationAction[];
  operator?: string;
  emergencyStop?: {
    command: string;
    contact: string;
  };
  humanCheckpoint?: boolean;
  labOnly?: boolean;
}

export interface AutomationReplayStep {
  index: number;
  actionId: string;
  summary: string;
  evidenceRequired: string;
}

export interface AutomationSafetyDecision {
  approved: boolean;
  mode: 'background' | 'human_review' | 'lab_only' | 'blocked';
  issues: string[];
  replay: AutomationReplayStep[];
  humanCheckpointRequired: boolean;
  emergencyStopRequired: boolean;
}

const WRITE_ACTIONS = new Set<AutomationActionType>(['click', 'type', 'navigate', 'move', 'stop']);
const ROBOT_MOTION_ACTIONS = new Set<AutomationActionType>(['move']);

function targetAllowed(target: string, allowedTargets: string[]) {
  return allowedTargets.some((allowed) => target === allowed || target.startsWith(`${allowed}/`) || target.startsWith(`${allowed}#`) || target.startsWith(`${allowed}?`));
}

function replayEvidenceFor(action: AutomationAction, surface: AutomationSurface) {
  if (surface === 'browser' || surface === 'computer') {
    if (action.type === 'screenshot') return 'Screenshot artifact with timestamp and route.';
    if (WRITE_ACTIONS.has(action.type)) return 'Before/after screenshot plus DOM or accessibility tree summary.';
    return 'Read-only observation log.';
  }
  if (surface === 'robot') {
    if (action.type === 'move') return 'Telemetry snapshot, simulated path, collision envelope, and emergency-stop status.';
    return 'Robot telemetry snapshot.';
  }
  return 'Execution log.';
}

export function validateAutomationSafetyEnvelope(plan: AutomationSafetyPlan): AutomationSafetyDecision {
  const issues: string[] = [];
  const hasWriteAction = plan.actions.some((action) => WRITE_ACTIONS.has(action.type));
  const hasRobotMotion = plan.surface === 'robot' && plan.actions.some((action) => ROBOT_MOTION_ACTIONS.has(action.type));

  if (!plan.allowedTargets.length) issues.push('At least one allowlisted target/surface is required.');
  for (const action of plan.actions) {
    if (!targetAllowed(action.target, plan.allowedTargets)) {
      issues.push(`Action ${action.id} targets non-allowlisted surface: ${action.target}`);
    }
  }

  if (hasWriteAction && !plan.humanCheckpoint) {
    issues.push('Write/navigation/motion actions require a human checkpoint.');
  }

  if (hasRobotMotion && !plan.emergencyStop) {
    issues.push('Robot movement requires an emergency stop contract.');
  }

  if (plan.surface === 'robot' && !plan.labOnly) {
    issues.push('Robot automation must remain lab-only until physical safety certification is complete.');
  }

  const replay = plan.actions.map((action, index) => ({
    index,
    actionId: action.id,
    summary: `${plan.surface}.${action.type} → ${action.target}`,
    evidenceRequired: replayEvidenceFor(action, plan.surface),
  }));

  const humanCheckpointRequired = hasWriteAction || hasRobotMotion;
  const emergencyStopRequired = hasRobotMotion;
  let mode: AutomationSafetyDecision['mode'] = 'background';
  if (issues.length) mode = plan.surface === 'robot' && plan.labOnly && issues.every((issue) => !issue.includes('emergency stop')) ? 'lab_only' : 'blocked';
  else if (plan.labOnly) mode = 'lab_only';
  else if (humanCheckpointRequired) mode = 'human_review';

  return {
    approved: issues.length === 0,
    mode,
    issues,
    replay,
    humanCheckpointRequired,
    emergencyStopRequired,
  };
}

export function assertAutomationSafetyEnvelope(plan: AutomationSafetyPlan) {
  const decision = validateAutomationSafetyEnvelope(plan);
  if (!decision.approved) {
    throw new Error(`Automation safety envelope rejected: ${decision.issues.join('; ')}`);
  }
  return decision;
}

export function createEmergencyStopContract(command = 'STOP_ALL_AUTOMATION', contact = 'Founder') {
  return { command, contact };
}
