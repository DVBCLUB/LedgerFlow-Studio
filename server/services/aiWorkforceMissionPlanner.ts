import { createHash } from 'node:crypto';
import {
  buildGroundedContextPack,
  requireGroundedContextForHighImpact,
  type GroundedContextPack,
  type GroundedKnowledgeSource,
} from './groundedContextPack.ts';
import {
  createEmergencyStopContract,
  validateAutomationSafetyEnvelope,
  type AutomationSafetyDecision,
  type AutomationSafetyPlan,
  type AutomationSurface,
} from './automationSafetyEnvelope.ts';

export type MissionRiskTier = 'low' | 'medium' | 'high' | 'critical';
export type MissionLane = 'knowledge-spine' | 'execution-layer' | 'mission-control' | 'software-factory' | 'governance';

export interface AIWorkforceMissionPlannerInput {
  goal: string;
  owner?: string;
  deadline?: string;
  constraints?: string[];
  domains?: string[];
  sources?: GroundedKnowledgeSource[];
  allowAutomation?: boolean;
  allowRobotLab?: boolean;
  repoFullName?: string;
  prNumber?: number;
}

export interface AIWorkforceMissionStep {
  id: string;
  title: string;
  lane: MissionLane;
  agentRole: string;
  toolId: string;
  riskTier: MissionRiskTier;
  requiresApproval: boolean;
  highImpact: boolean;
  status: 'planned' | 'blocked';
  dependsOn: string[];
  expectedEvidence: string[];
  approvalCheckpoint?: string;
  safetyPlan?: AutomationSafetyPlan;
  safetyDecision?: AutomationSafetyDecision;
}

