import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCodebaseSelfAudit, getLatestCodeAuditReport } from './glaciaSelfAuditEngine.ts';
import { generateRefactorDraftPR } from './glaciaAutoPRGenerator.ts';

describe('Glacia Self-Rewriting Code Engine (Frontier 1)', () => {
  it('runs codebase self-audit and generates health score with scan metrics', () => {
    const report = runCodebaseSelfAudit();

    assert.ok(report.id.startsWith('audit-rep-'));
    assert.ok(report.totalFilesScanned > 50, 'Should scan real service files');
    assert.ok(report.totalLinesOfCode > 1000);
    assert.ok(report.architectureHealthScore >= 70 && report.architectureHealthScore <= 100);
    assert.ok(report.topRefactorOpportunities.length >= 1);
  });

  it('retrieves the persistent latest code audit report accurately', () => {
    const report = getLatestCodeAuditReport();
    assert.ok(report);
    assert.ok(report.issuesSummary);
    assert.ok(Array.isArray(report.issues));
  });

  it('generates structured Draft Pull Requests with branch names and test plans', () => {
    const pr = generateRefactorDraftPR({
      title: 'Tối ưu hóa bộ nhớ RAG Vector Store',
      category: 'performance',
      targetFiles: ['server/services/vectorEmbeddingStore.ts', 'server/services/agenticRagRouter.ts'],
      rationale: 'Chuyển sang cơ chế nén float16 để giảm 50% RAM sử dụng.',
    });

    assert.ok(pr.id.startsWith('pr-glacia-'));
    assert.ok(pr.branchName.startsWith('glacia/performance/'));
    assert.equal(pr.status, 'draft_ready');
    assert.equal(pr.affectedFiles.length, 2);
    assert.ok(pr.markdownBody.includes('Glacia Self-Rewriting Autonomous Pull Request'));
  });
});
