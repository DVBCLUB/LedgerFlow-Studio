import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateKeystrokeDelay,
  getAdjacentTypoChar,
  generateBezierCurve,
  randomGaussian,
} from './glaciaHumanCadenceEngine.ts';

test('glaciaHumanCadenceEngine - calculateKeystrokeDelay produces natural human cadence', () => {
  // Test normal characters
  const delayA = calculateKeystrokeDelay('a', 'b', 60);
  assert.ok(delayA >= 40, 'Delay should be at least 40ms');
  assert.ok(delayA <= 350, 'Delay should not exceed human bounds (350ms)');

  // Test sentence end punctuation (should pause longer)
  const delayPeriod = calculateKeystrokeDelay('.', 'a', 60);
  assert.ok(
    delayPeriod > delayA,
    `Period delay (${delayPeriod}ms) should be noticeably longer than normal letter delay (${delayA}ms)`
  );

  // Test newline (paragraph pause)
  const delayNewline = calculateKeystrokeDelay('\n', 'a', 60);
  assert.ok(
    delayNewline > delayA * 2,
    `Newline pause (${delayNewline}ms) should reflect cognitive paragraph transition`
  );
});

test('glaciaHumanCadenceEngine - getAdjacentTypoChar returns realistic QWERTY neighbors', () => {
  const typoK = getAdjacentTypoChar('k');
  assert.ok(typoK !== null, 'Key "k" should have neighbors');
  assert.ok(
    ['j', 'i', 'o', 'l', 'm'].includes(typoK!.toLowerCase()),
    `Adjacent typo for "k" should be a neighboring key, got: ${typoK}`
  );

  // Uppercase preservation
  const typoUpperA = getAdjacentTypoChar('A');
  if (typoUpperA) {
    assert.equal(typoUpperA, typoUpperA.toUpperCase(), 'Typo for uppercase letter should be uppercase');
  }
});

test('glaciaHumanCadenceEngine - generateBezierCurve generates smooth multi-step trajectory', () => {
  const start = { x: 100, y: 150 };
  const end = { x: 600, y: 750 };
  const steps = 15;

  const curve = generateBezierCurve(start, end, steps);
  assert.equal(curve.length, steps + 1, 'Should contain steps + 1 points');

  // Start point match
  assert.equal(curve[0].x, start.x);
  assert.equal(curve[0].y, start.y);

  // End point match
  assert.equal(curve[curve.length - 1].x, end.x);
  assert.equal(curve[curve.length - 1].y, end.y);

  // Intermediate points should exist and not be purely collinear
  assert.ok(curve[5].x > start.x && curve[5].x < end.x);
});

test('glaciaHumanCadenceEngine - randomGaussian produces centered variance', () => {
  const mean = 100;
  const stdDev = 15;
  const samples: number[] = [];

  for (let i = 0; i < 50; i++) {
    samples.push(randomGaussian(mean, stdDev));
  }

  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  assert.ok(Math.abs(avg - mean) < 15, `Sample mean (${avg}) should be close to target mean (${mean})`);
});
