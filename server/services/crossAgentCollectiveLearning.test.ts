import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  broadcastCrossAgentInsight,
  queryCollectiveAgentKnowledge,
} from './crossAgentLearning.ts';

describe('Horizon 2: Cross-Agent Collective Vector Knowledge Graph', () => {
  it('broadcasts cross-agent insights and indexes them into vector store for semantic retrieval', () => {
    const insight = broadcastCrossAgentInsight({
      sourceAgent: 'swarm_coder',
      domain: 'coding',
      title: 'Vite React Bundle Optimization Pattern',
      content: 'Using RollbackCenter and manualChunks split improves app startup time by 40%.',
      confidence: 0.95,
      tags: ['vite', 'bundle', 'performance'],
    });

    assert.ok(insight.id);
    assert.equal(insight.sourceAgent, 'swarm_coder');

    const searchHits = queryCollectiveAgentKnowledge('Vite React bundle optimization', 'coding');
    assert.ok(searchHits.length > 0);
    assert.ok(searchHits.some((hit) => hit.document.content.includes('Vite React Bundle Optimization Pattern')));
  });
});
