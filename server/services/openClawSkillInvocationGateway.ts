import { appendAuditEvent, type AuditActor } from './auditLog.ts';
import { getOpenClawSkill, type OpenClawSkill } from './openClawSkillRegistry.ts';

export type OpenClawSkillInvocationActor = 'founder' | 'ai-agent' | 'automation' | 'system';
export type OpenClawSkillInvocationDecisionMode = 'dry_run' | 'pending_approval' | 'blocked';

export interface OpenClawSkillInvocationRequest {
  skillId: string;
  actor: OpenClawSkillInvocationActor;
  payload?: Record<string, unknown>;
  reason?: string;
}

export interface OpenClawSkillInvocationDecision {
  ok: boolean;
  mode: OpenClawSkillInvocationDecisionMode;
  skill: OpenClawSkill | null;
  reason: string;
  nextStep: string;
}

function auditActorFromInvocationActor(actor: OpenClawSkillInvocationActor): AuditActor {
  if (actor === 'founder') return 'founder';
  if (actor === 'ai-agent') return 'ai-agent';
  return 'system';
}

function isHardwareSkill(skill: OpenClawSkill) {
  return skill.mode === 'hardware' || skill.tags.includes('hardware');
}

export function decideOpenClawSkillInvocation(input: OpenClawSkillInvocationRequest): OpenClawSkillInvocationDecision {
  const skill = getOpenClawSkill(input.skillId);
  if (!skill) {
    return {
      ok: false,
      mode: 'blocked',
      skill: null,
      reason: 'Unknown OpenClaw skill.',
      nextStep: 'Discover skills through listOpenClawSkills before requesting invocation.',
    };
  }

  if (skill.risk === 'blocked' || isHardwareSkill(skill)) {
    return {
      ok: false,
      mode: 'blocked',
      skill,
      reason: 'Skill is blocked by policy. Hardware and blocked capabilities require a signed adapter, physical safety review, and explicit operator procedure.',
      nextStep: 'Create a reviewed adapter manifest and safety runbook before enabling this skill.',
    };
  }

  if (skill.requiresApproval || skill.risk === 'high') {
    return {
      ok: false,
      mode: 'pending_approval',
      skill,
      reason: 'Skill requires founder approval before execution.',
      nextStep: 'Create an approval request with skill id, payload summary, risk and audit fingerprint.',
    };
  }

  return {
    ok: true,
    mode: 'dry_run',
    skill,
    reason: 'Skill is allowed for dry-run planning only. No side effect is executed by the gateway.',
    nextStep: 'Route execution to the owning service boundary after policy-specific checks pass.',
  };
}

export async function auditOpenClawSkillInvocation(input: OpenClawSkillInvocationRequest) {
  const decision = decideOpenClawSkillInvocation(input);
  await appendAuditEvent({
    actor: auditActorFromInvocationActor(input.actor),
    workspace: 'OpenClaw Skill Gateway',
    action: decision.mode === 'blocked' ? 'openclaw.skill.blocked' : decision.mode === 'pending_approval' ? 'openclaw.skill.pending_approval' : 'openclaw.skill.dry_run',
    target: input.skillId,
    risk: decision.mode === 'blocked' ? 'HIGH' : decision.mode === 'pending_approval' ? 'HIGH' : 'LOW',
    status: decision.mode === 'blocked' ? 'rejected' : decision.mode === 'pending_approval' ? 'pending_approval' : 'sandbox',
    summary: decision.reason,
    connectorId: 'openclaw-skill-gateway',
    evidence: { skill: decision.skill, invocationActor: input.actor, payload: input.payload, reason: input.reason, nextStep: decision.nextStep },
  });
  return decision;
}
