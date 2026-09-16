/**
 * server/services/glaciaDocIngestionCrawler.test.ts
 * Unit tests for Glacia Continuous Doc Ingestion Crawler.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkDocumentText, runDocIngestion, getDocIngestionStats, listIngestionHistory } from './glaciaDocIngestionCrawler.ts';
import { listDocIngestionTargets } from './glaciaDocIngestionSchedule.ts';

describe('Glacia Doc Ingestion Pipeline', () => {
  it('chunks long text into coherent segments', () => {
    const text = 'Paragraph 1 of content.\n\nParagraph 2 with code snippet.\n\nParagraph 3 conclusion.';
    const chunks = chunkDocumentText(text, 50, 10);
    assert.ok(chunks.length >= 2, 'Should break text into chunks');
  });

  it('runs doc ingestion and updates vector statistics', async () => {
    const targets = listDocIngestionTargets();
    assert.ok(targets.length > 0, 'Targets should be pre-configured');

    const result = await runDocIngestion(targets[0].id);
    assert.equal(result.status, 'completed');
    assert.ok(result.chunksIngested > 0, 'Should ingest at least 1 chunk');

    const stats = getDocIngestionStats();
    assert.ok(stats.totalDocsInVectorStore > 0, 'Vector store should have ingested docs');

    const history = listIngestionHistory();
    assert.ok(history.length > 0, 'History should record the run');
  });
});
