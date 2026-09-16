import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
  policyEngine,
  type PolicyEvaluationRequest,
  saveAutonomyState,
  loadAutonomyState,
  type AutonomyState,
} from './policyEngine.ts';

const BASE_STATE: AutonomyState = {
  currentLevel: 2,
  trustScore: 850,
  totalApprovedMissions: 40,
  totalRejectedMissions: 2,
  emergencyLockout: false,
  lastUpdated: new Date().toISOString(),
};

beforeEach(() => {
  saveAutonomyState({ ...BASE_STATE });
});

test('policyEngine - allows Owner full authority across actions', () => {
  const req: PolicyEvaluationRequest = {
    principal: { id: 'davidbao', role: 'owner', email: 'davidbao1704@gmail.com' },
    action: 'git_force_push',
    riskLevel: 'critical',
  };

  const result = policyEngine.evaluate(req);
  assert.equal(result.allowed, true);
  assert.equal(result.decision, 'ALLOWED');
  assert.match(result.reason, /Solo Founder/);
});

test('policyEngine - blocks high-risk action for non-owner without approval', () => {
  const req: PolicyEvaluationRequest = {
    principal: { id: 'agent-1', role: 'ai_agent' },
    action: 'live_production_deploy',
    riskLevel: 'critical',
  };

  const result = policyEngine.evaluate(req);
  assert.equal(result.allowed, false);
  assert.equal(result.decision, 'REQUIRES_APPROVAL');
  assert.equal(result.requiresHumanApproval, true);
  assert.equal(result.enforcedBy, 'RBAC');
});

test('policyEngine - enforces emergency lockout completely', () => {
  saveAutonomyState({
    ...BASE_STATE,
    emergencyLockout: true,
  });

  const req: PolicyEvaluationRequest = {
    principal: { id: 'agent-1', role: 'ai_agent' },
    action: 'web_research',
  };

  const result = policyEngine.evaluate(req);
  assert.equal(result.allowed, false);
  assert.equal(result.enforcedBy, 'EMERGENCY_LOCKOUT');
});

test('policyEngine - allows safe action under Level 2 Executor', () => {
  const req: PolicyEvaluationRequest = {
    principal: { id: 'agent-1', role: 'ai_agent' },
    action: 'web_research',
    autonomyAction: 'web_research',
  };

  const result = policyEngine.evaluate(req);
  assert.equal(result.allowed, true);
  assert.equal(result.decision, 'ALLOWED');
});

test('policyEngine - requires approval for Level 3 action when current level is 2', () => {
  const req: PolicyEvaluationRequest = {
    principal: { id: 'agent-1', role: 'ai_agent' },
    action: 'full_dag_pipeline',
    autonomyAction: 'full_dag_pipeline',
  };

  const result = policyEngine.evaluate(req);
  assert.equal(result.allowed, false);
  assert.equal(result.decision, 'REQUIRES_APPROVAL');
  assert.equal(result.enforcedBy, 'AUTONOMY_GATE');
});

test('policyEngine.enforce - throws GlaciaError when denied', () => {
  const req: PolicyEvaluationRequest = {
    principal: { id: 'agent-1', role: 'ai_agent' },
    action: 'file_delete',
    riskLevel: 'high',
  };

  assert.throws(
    () => policyEngine.enforce(req),
    (err: any) => err.name === 'GlaciaError' && err.code === 'GLACIA_APPROVAL_REQUIRED'
  );
});
