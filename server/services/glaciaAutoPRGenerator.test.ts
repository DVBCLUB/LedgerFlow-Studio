import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateRefactorDraftPR } from './glaciaAutoPRGenerator.ts';

describe('Glacia Auto PR Generator', () => {
  it('generates a draft PR with correct structure', () => {
    const pr = generateRefactorDraftPR({
      title: 'Tối ưu hóa query database',
      category: 'performance',
      targetFiles: ['server/services/userAccounts.ts', 'server/services/accountingRoutes.ts'],
      rationale: 'Các query hiện tại chưa có index dẫn đến chậm khi dữ liệu lớn.',
    });

    assert.ok(pr.id.startsWith('pr-glacia-'));
    assert.ok(pr.title.includes('Tối ưu hóa'));
    assert.equal(pr.category, 'performance');
    assert.equal(pr.targetBranch, 'main');
    assert.equal(pr.status, 'draft_ready');
    assert.ok(pr.branchName.startsWith('glacia/performance/'));
    assert.ok(pr.testAssertions.length >= 3);
    assert.ok(pr.markdownBody.includes('Tạo bởi'));
    assert.ok(pr.markdownBody.includes('Kiểm thử'));
  });

  it('handles refactor category correctly', () => {
    const pr = generateRefactorDraftPR({
      title: 'Tái cấu trúc module auth',
      category: 'refactor',
      targetFiles: ['api/auth/session.ts'],
      rationale: 'Tách logic xác thực thành các hàm nhỏ hơn.',
    });

    assert.equal(pr.category, 'refactor');
    assert.ok(pr.branchName.startsWith('glacia/refactor/'));
  });

  it('generates branch name from title safely', () => {
    const pr = generateRefactorDraftPR({
      title: 'Fix: Security Vulnerability in JWT!',
      category: 'security',
      targetFiles: ['server/services/aiKeyVault.ts'],
      rationale: 'Cần vá lỗ hổng bảo mật.',
    });

    assert.ok(pr.branchName.startsWith('glacia/security/'));
    assert.ok(!pr.branchName.includes('!'));
    assert.ok(pr.branchName.length > 10);
  });
});
