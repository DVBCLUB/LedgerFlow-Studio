import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCustomerHealthAndIntervene,
  listCustomerHealthSentinels,
} from './glaciaCustomerSuccessSentinel.ts';

describe('Glacia Predictive Customer Success & Anti-Churn Sentinel (Epoch 12)', () => {
  it('detects churn risks based on telemetry metrics and triggers automated intervention plan', () => {
    const profile = evaluateCustomerHealthAndIntervene('cust-555', 'Cty Xây Dựng Long Thành', 5000000, 20, 0.3);

    assert.ok(profile.profileId.startsWith('cs-'));
    assert.equal(profile.customerId, 'cust-555');
    assert.ok(profile.churnRiskPercent >= 60);
    assert.equal(profile.healthCategory, 'critical_churn_risk');
    assert.ok(profile.automatedInterventionPlan.messagePayload.includes('Long Thành'));
    assert.ok(profile.automatedInterventionPlan.vietqrRetentionIncentiveVnd > 0);
  });

  it('retrieves persistent customer health sentinel records cleanly', () => {
    const list = listCustomerHealthSentinels();
    assert.ok(list.length >= 1);
  });
});
