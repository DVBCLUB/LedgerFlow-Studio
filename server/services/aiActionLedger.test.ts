import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  recordAIAction,
  queryAIActionLedger,
  verifyLedgerChainIntegrity,
  __resetActionLedgerForTesting,
} from './aiActionLedger.ts';

describe('aiActionLedger - Cryptographic Traceability', () => {
  beforeEach(() => {
    __resetActionLedgerForTesting();
  });

  it('records actions and maintains valid cryptographic hash chain', () => {
    const entry1 = recordAIAction({
      agentId: 'agent_code_claude',
      roleId: 'role_ai_code_specialist',
      domain: 'software_core',
      actionType: 'CREATE_DRAFT_PATCH',
      targetResource: 'src/utils/math.ts',
      inputPayload: { patch: 'fix edge case' },
      outputSummary: 'Draft patch created with 100% test coverage',
      permissionCheckPassed: true,
      constitutionalRulePassed: true,
      tokensUsed: 450,
      costUsd: 0.005,
    });

    const entry2 = recordAIAction({
      agentId: 'agent_judge_gpt4o',
      roleId: 'role_ai_security_judge',
      domain: 'system_security',
      actionType: 'VALIDATE_SECURITY',
      targetResource: 'src/utils/math.ts',
      outputSummary: 'Approved: No SQL injection or secret leak detected',
      permissionCheckPassed: true,
      constitutionalRulePassed: true,
      tokensUsed: 220,
      costUsd: 0.002,
    });

    assert.equal(entry1.previousHash, '0000000000000000000000000000000000000000000000000000000000000000');
    assert.equal(entry2.previousHash, entry1.integrityHash);
    assert.equal(verifyLedgerChainIntegrity(), true);

    const query = queryAIActionLedger({ roleId: 'role_ai_code_specialist' });
    assert.equal(query.total, 1);
    assert.equal(query.entries[0].actionType, 'CREATE_DRAFT_PATCH');
    assert.equal(query.isChainValid, true);
  });

  it('filters violations accurately', () => {
    recordAIAction({
      agentId: 'agent_rogue',
      roleId: 'role_ai_market_scout',
      domain: 'finance_vas200',
      actionType: 'WRITE_FINANCIAL_LEDGER',
      targetResource: 'tables/general_ledger.db',
      outputSummary: 'Blocked by boundary guard',
      permissionCheckPassed: false,
      constitutionalRulePassed: false,
    });

    const violations = queryAIActionLedger({ onlyViolations: true });
    assert.equal(violations.total, 1);
    assert.equal(violations.entries[0].permissionCheckPassed, false);
  });
});
