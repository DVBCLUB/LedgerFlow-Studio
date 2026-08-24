import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFileDiff,
  setHunkAcceptedState,
  applyAcceptedDiff,
} from './aiCodeDiffEngine.ts';

const original = `const a = 1;\nconst b = 2;\nconsole.log(a + b);`;
const proposed = `const a = 1;\nconst b = 2;\nconst c = 3;\nconsole.log(a + b + c);`;

test('aiCodeDiffEngine - computes line-by-line file diff and groups into hunks', () => {
  const diff = computeFileDiff('src/example.ts', original, proposed);

  assert.ok(diff.id);
  assert.ok(diff.hunks.length > 0);
  assert.equal(diff.status, 'pending');
});

test('aiCodeDiffEngine - allows selective hunk acceptance and reconstructs content', () => {
  const diff = computeFileDiff('src/example.ts', original, proposed);
  assert.equal(diff.hunks[0].accepted, true);

  const updatedDiff = setHunkAcceptedState(diff, diff.hunks[0].id, false);
  assert.equal(updatedDiff.status, 'rejected');

  const result = applyAcceptedDiff(updatedDiff);
  assert.equal(result, original);
});

