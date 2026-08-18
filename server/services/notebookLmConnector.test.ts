import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateNotebookLmSourcePack } from './notebookLmConnector.ts';

describe('notebookLmConnector - Google NotebookLM Integration', () => {
  it('generates a complete grounded source pack with podcast prompt and mindmap', () => {
    const pack = generateNotebookLmSourcePack({
      title: 'Báo Cáo Tài Chính Quý 3 - VAS 200',
      sourceType: 'FINANCIAL_REPORT',
      content: 'Doanh thu đạt 450 triệu VNĐ, chi phí hoạt động 120 triệu VNĐ, lợi nhuận ròng 330 triệu VNĐ.',
    });

    assert.ok(pack.packId.startsWith('nlm_'));
    assert.equal(pack.sourceType, 'FINANCIAL_REPORT');
    assert.ok(pack.rawDocumentContent.includes('450 triệu'));
    assert.ok(pack.audioOverviewPrompt.includes('Host Nam'));
    assert.ok(pack.studyGuideMarkdown.includes('FAQ'));
    assert.ok(pack.mindmapMermaid.startsWith('mindmap'));
  });
});
