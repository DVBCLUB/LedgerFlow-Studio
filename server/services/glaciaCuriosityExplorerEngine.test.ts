import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanKnowledgeGapsAndFormAgenda,
  investigateCuriousAnomaly,
  generateWeeklyCuriosityReport,
  listCuriosityAgendas,
} from './glaciaCuriosityExplorerEngine.ts';

describe('Glacia Curiosity-Driven Autonomous Explorer (Epoch 8)', () => {
  it('scans knowledge gaps and prioritizes research topics by business importance', () => {
    const topics = scanKnowledgeGapsAndFormAgenda();

    assert.ok(topics.length >= 2);
    assert.ok(topics[0].importanceWeight > 0.8);
    assert.ok(topics[0].investigationSteps.length >= 1);
  });

  it('autonomously investigates anomalies generating hypotheses and preliminary verdict', () => {
    const inv = investigateCuriousAnomaly('Tỷ lệ tương tác qua Zalo OA tăng đột biến 300%');

    assert.ok(inv.investigationId.startsWith('inv-'));
    assert.equal(inv.hypotheses.length, 3);
    assert.equal(inv.actionPlan.length, 3);
    assert.ok(inv.preliminaryVerdict.length > 10);
  });

  it('generates a weekly curiosity report with 3 high-impact strategic questions for the CEO', () => {
    const report = generateWeeklyCuriosityReport();

    assert.ok(report.reportId.startsWith('agenda-'));
    assert.equal(report.top3StrategicQuestionsForCEO.length, 3);
    assert.ok(report.serendipitousFindings.length >= 1);
  });

  it('retrieves persistent curiosity agendas cleanly', () => {
    const list = listCuriosityAgendas();
    assert.ok(list.length >= 1);
  });
});
