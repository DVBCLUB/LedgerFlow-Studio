import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listTrustedSources,
  addTrustedSource,
  removeTrustedSource,
  getSourceTrustScore,
} from './glaciaSourceTrustRegistry.ts';

describe('Glacia Source Trust Registry', () => {
  it('lists trusted sources with default entries', () => {
    const sources = listTrustedSources();
    assert.ok(Array.isArray(sources));
    assert.ok(sources.length >= 3);
    assert.ok(sources.some(s => s.id.includes('thuvienphapluat') || s.domain === 'thuvienphapluat.vn'));
  });

  it('lists sources filtered by category', () => {
    const sources = listTrustedSources('blender_3d');
    assert.ok(sources.length > 0);
    assert.ok(sources.every(s => s.domainCategory === 'blender_3d'));
  });

  it('returns sources with correct structure', () => {
    const sources = listTrustedSources();
    const source = sources[0];
    assert.ok(source.id);
    assert.ok(source.name);
    assert.ok(source.domain);
    assert.ok(source.domainCategory);
    assert.ok(typeof source.trustScore === 'number');
    assert.ok(source.trustScore >= 0 && source.trustScore <= 100);
    assert.ok(typeof source.isOfficial === 'boolean');
    assert.ok(Array.isArray(source.preferredUrlPatterns));
  });

  it('adds a new trusted source', () => {
    const source = addTrustedSource({
      name: 'MDN Web Docs',
      domain: 'developer.mozilla.org',
      domainCategory: 'fullstack_code',
      trustScore: 95,
      preferredUrlPatterns: ['https://developer.mozilla.org/en-US/'],
      isOfficial: true,
    });

    assert.ok(source.id.startsWith('src_'));
    assert.equal(source.domain, 'developer.mozilla.org');
    assert.equal(source.trustScore, 95);
  });

  it('removes a trusted source by ID', () => {
    const sources = listTrustedSources();
    const existingId = sources[0].id;

    const removed = removeTrustedSource(existingId);
    assert.equal(removed, true);

    const afterRemove = listTrustedSources();
    assert.ok(!afterRemove.some(s => s.id === existingId));
  });

  it('returns false when removing non-existent source', () => {
    const result = removeTrustedSource('non-existent-id');
    assert.equal(result, false);
  });

  it('gets trust score for a known source URL', () => {
    const score = getSourceTrustScore('https://thuvienphapluat.vn/some-law');
    assert.equal(score, 96);

    const unknownScore = getSourceTrustScore('https://unknown-malicious-site.com/hack');
    assert.equal(unknownScore, 50);
  });
});
