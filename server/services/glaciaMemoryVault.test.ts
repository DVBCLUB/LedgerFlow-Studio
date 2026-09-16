import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  loadMemoryVault,
  addMemoryEntry,
  deleteMemoryEntry,
  calculateRelevanceScore,
  searchSemanticMemories,
  consolidateMemoryVault,
  type MemoryVaultEntry,
} from './glaciaMemoryVault.ts';

describe('glaciaMemoryVault - Persistent Memory & Semantic Recall', () => {
  test('loads memory vault with default core memories', () => {
    const vault = loadMemoryVault();
    assert.ok(vault.memories.length >= 4);
    assert.strictEqual(vault.ownerEmail, 'davidbao1704@gmail.com');
  });

  test('adds and deletes a memory entry', () => {
    const entry = addMemoryEntry({
      category: 'insight',
      title: 'Tự động kiểm toán quy trình',
      content: 'Nội dung kiểm toán tự động các giao dịch ngân hàng.',
      tags: ['audit', 'bank', 'vietqr'],
      importance: 'high',
    });

    assert.ok(entry.id.startsWith('mem-'));
    assert.strictEqual(entry.title, 'Tự động kiểm toán quy trình');

    const deleted = deleteMemoryEntry(entry.id);
    assert.strictEqual(deleted, true);
  });

  test('calculates relevance score accurately', () => {
    const sampleMem: MemoryVaultEntry = {
      id: 'test-1',
      category: 'procedural',
      title: 'Đóng gói Windows Binary',
      content: 'Chạy npm run desktop:pack để cập nhật release win-unpacked.',
      tags: ['windows', 'pack', 'desktop'],
      importance: 'critical',
      accessCount: 0,
      lastRecalledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const scoreHigh = calculateRelevanceScore('Đóng gói Windows', sampleMem);
    const scoreLow = calculateRelevanceScore('nấu ăn gia đình', sampleMem);

    assert.ok(scoreHigh > 0.4);
    assert.strictEqual(scoreLow, 0);
  });

  test('searches semantic memories and ranks by relevance', () => {
    const results = searchSemanticMemories('Windows Desktop', 3, 0.1);
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
    assert.ok(results[0].relevanceScore > 0);
  });

  test('consolidates memory vault successfully', () => {
    const report = consolidateMemoryVault();
    assert.ok(report.totalBefore >= 0);
    assert.ok(report.totalAfter >= 0);
    assert.ok(Array.isArray(report.newInsightsGenerated));
  });
});
