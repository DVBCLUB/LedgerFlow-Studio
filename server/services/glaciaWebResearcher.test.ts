/**
 * server/services/glaciaWebResearcher.test.ts
 * Unit tests for Glacia Dynamic Web Researcher & Source Trust Registry.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performGlaciaWebResearch, extractCodeSnippets, getGlaciaResearchHistory } from './glaciaWebResearcher.ts';
import { getSourceTrustScore, listTrustedSources, addTrustedSource } from './glaciaSourceTrustRegistry.ts';

describe('Glacia Source Trust Registry', () => {
  it('loads trusted sources with default rankings', () => {
    const sources = listTrustedSources();
    assert.ok(sources.length >= 5, 'Should contain at least 5 default trusted sources');
    const blender = sources.find((s) => s.domain === 'docs.blender.org');
    assert.ok(blender, 'docs.blender.org should be present');
    assert.ok(blender.trustScore >= 95, 'Blender trust score should be >= 95');
  });

  it('calculates source trust score accurately', () => {
    const blenderScore = getSourceTrustScore('https://docs.blender.org/manual/en/latest/materials.html');
    assert.equal(blenderScore, 99);

    const unknownScore = getSourceTrustScore('https://random-unverified-blog.xyz/post');
    assert.equal(unknownScore, 50, 'Unknown domain should get default base score 50');
  });
});

describe('Glacia Web Researcher Engine', () => {
  it('extracts code snippets from markdown', () => {
    const text = 'Here is the fix:\n```typescript\nconst a: number = 42;\n```\nAnd run:\n```bash\nnpm test\n```';
    const snippets = extractCodeSnippets(text);
    assert.equal(snippets.length, 2);
    assert.ok(snippets[0].includes('const a: number = 42;'));
    assert.ok(snippets[1].includes('npm test'));
  });

  it('performs on-demand web research and indexes into vector memory', async () => {
    const res = await performGlaciaWebResearch({
      query: 'Tối ưu hóa EEVEE Next Shader trong Blender 4.2',
      category: 'blender_3d',
      depth: 'quick',
    });

    assert.ok(res.query, 'Should have query');
    assert.ok(res.articles.length > 0, 'Should have articles');
    assert.ok(res.vectorIndexedCount > 0, 'Should index into local vector store');
    assert.ok(res.synthesizedSolution.length > 0, 'Should have synthesized solution');

    const history = getGlaciaResearchHistory();
    assert.ok(history.length > 0, 'History should record research result');
  });
});
