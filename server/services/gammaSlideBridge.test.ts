import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertMarkdownToGammaSlideSpec } from './gammaSlideBridge.ts';

describe('gammaSlideBridge - Gamma.app Slide Presentation Exporter', () => {
  it('converts content into a structured Gamma presentation spec', () => {
    const spec = convertMarkdownToGammaSlideSpec({
      title: 'Giới Thiệu Phần Mềm Kế Toán Tự Động LedgerFlow',
      content: 'Nội dung chi tiết giải pháp',
      theme: 'DARK_SLATE_CYAN',
    });

    assert.ok(spec.specId.startsWith('gam_'));
    assert.equal(spec.theme, 'DARK_SLATE_CYAN');
    assert.ok(spec.totalSlidesCount >= 5);
    assert.ok(spec.gammaFormattedPayload.includes('---'));
    assert.ok(spec.cards.length >= 5);
  });
});
