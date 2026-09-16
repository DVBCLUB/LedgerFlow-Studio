import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  loadAutonomyState,
  validateActionPermission,
  adjustTrustScore,
  setAutonomyLevel,
  AUTONOMY_SPECS,
} from './glaciaAutonomyGate.ts';

describe('glaciaAutonomyGate - Autonomy Levels & Trust Enforcer', () => {
  test('loads autonomy state with valid specs', () => {
    const state = loadAutonomyState();
    assert.ok(state.currentLevel >= 0 && state.currentLevel <= 4);
    assert.ok(AUTONOMY_SPECS[state.currentLevel]);
    assert.ok(state.trustScore >= 0);
  });

  test('validates action permission based on autonomy level', () => {
    const perm1 = validateActionPermission('web_research');
    assert.strictEqual(typeof perm1.allowed, 'boolean');

    const perm2 = validateActionPermission('night_shift_autopilot');
    assert.strictEqual(typeof perm2.allowed, 'boolean');
    assert.strictEqual(perm2.requiredLevel, 4);
  });

  test('adjusts trust score on approval or rejection', () => {
    const initial = loadAutonomyState().trustScore;
    const updated = adjustTrustScore('approved');
    assert.strictEqual(updated.trustScore, initial + 25);

    const penalized = adjustTrustScore('rejected');
    assert.strictEqual(penalized.trustScore, updated.trustScore - 50);
  });

  test('sets autonomy level within trust score limit', () => {
    const res = setAutonomyLevel(1);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state.currentLevel, 1);
  });
});