export interface AIWorkforceMissionPlan {
  id: string;
  goal: string;
  owner: string;
  deadline?: string;
  createdAt: string;
  contextPack: GroundedContextPack;
  contextGuard: { ok: true } | { ok: false; error: string };
  riskTier: MissionRiskTier;
  approvalRequired: boolean;
  automationAllowed: boolean;
  steps: AIWorkforceMissionStep[];
  toolRoute: Array<{ stepId: string; toolId: string; agentRole: string; lane: MissionLane }>;
  approvalCheckpoints: Array<{ stepId: string; phrase: string; reason: string }>;
  auditTrail: Array<{ action: string; severity: 'info' | 'warning' | 'critical'; summary: string }>;
  summary: {
    totalSteps: number;
    blockedSteps: number;
    highRiskSteps: number;
    humanApprovals: number;
    contextConfidence: number;
    contradictions: number;
  };
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function includesAny(text: string, patterns: string[]) {
  const normalized = normalize(text);
  return patterns.some((pattern) => normalized.includes(normalize(pattern)));
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function inferRisk(input: AIWorkforceMissionPlannerInput): MissionRiskTier {
  const text = [input.goal, ...(input.constraints || []), ...(input.domains || [])].join(' ');
  if (includesAny(text, ['robot', 'payment', 'payroll', 'delete', 'production database', 'bank', 'tax filing', 'security credential', 'credential rotation'])) return 'critical';
  if (includesAny(text, ['deploy', 'release', 'database', 'migration', 'invoice', 'customer data', 'github', 'pull request', 'pr control', 'automation'])) return 'high';
  if (includesAny(text, ['write', 'content', 'browser', 'integration', 'workflow', 'api'])) return 'medium';
  return 'low';
}

function riskRank(risk: MissionRiskTier) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[risk];
}

function maxRisk(...risks: MissionRiskTier[]): MissionRiskTier {
  return risks.sort((a, b) => riskRank(b) - riskRank(a))[0] || 'low';
}

function buildMissionSources(input: AIWorkforceMissionPlannerInput): GroundedKnowledgeSource[] {
  const goalSource: GroundedKnowledgeSource = {
    id: 'mission-goal',
    kind: 'decision',
    title: 'Mission goal brief',
    content: [
      `Goal: ${input.goal}`,
      input.owner ? `Owner: ${input.owner}` : '',
      input.deadline ? `Deadline: ${input.deadline}` : '',
      input.constraints?.length ? `Constraints: ${input.constraints.join('; ')}` : '',
      input.domains?.length ? `Domains: ${input.domains.join(', ')}` : '',
    ].filter(Boolean).join('\n'),
    tags: ['mission-planner', 'ai-workforce'],
    facts: {
      mission_owner: input.owner || 'Founder',
      automation_allowed: Boolean(input.allowAutomation),
      robot_lab_allowed: Boolean(input.allowRobotLab),
    },
    confidence: 0.9,
  };

  const governanceSource: GroundedKnowledgeSource = {
    id: 'mission-governance-policy',
    kind: 'sop',
    title: 'AI Workforce mission governance policy',
    content: 'High-impact missions require grounded context, source map, approval checkpoints, safety replay evidence, audit event, and run metrics before execution.',
    tags: ['mission-planner', 'governance', 'ai-workforce'],
    facts: { high_impact_policy: 'approval_checkpoint_required' },
    confidence: 0.92,
  };

  return [goalSource, governanceSource, ...(input.sources || [])];
}

function selectAutomationSurface(input: AIWorkforceMissionPlannerInput): AutomationSurface {
  const text = [input.goal, ...(input.constraints || []), ...(input.domains || [])].join(' ');
  if (includesAny(text, ['robot', 'arm', 'motion'])) return 'robot';
  if (includesAny(text, ['browser', 'web', 'website', 'portal'])) return 'browser';
  return 'computer';
}

function buildSafetyPlan(input: AIWorkforceMissionPlannerInput, missionId: string): AutomationSafetyPlan {
  const surface = selectAutomationSurface(input);
  const target = surface === 'robot'
    ? 'robot://simulator/arm-a'
    : surface === 'browser'
      ? 'browser://sandbox/mission'
      : 'computer://sandbox/mission';
  const writeActionType = surface === 'robot' ? 'move' : surface === 'browser' ? 'navigate' : 'inspect';

  return {
    id: `${missionId}_automation_safety`,
    surface,
    title: `Mission automation safety preview for ${input.goal.slice(0, 80)}`,
    allowedTargets: [target],
    labOnly: surface === 'robot' || !input.allowAutomation,
    humanCheckpoint: true,
    emergencyStop: surface === 'robot' ? createEmergencyStopContract() : undefined,
    actions: [
      { id: 'inspect-target', type: 'inspect', target },
      { id: 'preview-action', type: writeActionType, target: surface === 'robot' ? `${target}/joint-1` : target },
    ],
  };
}

function step(
  missionId: string,
  index: number,
  partial: Omit<AIWorkforceMissionStep, 'id' | 'status'>,
): AIWorkforceMissionStep {
  const blocked = partial.safetyDecision ? !partial.safetyDecision.approved : false;
  return {
    id: `${missionId}_step_${index + 1}`,
    status: blocked ? 'blocked' : 'planned',
    ...partial,
  };
}

export function planAIWorkforceMission(input: AIWorkforceMissionPlannerInput): AIWorkforceMissionPlan {
  if (!input.goal?.trim()) throw new Error('Mission Planner requires a non-empty goal.');

  const createdAt = new Date().toISOString();
  const missionId = stableId('mission', { goal: input.goal, owner: input.owner || 'Founder', createdAt });
  const missionRisk = inferRisk(input);
  const highImpact = riskRank(missionRisk) >= 3;
  const contextPack = buildGroundedContextPack({
    question: `Plan an AI Workforce mission for: ${input.goal}`,
    sources: buildMissionSources(input),
    requiredTags: ['mission-planner'],
    maxSources: 8,
  });
  let contextGuard: AIWorkforceMissionPlan['contextGuard'] = { ok: true };
  if (highImpact) {
    try {
      requireGroundedContextForHighImpact(contextPack);
    } catch (error: any) {
      contextGuard = { ok: false, error: error?.message || String(error) };
    }
  }

  const safetyPlan = buildSafetyPlan(input, missionId);
  const safetyDecision = validateAutomationSafetyEnvelope(safetyPlan);
  const automationRisk: MissionRiskTier = safetyDecision.approved ? (safetyDecision.humanCheckpointRequired ? 'high' : 'medium') : 'critical';
  const repoEvidence = input.repoFullName ? [`Repo: ${input.repoFullName}${input.prNumber ? `#${input.prNumber}` : ''}`] : [];

  const steps: AIWorkforceMissionStep[] = [
    step(missionId, 0, {
      title: 'Ground mission context and source map',
      lane: 'knowledge-spine',
      agentRole: 'Memory Agent',
      toolId: 'read_knowledge',
      riskTier: highImpact ? 'high' : 'medium',
      requiresApproval: highImpact,
      highImpact,
      dependsOn: [],
      expectedEvidence: ['Grounded context pack', 'Source map', 'Contradiction report'],
      approvalCheckpoint: highImpact ? 'APPROVE MISSION CONTEXT' : undefined,
    }),
    step(missionId, 1, {
      title: 'Break mission into deliverables and acceptance criteria',
      lane: 'mission-control',
      agentRole: 'Chief of Staff',
      toolId: 'draft_patch',
      riskTier: missionRisk === 'low' ? 'medium' : missionRisk,
      requiresApproval: highImpact,
      highImpact,
      dependsOn: [`${missionId}_step_1`],
      expectedEvidence: ['Task breakdown', 'Acceptance criteria', 'Owner handoff checklist'],
      approvalCheckpoint: highImpact ? 'APPROVE MISSION PLAN' : undefined,
    }),
    step(missionId, 2, {
      title: 'Preview automation safety envelope',
      lane: 'execution-layer',
      agentRole: 'Automation Safety Agent',
      toolId: safetyPlan.surface === 'robot' ? 'robot_move' : safetyPlan.surface === 'browser' ? 'browser_check' : 'terminal_check',
      riskTier: automationRisk,
      requiresApproval: safetyDecision.humanCheckpointRequired || !safetyDecision.approved,
      highImpact: true,
      dependsOn: [`${missionId}_step_2`],
      expectedEvidence: ['Safety decision', 'Replay evidence requirements', 'Emergency stop contract when needed'],
      approvalCheckpoint: 'APPROVE AUTOMATION SAFETY',
      safetyPlan,
      safetyDecision,
    }),
    step(missionId, 3, {
      title: input.repoFullName ? 'Prepare GitHub PR Control and release gate' : 'Prepare implementation or execution package',
      lane: input.repoFullName ? 'software-factory' : 'mission-control',
      agentRole: input.repoFullName ? 'Software Factory PR Control' : 'Software Factory Agent',
      toolId: input.repoFullName ? 'github_pr_control' : 'draft_patch',
      riskTier: input.repoFullName ? 'high' : missionRisk,
      requiresApproval: true,
      highImpact: true,
      dependsOn: [`${missionId}_step_3`],
      expectedEvidence: ['CI/check evidence', 'Rollback plan', 'Reviewer checklist', ...repoEvidence],
      approvalCheckpoint: input.repoFullName ? 'APPROVE PR CONTROL GATE' : 'APPROVE EXECUTION PACKAGE',
    }),
    step(missionId, 4, {
      title: 'Create final operator brief and audit handoff',
      lane: 'governance',
      agentRole: 'AI Auditor',
      toolId: 'read_knowledge',
      riskTier: highImpact ? 'high' : 'medium',
      requiresApproval: highImpact,
      highImpact,
      dependsOn: [`${missionId}_step_4`],
      expectedEvidence: ['Audit summary', 'Risk register', 'Next action checklist', 'Metric trail'],
      approvalCheckpoint: highImpact ? 'APPROVE MISSION HANDOFF' : undefined,
    }),
  ];

  const blockedSteps = steps.filter((item) => item.status === 'blocked');
  const approvalCheckpoints = steps
    .filter((item) => item.requiresApproval)
    .map((item) => ({
      stepId: item.id,
      phrase: item.approvalCheckpoint || 'APPROVE MISSION STEP',
      reason: `${item.riskTier} risk ${item.toolId} handled by ${item.agentRole}`,
    }));
  const riskTier = maxRisk(missionRisk, ...steps.map((item) => item.riskTier));

  return {
    id: missionId,
    goal: input.goal.trim(),
    owner: input.owner || 'Founder',
    deadline: input.deadline,
    createdAt,
    contextPack,
    contextGuard,
    riskTier,
    approvalRequired: approvalCheckpoints.length > 0 || !contextGuard.ok || blockedSteps.length > 0,
    automationAllowed: Boolean(input.allowAutomation) && safetyDecision.approved,
    steps,
    toolRoute: steps.map((item) => ({ stepId: item.id, toolId: item.toolId, agentRole: item.agentRole, lane: item.lane })),
    approvalCheckpoints,
    auditTrail: [
      {
        action: 'mission_context_planned',
        severity: contextGuard.ok ? 'info' : 'warning',
        summary: contextGuard.ok ? `Context pack ${contextPack.id} is ready.` : `Context guard blocked: ${contextGuard.error}`,
      },
      {
        action: 'mission_safety_previewed',
        severity: safetyDecision.approved ? 'info' : 'critical',
        summary: safetyDecision.approved ? `Safety envelope approved in ${safetyDecision.mode} mode.` : `Safety envelope blocked: ${safetyDecision.issues.join('; ')}`,
      },
      {
        action: 'mission_tool_route_created',
        severity: riskRank(riskTier) >= 4 ? 'critical' : riskRank(riskTier) >= 3 ? 'warning' : 'info',
        summary: `${steps.length} steps routed across ${unique(steps.map((item) => item.lane)).length} lanes with ${approvalCheckpoints.length} checkpoints.`,
      },
    ],
    summary: {
      totalSteps: steps.length,
      blockedSteps: blockedSteps.length,
      highRiskSteps: steps.filter((item) => riskRank(item.riskTier) >= 3).length,
      humanApprovals: approvalCheckpoints.length,
      contextConfidence: contextPack.confidence,
      contradictions: contextPack.contradictions.length,
    },
  };
}
