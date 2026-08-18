import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  submitHumanApprovalRequest,
  respondToApprovalRequest,
  listApprovalRequests,
  isActionHighRisk,
  __resetApprovalRequestsForTesting,
} from './humanApprovalGateway.ts';

describe('humanApprovalGateway - Human-in-the-loop Controls', () => {
  beforeEach(() => {
    __resetApprovalRequestsForTesting();
  });

  it('identifies high risk actions accurately', () => {
    assert.equal(isActionHighRisk('deploy_production_build'), true);
    assert.equal(isActionHighRisk('financial_ledger_modify'), true);
    assert.equal(isActionHighRisk('read_readme_file'), false);
  });

  it('submits and resolves approval request', () => {
    const req = submitHumanApprovalRequest({
      requesterAgentId: 'agent_devops',
      requesterRoleId: 'role_ai_code_specialist',
      domain: 'software_core',
      actionType: 'deploy_production_build',
      title: 'Deploy v2.4.0 to Production',
      description: 'Contains new AI Delegation Matrix and 100% Green test suite',
      proposedChanges: { version: '2.4.0', target: 'windows_exe' },
    });

    assert.equal(req.status, 'PENDING');
    assert.equal(req.riskLevel, 'CRITICAL');

    const pending = listApprovalRequests({ status: 'PENDING' });
    assert.equal(pending.length, 1);

    const resolved = respondToApprovalRequest(req.requestId, 'APPROVED', 'Solo Founder', 'Passed all CI tests');
    assert.equal(resolved.status, 'APPROVED');
    assert.equal(resolved.reviewedBy, 'Solo Founder');
  });

  it('rejects duplicate or invalid resolution', () => {
    const req = submitHumanApprovalRequest({
      requesterAgentId: 'agent_marketing',
      requesterRoleId: 'role_ai_market_scout',
      domain: 'video_marketing',
      actionType: 'bulk_external_publish',
      title: 'Publish 50 TikTok videos',
      description: 'Auto campaign launch',
    });

    respondToApprovalRequest(req.requestId, 'REJECTED', 'Solo Founder', 'Need review captions first');

    assert.throws(() => {
      respondToApprovalRequest(req.requestId, 'APPROVED');
    }, /already REJECTED/);
  });
});
