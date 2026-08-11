import assert from 'node:assert/strict';
import test from 'node:test';
import { assessActionRisk, getRiskMatrixRegistry } from './dynamicRiskMatrix.ts';

test('assessActionRisk evaluates low-risk read actions as AUTO_EXECUTE', () => {
  const result = assessActionRisk({
    actionId: 'read_file',
    environment: 'local',
  });

  assert.equal(result.baseRisk, 'LOW');
  assert.equal(result.effectiveRisk, 'LOW');
  assert.equal(result.decision, 'AUTO_EXECUTE');
  assert.equal(result.category, 'read');
});

test('assessActionRisk evaluates shell command as TELEGRAM_APPROVAL_REQUIRED', () => {
  const result = assessActionRisk({
    actionId: 'run_command',
    environment: 'local',
  });

  assert.equal(result.baseRisk, 'HIGH');
  assert.equal(result.effectiveRisk, 'HIGH');
  assert.equal(result.decision, 'TELEGRAM_APPROVAL_REQUIRED');
});

test('assessActionRisk elevates destructive payload to CRITICAL / HARD_BLOCKED', () => {
  const result = assessActionRisk({
    actionId: 'run_command',
    payload: { command: 'rm -rf /' },
    environment: 'production',
  });

  assert.equal(result.effectiveRisk, 'CRITICAL');
  assert.equal(result.decision, 'HARD_BLOCKED');
  assert.ok(result.reasons.some((r) => r.includes('destructive command pattern')));
});

test('assessActionRisk downgrades risk in sandbox environment', () => {
  const result = assessActionRisk({
    actionId: 'write_file',
    environment: 'sandbox',
  });

  assert.equal(result.baseRisk, 'MEDIUM');
  assert.equal(result.effectiveRisk, 'LOW');
  assert.equal(result.decision, 'AUTO_EXECUTE');
});

test('getRiskMatrixRegistry returns all default risk rules', () => {
  const registry = getRiskMatrixRegistry();
  assert.ok(registry.length >= 10);
  assert.ok(registry.some((r) => r.actionId === 'github_push_main'));
});
