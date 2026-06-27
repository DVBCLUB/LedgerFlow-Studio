import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';

test('AI Workforce Mission Planner creates grounded tasks, tools, approvals and safety evidence for high-impact software goals', () => {
  const plan = planAIWorkforceMission({
    goal: 'Ship a GitHub pull request for AI Workforce Runtime Hub with CI, rollback plan and human approval.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must preserve audit trail', 'must require approval before merge'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      {
        kind: 'sop',
        title: 'Mission Planner SOP',
        content: 'Mission plans must map each step to an agent role, tool, risk tier, approval checkpoint, evidence and audit trail.',
        tags: ['mission-planner', 'software-factory'],
        facts: { mission_policy: 'approval_checkpoint_required' },
        confidence: 0.93,
      },
    ],
  });

  assert.match(plan.id, /^mission_/);
  assert.equal(plan.contextGuard.ok, true);
  assert.equal(plan.riskTier, 'high');
  assert.equal(plan.approvalRequired, true);
  assert.equal(plan.summary.totalSteps, 5);
  assert.ok(plan.summary.highRiskSteps >= 3);
  assert.ok(plan.approvalCheckpoints.length >= 3);
  assert.ok(plan.contextPack.sourceMap.length >= 2);
  assert.ok(plan.contextPack.graph.nodes.length > 0);
  assert.ok(plan.steps.some((step) => step.toolId === 'github_pr_control'));
  assert.ok(plan.steps.some((step) => step.agentRole === 'Automation Safety Agent' && step.safetyDecision?.approved));
  assert.ok(plan.toolRoute.some((route) => route.lane === 'software-factory'));
  assert.ok(plan.auditTrail.some((event) => event.action === 'mission_tool_route_created'));
});

test('AI Workforce Mission Planner blocks unsafe robot mission safety envelope when automation is not explicitly allowed', () => {
  const plan = planAIWorkforceMission({
    goal: 'Move robot arm to inspect a physical invoice scanner.',
    domains: ['robot lab', 'automation'],
    allowAutomation: false,
    allowRobotLab: true,
    sources: [
      {
        kind: 'sop',
        title: 'Robot Mission SOP',
        content: 'Robot movement requires human checkpoint, lab-only mode, telemetry evidence and emergency stop readiness.',
        tags: ['mission-planner', 'robot_lab'],
        facts: { robot_policy: 'human_checkpoint_required' },
        confidence: 0.94,
      },
    ],
  });

  assert.equal(plan.riskTier, 'critical');
  assert.equal(plan.approvalRequired, true);
  const robotStep = plan.steps.find((step) => step.toolId === 'robot_move');
  assert.ok(robotStep);
  assert.equal(robotStep?.safetyPlan?.surface, 'robot');
  assert.equal(robotStep?.safetyPlan?.labOnly, true);
  assert.equal(robotStep?.safetyDecision?.approved, true);
  assert.equal(robotStep?.requiresApproval, true);
  assert.ok(plan.approvalCheckpoints.some((checkpoint) => checkpoint.phrase === 'APPROVE AUTOMATION SAFETY'));
});

test('AI Workforce Mission Planner flags high-impact contradictory grounding', () => {
  const plan = planAIWorkforceMission({
    goal: 'Deploy production database migration for customer invoices.',
    constraints: ['requires database migration'],
    sources: [
      {
        kind: 'sop',
        title: 'Database Migration SOP',
        content: 'Production database migration requires human approval.',
        tags: ['mission-planner', 'database'],
        facts: { database_migration_policy: 'approval_required' },
      },
      {
        kind: 'runtime',
        title: 'Runtime note',
        content: 'Production database migration may run automatically.',
        tags: ['mission-planner', 'database'],
        facts: { database_migration_policy: 'auto_allowed' },
      },
    ],
  });

  assert.equal(plan.contextGuard.ok, false);
  assert.ok(plan.contextPack.contradictions.length >= 1);
  assert.equal(plan.approvalRequired, true);
  assert.ok(plan.auditTrail.some((event) => event.severity === 'warning'));
});
