import { describe, it, expect } from 'vitest';
import {
  computeFileDiff,
  setHunkAcceptedState,
  applyAcceptedDiff,
} from './aiCodeDiffEngine.ts';

describe('aiCodeDiffEngine', () => {
  const original = `const a = 1;\nconst b = 2;\nconsole.log(a + b);`;
  const proposed = `const a = 1;\nconst b = 2;\nconst c = 3;\nconsole.log(a + b + c);`;

  it('computes line-by-line file diff and groups into hunks', () => {
    const diff = computeFileDiff('src/example.ts', original, proposed);

    expect(diff.id).toBeDefined();
    expect(diff.hunks.length).toBeGreaterThan(0);
    expect(diff.status).toBe('pending');
  });

  it('allows selective hunk acceptance and reconstructs content', () => {
    const diff = computeFileDiff('src/example.ts', original, proposed);
    expect(diff.hunks[0].accepted).toBe(true);

    const updatedDiff = setHunkAcceptedState(diff, diff.hunks[0].id, false);
    expect(updatedDiff.status).toBe('rejected');

    const result = applyAcceptedDiff(updatedDiff);
    expect(result).toBe(original);
  });
});
