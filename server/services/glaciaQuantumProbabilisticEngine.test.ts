import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSuperpositionDilemma,
  listQuantumDilemmas,
} from './glaciaQuantumProbabilisticEngine.ts';

describe('Glacia Quantum-Inspired Probabilistic Reasoning Engine (Epoch 11)', () => {
  it('evaluates dilemma in superposition state and performs clean wave function collapse', () => {
    const res = evaluateSuperpositionDilemma('Lựa chọn kiến trúc Backend: Microservices vs Monolith');

    assert.ok(res.dilemmaId.startsWith('quantum-'));
    assert.ok(res.superpositionState.length >= 2);
    assert.ok(res.quantumEntanglementScore >= 0.9);
    assert.ok(res.collapsedHypothesis.certaintyScore >= 0.85);
    assert.ok(res.collapsedHypothesis.synthesizedResolution.length > 0);
  });

  it('retrieves persistent quantum dilemma records cleanly', () => {
    const list = listQuantumDilemmas();
    assert.ok(list.length >= 1);
  });
});
