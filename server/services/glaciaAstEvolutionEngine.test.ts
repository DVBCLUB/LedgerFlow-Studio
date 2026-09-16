import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCodeAst,
  synthesizeAstMutation,
  listAstMutations,
} from './glaciaAstEvolutionEngine.ts';

describe('Glacia AST Code Mutation & Evolution Engine (Epoch 9)', () => {
  it('analyzes code AST complexity, detects loop bottlenecks and memory leak risks', () => {
    const code = `
      function processBatch(items: any[]) {
        if (items.length > 0) {
          items.forEach((item) => {
            console.log(item);
          });
        }
        setInterval(() => { console.log('tick'); }, 1000);
      }
    `;

    const report = analyzeCodeAst(code, 'batchProcessor.ts');
    assert.ok(report.totalAstNodes > 0);
    assert.ok(report.cyclomaticComplexity >= 2);
    assert.ok(report.performanceBottlenecksDetected.length >= 1);
    assert.ok(report.memoryLeakRisks.length >= 1);
  });

  it('synthesizes AST mutations benchmarking speed and verifying regression safety', () => {
    const original = 'const arr = [10, 20, 30]; arr.forEach((val) => { console.log(val); });';
    const mutation = synthesizeAstMutation(original, 'speed');

    assert.ok(mutation.mutationId.startsWith('ast-'));
    assert.ok(mutation.mutatedCode.includes('for (const val of arr)'));
    assert.equal(mutation.isRegressionSafe, true);
    assert.ok(mutation.benchmarkComparison.memorySavedKb > 0);
  });

  it('retrieves persistent AST code mutations history cleanly', () => {
    const list = listAstMutations();
    assert.ok(list.length >= 1);
  });
});
