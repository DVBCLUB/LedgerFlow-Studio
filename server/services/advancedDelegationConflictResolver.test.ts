import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyAgentActionPermission,
  arbitrateMultiAgentConflict,
  recordAgentExecutionHealth,
  restoreQuarantinedAgent,
  verifyConstitutionalInvariants,
  issueAgentSessionToken,
  verifyAgentSessionToken,
  getEnterpriseRaciMatrix,
  calculateAIWorkforceHealthScores,
  type CompetingProposal,
} from './advancedDelegationConflictResolver.ts';

describe('advancedDelegationConflictResolver - Enterprise AI Governance', () => {
  it('enforces Amazon IAM Least-Privilege domain boundaries', () => {
    // Market Scout cannot touch finance
    const breachCheck = verifyAgentActionPermission('role_ai_market_scout', 'finance_vas200', 'read');
    assert.equal(breachCheck.isAllowed, false);
    assert.equal(breachCheck.violatedRule, 'DOMAIN_BOUNDARY_BREACH');

    // Code Specialist can create draft in software_core
    const validCheck = verifyAgentActionPermission('role_ai_code_specialist', 'software_core', 'create_draft');
    assert.equal(validCheck.isAllowed, true);
    assert.equal(validCheck.rulePassed, true);
  });

  it('enforces Constitutional Invariants against secret leaks and high transactions', () => {
    const leakCheck = verifyConstitutionalInvariants({
      actionType: 'GENERATE_OUTPUT',
      outputContent: 'Here is your api key: sk-proj-123456789012345678901234567890',
    });
    assert.equal(leakCheck.isAllowed, false);
    assert.equal(leakCheck.violatedRule, 'CONST_01_NO_SECRET_LEAK');

    const highTxCheck = verifyConstitutionalInvariants({
      actionType: 'RECONCILE_PAYMENT',
      financialAmountVnd: 25000000,
    });
    assert.equal(highTxCheck.isAllowed, false);
    assert.equal(highTxCheck.violatedRule, 'CONST_02_FINANCIAL_THRESHOLD');
  });

  it('issues and validates Zero-Trust Non-Human Identity (NHI) tokens', () => {
    const session = issueAgentSessionToken('agent_claude_swe', 'role_ai_code_specialist', 30);
    assert.ok(session.token.startsWith('nhi_'));

    const verification = verifyAgentSessionToken(session.token);
    assert.equal(verification.isValid, true);
    assert.equal(verification.session?.agentId, 'agent_claude_swe');

    const fakeVerification = verifyAgentSessionToken('nhi_invalid_token');
    assert.equal(fakeVerification.isValid, false);
  });

  it('arbitrates multi-agent conflicts and handles deadlock escrow via conservative default', () => {
    const proposals: CompetingProposal[] = [
      {
        proposalId: 'prop_fast_patch',
        proposedByAgentId: 'devops_ai',
        title: 'Bản vá nhanh 10 phút',
        description: 'Sửa trực tiếp hàm lỗi',
        approachType: 'HOTFIX',
        safetyScore: 88,
        speedScore: 92,
        sustainabilityScore: 80,
      },
      {
        proposalId: 'prop_safe_refactor',
        proposedByAgentId: 'architect_ai',
        title: 'Tái cấu trúc an toàn',
        description: 'Viết lại module với kiểm thử mở rộng',
        approachType: 'REFACTOR',
        safetyScore: 98,
        speedScore: 70,
        sustainabilityScore: 95,
      },
    ];

    const result = arbitrateMultiAgentConflict('Xung đột phát hành bản vá', proposals);
    assert.ok(result.arbitrationId.startsWith('arb_'));
    assert.ok(result.winnerProposalId);
    assert.equal(result.judgeVotes.length, 3);
  });

  it('quarantines agent on 3 consecutive errors and invalidates tokens', () => {
    recordAgentExecutionHealth('role_ai_code_specialist', false);
    recordAgentExecutionHealth('role_ai_code_specialist', false);
    const quarantined = recordAgentExecutionHealth('role_ai_code_specialist', false);

    assert.equal(quarantined.quarantineStatus, 'QUARANTINED');
    assert.equal(quarantined.canDirectlyWriteDisk, false);

    const checkBlocked = verifyAgentActionPermission('role_ai_code_specialist', 'software_core', 'create_draft');
    assert.equal(checkBlocked.isAllowed, false);
    assert.equal(checkBlocked.violatedRule, 'BLAST_RADIUS_QUARANTINED');

    // Restore
    const restored = restoreQuarantinedAgent('role_ai_code_specialist');
    assert.equal(restored.quarantineStatus, 'HEALTHY');
    assert.equal(restored.canDirectlyWriteDisk, true);
  });

  it('returns RACI matrix and calculates workforce health scores', () => {
    const raci = getEnterpriseRaciMatrix();
    assert.ok(raci.length >= 4);

    const healthScores = calculateAIWorkforceHealthScores();
    assert.ok(healthScores.length >= 4);
    assert.ok(healthScores.every((h) => h.healthScore >= 0 && h.healthScore <= 100));
  });

  it('delegates task from department manager to team member', async () => {
    const { delegateTaskToDepartmentMember } = await import('./advancedDelegationConflictResolver.ts');
    const result = delegateTaskToDepartmentMember({
      managerRoleId: 'role_chief_of_staff',
      memberRoleId: 'role_ai_code_specialist',
      taskTitle: 'Refactor Auth Token Cache',
      domain: 'software_core',
    });

    assert.equal(result.success, true);
    assert.ok(result.delegationId.startsWith('del_'));
  });
});
