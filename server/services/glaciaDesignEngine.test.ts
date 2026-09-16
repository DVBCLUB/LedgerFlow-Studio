import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateGlaciaBanner } from './glaciaDesignEngine.ts';

describe('Glacia Design Engine', () => {
  it('generates a banner with default settings', async () => {
    const result = await generateGlaciaBanner({
      headline: 'LedgerFlow Studio',
    });

    assert.equal(result.success, true);
    assert.ok(result.svgContent.includes('svg'));
    assert.ok(result.svgContent.includes('LedgerFlow Studio'));
    assert.equal(result.dimensions.width, 1200);
    assert.equal(result.dimensions.height, 630);
    assert.ok(result.outputPath.endsWith('.svg'));
  });

  it('generates banner with custom theme and size', async () => {
    const result = await generateGlaciaBanner({
      headline: 'Cyberpunk Dashboard',
      subheadline: 'Real-time AI Analytics',
      theme: 'cyberpunk_neon',
      size: '1920x1080',
    });

    assert.equal(result.success, true);
    assert.equal(result.dimensions.width, 1920);
    assert.equal(result.dimensions.height, 1080);
    assert.ok(result.svgContent.includes('Cyberpunk'));
  });

  it('includes HUD elements when requested', async () => {
    const result = await generateGlaciaBanner({
      headline: 'Executive Report',
      theme: 'executive_dark',
      size: '800x400',
      showHudElements: true,
      metrics: [
        { label: 'Revenue', value: '2.4B' },
        { label: 'Users', value: '12.5K' },
      ],
    });

    assert.equal(result.success, true);
    assert.ok(result.svgContent.includes('Revenue'));
    assert.ok(result.svgContent.includes('2.4B'));
    assert.ok(result.svgContent.includes('Users'));
  });

  it('handles vertical format (9:16)', async () => {
    const result = await generateGlaciaBanner({
      headline: 'Vertical Post',
      size: '1080x1920',
    });

    assert.equal(result.success, true);
    assert.equal(result.dimensions.width, 1080);
    assert.equal(result.dimensions.height, 1920);
  });

  it('handles emerald finance theme', async () => {
    const result = await generateGlaciaBanner({
      headline: 'Financial Summary',
      theme: 'emerald_finance',
      badge: 'VAS Compliant',
    });

    assert.equal(result.success, true);
    assert.ok(result.svgContent.includes('Financial'));
  });
});
