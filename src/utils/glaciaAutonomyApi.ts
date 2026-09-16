/**
 * glaciaAutonomyApi.ts
 * ============================================================
 * Frontend API client for Glacia Autonomy Levels & Trust Enforcer
 * ============================================================
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export interface AutonomyLevelSpec {
  level: AutonomyLevel;
  code: 'OBSERVER' | 'ADVISOR' | 'EXECUTOR' | 'ORCHESTRATOR' | 'AUTONOMOUS';
  name: string;
  minTrustScore: number;
  description: string;
  allowedActions: string[];
  requiresApprovalFor: string[];
  color: string;
}

export interface AutonomyState {
  currentLevel: AutonomyLevel;
  trustScore: number;
  totalApprovedMissions: number;
  totalRejectedMissions: number;
  emergencyLockout: boolean;
  lastUpdated: string;
}

export async function fetchAutonomyStatus(): Promise<{
  state: AutonomyState;
  specs: Record<AutonomyLevel, AutonomyLevelSpec>;
}> {
  const res = await fetch('/api/glacia/autonomy/status');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch autonomy status');
  return { state: json.state, specs: json.specs };
}

export async function validateAutonomyAction(actionType: string): Promise<{
  allowed: boolean;
  currentLevel: AutonomyLevel;
  currentLevelName: string;
  requiredLevel: AutonomyLevel;
  reason: string;
}> {
  const res = await fetch('/api/glacia/autonomy/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Validation failed');
  return json.validation;
}

export async function setGlaciaAutonomyLevel(level: AutonomyLevel): Promise<{
  success: boolean;
  state: AutonomyState;
  message: string;
}> {
  const res = await fetch('/api/glacia/autonomy/set-level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });
  return res.json();
}

export async function toggleEmergencyLockout(enabled: boolean): Promise<{
  success: boolean;
  state: AutonomyState;
  message: string;
}> {
  const res = await fetch('/api/glacia/autonomy/emergency-lockout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  return res.json();
}

export async function evaluateGlaciaPolicy(request: {
  action: string;
  riskLevel?: string;
  target?: string;
}): Promise<{
  success: boolean;
  evaluation: {
    decision: 'ALLOWED' | 'DENIED' | 'REQUIRES_APPROVAL' | 'LAB_ONLY';
    allowed: boolean;
    requiresHumanApproval: boolean;
    enforcedBy: string;
    reason: string;
    currentAutonomyLevel: AutonomyLevel;
    trustScore: number;
  };
}> {
  const res = await fetch('/api/glacia/policy/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return res.json();
}

