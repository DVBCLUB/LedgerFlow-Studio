import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePostMortem,
  listPostMortemReports,
  getPostMortemById,
  __resetPostMortemForTesting,
} from './aiIncidentPostMortem.ts';

describe('aiIncidentPostMortem - Root Cause Analysis Engine', () => {
  beforeEach(() => {
    __resetPostMortemForTesting();
  });

  it('generates a complete Post-Mortem report on quarantine event', () => {
    const report = generatePostMortem({
      incidentType: 'QUARANTINE',
      affectedRoleId: 'role_ai_code_specialist',
      triggerReason: '3 lỗi cú pháp liên tiếp khi tạo patch',
    });

    assert.ok(report.incidentId.startsWith('rca_'));
    assert.equal(report.incidentType, 'QUARANTINE');
    assert.equal(report.severity, 'CRITICAL');
    assert.ok(report.preventiveActions.length >= 2);
    assert.ok(report.impactAssessment.includes('Blast-Radius'));
  });

  it('generates a Post-Mortem report on handoff chain failure', () => {
    const report = generatePostMortem({
      incidentType: 'CHAIN_FAILURE',
      affectedRoleId: 'role_chief_of_staff',
      triggerReason: 'Không vượt qua bước kiểm thử hồi quy QA',
      severity: 'HIGH',
    });

    assert.equal(report.incidentType, 'CHAIN_FAILURE');
    assert.equal(report.severity, 'HIGH');
    assert.ok(report.preventiveActions.length >= 2);
  });

  it('lists and finds reports properly', () => {
    const rep1 = generatePostMortem({
      incidentType: 'BUDGET_BREACH',
      affectedRoleId: 'role_ai_cfo_director',
      triggerReason: 'Token spend đạt 92% monthly cap',
    });

    const list = listPostMortemReports();
    assert.ok(list.length >= 1);

    const found = getPostMortemById(rep1.incidentId);
    assert.ok(found);
    assert.equal(found.incidentId, rep1.incidentId);
  });
});
